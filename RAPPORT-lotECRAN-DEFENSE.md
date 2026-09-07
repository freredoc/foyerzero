# Rapport — lot ÉCRAN-DÉFENSE

**07/09/2026 · version 0.99.13 · build 114**

Six retours d'Ethan du 07/09 — points **2, 3, 4, 5, 6 et 16** —, tous
d'affichage. Le lot ne touche ni `src/sim/`, ni `src/data/`, ni une règle de
jeu : `src/ui/chantier.js`, la feuille et le balisage de `src/index.src.html`,
plus **un module neuf de `src/render/`** et une fonction pure de plus dans
`src/render/bandes.js`.

---

## 0. Ce que le lot pèse, et ce qu'il rend

`npm test` → **1264 pass / 0 fail** · `npm run build` → `dist/index.html`,
**8 012 076 octets**, **0 référence externe**.

Coût **+8 265 octets**, mesuré poste par poste contre un livrable **rebâti dans
un `git worktree`** depuis le commit de base (`9a30bdd`, 8 003 811 octets) :

| Poste | Avant | Après | Écart |
|---|---:|---:|---:|
| JavaScript | 356 871 | 358 593 | **+1 722** |
| feuille | 112 845 | 119 374 | **+6 529** |
| balisage | 33 827 | 33 841 | **+14** |
| images | 6 306 922 | 6 306 922 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| **total** | **8 003 811** | **8 012 076** | **+8 265** |

**La somme des cinq postes tombe EXACTEMENT sur le total** — **296 lignes
`data:` avant, 296 après, 291 URI de part et d'autre** : aucune image, aucun son
n'entre ni ne sort.

Borne T10 **inchangée à 9 300 000**, marge **1 287 924 octets, 13,85 %**.
La feuille est le poste le plus lourd du lot, et c'est le prix des paragraphes
qui expliquent pourquoi la ligne d'avis a quitté le flux : sept commentaires
neufs pour cinq règles CSS.

⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 27 — VÉRIFIÉ AU DIFF.** Pas un champ
n'entre dans l'état : une ligne de barre, un rayon dessiné, une mise en page de
fiche, un voile de bande et un liseré de vignette vivent tous dans l'écran.
`src/sim/state.js` n'a pas une ligne de changée.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le
lot ne touche ni `art/`, ni un outil de la chaîne — pas un octet
d'`art/sprites/` ne change.

---

## 1. Point 2 — le mode Pose ne recadre plus rien, et le brief ne nommait pas la cause

Le §2 du brief l'écrit de face : « **CE BRIEF NE NOMME PAS LA CAUSE, PARCE QU'IL
NE L'A PAS MESURÉE** ». Elle a donc été instrumentée **avant** qu'une ligne ne
change, dans Chromium à la géométrie du S25 FE (360 × 780 CSS, dpr 3), sur une
partie chargée depuis une vraie sauvegarde.

⚠⚠ **LA PRÉMISSE DU RETOUR EST À MOITIÉ FAUSSE, ET C'EST LE PREMIER FAIT À
DIRE.** Le décor **ne se recadre pas** : `--case-cote` vaut 36 px, la taille du
fond 360 × 720, sa position 50 % 0 % et le défilement 227 — **identiques dans
les trois modes**, avant comme après le lot. Ce qui change est la FENÊTRE qui
l'encadre.

| État | `#chantier-defile` avant | après |
|---|---:|---:|
| repos | 458 px | **458** |
| mode Pose | **414** | **458** |
| mode Améliorer | **414** | **458** |
| mode Réparer | **392** | 436 |

⚠⚠ **LA CAUSE EST LA LIGNE D'AVIS, QUI ÉTAIT UNE BARRE DANS LE FLUX.**
`#chantier-avis` portait `flex: 0 0 auto` : armer un mode la faisait paraître,
et le champ perdait **44 px par le bas**, ancrés en haut — donc le bas du décor
était rogné. C'est très exactement « le décor est cadré autrement », vu par
l'autre bout. Elle est désormais **posée** sur `#chantier-vue`, en `absolute`,
et elle ne participe plus à la hauteur.

⚠⚠ **ET `pointer-events: none` EST LA MOITIÉ QUI COMPTE.** Elle couvre le bas de
la grille : sans elle, elle avalerait le toucher des cases qu'elle recouvre —
la faute mesurée du lot TUTORIEL. **Mesuré après correction :
`elementFromPoint` au milieu de la ligne d'avis rend `DIV#chantier-grille`** en
mode Pose comme en mode Améliorer.

⚠⚠ **ET IL Y AVAIT UNE SECONDE PORTE, TROUVÉE EN REGARDANT UNE CAPTURE.** La
fiche restait ouverte par-dessus le champ : `.panneau-detail` est en `absolute`
et porte `z-index: 2`, donc elle recouvrait la ligne de mode **et les trois
quarts des cases que le mode venait de cercler** — le joueur armait « Poser » et
ne voyait pas où poser. `choisirPosable` et `armer` ferment donc le panneau, et
`ÉD T5 bis` le mesure sur les deux modes.

⚠⚠ **ÉCART DÉCLARÉ : `#chantier-reparation` POUSSE ENCORE LE CHAMP, DE 22 px, ET
IL NE PEUT PAS PRENDRE LE MÊME REMÈDE.** Il porte un BOUTON — « Tout réparer » —,
donc il doit recevoir le toucher, donc `pointer-events: none` lui est interdit ;
et lui réserver sa place d'avance coûterait ces 22 px **en permanence**, y
compris hors du mode Réparer. **Ethan tranche** : soit on accepte les 22 px
pendant ce mode-là, soit le bouton global déménage.

---

## 2. Point 5 — la barre d'action cesse de parler du Chantier, et la question posée a une réponse

Ethan, capture à l'appui : la barre affichait « Chantier de co… · Niv. 9 » et
« AMÉLIORER **vers niv. 10** » pendant qu'il regardait sa garnison. Reproduit
avant correction sur une partie bâtie : « Chantier de construction / Niv. 35 /
vers niv. 36 » sur la bande Défense.

⚠⚠ **LA QUESTION DU BRIEF — « le bouton AMÉLIORER agit-il vraiment sur le
Chantier ? » — A POUR RÉPONSE MESURÉE : NON.** Les quatre boutons suivent le
modèle « armer puis toucher », et `executerAction` reçoit
`terrainDeLaRangee(rangee)` — le terrain de la **case touchée**, jamais celui de
la sélection. Ce qui était faux, c'est ce que la barre **annonçait**.
`ÉD T2` FIGE le fait, parce que rien ne le disait : il monte une pièce de
garnison depuis la bande Défense et exige que la disposition de la base soit
**identique au caractère** après le geste.

⚠⚠ **CE QUI S'AFFICHE À LA PLACE EST LE COMPLEXE DE DÉFENSE, ET SON NOM SE
LIT.** `ligneSansSelection` est **pure et exportée** ; elle prend le nom dans
`BASE_BATIMENTS[RETOUR_DEFENSES.indexeeSur]` — la table qui dit déjà quel
bâtiment commande le retour de la garnison — plutôt qu'un `'complexeDeDefense'`
écrit à la main. Le Complexe est ce dont dépend le retour des pièces : c'est ce
que le joueur a de mieux à lire devant sa garnison.

⚠ **ET « VERS NIV. N+1 » TOMBE AVEC.** C'est ce mot-là qui promettait une montée
du Chantier ; il ne s'écrit plus que là où `terrain.actions.ameliorer` existe.

⚠⚠ **ELLE ACCEPTE UN ÉTAT ABSENT, ET C'EST CE QUI GARDE LA PHRASE UNIQUE.** La
première écriture laissait `selectionner` porter son propre repli pour
`etatCourant === null` : la phrase « aucun bâtiment sélectionné » était alors
écrite DEUX fois dans le fichier, et la garde du lot l'a dit.

⚠ **LA BANDE BASE NE CHANGE PAS.** Y annoncer le Chantier est légitime — c'est
ce autour de quoi la base se lit, arbitrage du lot ÉCRAN-CHANTIER — et `ÉD T3`
le garde. Sans Complexe posé, la barre dit « aucune pièce sélectionnée » et
**n'invente pas une seconde formulation** : `#chantier-garnison` écrit déjà
« Sans Complexe de défense, les pièces abîmées de la garnison ne reviennent
jamais », et le redire deux lignes plus bas dans d'autres mots donnerait au
joueur deux vérités pour un fait (`ÉD T4`).

⚠ **ET LA GARDE EXISTANTE S'EST RESSERRÉE, PAS ASSOUPLIE.** `défense — la ligne
de détail suit le TERRAIN` comptait les écrivains de cette ligne ; elle n'exempte
plus personne : chaque écrivain doit nommer `terrain.detail(` ou
`ligneSansSelection(`, et chaque phrase du vide n'est écrite qu'une fois.

---

## 3. Point 3 — le rayon d'attaque, dérivé du moteur et jamais d'un disque

`src/render/portee.js` entre — **treizième fichier de `src/render/`**. Il rend
deux fonctions pures : `porteeQuiTire(ligne)` et `casesAPortee(depuis, portees)`.

⚠⚠ **UNE PORTÉE DE 2,5 N'EST PAS UN CERCLE DE 2,5 CASES.** Le moteur compare des
CARRÉS de milli-cases — `distanceCarreeMilli(...) <= porteeCarree` et
`>= porteeMiniCarree` — sur des positions posées par `milliDepuisCase` au centre
de leur case. Un disque tracé au rayon 2,5 couvrirait des morceaux de cases hors
de portée et laisserait dehors des morceaux de cases à portée. Ce qu'on rend est
donc **l'ensemble des cases**, dérivé des deux mêmes fonctions que le combat.
`ÉD T6` le confronte case par case à un témoin recalculé **sur la grille
ENTIÈRE**, sur **deux portées** et **deux origines dont une contre le bord** — le
brief l'exige, et il a raison : un test sur une seule portée passerait sur un
rayon écrit en dur.

⚠⚠ **ET LE DISQUE N'EST PAS LE CARRÉ, MESURÉ.** Un rayon écrit en Tchebychev —
la faute la plus probable — rendrait **25 cases** pour la casemate au milieu de
la grille ; le disque euclidien en rend **21**. `ÉD T6` asserte l'écart, sans
quoi les deux témoins seraient calculés pareil et la garde ne dirait rien.

⚠⚠ **LA PORTÉE MINIMALE FAIT UN TROU, ET IL EST RENDU.** Les trois artilleries
portent `porteeMini: 3.5` : un disque plein mentirait sur ce qu'elles couvrent,
et le joueur poserait une Faucheuse au contact de ce qu'elle ne peut pas
toucher. `ÉD T7` mesure les deux moitiés — l'artillerie ne couvre **pas** sa
propre case, la tourelle **si** — et compte le trou (plus de dix cases), ce qui
fait tomber un module qui n'exclurait que le centre.

⚠⚠ **ET SEULE UNE PIÈCE QUI TIRE A UN RAYON, AUX TROIS CONDITIONS DE `peutTirer`
DU MOTEUR.** Un Mur porte `degats: null` et `portee: 0` ; une **Ronce a une
portée de 1 et ne tire jamais** — elle FRANCHIT. Les deux rendent `null`.
Mesuré : **les huit unités de garnison tirent**, les trois barrières non.

⚠⚠ **LES BÂTIMENTS N'EN ONT PAS, ET LE TERRAIN LE DIT PAR `roster`, JAMAIS PAR
UN `=== 'defense'`.** `TERRAINS.batiments.roster` vaut `null`,
`TERRAINS.defense.roster` résout la ligne dans les DEUX tables — `DEFENSES` puis
`UNITES` —, ce qu'`apercuDeLaPiece` fait déjà : l'écran n'écrit pas une
troisième résolution d'identifiant.

⚠ **ÉCART DÉCLARÉ : PAS DE `pointer-events: none` ICI, ET IL N'Y A RIEN À
NEUTRALISER.** Le brief le demandait par analogie avec le voile de bande. Le
rayon n'est pas un calque posé sur la grille : c'est une **classe sur la case
elle-même**, qui reste sa propre cible. `ÉD T8` mesure ce qui compte — le
toucher d'une case couverte tombe bien sur elle et déclenche le geste.

⚠ **ET L'ANNEAU FAIT 4 px, PAS 2 — MESURÉ À L'ÉCRAN.** À 2 px il était invisible
sur toute case déjà cerclée : `.case.legale` peint un `outline` de 2 px à
`outline-offset: -2px`, c'est-à-dire exactement la bande qu'un anneau de 2 px
occupe. Relevé après correction : `inset 0 0 0 4px rgb(166, 112, 24)`, soit
**`#A67018`** — l'ambre de la palette, **aucune teinte neuve**.

⚠ **RELEVÉ SUR UNE VRAIE PARTIE : 13 cases marquées** pour une Tourelle
mitrailleuse posée en (3, 1) — le rognage contre le bord et le bord bas de la
carte y mordent tous les deux. **Zéro erreur de page.**

---

## 4. Point 4 — la fiche en deux colonnes de PAIRES, et un seul rendu

Ethan : « condensé comme ça au lieu de deux lignes et un espace vide, faire une
ligne et deux colonnes ». **Deux colonnes de paires, pas quatre colonnes** : ce
qui se met côte à côte, c'est le COUPLE libellé/valeur, jamais le libellé d'un
côté et la valeur de l'autre.

Mesuré dans Chromium sur la même pièce, avant et après :

| | avant | après |
|---|---:|---:|
| panneau | 243 px | **204** |
| corps | 142 px | **103** |
| rangées distinctes | 7 | **4** |
| paires | 7 | 7 |
| débordement horizontal | non | **non** |

⚠ **ET LA VALEUR TOUCHE SON LIBELLÉ.** Le `flex: 1` du libellé poussait la
valeur au bord droit : c'est lui qui creusait le vide qu'Ethan barre.

⚠⚠ **LE RENDU EST UNIQUE, PUR ET EXPORTÉ, ET C'EST LE TEST QUI EMPÊCHE LA
TROISIÈME COPIE.** `peindreVueDuPanneau` sert la fiche de la Défense **et**
celle de l'Offense ; Ethan écrit « pour les unités défensive et offensive **et
futures cibles ennemies** » — la fiche ennemie n'existe pas encore, et c'est
maintenant qu'on lui prépare la place. `ÉD T8 ter` exige que l'Offense IMPORTE
et APPELLE le rendu partagé, et que le conteneur de paires ne soit écrit qu'une
fois dans tout `src/ui/`.

⚠ **LA PAIRE IMPAIRE RESTE SEULE À GAUCHE, ET LE CHOIX EST ÉCRIT.** L'étaler sur
la largeur demanderait un `:last-child:nth-child(odd)`, c'est-à-dire un cas
particulier de plus dans une feuille qui en a peu. `ÉD T8 quater` prouve d'abord
que la section « La pièce » a bien un nombre IMPAIR de paires — sans quoi il ne
mesurerait rien — puis refuse toute règle qui déciderait de son sort.

⚠ **`tabular-nums` N'A PAS ÉTÉ AJOUTÉ : IL Y ÉTAIT DÉJÀ**, sur la valeur d'une
ligne de fiche. Le brief demandait de le reprendre ; il n'y avait rien à
reprendre, et le dire vaut mieux que de l'écrire une seconde fois.

---

## 5. Point 6 — le hachuré couvre les deux lignes du bas, d'un seul tenant

Ethan : « Afficher le hachuré dans les 2 lignes du bas en défense. » Ce sont les
rangées 1 et 2 — le **déploiement**, celui par où l'assaut arrive.

⚠⚠ **UN SEUL ÉLÉMENT PAR ZONE, ET C'EST LA COUTURE QUI L'IMPOSE.** Le voile est
un dégradé répété à −45° : deux éléments **adjacents** redémarrent sa phase à
leur jointure, et la couture se voit. `voilesDeLaBande` de `render/bandes.js`
FUSIONNE donc les lignes contiguës, et `ÉD T9` ne se contente pas de compter les
zones — il exige qu'**aucune paire de zones ne se touche**, et que le voile ne
couvre jamais la bande qu'on regarde.

Relevé à l'écran, bande Défense : **`1 / span 8`** (les bâtiments) et
**`17 / span 2`** (le déploiement) — deux zones disjointes, séparées par les
huit lignes de la Défense. Bande Base : **une seule zone**, `9 / span 10`, la
Défense et le déploiement s'y touchant, donc fusionnant.

⚠⚠ **ET LA FONCTION NE NOMME AUCUNE BANDE — LA PREMIÈRE ÉCRITURE LE FAISAIT, ET
UNE GARDE EXISTANTE L'A REFUSÉE.** Deux tables littérales avaient été posées ;
`RAID-E T5` est tombé dessus, en disant « les trois bandes sont nommées ailleurs
qu'une fois ». Elle avait raison. La version retenue **dérive** les zones de
`BANDES` : elle est vraie quel que soit le découpage, et le jour où une
quatrième bande entrera, elle suivra sans qu'on y pense.

⚠ **AUCUN `z-index` N'EST APPARU SUR UNE CASE**, et `ÉD T10` le garde — un
`z-index` sur une case en fait un CONTEXTE D'EMPILEMENT, son jeton reste
prisonnier de l'étage 1 et le mur lui passe dessus. `.case.choisie` l'a coûté
une fois.

---

## 6. Point 16 — le menu armé perd ses fonds pleins, il garde ses pointillés

Ethan : « Menu armé : enlever les fonds pleins, garder les contours pointillés
pour les unités. »

⚠⚠ **LA RÈGLE EXISTAIT DÉJÀ, ÉCRITE DEUX FOIS, ET ELLE A ÉTÉ REPRISE PLUTÔT QUE
RECOPIÉE.** `#ecran-offense .emplacement` et `#ecran-raid .emplacement`
portaient chacun `border: 1px dashed #4E5742`, à l'identique. En écrire une
troisième pour la palette aurait fait **trois définitions du même pointillé**,
dont deux se seraient tues au premier réglage : c'est **un sélecteur de plus**,
pas une seconde règle. `ÉD T12` exige que la déclaration soit écrite UNE fois et
nomme les trois sélecteurs.

⚠⚠ **`background: transparent` EST OBLIGATOIRE, PAS COSMÉTIQUE — MESURÉ À
L'ÉCRAN.** Retirer la déclaration de fond ne laisse pas la vignette
transparente : **un `<button>` sans fond déclaré retombe sur le gris clair du
navigateur**, et les cinq vignettes sont ressorties EN CLAIR sur le bandeau
sombre — l'inverse exact de ce qu'Ethan demande. Trouvé en regardant une
capture, pas à la relecture.

⚠⚠ **LE LISERÉ DEVIENT LE SEUL DISCRIMINANT DES TROIS ÉTATS, ET `ÉD T11` EXIGE
QU'ILS RESTENT DEUX À DEUX DIFFÉRENTS.** `#4E5742` au repos, `#1E2124`
verrouillée, `#F5F3E8` armée — **trois teintes de la fiche, aucune neuve**. Une
vignette verrouillée se lisait à son aplat sombre ; sans lui elle se lit encore
à son liseré éteint, à son libellé gris ardoise et à son sprite à 40 % : trois
signaux là où il en fallait un.

⚠ **ET LA PALETTE GRISE TOUJOURS, ELLE NE RETIRE PAS** — arbitrage du 28/08,
intact. `ÉD T13` et `ÉD T14` le gardent des deux côtés : le roster entier reste
affiché, chaque pièce verrouillée dit sa raison, et **la palette ne change pas
de longueur quand une pièce se pose** — une palette qui rétrécit déplace les
vignettes sous le doigt entre deux gestes.

---

## 7. Relecture hostile — §10

Le brief demande de chercher **une** chose : « un endroit où l'écran recalcule un
nombre que le moteur détient déjà ». Il y en avait un, **et il était dans le code
que ce lot venait d'écrire**.

⚠⚠ **`casesAPortee` CONVERTISSAIT LA PORTÉE EN MILLI-CASES PAR
`Math.round(portee × 1000)`.** C'était la SECONDE conversion de cette grandeur
dans le dépôt : `creerCombat` la fait déjà, par `enEntier(u.portee, MILLE, …)`,
et le millier écrit en clair était une seconde écriture de `MILLI_PAR_CASE`.

⚠⚠ **ET LES DEUX NE RENDENT PAS LA MÊME CHOSE.** `Math.round` **accepte** une
portée de 2,5001 et l'arrondit en silence ; `enEntier` **lève** en nommant la
table fautive. Le dessin aurait donc pu montrer un rayon qu'aucun tir n'atteint,
sans que rien ne le dise. Corrigé : le module appelle `enEntier` et
`MILLI_PAR_CASE`, les deux exports de `sim/grille.js` que le moteur emploie.

⚠ **`ÉD T6 bis` LE GARDE PAR DEUX CHEMINS** : la source ne porte plus ni `1000`
ni `Math.round`, **et** une portée de 2,5001 lève pour de bon. Le second sans le
premier laisserait passer un `Math.round` réécrit sous un autre nom ; le premier
sans le second ne mesurerait que du texte.

⚠ **RIEN D'AUTRE N'A ÉTÉ TROUVÉ.** Les autres nombres de l'écran — le niveau du
Complexe, le coût d'une amélioration, la durée d'un retour, les points engagés —
sont tous **demandés** à `sim/`, et les gardes du dépôt le tenaient déjà.

---

## 8. Tests, falsifications et gardes existantes

⚠ **DIX-NEUF TESTS ENTRENT — `ÉD T1` à `T14`, plus `T5 bis`, `T6 bis`, `T8 bis`,
`T8 ter` et `T8 quater` — ET LE COMPTE PASSE DE 1 245 À 1 264.** Dix-sept dans
`test/chantier.test.js`, deux dans `test/rendu.test.js`.

⚠⚠ **`ÉD T6`, `ÉD T6 bis` ET `ÉD T7` VIVENT DANS `rendu.test.js`, ET C'EST LE
PARTAGE DU DÉPÔT.** `render/portee.js` est PUR : il ne connaît ni case du DOM,
ni classe, ni écran. Ce que l'écran en fait — poser `a-portee` sur la case, et
rien d'autre — se mesure dans `chantier.test.js`, sur le document monté.

⚠ **VINGT ET UNE FALSIFICATIONS, VINGT ET UNE CHUTES — ET QUATRE ONT DÛ ÊTRE
REFAITES, CHACUNE POUR UNE RAISON QU'IL FAUT DIRE.**

⚠⚠ **LA PREMIÈRE A TROUVÉ UN MOTIF MORT DANS MA PROPRE GARDE.** Poser
`z-index: 1` sur `.case.a-portee` laissait `ÉD T10` **VERT** : son expression
régulière s'échappait DEUX fois, si bien qu'elle cherchait un backslash littéral
et ne trouvait jamais rien. **Et son témoin ne le voyait pas non plus** — il
portait une expression écrite à la main, DIFFÉRENTE de celle qu'il prétendait
éprouver. Le test compte désormais les règles qu'il retrouve, et son témoin passe
par LE MÊME constructeur de motif. Falsification rejouée : elle mord.
⚠ **Le même défaut d'échappement tuait `ÉD T11`** — trouvé en l'écrivant, pas en
le falsifiant.

⚠⚠ **LA DEUXIÈME A TROUVÉ UNE BORNE TROP LARGE.** `ÉD T5` vérifiait que la ligne
d'avis est DANS `#chantier-vue` en bornant sa tranche au `<div
id="chantier-panneau">` qui suit : la fente entre le `</div>` de la vue et le
panneau tombait dedans, donc **déplacer la ligne juste après la fermeture de la
vue la laissait VERTE**, mesuré. Elle compte maintenant la profondeur des `div`
et s'arrête sur la balise qui ferme vraiment la vue, avec une assertion qui
refuse que la tranche déborde.

⚠ **LES DEUX AUTRES ÉTAIENT DES FALSIFICATIONS MAL FORMÉES, ET ELLES NE SE
COMPTENT PAS COMME DES CHUTES.** L'une cassait la syntaxe du module — « 0 pass /
1 fail ne prouve rien » — ; l'autre visait un mécanisme qui ne changeait rien à
ce que `ÉD T14` mesure, et elle a été refaite pour retirer une pièce **dès
qu'elle est posée**, ce qui est le danger réel.

⚠ **ET TROIS MONTAGES DE MOI ONT DÛ ÊTRE CORRIGÉS AVANT DE CROIRE LEUR ROUGE.**
(1) `baseAvecComplexe` laissait le QG de défense au niveau 1, donc
`niveauDeCommandementDeLaBase` valait 1 et **toute** montée d'une pièce était
refusée sous `plafond-commandement` : `ÉD T2` mesurait un refus du moteur en
croyant mesurer le terrain touché, et il aurait passé sur un code qui améliore
bel et bien le Chantier. (2) `ÉD T8` dispatchait son clic **sur la case** ;
l'écran ne pose qu'UN écouteur, sur la grille, et lit `evenement.target` — le
geste n'atteignait personne. (3) Le même test cherchait une case couverte dans
le rayon d'une casemate posée en rangée 3 : le rayon déborde sur le
**déploiement**, où aucune pièce de garnison ne se pose.

⚠ **DEUX GARDES EXISTANTES CHANGENT DE CIBLE, ET LES DEUX SE RESSERRENT.**
`défense — la ligne de détail suit le TERRAIN` n'exempte plus aucun écrivain ;
`ERGO T5` suit le mécanisme des voiles et leur nouveau `grid-row`. **Aucune
assertion n'a été retirée ni assouplie.**

⚠ **ET UNE GARDE EXISTANTE A MORDU SANS QU'ON LA PROVOQUE** : `RAID-E T5`, sur
les tables de bandes littérales du premier jet — voir le §5.

---

## 9. Ce qui reste ouvert pour Ethan

1. **Les 22 px de `#chantier-reparation`** — §1 ci-dessus. Le bouton « Tout
   réparer » interdit le remède de la ligne d'avis ; réserver sa place d'avance
   coûterait la hauteur en permanence.
2. **Le rendu n'a pas été vu sur appareil**, et se déclare non exécuté : tout ce
   qui précède est relevé dans Chromium à la géométrie du S25 FE, ce qui n'est
   pas le téléphone d'Ethan (CLAUDE.md §3).
3. Hérités des lots précédents et non touchés : `REPARATION_BASE_JOUEUR`, la
   fiche du Complexe qui n'annonce plus le pire cas, et le calibrage du lot
   COLONNE — butin **+67,4 %**, `blindeLourd/base/1` à **5 478 ticks**.
