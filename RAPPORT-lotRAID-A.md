# RAPPORT — lot RAID-A : l'écran de raid

Écrit le 01/09/2026, sur disque, à la racine. Brief : `BRIEF-lotRAID-A.md`.
Aucun `RAPPORT-lotRAID-A.md` n'existait à la racine avant celui-ci.

---

## 1. Version et build produits

| Grandeur | Avant | Après |
| --- | --- | --- |
| `version` | 0.61.0 | **0.62.0** |
| `config.build` | `"62"` | **`"63"`** |

⚠ **LES DEUX RESTENT DES CHAÎNES**, vérifié par exécution (`typeof` → `string`) :
Kotlin les lit `as String`, et un nombre fait tomber le build Android à la
configuration, avant le moindre test.

---

## 2. Base de référence du §1 — retrouvée

| Grandeur | Attendu | Mesuré | Verdict |
| --- | --- | --- | --- |
| version / build | 0.61.0 / 62 | 0.61.0 / 62 | ✅ |
| `dist/index.html` | 1 340 077 o | **1 340 077 o** | ✅ |
| suite | 808 pass / 0 fail | **808 pass / 0 fail** | ✅ |
| `SAVE_VERSION` | 18 | 18 | ✅ |

La branche a été **repartie de `main`** (`3686044`, merge de RAID-0), et non
empilée sur de l'historique déjà fusionné.

---

## 3. Delta et comptes

| Grandeur | Avant | Après | Delta |
| --- | --- | --- | --- |
| `dist/index.html` | 1 340 077 o | **1 370 976 o** | **+30 899 o** |
| Tests | 808 | **820** | +12 |

⚠ **AUCUNE IMAGE N'ENTRE.** Le champ de bataille d'un site porte des **bâtiments
et des défenses**, que le banc n'avait jamais eu à dessiner : il fallait trois
atlas de plus en `drawImage`. Ils étaient **déjà dans la feuille** pour le fond
CSS du Chantier ; leur donner une balise `<img>` que `garnirLesAtlas` garnit ne
les inline pas une seconde fois. **Mesuré : 16 `data:image/png;base64,` avant,
16 après.** Le +30 899 est du code, du balisage et de la feuille.

Borne T10 inchangée à 1 400 000 ; marge **29 024 octets, 2,07 %**. Le prochain
lot qui fait entrer une image devra la relever en écrivant pourquoi.

**Suite finale : `npm run check` → build OK, `820 pass / 0 fail`**, depuis un
`dist/` supprimé. 0 référence externe (seul `w3.org/2000/svg`, l'identifiant
toléré).

---

## 4. Chaque test du §6, avec la falsification effectivement jouée

Injection de défaut **sur une copie fraîche**, jamais sur l'arbre de travail.
**Neuf falsifications jouées, neuf ROUGE** — après correction de l'une d'elles,
voir l'encadré.

| # | Test | Falsification injectée | Verdict |
| --- | --- | --- | --- |
| T1 | le panneau tire butin, force et coût des **trois briques** | `butinSiToutTombe` remplacé par un calcul à la main | **ROUGE** ✅ |
| T2 | le second toucher **compare la case**, il ne compte pas | comparaison remplacée par « le panneau est ouvert » | **ROUGE** ✅ |
| T3 | `problemesDuRaid` garde l'entrée, et la raison s'affiche | *(pas de falsification au brief)* | ✅ PASS |
| T4 | `#ressources` et `#navigation` masqués, **onglets visibles** | `tete-onglets` ajouté à la liste des masqués | **ROUGE** ✅ |
| T5 | six boutons ; « tout réparer » **seulement** le mode armé | *(pas de falsification au brief)* | ✅ PASS |
| T6 | le glisser-déposer passe par `deplacerEffectif` | déplacement écrit en direct dans `etat.armee` | **ROUGE** ✅ |
| T7 | les deux panneaux affichent **les mêmes nombres** | une ligne du panneau calculée dans l'écran | **ROUGE** ✅ *(après renforcement)* |
| T8 | les trois verdicts ; défense seule touchée = **défaite totale** | « défense endommagée » traitée comme victoire | **ROUGE** ✅ |
| T9 | `simulerRaid` ne range **aucun** rapport | rapport simulé rangé dans les dix | **ROUGE** ✅ |
| T10 | onze raids ne gardent que les dix derniers | *(pas de falsification au brief)* | ✅ PASS |
| T11 | le champ traverse la sauvegarde ; v18 → tableau vide | *(pas de falsification au brief)* | ✅ PASS |
| T12 | **les 808 tests existants passent** | *(la suite elle-même)* | ✅ PASS |
| — | trois raids d'affilée, et le % descend | l'entrée rangée sur le montage réduit | **ROUGE** ✅ |
| — | idem | dénominateur ramené aux survivantes | **ROUGE** ✅ |

### ⚠⚠ T7 est passé VERT à la première falsification, et le test a été renforcé

Le défaut injecté **remplaçait** la ligne « Défense restante » par un autre
calcul. La première version de T7 comparait les deux panneaux et surveillait la
**façon dont** `restantDefense` était employé — mais le défaut faisait
**disparaître** la référence, donc rien ne se déclenchait, et l'égalité des deux
panneaux tenait toujours : ils partagent la fonction, donc **ils mentaient
pareil**.

*Deux panneaux qui mentent de la même façon sont toujours d'accord.* T7 asserte
maintenant les VALEURS rendues sur un rapport forgé — chaque ligne doit porter le
nombre du rapport — et la falsification le fait tomber.

C'est la deuxième fois de la journée qu'une falsification apprend quelque chose :
au lot RÉSERVE elle avait montré qu'un défaut supposé n'en était pas un ; ici
elle montre un vrai trou dans la garde.

### T12 — ce qui a dû bouger, et pourquoi c'est mécanique

Quatre amendements, tous mécaniques, **aucun sémantique** :

1. le numéro `SAVE_VERSION` écrit en dur (`state.test.js` ×2, `recherche.test.js`) ;
2. `ATLAS_DE_LA_PAGE.length` **4 → 7** dans `monde.test.js` — un compte épinglé ;
   les assertions qui comptent (aucune balise ne porte de `src`, le marqueur est
   dans la feuille, aucun `url(` écrit depuis le JS) passent **inchangées** pour
   les trois nouveaux ;
3. `CLAUDE.md` §2, qui déclare `src/ui/raid.js` — la garde des noms a fait son
   travail ;
4. `CLAUDE.md` §0, le compte de tests.

Aucune assertion de combat, de butin, de recherche ou de report de dégâts n'a
bougé.

---

## 5. M1 et M2, chiffrées

### M1 — le poids d'un rapport gardé

| Grandeur | Valeur |
| --- | --- |
| État sérialisé à **0** rapport | **1 814 octets** |
| État sérialisé à **10** rapports | **8 765 octets** |
| Écart | **6 951 octets** |
| **Par rapport** | **695 octets** |
| Seuil d'arrêt du brief | 2 048 octets |

**Trois fois sous le seuil.** Le point d'arrêt du §7 ne s'est pas déclenché. On
garde le RAPPORT, jamais le `resultat` : un résultat complet porte les vagues,
les positions et les PV de chaque entité.

### M2 — le coût d'une image du déroulé

Mesuré **dans Chromium**, sur le vrai livrable, en échantillonnant l'intervalle
entre images (`requestAnimationFrame`) pendant tout le déroulé du vrai raid, sur
la cible la plus chargée disponible (un camp complet, 23 s de combat) :

| Grandeur | Valeur |
| --- | --- |
| Images échantillonnées | **1 374** |
| Intervalle **médian** | **16,7 ms** |
| p95 | **16,8 ms** |
| max | **49,9 ms** |

**Le déroulé tient les 60 images par seconde**, médiane et p95 collées sur le
budget de 16,7 ms. Le maximum de 49,9 ms est un unique à-coup de trois trames.
**Rien n'a été optimisé**, conformément au brief.

⚠ Mesuré sur un ordinateur de bureau sous Chromium, **pas sur le Galaxy S25 FE**.
Il n'y a pas d'appareil ici, et un test appareil non exécuté se déclare non
exécuté (`CLAUDE.md` §3).

---

## 6. Les trois lectures prises, et ce qu'il faut changer si Ethan décide autrement

### 6.1 `#navigation` est masqué sur l'écran de raid

Le §2.4 du brief le donne comme une lecture, pas comme une dictée. Retenu : un
compteur des bases **du joueur** — « BASE 1 / 1 » — n'a aucun sens devant une
base ennemie.

**Si Ethan le veut visible** : retirer `'navigation'` de `CHROME_MASQUE_PAR` dans
`ui/session.js`, et amender l'assertion de `RAID-A T4`. Une ligne chacune.

### 6.2 `reparationInduite` est un pourcentage **de la réserve du châssis**

Retenu parce que c'est le nombre actionnable : « ça me coûtera 27 % de ma réserve
escouade ».

**Si Ethan voulait un pourcentage des PV de l'armée** : c'est `reparationInduite`
dans `sim/raid.js`, une ligne — le dénominateur `etat.reserveReparation[chassis]`
devient la somme des PV maximaux du châssis.

### 6.3 Le glisser-déposer coexiste avec les modes tactiles d'Offense

**Dette d'ergonomie assumée, et signalée comme telle.** `ui/offense.js` compose
la MÊME grille 4 × 9 par modes — « Mode DÉPLACER : touchez l'unité à déplacer » —
là où l'écran de raid déplace au doigt. Ethan l'a demandé deux fois ; ce lot
l'exécute et ne résout rien d'initiative.

Ce qui limite les dégâts : les deux passent par `deplacerEffectif`, donc la règle
de qui peut aller où est la même. Ce qui diffère est le GESTE, pas la règle.

**Pour l'unifier un jour** : soit l'Offense gagne le glisser-déposer, soit le raid
gagne les modes. Le second est moins cher — `MODES_RAID` a déjà la forme
d'`ACTIONS_ARMEE`.

---

## 7. L'amendement de `test/monde.test.js:287`, cité tel qu'écrit

Le test **n'a pas été supprimé et ne s'est pas assoupli d'un mot** : la liste des
boutons autorisés dans le panneau reste **exactement `['monde-panneau-fermer']`**,
et les quatre mots interdits (`Attaquer`, `Raider`, `Piller`, `Conquérir`) le
restent. Ce lot n'introduit **aucun** bouton dans ce panneau : on entre par un
SECOND TOUCHER sur la cible.

Deux assertions ont été **ajoutées** :

```js
  // ⚠ ET LE REFUS SE DIT. On entre au second toucher ; quand `problemesDuRaid`
  // s'y oppose, le panneau doit l'écrire, sinon le geste serait muet.
  assert.ok(html.includes('id="monde-panneau-refus"'),
    'le panneau ne peut plus dire pourquoi on n\'entre pas');
  assert.match(ecran, /problemesDuRaid/,
    'l\'écran Monde n\'interroge plus le garde du raid');
```

Et son en-tête porte désormais la raison de l'amendement — « le raid EXISTE
maintenant, et on y entre, mais par un SECOND TOUCHER, pas par un bouton ».

---

## 8. Écarts par rapport au brief

### 8.1 ⚠⚠ Un bogue de MOTEUR corrigé, dans du code que le §3 mettait « à ne pas toucher »

**Le troisième raid d'affilée sur une même cible LEVAIT** : `site-entamé : 0 PV
rangés pour 3 pièces`. Trouvé au boot sans tête, puis **reproduit en simulation
pure, sans interface** — cinq lignes suffisent.

`montageCourant` régénère le site ENTIER et applique les PV rangés **position par
position** ; `enregistrerLeRaid` les rangeait sur le montage qui venait de se
battre, d'où les pièces mortes avaient déjà été retirées :

- raid 1 tue les trois défenseurs → l'entrée note `[0,0,0]` ;
- appliquer des zéros les **retire** du montage → le site n'a plus de défenseur ;
- raid 2 se bat contre zéro défenseur → l'entrée note `[]` ;
- raid 3 régénère les trois et n'a plus rien à leur appliquer → **lève**.

Le bogue est **antérieur à ce lot** : aucun test n'enchaînait trois raids, et
aucun écran ne savait attaquer. RAID-A ne l'a pas créé, il l'a rendu atteignable
— et c'est le geste le plus naturel du jeu, insister sur un même camp.

Le correctif (`reprojeter`) range sur la composition **pleine**. Il tombe dans
`enregistrerLeRaid`, que le §3 liste explicitement « à ne pas toucher » : **la
question a été posée à Ethan avant d'écrire une ligne**, et sa réponse a été de
le corriger dans ce lot. Onze raids d'affilée mènent maintenant au rasage.

### 8.2 ⚠ « % restant » montait quand on cassait

Trouvé en vérifiant le correctif ci-dessus. Une pièce détruite QUITTE le montage,
donc quittait aussi le dénominateur : relevé **74 % puis 76 %** après une passe
qui avait pourtant détruit un bâtiment de plus. Un nombre qui grimpe quand on
casse est illisible, et ruine la seule chose qu'on demande à « restant » : se
comparer au raid suivant.

Le dénominateur est désormais le site **PLEIN**, monté une fois par
`montageDuSite` — même détour que `butinSiToutTombe`. Les onze raids descendent
90 → 78 → 69 → 61 → 52 → 44 → 38 → 33 → 27 → 22 → 17.

### 8.3 Deux défauts d'écran trouvés au boot sans tête

- **Le `ResizeObserver` mesurait le canevas encore CACHÉ**, et la page partait en
  « projection : viewport 1 × 1 trop petit pour une case » **au démarrage**,
  avant que le joueur ait rien touché. C'est le piège qu'`initialiserBanc` évite
  en n'étant appelé qu'à l'ouverture ; ici l'écran se câble au démarrage, donc la
  garde est dans la mesure elle-même — `dimensionner` rend `false` et ne dessine
  pas. **Aucun test du dépôt ne pouvait le voir.**
- Une teinte inventée, `#C8A93C`, refusée par la garde de palette. Remplacée par
  `#F5B636`, l'ambre de `FICHE-STYLE.md`. La garde a fait exactement son travail.

### 8.4 `montageDuRaid` extraite de `executerRaid`

Le déroulé est un **rejeu** : l'écran doit refaire tourner la boucle sur le MÊME
montage que le raid. Le recomposer dans `ui/` aurait donné deux montages voisins
— modules, POI, PV courants — dont un seul serait éprouvé. Un seul montage, deux
appelants. Il **ne voyage pas** dans le rapport : le mettre là le ferait entrer
dans les dix rapports gardés, donc dans la sauvegarde.

### 8.5 `sansBatiment` ajouté à `reparationInduite`

Le §4.6 ne le demandait pas. Sans lui, un châssis intact et un châssis **sans
Caserne** rendent tous deux `0 s` : le panneau annoncerait « aucune réparation » à
un joueur dont l'infanterie est en miettes et irréparable. Mesuré sur une base
neuve : les trois châssis rendent 0 après un raid qui a bel et bien abîmé l'armée.

### 8.6 Le §4.3 annonçait un état qui n'existait pas

« L'état "quelle case est ouverte" existe déjà dans `monde.js` » — il n'existait
pas : `ouvrirPanneau` ne retenait rien, seul `panneau.hidden` disait quelque
chose. `siteOuvert` a été ajouté, et c'est bien à lui que le second toucher se
compare.

### 8.7 « Activer / désactiver » est un MODE

Le §4.5 le donne comme une simple bascule. Retenu : la même forme que « Réparer »
— armer, puis désigner —, parce que la grille porte aussi le glisser-déposer et
qu'un toucher simple y serait ambigu. `MODES_RAID` porte les deux, une seule
grammaire.

---

## 9. Points en suspens

### 9.1 Hors périmètre, non commencé (§0)

Les raids de l'Ouvrage sur la base du joueur (**RAID-B**), le halo et le choix de
la base attaquante (bloqués par le mono-base), le **coût de réparation** dans la
fenêtre du simulateur — reporté par Ethan le 01/09. Rien n'a été commencé.

### 9.2 Ouverts par ce lot

- **La dette d'ergonomie du §6.3** — deux grammaires sur la même grille 4 × 9.
- **La marge sous la borne T10 est tombée à 2,07 %** (29 024 octets). C'est la
  plus mince depuis le lot RETOURS-DU-31.
- **Le déroulé n'a pas été mesuré sur appareil.** M2 est une mesure Chromium de
  bureau ; le S25 FE reste à éprouver. Si les 16,7 ms ne tiennent pas là-bas, le
  curseur est la taille du canevas, pas la boucle.
- **La flèche de défilement vers les bâtiments de la cible** (§4.1) n'est pas
  câblée : la zone haute est un canevas unique qui montre la base attaquée
  entière, pas un conteneur qui défile comme la grille du Chantier. Le joueur
  voit la cible ; il ne peut pas encore la parcourir. **C'est le seul point du
  §4.1 qui n'est pas livré**, et il se branche sur la projection.
- **Le journal des dix rapports n'a pas d'écran.** Le §4.9 demande un bouton
  « rapport » dans l'onglet armée : l'état les garde, la migration est écrite et
  testée, mais `ui/offense.js` n'a pas été touché — il aurait fallu y ouvrir une
  vue, ce qui déborde de « l'écran de raid ». **À brancher au prochain lot.**
