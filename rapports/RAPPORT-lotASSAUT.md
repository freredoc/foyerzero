# RAPPORT — lot ASSAUT

**Version produite : 0.89.0 · build 91.** `npm run check` → **1037 pass / 0
fail**, `dist/index.html` **6 783 659 octets**, 0 référence externe.

Trois retours d'Ethan du 04/09, tenus ensemble : on ENTRE par le double-toucher,
on ATTAQUE par un bouton et un seul, et pendant le déroulé il ne reste que le
combat à l'écran. Aucune règle de jeu ne bouge, `SAVE_VERSION` reste à 24, et la
sauvegarde ne grandit pas d'un octet.

---

## 0. La base de départ n'était pas celle du brief, et c'est déclaré

Le brief annonce **1015 pass, 6 779 831 octets, 0.87.0 · build 89**. Mesuré sur
un clone d'`origin/main` au premier geste : **1026 pass / 0 fail,
6 780 316 octets, 0.88.0 · build 90**. L'écart est le lot **ZOOM-CONTINU**,
fusionné entre l'écriture du brief et l'exécution de celui-ci — le §4 du brief
le nomme comme « à passer avant ou après, sans dépendance entre les deux ». Le
lot est donc parti de cette base-là, et tous les écarts d'octets ci-dessous sont
mesurés contre elle, sur un livrable **rebâti** depuis `origin/main` dans un
`git worktree`.

`python3 tools/verifier.py` n'a **pas** été lancé, et c'était conforme : le lot
ne touche ni `art/`, ni `tools/`. Les trois captures vivent dans `rapports/`,
hors de la chaîne.

---

## 1. Ce que le code faisait vraiment

⚠⚠ **Le double-toucher ne lançait pas le raid, et il fallait le mesurer avant de
corriger quoi que ce soit.** `relacher`, dans `src/ui/monde.js`, appelait
`entrerDansLaCible` → `surEntreeRaid` : on ARRIVAIT sur l'écran de raid. Le
combat, lui, partait de `brancher('raid-attaquer', () => lancer(false))`.

Ce qu'Ethan a vu est réel autrement, et le §4 de ce rapport le montre : **le
bouton qui déclenche était noyé**, et un contact de trop tombait dessus.

---

## 2. Le bouton d'attaque sort du rang

### Ce qui a changé

`#raid-attaquer` quitte `#raid-boutons` et devient le frère droit d'une rangée
`#raid-rangee` : cinq boutons à gauche qui se partagent la place, un bloc à
droite qui prend la sienne.

**Relevé dans Chromium**, viewport 360 × 720 CSS, dpr 3, sur une vraie cible :

| élément | mesure |
|---|---|
| `#raid-attaquer` | **107 × 48 px, posé à x = 247** sur 360 |
| chacun des cinq autres | 45 × 48 px |
| libellé | **« ATTAQUER »** en 13 px, **« 11 points »** en 10 px dessous |
| fond au repos | `rgb(138, 30, 23)` = `#8A1E17` |

Les 11 points sont exactement ce que `coutDUnRaid` rend pour cette cible — la
valeur est comparée au moteur dans `ASSAUT T2`, elle n'est pas recopiée.

### Le prix vient de `vueDuRaid`, et `vueDuRaid` était morte

⚠⚠ **`vueDuRaid` n'avait AUCUN appelant** — ni dans `src/`, ni dans `test/`,
vérifié au `grep` avant d'écrire une ligne. Écrite au lot RAID-A comme étage pur
de cet écran, elle attendait un lecteur. Elle gagne `cout` et l'étage DOM la lit :
**il y a exactement un site d'appel de `coutDUnRaid` dans tout `src/ui/raid.js`**,
et `ASSAUT T2` compte. C'est le motif de `ciblageOuvert` dans `ui/monde.js`, où
la flèche RELIT le ciblage plutôt que de le refaire.

⚠ **Et l'ordre des deux lignes n'est pas cosmétique** : `coutDUnRaid` LÈVE
au-delà du rayon d'attaque. Les problèmes se demandent donc AVANT le coût, qui
vaut `null` hors de portée — jamais zéro, qui se lirait « gratuit ». C'est le
défaut que `ciblageDuSite` a payé au lot DÉPLACEMENT, où le panneau ne s'ouvrait
plus sur aucun site lointain de toute la carte. Un test le rejoue de face.

### La teinte n'est pas neuve, et `#E43E32` a été écarté

`#8A1E17` sur `#F5F3E8` **est déjà** le bouton irréversible du dépôt :
`#options-zero`, « Effacer et recommencer ». Aucune couleur n'est inventée, et la
palette fermée à trente-trois teintes de `banc.test.js` reste verte.

⚠ **Ce que couvre le test des bords d'emblème, vérifié plutôt que supposé.**
`monde.test.js` croise `EMBLEMES_CARTE[x].bord` avec `TYPES_SITE[x].attaqueLeJoueur`
— il ne lit **pas** la feuille de style, et le dépôt emploie déjà `#E43E32` dans
une douzaine de règles CSS. Reprendre cette teinte ici n'aurait donc fait tomber
aucun test. Elle est écartée quand même : **la règle que ce test défend est une
règle de JEU** — « le rouge désigne ce qui attaque le joueur » — et un bouton
d'interface n'a pas à l'emprunter.

### Aucune confirmation

Ethan dit que le bouton doit être **gros et seul**, pas qu'il faut demander
« êtes-vous sûr ? ». Une boîte ajouterait un geste à chaque raid, et il est le
seul testeur. Il n'y en a pas.

### Un seul déclencheur, et deux boutons qui y mènent

`ASSAUT T1` lit la source décommentée et exige que **chaque** occurrence de
`lancer(false)` soit sur une ligne qui nomme `raid-attaquer` ou
`raid-reattaquer`, et que les deux soient présents. `raid-reattaquer` reste :
c'est un second raid décidé devant un RÉSULTAT, sous un panneau qui couvre tout
l'écran, et son bouton n'est vif que si `problemesDuRaid` est vide.

---

## 3. Le double-toucher sur sa propre base

### Ce qui était vrai

Sur une `baseJoueur`, `ciblageDuSite` rend `null` — on n'attaque pas chez soi —
donc `entrerDansLaCible` affichait « Plus rien à attaquer ici. » **Le geste ne
menait nulle part.**

### Ce qui a changé

`gesteDuSecondToucher(site)` entre dans `src/ui/monde.js`, pure et exportée :
`baseJoueur` → `'base'`, tout le reste → `'cible'`. Le second toucher sur sa
base ferme le panneau et demande `surEntreeBase()` ; partout ailleurs,
`entrerDansLaCible` est appelée **mot pour mot comme avant**.

⚠ **Rien ne rebascule.** `basculerVersLaBase` a toujours **un seul site
d'appel**, dans `ouvrirPanneau`, au PREMIER toucher — « haloter et basculer sont
le MÊME geste », lot BASES-1. `ASSAUT T5` compte les occurrences et refuse aussi
toute écriture directe de `.baseCourante` dans l'écran.

⚠ **Le bouton « Déplacer la base » lit la même fonction**, plutôt que de
recomparer `'baseJoueur'` de son côté : une seule table fait foi par grandeur
(§4 de `CLAUDE.md`). Sans ça, le lot aurait laissé deux littéraux pour la même
question, et le premier renommage les aurait fait diverger.

⚠ **Le passage d'écran est un crochet**, `surEntreeBase`, câblé dans
`src/ui/session.js` à côté de `surEntreeRaid` : `ui/monde.js` ne connaît pas
`montrerEcran` et ne l'apprend pas.

**Relevé dans Chromium** : double-toucher sur « Votre base » → `ecran-chantier`,
panneau refermé ; double-toucher sur le camp voisin → `ecran-raid`, inchangé.

---

## 4. La garde du doigt qui reste — le clic fantôme est RÉEL

C'est le point le plus important du lot, et il ne se raconte pas : il se mesure.

### Le montage

Une sauvegarde est fabriquée par le moteur (graine 2026, six Meutes posées,
5 000 points d'attaque) et injectée dans `localStorage` avant le chargement de
`dist/index.html`. Chromium, viewport **360 × 720 CSS, dpr 3, tactile**. La carte
est ouverte, **pincée** par `Input.dispatchTouchEvent` à deux points pour agrandir
les cases, la cible localisée par balayage, puis **la carte est FAITE GLISSER pour
que la case du camp tombe à l'endroit EXACT où le bouton se retrouvera** —
(300,5 ; 476,4), le centre mesuré de `#raid-attaquer`. Les contacts sont ensuite
dispatchés par CDP, sur une session ouverte AVANT la mesure : la créer entre deux
contacts ajouterait son propre délai à l'intervalle qu'on croit mesurer.

`document.elementFromPoint` au moment du troisième contact rend **`raid-attaquer`** :
le doigt est bien sur le bouton.

### Verdict : REPRODUIT

**Contre-épreuve d'abord, sur un livrable rebâti avec `delaiArmementMs: 0`** — il
fallait savoir si le défaut existe avant de garder quoi que ce soit :

| intervalle réel | 3 contacts | `lancer(false)` part ? |
|---|---|---|
| 140 ms | oui | **OUI** |
| 141 ms | oui | **OUI** |
| 244 ms | oui | **OUI** |
| 600 ms | oui | **OUI** |

⚠⚠ **Et le mécanisme est le TROISIÈME CONTACT, pas le clic de compatibilité.**
Le brief donnait trois candidats ; le même montage avec **deux** contacts
seulement, à 60, 120 et 250 ms, ne fait **jamais** partir le raid. Le `click` que
Chromium émet après un `touchend` ne tombe donc pas sur le bouton qui vient
d'apparaître. Le troisième candidat — « rien du tout » — est écarté par le
tableau ci-dessus.

### La garde mord, et elle n'est pas un mur

Même montage, livrable du lot (`delaiArmementMs: 300`) :

| intervalle réel | `lancer(false)` part ? | `#raid-attaquer` inerte ? |
|---|---|---|
| 102 ms | non | oui |
| 101 ms | non | oui |
| 219 ms | non | oui |
| **611 ms** | **oui** | non |

⚠ **Les deux intervalles les plus courts du brief ne sont pas atteignables depuis
ce banc, et ça se déclare.** Un contact dispatché par CDP coûte une soixantaine
de millisecondes ; le plancher du montage est **~101 ms**, si bien que « 60 » et
« 120 » y valent la même chose. Les deux sont sous les 300 ms de la garde, qui
les couvre par construction — mais le rapport ne prétend pas les avoir joués.

### Ce que la garde est, et ce qu'elle n'est pas

`#raid-attaquer` naît `disabled` dans le balisage, est **remis inerte à chaque
entrée** sur l'écran, et redevient vif tout seul au bout de
`ECRAN_RAID.delaiArmementMs`. Pendant le délai il porte l'aspect hors service du
dépôt — la teinte de `#raid-fin .boutons button[disabled]`, `#68727E`, sur le
fond ordinaire `#343A2C` : **relevé à l'écran, `rgb(52, 58, 44)` à l'entrée puis
`rgb(138, 30, 23)` 500 ms plus tard.**

⚠ **Ce n'est pas une confirmation déguisée** : elle ne demande rien, ne s'affiche
pas, et au bout de trois cents millisecondes elle n'existe plus. Si elle gêne un
joueur qui attaque vite, **c'est le nombre qui baisse** — il est dans
`src/data/sites.js`, il se change seul.

⚠ **Et le lot aggrave le risque avant de le réduire** : le §2 fait passer le
bouton d'un sixième de rangée à 107 × 48 px. La garde est la contrepartie de
cette taille, pas une précaution annexe.

⚠ **Sans navigateur, le bouton n'est pas condamné** : `armerLAttaque` rend la
main au bouton quand `setTimeout` n'existe pas. Un test le lit.

---

## 5. Pendant le déroulé, il ne reste que le combat

### La citation du 01/09 est réécrite, pas laissée

`CHROME_MASQUE_PAR` portait : *Ethan, 01/09 : « on garde la barre du haut… les
onglets seuls »*. Elle est **gardée et datée**, et la nouvelle lecture est
écrite à côté :

> ⚠⚠ **ET LE DÉROULÉ D'UN COMBAT MASQUE TOUT, ONGLETS COMPRIS** — lot ASSAUT,
> 04/09. Ethan : « quand on lance un raid, toutes les barres disparaissent. On
> voit juste la simulation en cours. » **CETTE PHRASE REVIENT SUR CELLE DU 01/09
> ci-dessus, et les deux tiennent ensemble** : ce jour-là il parlait de l'écran
> de raid, celui-ci du DÉROULÉ.

### Trois états, et la fin est la préparation

| état | onglets | `#ressources` | `#navigation` | `#barre-bas` | `#raid-bas` | vitesses |
|---|---|---|---|---|---|---|
| Préparation | visibles | masqué | masqué | visible | visible | masquées |
| **Déroulé** | **masqués** | masqué | masqué | **masquée** | **masqué** | **visibles (simu.)** |
| Fin | visibles | masqué | masqué | visible | visible | masquées |

`chromeMasque(ecran, deroule)` réunit `CHROME_MASQUE_PAR` (par écran) et
`CHROME_MASQUE_PAR_LE_DEROULE` (pendant un combat). `ASSAUT T6` exige que la
ligne du déroulé se distingue des deux autres **et** que les deux autres soient
égales — c'est le second point qui garde le retour du chrome.

### ⚠⚠ « Toutes les barres » a été pris au mot par la CAPTURE, pas par la relecture

La première écriture de ce lot masquait onglets, ressources et bascule, et
laissait **`#barre-bas`** — « BASE 1,0 · DÉFENSE — · OFFENSE 1,0 », c'est-à-dire
les trois niveaux de la base du JOUEUR, affichés devant une base ennemie qu'on
est en train de casser. C'est le motif exact pour lequel le bandeau des bases est
masqué depuis le 01/09.

Elle n'était dans **aucune** liste de chrome, parce que **personne ne l'avait
jamais masquée** : elle entre dans `BLOCS_DE_CHROME` en même temps que dans la
liste du déroulé. Mesuré à l'écran après correction : **le canevas du champ de
bataille passe de 360 × 674 à 360 × 720** — tout le viewport —, et il ne reste que
la légende de la cible.

⚠ **Cette légende reste, et c'est une LECTURE, pas une omission.**
`#raid-titre` — « camp · niveau 1 · rangée 295, colonne 17 » — est une bande de
17 px POSÉE SUR le canevas, dans le même emplacement que le bandeau
« SIMULATEUR ». Ce n'est pas une barre du chrome ; elle nomme ce qu'on regarde.
Une ligne à retirer si Ethan la lit comme une barre.

### Le retour est garanti, et il se monte CHEMIN PAR CHEMIN

`quitterLeDeroule` est **idempotente** et appelée par **trois portes** : la fin
du combat (`finDuDeroule`), l'abandon (`fermerPanneaux`) et la sortie d'écran
(`masquer`). Les trois fins de combat — la boucle d'image, « Instantané », le
pas-à-pas au dernier tick — passent toutes par `finDuDeroule`.

**Relevé dans Chromium, bloc par bloc, sur les quatre chemins** :

| chemin | chrome au déroulé | chrome à la fin |
|---|---|---|
| raid normal | tout masqué | **identique à la préparation** |
| simulateur ×1 | tout masqué, vitesses visibles | **identique à la préparation** |
| simulateur → Instantané | tout masqué, vitesses visibles | **identique à la préparation** |
| simulateur → pas-à-pas jusqu'au bout | tout masqué, vitesses visibles | **identique à la préparation** |

⚠ **« Instantané » et le pas-à-pas sont des chemins du SIMULATEUR**, pas du vrai
raid : `#raid-vitesses` est masqué quand `simule` est faux — « le vrai raid se
regarde en temps réel, sans contrôle de vitesse », arbitrage du 01/09. Le brief
les listait sans le dire ; c'est mesuré ici.

⚠ **Aucune porte d'abandon n'est atteignable par le joueur pendant un déroulé** —
`#raid-bas` est masqué, les onglets aussi. `masquer()` reste câblé quand même :
c'est la ceinture du jour où une sortie apparaîtra.

### Le simulateur suit la même règle — c'est une lecture

`lancer(true)` déroule le même combat à l'écran ; laisser les barres dans un cas
et pas dans l'autre apprendrait deux grammaires pour le même dessin. **Ethan a
parlé du raid** : c'est une lecture, signalée comme telle, et `ASSAUT T8` refuse
que l'entrée dans le déroulé soit enfermée dans une branche de simulation.

### Le déroulé n'est pas un écran

Le masquage du chrome commun se faisait « dans `montrerEcran`, et nulle part
ailleurs ». Le déroulé n'a pas d'entrée dans `ECRANS` : la session expose donc
`appliquerLeChrome()`, appelée par `montrerEcran` **et** par le crochet
`pendantLeDeroule` que `src/ui/raid.js` déclenche. **Les deux écritures restent
chez la session** ; `#raid-bas`, lui, appartient à l'écran de raid, qui le masque
directement.

⚠ **Une garde a accusé un innocent au premier jet.** Elle interdisait aux écrans
de NOMMER un bloc de chrome ; or `ui/chantier.js` nomme `#ressources` pour le
REMPLIR — il construit les trois bandeaux, ce que `CLAUDE.md` §6 écrit déjà. Elle
porte désormais sur le MASQUAGE (`$('bloc').hidden`), avec un appât qui prouve
qu'elle voit encore la faute.

---

## 6. Les onze tests, avec leur montage effectif

`test/raid-ecran.test.js` entre — **le compte passe de 1 026 à 1 037**. Aucune
assertion existante n'a été retirée ni assouplie.

| test | montage effectif |
|---|---|
| `ASSAUT T1` | source décommentée de `raid.js` : chaque ligne portant `lancer(false)` nomme `raid-attaquer` ou `raid-reattaquer`, et les deux sont présents ; balisage : `#raid-boutons` porte cinq boutons et pas le sixième ; feuille : `min-height ≥ 48px` |
| `ASSAUT T2` | **un seul** site d'appel de `coutDUnRaid`, et il est dans `vueDuRaid` ; partie réelle graine 2026 : `vueDuRaid(...).cout === coutDUnRaid(...)` ; cible à 40 rangées : `null` sans lever ; `libelleDAttaque` sur `null`, `1`, `n` |
| `ASSAUT T3` | `gesteDuSecondToucher({type:'baseJoueur'}) === 'base'` ; la branche appelle `surEntreeBase()` et `fermerPanneau()`, **jamais** `entrerDansLaCible` ; la session câble le crochet |
| `ASSAUT T4` | les trois `TYPES_SITE` et les onze clés d'`EMBLEMES_CARTE` hors `baseJoueur` rendent `'cible'` ; le chemin ordinaire est inchangé au caractère ; le bouton de déplacement lit la même fonction |
| `ASSAUT T5` | `basculerVersLaBase` compté : **1** ; il est dans `ouvrirPanneau` ; aucune écriture directe de `.baseCourante` ; le second toucher ne bascule pas ; le motif est falsifié sur une chaîne à deux occurrences |
| `ASSAUT T6` | `chromeMasque('raid', false/true/false)` : le déroulé diffère, la fin **égale** la préparation ; listes nommées ; les blocs existent dans la page ; six écrans balayés pour le masquage, avec appât |
| `ASSAUT T7` | `quitterLeDeroule` idempotente et appelée par `finDuDeroule`, `fermerPanneaux`, `masquer` ; la boucle d'image, `raid-pas` et `raid-instantane` passent tous par `finDuDeroule` ; `#raid-bas` part et revient |
| `ASSAUT T8` | `entrerDansLeDeroule()` est dans `lancer` et **pas** sous une condition de `simule` ; les vitesses restent le seul rescapé, et s'en vont à la fin |
| `ASSAUT T9` | `disabled` dans le balisage ; `bouton.disabled = true` **avant** `setTimeout` ; ré-armé à chaque `ouvrir` ; la teinte inerte est LUE dans la règle `#raid-fin .boutons button[disabled]`, pas recopiée |
| `ASSAUT T10` | `disabled = false` existe ; la minuterie emploie `ECRAN_RAID.delaiArmementMs` ; délai `> 0` et `≤ 500` ; repli sans `setTimeout` ; `clearTimeout` de la minuterie précédente |
| `ASSAUT T11` | le délai est un entier de `src/data/` ; **aucune** minuterie de `raid.js` ne porte un nombre en dur, avec appât ; la session ne recopie pas la valeur |

⚠ **Ces onze tests ne prouvent rien du rendu**, et le fichier le dit en tête : le
dépôt n'a ni jsdom ni navigateur (§3). Ce sont des gardes de mécanisme ; la
preuve du rendu est aux §2, §3, §4 et §5 ci-dessus, mesurée dans Chromium.

### Dix-neuf falsifications, dix-neuf chutes, zéro muette

| # | falsification | tombe |
|---|---|---|
| F1 | le bouton retombe dans la rangée des cinq | T1 |
| F2 | sa hauteur passe sous 48 px | T1 |
| F3 | un troisième chemin appelle `lancer(false)` | T1 |
| F4 | le libellé rappelle `coutDUnRaid` | T2 |
| F5 | `gesteDuSecondToucher` rend toujours `'base'` | T4 |
| F6 | elle rend toujours `'cible'` | T3 |
| F7 | le second toucher rebascule de base | T5 |
| F8 | le déroulé ne masque plus rien de plus | T6 |
| F9 | la porte d'abandon ne rend plus le chrome | T7 |
| F10 | « Instantané » ne finit plus le déroulé | T7 |
| F11 | l'entrée dans le déroulé passe sous `if (!simule)` | T8 |
| F12 | le bouton naît vif dans la page | T9 |
| F13 | la minuterie part avant l'extinction | T9 |
| F14 | le délai tombe à zéro | T10 |
| F15 | le délai est écrit en dur dans l'écran | T10, T11 |
| F16 | deux entrées empilent leurs minuteries | T10 |
| F17 | un écran masque `#tete-onglets` lui-même | T6 |
| F18 | `#barre-bas` survit au déroulé | T6 |
| F19 | un écran masque `#barre-bas` lui-même | T6 |

⚠ **Et la falsification qui compte le plus n'est pas dans ce tableau** : c'est le
livrable rebâti à `delaiArmementMs: 0` du §4, qui montre que **sans la garde le
raid part**. Une garde dont on ne montre pas qu'elle change quelque chose n'est
pas une garde.

---

## 7. Le coût, poste par poste

Mesuré contre un livrable **rebâti** depuis `origin/main` dans un `git worktree`.

| poste | `main` | lot | écart |
|---|---|---|---|
| total | 6 780 316 | **6 783 659** | **+3 343** |
| JavaScript (hors `data:`) | 332 392 | 333 775 | **+1 383** |
| feuille (hors `data:`) | 91 661 | 93 522 | **+1 861** |
| balisage | 1 964 166 | 1 964 265 | **+99** |
| audio `data:` | 1 193 346 | 1 193 346 | **+0** |
| images `data:` | 5 130 772 | 5 130 772 | **+0** |
| nombre de `data:` | 289 | **289** | **+0** |

**Aucune ressource n'entre.** Borne T10 **inchangée à 7 000 000**, marge
**216 341 octets, 3,09 %**.

⚠ **La sauvegarde ne grandit pas d'un octet** : 1 301 · 1 301 · 1 301 · 1 307 ·
1 307 octets sur les cinq graines témoins, **6 517 au total, avant comme après**.
`SAVE_VERSION` reste à **24** : pas un champ n'entre dans l'état — un état de
chrome vit dans l'écran, une minuterie d'armement aussi.

---

## 8. Les ancres, extraites du fichier et comptées

Chaque édition a été faite par substitution sur une ancre **lue dans le fichier**,
sous `assert count == 1`. Vérification rejouée sur les fichiers finaux :

| fichier | ancre | occurrences |
|---|---|---|
| `src/data/sites.js` | `export const ECRAN_RAID = { delaiArmementMs: 300 };` | 1 |
| `src/ui/raid.js` | l'import de `ECRAN_RAID` | 1 |
| `src/ui/raid.js` | l'import de `coutDUnRaid` | 1 |
| `src/ui/raid.js` | `export function libelleDAttaque(cout) {` | 1 |
| `src/ui/raid.js` | la ligne `cout:` de `vueDuRaid` | 1 |
| `src/ui/raid.js` | `const pendantLeDeroule = crochets.pendantLeDeroule …` | 1 |
| `src/ui/raid.js` | `function entrerDansLeDeroule() {` | 1 |
| `src/ui/raid.js` | `function quitterLeDeroule() {` | 1 |
| `src/ui/raid.js` | `function armerLAttaque(cout) {` | 1 |
| `src/ui/raid.js` | `entrerDansLeDeroule();` (appel) | 1 |
| `src/ui/raid.js` | `quitterLeDeroule()` | **1 déclaration + 3 appels** |
| `src/ui/raid.js` | `armerLAttaque(vueDuRaid(etat, cibleCourante).cout);` | 1 |
| `src/ui/monde.js` | `export function gesteDuSecondToucher(site) {` | 1 |
| `src/ui/monde.js` | `const surEntreeBase = crochets.surEntreeBase …` | 1 |
| `src/ui/monde.js` | `if (gesteDuSecondToucher(site) === 'base') {` | 1 |
| `src/ui/monde.js` | `panneauDeplacer.hidden = gesteDuSecondToucher(site) !== 'base';` | 1 |
| `src/ui/session.js` | `BLOCS_DE_CHROME`, `CHROME_MASQUE_PAR`, `CHROME_MASQUE_PAR_LE_DEROULE` | 1 chacune |
| `src/ui/session.js` | `export function chromeMasque(ecran, deroule = false) {` | 1 |
| `src/ui/session.js` | `function appliquerLeChrome() {` / son appel | 1 / 1 |
| `src/ui/session.js` | les deux crochets `pendantLeDeroule` et `surEntreeBase` | 1 chacun |
| `src/index.src.html` | `<div id="raid-rangee">` | 1 |
| `src/index.src.html` | `<button … id="raid-attaquer" disabled>` | 1 |
| `src/index.src.html` | `#raid-attaquer {` et `#raid-attaquer[disabled] {` | 1 chacune |

Les trois appels de `quitterLeDeroule` sont **voulus et exigés par `ASSAUT T7`** :
une seule porte gardée laisserait le joueur enfermé par les deux autres.

---

## 9. Écarts au brief, et points laissés en suspens

### Écarts déclarés

1. **La base de départ** — 1026 / 6 780 316 / 0.88.0 · build 90 au lieu des
   1015 / 6 779 831 / 0.87.0 · build 89 annoncés. Le lot ZOOM-CONTINU a été
   fusionné entre-temps ; §0.
2. **Les intervalles de 60 et 120 ms ne sont pas atteignables** depuis le banc :
   le plancher du dispatch CDP est de ~101 ms. Les deux sont sous la garde, mais
   le rapport ne prétend pas les avoir joués ; §4.
3. **« Instantané » et le pas-à-pas sont des chemins du simulateur**, pas du vrai
   raid : `#raid-vitesses` est masqué hors simulation. `ASSAUT T7` les monte donc
   par le simulateur ; §5.
4. **`#raid-titre` survit au déroulé.** C'est une légende posée SUR le canevas,
   pas une barre du chrome. Lecture déclarée, une ligne à changer.
5. **`#barre-bas` entre dans le chrome**, ce que le brief ne demandait pas
   explicitement — mais « toutes les barres disparaissent » la nomme, et la
   capture l'a montrée restée. Elle n'est masquée QUE pendant le déroulé.
6. **Les captures sont dans `rapports/`, à dpr 1.** Les mesures ont été prises à
   dpr 3 ; seule la définition change, la mise en page est en pixels CSS. Trois
   fichiers de 491 Kio en tout, plutôt que 5,5 Mio.

### Ce que le lot a trouvé sans que le brief le demande

- **`vueDuRaid` n'avait aucun appelant** depuis le lot RAID-A. Elle est vivante.
- **`#barre-bas` n'était dans aucune liste de chrome** parce que personne ne
  l'avait jamais masquée.
- ⚠ **Le panneau de la carte couvre le bas de l'écran**, et les seules cibles
  qu'une partie neuve met à portée sont aux rangées 294–296, c'est-à-dire tout en
  bas de la carte, qui est bornée à la rangée 300. **Au cran de zoom par défaut,
  le second toucher tombe donc sur le panneau et non sur la case** : mesuré, il
  faut zoomer pour entrer dans un raid. C'est très probablement ce que le lot
  MUR-PEINT avait relevé sans l'expliquer — « 120 doubles touchers balayés n'ont
  ouvert aucune cible ». **Ce n'est pas corrigé ici** : ce serait une géométrie de
  panneau, donc un autre lot, et Ethan n'a rien demandé dessus.
- ⚠ **« Simulateur » se coupe en deux lignes** dans la rangée à cinq boutons
  (45 px chacun contre 56 avant). C'est le comportement d'`overflow-wrap:
  anywhere` déjà en place, le même que la palette de l'Offense sur
  « Cuirassiers » ; le mot n'est pas tronqué, il passe à la ligne.

### Les trois nombres qu'Ethan tranche — un nombre se change seul

1. **La hauteur du bouton d'attaque** : `min-height: 48px`, `min-width: 104px`.
   Mesuré à 107 × 48 px sur 360 de large. Le monter réduit les cinq autres, qui
   sont à 45 px.
2. **Le coût affiché SUR le bouton** plutôt qu'à côté. Il tient en deux lignes
   dans les 107 px ; le sortir demanderait une place que la rangée n'a pas.
3. **Le délai de la garde** : `ECRAN_RAID.delaiArmementMs = 300`. Mesuré, il
   refuse un contact à 219 ms et laisse passer à 611. Le baisser rapproche du
   plancher mesuré du clic fantôme.
