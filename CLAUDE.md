# CLAUDE.md — Foyer Zéro

À lire en premier, à chaque session. Fait autorité sur ce document-ci ;
pour le contenu du jeu, voir la hiérarchie ci-dessous.

**Foyer Zéro** (codename interne : *Chantier*) — jeu de guerre idle solo, hors ligne,
distribué comme un fichier HTML autonome, avec enveloppe Android WebView et
auto-update par GitHub Pages. Paquet : `fr.freredoc.foyerzero`.

Dernière révision : **02/09/2026**, version 0.69.0 · build 70.

---

## 0. Premier geste, sans exception

1. Lire ce fichier.
2. Lire la **passation la plus récente** — `PASSATION-<date>.md` à la racine.
   Elle dit où en est le projet, ce qui est ouvert et ce qui a coûté cher.
3. **Lister** la racine, `src/`, `src/data/`, `src/sim/`, `src/render/`,
   `src/ui/` et `test/`. Ne jamais se fier à la mémoire pour l'arborescence, ni
   à la §2 de ce fichier : **elle a déjà menti, deux fois.** Elle est relevée le
   26/08/2026 ; elle sera périmée le jour où quelqu'un ajoutera un fichier.
4. `npm ci && npm run check` **avant de toucher quoi que ce soit**, et consigner
   le compte de tests obtenu. Un lot qui démarre sur une base rouge sans le
   savoir est un lot perdu.
5. **SI LE LOT TOUCHE À L'ART** — `art/sources/`, `art/sprites/` ou un outil de
   `tools/` —, lancer aussi `python3 tools/verifier.py` et consigner son verdict.
   Il dit si la chaîne produit encore, à l'octet, les sprites qui sont au dépôt,
   et c'est la seule chose qui le dise : `npm run check` était VERT le 30/08
   pendant que six PNG d'emblème contredisaient l'outil qui les fabrique.
   ⚠ **Pas aux autres lots.** Il prend deux minutes ; une consigne qu'on
   n'applique pas en affaiblit d'autres.
6. ⚠ **AVANT DE DEMANDER UN ARBITRAGE À ETHAN, CHERCHER LA RÉPONSE DANS LE
   DÉPÔT.** `src/data/` porte toutes les valeurs de calibrage,
   `SPEC-FOYER-ZERO.md` la règle, les `RELEVE-TA-*.md` d'où elle vient. Le
   29/08, quatre questions ont été posées à Ethan sur les points d'attaque :
   **trois avaient déjà leur réponse dans `POINTS_ATTAQUE` et dans la §3 de la
   spec** — le plafond, le barème du raid et le nom même de la grandeur —, et la
   quatrième a fait remplacer une valeur juste par une autre, retirée le soir
   même. Un `grep` de trente secondes sur la grandeur en jeu vaut mieux qu'une
   question : le dépôt est devenu assez gros pour que le savoir y soit déjà, et
   assez gros pour qu'on ne tombe plus dessus par hasard.

**Référence au 02/09/2026 (après le lot TRANSFERT), à confronter :**
`npm test` → **924 pass / 0 fail**, `npm run build` → `dist/index.html`,
**1 591 262 octets**, 0 référence externe. Coût **+9 343 octets**, aucune image
n'entre — **16 `data:image` avant, 16 après**. Marge T10 **58 738 octets,
3,56 %**, borne inchangée à 1 650 000.
⚠⚠ **DEUX RÈGLES SUR LE PLAFOND DE STOCKAGE, ET ELLES SE LISENT ENSEMBLE.** Le
butin d'un raid a désormais **le droit de dépasser** la capacité ; tant que le
stock est au-dessus, **cette ressource-là cesse d'être produite dans cette
base**. Le transfert entre bases, lui, est **REFUSÉ** s'il ferait déborder :
rien ne se perd jamais. Arbitré par Ethan le 02/09.
⚠⚠ **LA BASE DE RÉFÉRENCE DU BRIEF N'A PAS ÉTÉ RETROUVÉE, ET C'EST LE LOT PIXELS
QUI L'EXPLIQUE ENTIÈREMENT.** Le brief était écrit après BASES-1 — 0.67.0 / 68,
1 388 959 octets, 902 tests ; PIXELS a été mergé entre-temps. Les DEUX faits dont
ce lot-ci dépend, eux, étaient intacts : `SAVE_VERSION` à **24** et `butinPerdu`
dans **exactement les quatre fichiers** annoncés. PIXELS ne touche `src/` que par
`src/ui/banc.js`. **Signalé à Ethan plutôt que traité comme un point d'arrêt.**
⚠⚠ **`butinPerdu` DISPARAÎT, ET LE PLAFONNEMENT AVEC.** `verser` — la fonction
privée de `raid.js` qui rabattait — est RETIRÉE, pas déplacée : elle rendait « ce
qui n'a pas pu entrer », plus rien ne peut ne pas entrer, donc sa signature
aurait menti. Le champ `butinPerdu` quitte le rapport de raid pour la même
raison : un champ qui vaut toujours `{}` invite à écrire un écran qui ne montrera
jamais rien.
⚠⚠ **LE GEL DU SURPLUS N'A PAS ÉTÉ ÉCRIT PAR CE LOT — IL A ÉTÉ PROUVÉ.** Il est
dans `economie-base.js` depuis le 26/08, dans les DEUX chemins ; ce lot retire ce
qui l'empêchait. **Mesuré : `tickEconomieBase` × 4 000 et
`rattrapageEconomieBase(4 000)` rendent des états IDENTIQUES en partant
au-dessus du plafond, résidus compris**, le quartz gelé et la scorie encore
productive. C'était un point d'arrêt du brief : il n'a pas été atteint.
⚠⚠ **CINQ CHEMINS DE RAPPORT BOUGENT, ET PAS UN DE PLUS** — mesurés en rejouant
`origin/main` et HEAD côte à côte, en profondeur : `offense.butinPerdu`,
`offense.butin.{quartz,scorie}`, et `defense.sanction.perdu.{quartz,scorie}`. Ce
dernier est la conséquence la moins évidente du lot, et elle est juste : un
rasage détruit les ressources STOCKÉES, que le butin peut maintenant porter plus
haut. La sanction détruit donc davantage.
⚠ **LE TÉMOIN DE BASES-0 TIENT, AVEC QUINZE COUPLES DÉCLARÉS SUR 322** —
`rapports` et `economie` à partir de la phase 7, qui est le premier raid. ⚠
`economie` ne bouge PAS en phase 14, et c'est mesuré : la base y est rasée trois
fois, un rasage met les stocks à zéro, et les vingt-quatre heures qui suivent
saturent à la capacité quoi qu'un butin ait versé avant.
⚠⚠ **AUCUN `Math.sqrt`, ET L'ARRONDI EST EXACT EN ENTIERS** :
`round(√x) = n ⟺ (2n−1)² ≤ 4x < (2n+1)²`. **Vérifié sur les 7 879 couples de 0 à
140 qui tombent dans les 99 cases : zéro désaccord** avec la racine flottante. La
boucle est BORNÉE explicitement — cent tours au pire — pour qu'une position
absurde ne la fasse pas tourner des milliards de fois.
⚠⚠ **ÉCART DÉCLARÉ SUR T6 : « le grep reste vide » ÉTAIT IMPOSSIBLE.** Deux
`Math.sqrt` existent depuis les lots ÉCRAN-CARTE et RETOURS-DU-31, dans le chemin
du DESSIN — `render/terrain.js` normalise une somme pondérée, `ui/monde.js` un
vecteur d'écran —, et le second porte déjà le commentaire qui dit pourquoi. La
garde tient donc la doctrine d'EUCLIDE : **interdiction TOTALE dans `src/sim/` et
`src/data/`**, liste FERMÉE et nommée ailleurs.
⚠ **TAXE DE 1 % PAR CASE, PERDUE — elle ne va nulle part**, et un test le dit de
face : le total des deux bases baisse d'exactement ce qui est annoncé perdu. M1,
sur un aller-retour de 1 000 unités : **19 % perdus à 10 cases, 75 % à 50,
99,99 % à 99**.
⚠ **LE REFUS SE CALCULE SUR LE REÇU, PAS SUR L'ENVOYÉ**, et le plafond de la
destination est `max(cap, stock)` comme partout depuis le 26/08 — une base déjà
au-dessus ne peut donc **rien** recevoir.
⚠⚠ **TROIS FALSIFICATIONS SUR QUATORZE NE MORDAIENT PAS AU PREMIER RELEVÉ**, et
les tests qui les attrapent ont été écrits APRÈS la mesure : le refus écrit
`>= 99` (aucun test ne faisait PASSER un transfert à 99 cases), le débordement
comparé à l'envoyé (le montage enfermait son assertion dans un `if` jamais vrai),
et une troisième qui s'est révélée être une mauvaise falsification —
`max(cap,stock)−stock` et `cap−stock` bornés à zéro rendent le même nombre.
⚠ **LA PRÉMISSE DE `fondation.js` EST TOMBÉE, LE COMPORTEMENT EST GARDÉ** : le
butin d'un camp fondé dessus va toujours à la base QUI FONDE, mais l'argument
(« la neuve déborderait en entier ») n'est plus valide. **DÉCISION À ROUVRIR PAR
ETHAN** — le commentaire porte les deux côtés.
⚠ **`SAVE_VERSION` NE BOUGE PAS ET RESTE À 24.** Le transfert est INSTANTANÉ :
aucun champ persistant. **Mesuré : la sauvegarde grandit de ZÉRO octet** sur les
vingt-cinq graines du témoin, et un test asserte qu'aucune clé n'entre dans
l'état.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`.

**Auparavant, après le lot PIXELS :**
`npm test` → **903 pass / 0 fail**, `npm run build` → `dist/index.html`,
**1 581 919 octets**, 0 référence externe.
⚠⚠ **LA CHAÎNE GRAPHIQUE A CESSÉ DE FAIRE RENTRER LES PLANCHES DANS UN MOULE.**
Les sources sortent déjà en pixel art : `ecrire` ne peint plus une grille
d'indices quantifiée sur quatorze teintes, il **détoure, prémultiplie, réduit en
LANCZOS, dé-prémultiplie et coupe l'alpha sous 8**. Coût **+192 960 octets**, et
**la borne T10 est relevée de 1 400 000 à 1 650 000** — marge **68 081 octets,
4,13 %**. Toujours **16 `data:` avant, 16 après**, mais huit d'entre eux ont
changé de format.
⚠⚠ **C'EST LE WEBP QUI REND LE PROTOCOLE TENABLE, PAS LE PROTOCOLE SEUL.**
Mesuré sur les huit atlas cousus, grille 64 : **478 793 o** en PNG quantifié la
veille, **1 668 951 o** en PNG rendu libre — ×3,5, hors de question —,
**561 240 o en WebP q85**. Les deux grosses bases de l'Ouvrage, elles, sont hors
atlas et restent des PNG : elles passent de 27 779 à 90 047 octets, sans remède,
un atlas d'un seul sprite ne cousant rien.
⚠⚠ **LES ATLAS SONT EN `.webp`, LES SPRITES RESTENT EN `.png`, ET C'EST CE QUI
SAUVE LES TESTS.** `decoderRgba` de `test/png-rgba.js` lit toujours la matière
partout — accent, trous, murs de contour. Seul l'atlas est illisible côté JS.
⚠⚠ **`tools/atlas.py` COUD DEUX GRILLES ET N'EN EMBARQUE QU'UNE.** La 128 est
au dépôt pour le jour où un écran la demandera — **1 407 070 octets, zéro octet
de livrable**. La grille embarquée tient dans **UNE constante de
`tools/build.js`**, `GRILLE_ATLAS`, et un test refuse qu'elle diverge du
`COTE_SPRITE` de l'index.
⚠⚠ **LA GARDE DES PIXELS DE L'ATLAS EST DEVENUE UNE GARDE D'EMPREINTES, ET
C'EST UN ARBITRAGE D'ETHAN DU 02/09.** `test/sprite.test.js` décodait l'atlas
pour comparer sa cellule `i` au sprite `i` — la garde née de BÂTIMENTS-1024 ;
Node n'a pas de décodeur WebP et §3 interdit d'ajouter une dépendance de test.
`tools/atlas.py` écrit donc `art/sprites/atlas-empreintes.json` : le SHA-256 de
chaque atlas ET de chaque sprite source. **Falsifié dans les deux sens** — un
sprite remplacé, un atlas remplacé : la garde tombe à chaque fois.
⚠ **CE QU'ELLE NE TIENT PLUS : la correspondance CELLULE ↔ SPRITE**, refaite par
RECONSTRUCTION à chaque `python3 tools/verifier.py`, donc sur les lots d'art et
non plus à chaque `npm run check`. Les deux autres issues étaient mesurées :
committer aussi un PNG jamais embarqué (+1,6 Mio de dépôt, deux fichiers pour
une vérité) ou rester en PNG (livrable à 2,94 Mo).
⚠⚠ **LA SENTINELLE DE TRANSPARENCE ÉTAIT FAUSSE POUR L'OUVRAGE, ET LE LOT LA
CORRIGE SANS QUE ÇA CHANGE UN SEUL OCTET.** `cond.reduire` prenait `TR` à
`len(PAL)` = 14 ; la palette de l'Ouvrage en compte **19**, et son index 14 est
« A contour » `#0D0B12` : transparent et contour partageaient la case du vote.
`TR` est désormais un paramètre. **Mesuré : 0 fichier sur 51 change quand on
remet 14** — depuis que `ecrire` réduit la MATIÈRE, la grille `g` n'atteint plus
aucun fichier, et `boite(g)`, son seul consommateur, est un diagnostic dont
l'appelant jette le retour. **La falsification que le brief proposait pour la
garde des trous est donc impossible**, et c'est l'autre geste qui la tient.
⚠⚠ **LA SECONDE PORTE DE `est_fond` PERÇAIT LE SUJET, ET C'EST ELLE QUI FAISAIT
LES TROUS.** `c2` attrape le violet clair de l'Ouvrage jusqu'au MILIEU d'une
base, et `eroder` transforme chaque pixel pris en losange de 25. `est_fond_sujet`
la borne à la composante de fond qui TOUCHE LE BORD. **Mesuré, trous enfermés
dans les sprites de l'Ouvrage en grille 128 : 55 865 px avant, 1 194 après** ;
et la falsification, rejouée pour de bon, fait remonter 51 sprites de 113 à
19 213 px.
⚠ **`est_fond` N'A PAS ÉTÉ TOUCHÉE, ET C'ÉTAIT OBLIGATOIRE** : elle DÉCOUPE
aussi les planches — gouttières d'`emblemes.cellules`, `bandes`, `pivot` de
`tourelles.py`. La toucher aurait déplacé les cellules elles-mêmes.
⚠ **LA CLÉ VERTE EST PLOMBÉE, PAS ÉPROUVÉE.** `cle_de_fond` choisit magenta ou
vert `#00FF00` d'après les quatre coins, parce que le violet de l'Ouvrage frôle
le magenta — distance minimale 140,0, pile sur le seuil. **Aucune source verte
n'est au dépôt aujourd'hui**, et une qui arriverait demanderait aussi
`recadrer`, dont le fond de remplissage est magenta en dur et qui appelle
`est_fond` : ce sera un lot, pas une ligne.
⚠⚠ **LA GRILLE 32 EST SORTIE — 465 FICHIERS RETIRÉS — SAUF `terrain/32`.** Ni le
jeu ni les tests ne la lisaient. `terrain/` est une SOURCE DÉCLARÉE que la
chaîne ne reproduit pas : ses planches d'origine ont été supprimées par la
migration qui les a consommées, donc **ses 18 tuiles en 32 sont irrécupérables**
et elles restent. C'est le seul écart au §3.1 du brief, et il est délibéré.
⚠ **`ECARTS_PERMANENTS` EST VIDE POUR LA PREMIÈRE FOIS.** Ses deux lignes
désignaient `unite/32/off_j_ratisseur.png` et `off_j_belier.png` : la grille où
elles vivaient n'est plus produite. La passe `aligner` des chenilles meurt avec
elles — elle ne tournait qu'en 32, et elle peignait dans `g`, que plus rien ne
dessine. `tools/align_chenilles.py` reste au dépôt, sans appelant.
⚠⚠ **`test/accent.test.js` NE MESURE PLUS UNE ÉGALITÉ, ET C'EST ARBITRÉ.** Il
comptait les pixels EXACTEMENT d'une des six teintes d'accent ; après réduction
par filtre il n'en reste aucun — mesuré, `off_j_pilon_s` passe de **161 pixels
de véhicule à ZÉRO**. Il classe désormais chaque pixel sur la teinte la plus
PROCHE des quatorze, sous les trois portes de `final128.quant`. **48/48
d'accord hors dettes**, là où l'ancien n'exigeait que 30.
⚠⚠ **ET LES SEUILS DES PORTES NE SE RETAPENT PAS EN JS, ILS SE GÉNÈRENT** —
exigence d'Ethan, 02/09. Ils vivent dans `tools/portes.py`, `final128.quant` les
emploie, `atlas.py` les écrit dans `atlas-empreintes.json`, le test les lit. Le
JS ne porte que la FORME des trois conditions. **Falsifié : fermer la porte du
rouge dans le fichier généré fait tomber les quatre tests.**
⚠⚠ **DEUX DES QUATRE `DETTES_ACCENT` SE REFERMENT, ET L'ART N'A PAS BOUGÉ.**
`ratisseur` et `belier`, camp `o`, rendent exactement ce que la table dit :
**ce n'était pas l'art qui était de travers, c'était la quantification qui
effaçait l'accent** — un pixel d'accent isolé perdait son vote de bloc contre le
kaki autour. Les deux lignes sont retirées, comme la table l'exigeait
d'elle-même. Il en reste deux, `broyeur j` et `pilon j`, encore violées.
⚠ **TROIS AUTRES FORMULATIONS ONT ÉTÉ MESURÉES ET ÉCARTÉES**, dont celle
qu'Ethan demandait d'essayer d'abord : le plus proche parmi les SIX accents
seuls rend **40/48 au mieux**, balayé de 10 à 100 dans les deux métriques ; sans
les portes, 46/48 — le `busard` bascule.
⚠⚠ **LE LISSAGE REVIENT SUR UN SEUL CANEVAS, ET LES DIX AUTRES SITES ATTENDENT
UN ARBITRAGE.** `ui/banc.js` passe à `imageSmoothingEnabled = true` : le
protocole repose sur le filtre, et une case de 71 px tirée d'un sprite de 64
double SEPT colonnes sur 64 en plus proche voisin. **Le brief ne nomme que cette
ligne-là.** `ui/raid.js` porte la même à `false` avec le même argument, et la
feuille porte **huit `image-rendering: pixelated`**. L'argument NE vaut PAS pour
`ui/monde.js`, dont les quatre crans sont des puissances de deux.
⚠ **`python3 tools/verifier.py` → 931 identiques · 0 différent · 0 nouveau ·
0 MANQUANT**, verdict VERT, en 198,5 s. Il était dû : le lot touche `art/` et
`tools/`. La veille, sur `main` : 1 386 · 2 · 0 · 0.
⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 24.** Le lot ne touche ni l'état, ni
la sauvegarde, ni une seule règle de jeu : c'est du dessin et de l'outillage.

**Auparavant, après le lot BASES-1 :**
`npm test` → 902 pass / 0 fail, `npm run build` → `dist/index.html`,
**1 388 959 octets**, 0 référence externe.
⚠⚠ **CE LOT OUVRE LE MULTI-BASES, ET C'EST LE PREMIER OÙ LE JOUEUR EN A DEUX.**
Fonder, basculer, haloter. Coût **+3 029 octets**, aucune image n'entre —
**16 `data:` avant, 16 après**. ⚠⚠ **MARGE T10 : 11 041 OCTETS, 0,79 %.** C'est la
première fois qu'elle passe sous le pour-cent, et **la borne N'A PAS ÉTÉ
RELEVÉE** : la règle §5 veut qu'elle monte quand une RESSOURCE entre, jamais
pour faire passer du code. Le prochain lot qui fait entrer une image devra la
relever EN ÉCRIVANT POURQUOI ; celui qui n'en fait pas entrer devra tenir dans
onze kilo-octets.
⚠⚠ **`etat.bases` PEUT ENFIN EN PORTER PLUSIEURS, ET `basesAutorisees` DIT
COMBIEN.** Le nœud `SPECIAL.deuxiemeBase` est renommé **`baseSupplementaire`** —
« deuxième » devient faux au rang 3 — et il se RACHÈTE : `2 000 000 × 2,5^(rang−2)`
points, chaîne OUVERTE. ⚠ **Le ×2,5 est une fraction d'entiers, 5 / 2, jamais un
flottant** : mesuré, `Math.round(2e9 × 2,5²³)` rend **360 milli-points de moins**
que la vérité au rang 25. Au rang 10 les deux coïncident encore — un test qui
s'arrêterait là passerait sur le code faux.
⚠⚠ **LE ×2,5 EST PRIS SUR LA PAROLE D'ETHAN.** Il cite un classeur
`fz recherche.xlsx` qui n'est **PAS dans le dépôt**, et §1 interdit de toute
façon de lire un `.xlsx` pour coder. Aucune autre valeur d'équilibrage n'a bougé.
⚠⚠ **`territoire.js` PASSE EN EUCLIDIEN, ET LE LOT EUCLIDE L'AVAIT MANQUÉ.**
`peindre` remplissait un CARRÉ de (2r+1)² cases sans le moindre test de
distance : la carte peinte et le prix du raid décrivaient deux géométries.
**Mesuré : le disque du joueur fait 13 cases au lieu de 25, celui de l'Ouvrage 29
au lieu de 49.** M1 — sur **150 graines et 5 161 cibles**, le prix moyen d'un raid
passe de **27,945 à 28,078 points**, soit **+0,133** ; **3,33 % des cibles**
renchérissent, toutes en diagonale. **Rien n'a été compensé.**
⚠⚠ **FONDER EST INTERDIT DANS LE TERRITOIRE DE L'OUVRAGE, ET LA CONSÉQUENCE SE
MESURE.** Sur 40 graines, le nombre de cases fondables dans le disque de rayon 10
tombe de **261 sur 317 à la rangée 295** à **190 à la 285**, **24 à la 275** et
**moins d'une au-delà de la 270** : l'Ouvrage tient 100 % des rangées hautes.
**Le jeu passe donc par le rasage** — une base rasée cesse de projeter son
influence — et ce n'est pas un défaut à corriger, c'est ce que l'arbitrage
d'Ethan produit. À relire s'il veut fonder plus haut.
⚠⚠ **DEUX BASES DU JOUEUR PEUVENT ÊTRE ADJACENTES, ET C'EST ARBITRÉ.** Ethan,
02/09 : fonder dans son PROPRE territoire est autorisé ; il avait d'abord appelé
cela un exploit, puis tranché autrement. **Seule la case EXACTE d'une base
existante est refusée** — un `=== 0` dans `problemesDeLaFondation`, à changer en
rayon si Ethan revient dessus.
⚠⚠ **LE BUTIN D'UN CAMP FONDÉ DESSUS VA À LA BASE QUI FONDE. LECTURE PRISE.**
Une base neuve n'a qu'un Chantier de niveau 1 — 50 · 50 · 40 de capacité — et le
butin d'un avant-poste la ferait déborder EN ENTIER. `verserLeButin` est sorti
d'`executerRaid` pour que le raid et la fondation partagent UN code de
plafonnement, `butinPerdu` compris.
⚠⚠ **HALOTER ET BASCULER SONT LE MÊME GESTE. LECTURE PRISE.** Le halo suit
`etat.baseCourante` ; deux notions distinctes — « la base affichée » et « la base
qui attaque » — se désynchroniseraient à la première inattention, et le joueur
lancerait un raid depuis une base qu'il ne regarde pas.
⚠⚠ **LA SIXIÈME CONDITION DE RUPTURE DE `rattraperJeu` EST TRAITÉE.**
`basesAttaquantes` interrogeait `ciblesAPortee(etat, baseCourante(etat))` : une
seconde base aurait été un **SANCTUAIRE**, invisible pour l'Ouvrage, et rien
n'aurait cassé. Elle rend maintenant des PAIRES, chacune portant `baseVisee`.
⚠ **UNE BASE DE L'OUVRAGE À PORTÉE DE DEUX BASES DU JOUEUR LES ATTAQUE TOUTES
LES DEUX, LA MÊME MINUTE. LECTURE PRISE.** `baseAttaqueALaMinute` hache la CASE
et la minute, jamais la cible : c'est ce qui rend les tirages d'une partie à une
seule base identiques au bit après ce lot. Lui faire choisir UNE cible demanderait
une règle qu'Ethan n'a pas donnée.
⚠⚠ **`siteDeLaCase` ET LA CARTE NE LISAIENT QUE LA BASE COURANTE, ET CE N'ÉTAIT
PAS QU'UN DÉFAUT D'AFFICHAGE :** sur le camp d'une AUTRE base, `siteDeLaCase`
rendait `null`, donc la case cessait d'être **attaquable** en même temps qu'elle
devenait invisible. `satellitesPresents` boucle désormais sur toutes les bases.
⚠⚠ **LES OBJECTIFS DU TUTORIEL SE MESURENT SUR LA MEILLEURE BASE, PAS SUR LA
COURANTE — ET C'EST CE LOT QUI L'A RENDU NÉCESSAIRE.** Ils lisaient
`baseCourante` ; dès qu'une seconde base existe, FONDER ou BASCULER faisait
décocher les douze missions de construction d'un coup, la base neuve n'ayant
qu'un Chantier de niveau 1. Le joueur aurait vu son tutoriel se vider pour avoir
fait exactement ce que le tutoriel lui demandait.
⚠⚠ **LES QUATRE MISSIONS `sans-moteur` ONT LEUR MOTEUR, ET M2 SE COMPTE :
LE DÉNOMINATEUR PASSE DE 13 / 17 À 17 / 17.** La famille `sans-moteur` a disparu
des données ET du moteur — la garder vide inviterait à y remettre un objectif
plutôt qu'à lui écrire un moteur. ⚠ Les quatre gardent le libellé qu'Ethan a
dicté, et `titreEcrit` le dit : l'écran les reconnaissait à `!verifiable`, ce qui
était vrai par COÏNCIDENCE.
⚠ **`SAVE_VERSION` PASSE À 24, ET LA SAUVEGARDE GRANDIT DE 76 OCTETS EXACTEMENT**
sur les vingt-cinq graines du témoin. Trois champs entrent :
`prochaineInstanceSatellite` (le compteur d'instance des satellites, qui quitte
la base pour l'ÉTAT — deux bases seraient toutes deux parties de l'instance 1,
donc du même tirage), `recherche.basesAutorisees` et `satellitesDetruits`.
⚠⚠ **LE TÉMOIN DE BASES-0 TIENT TOUJOURS, ET LES CLÉS DÉMÉNAGÉES SONT
SUBSTITUÉES, PAS EXEMPTÉES.** Le relevé recompose `satellites` avec son ancien
`prochaineInstance` et `recherche` sans son `basesAutorisees` : les quatorze
empreintes d'origine doivent **retomber justes**, ce qui prouve qu'aucun TIRAGE
n'a bougé. Sept couples seulement sont déclarés déplacés — `attaque` et
`rapports` à partir de la phase 11, le prix du raid ayant monté.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot BASES-0 :**
`npm test` → **885 pass / 0 fail**, `npm run build` → `dist/index.html`,
**1 385 930 octets**, 0 référence externe.
⚠⚠ **CE LOT NE CHANGE AUCUN COMPORTEMENT, ET C'EST TOUT CE QU'ON LUI DEMANDE.**
Il déplie l'état : les onze champs d'une base descendent d'un cran, dans
`etat.bases[0]`, et `etat.baseCourante` vaut 0. **`etat.bases` A EXACTEMENT UN
ÉLÉMENT À LA FIN DU LOT** — fonder, basculer, transférer sont `BASES-1` et
`TRANSFERT`. La coquille de bascule reste désactivée et son « 1 / 1 » reste vrai.
Coût **+2 207 octets**, aucune image n'entre — **16 `data:` avant, 16 après**.
Marge T10 **14 070 octets, 1,00 %** : c'est la marge la plus mince du dépôt, et
le prochain lot qui fait entrer une image devra relever la borne EN ÉCRIVANT
POURQUOI.
⚠⚠ **LES TÉMOINS SONT LA SEULE GARDE QUI COMPTE ICI, ET ILS SE CAPTURENT
AVANT.** Un dépliage de deux cent cinquante sites ne se prouve pas avec des tests
unitaires : ils sont réécrits par la même main que le code, donc ils suivent
l'erreur qu'ils devraient attraper. `test/temoins-bases-0.js` porte les
empreintes d'un scénario de **quatorze phases sur vingt-cinq graines**, relevées
sur `main` à `9d7d711` avant que rien ne bouge — vingt-deux champs par phase,
raid du joueur, raid de l'Ouvrage, rasages, sauvegarde-rechargement, et une
fenêtre jouée tick par tick à cheval sur un raid. **Mesuré après dépliage :
25 × 14 × 22 valeurs identiques, à deux exceptions près, toutes deux ASSERTÉES.**
⚠⚠ **LES DEUX SEULES VALEURS QUI BOUGENT SE MESURENT, ELLES NE SONT PAS
EXEMPTÉES.** `version` passe de 22 à 23 : le témoin recalcule son empreinte en
SUBSTITUANT 22, et si elle retombe juste, c'est que le nombre seul a changé,
uniformément. Et la sauvegarde grandit de **29 octets exactement**, sur les
vingt-cinq graines — l'enveloppe `{"bases":[…],"baseCourante":0}` autour de onze
champs qui ne changent pas. Un écart qui dépendrait de la partie voudrait dire
qu'un CONTENU a bougé.
⚠⚠ **LES ACCESSEURS PAR GETTER SONT INTERDITS, ET LA RAISON EST MÉCANIQUE.**
Laisser `etat.disposition` déléguer à `etat.bases[…]` aurait fait ce lot en dix
lignes ; mais `simulerRaid` fait `structuredClone(etat)`, et **`structuredClone`
ne préserve pas les getters** — il copie des valeurs. La copie se retrouverait
avec des champs plats figés, le simulateur cesserait SILENCIEUSEMENT d'être
exact, et le test de non-fuite ne verrait rien, l'état réel restant intact. Même
raisonnement contre `Object.defineProperty` et les `Proxy` : l'état doit rester
**des données simples**, parce que c'est ce que `serialiser` et
`structuredClone` supposent tous les deux. Un test balaie la source ET compare
les deux sérialisations.
⚠⚠ **`baseCourante` VIT DANS `src/sim/base-courante.js`, ET C'EST UNE CONTRAINTE
D'IMPORTS.** Le brief demandait `state.js` ; or `state.js` importe satellites,
poi, points-attaque, site-entame, raid, raid-ouvrage, reparation et — par
`raid-ouvrage` — deplacement : les huit modules qui ont besoin de l'accesseur
sont ses DÉPENDANCES, et le leur faire importer de là ferait huit cycles.
**`state.js` le RÉ-EXPORTE**, donc `import { baseCourante } from './state.js'`
marche : un ré-export n'est pas une copie, c'est la même liaison.
⚠⚠ **DEUX MIGRATIONS TOURNAIENT SUR LA FORME D'AUJOURD'HUI, ET LE DÉPLIAGE LES
AURAIT CASSÉES EN SILENCE.** La 9 → 10 appelait `basesDuJoueur(s)` et la 13 → 14
`niveauDeCommandement(s)` : les deux lisent désormais `s.bases`, qui n'existe
qu'à partir de la v23. **Une migration tourne sur la forme de SON époque**, et
la faute ne se voyait qu'en rejouant la chaîne complète depuis une sauvegarde
PLATE — d'où `test/aplatir-sauvegarde.js`, l'inverse du maillon 22 → 23, dont
huit fichiers de test ont eu besoin le même jour.
⚠ **`SAVE_VERSION` PASSE À 23, ET LA MIGRATION NE PERD RIEN.** C'est le premier
dépliage de la chaîne : aucune valeur convertie, aucune inventée, les mêmes
objets changent d'adresse. `champs` et `obstacles` ne sont pas recopiés — ils
n'ont jamais été dans la sauvegarde, et `charger` les redéduit de `fondation`,
qui voyage. **Mesuré : redérivés, ils sont identiques aux anciens**, ce qui
confirme que le terrain est bien gelé comme trois documents l'affirment.
⚠⚠ **ONZE CHAMPS DESCENDENT, ONZE RESTENT, ET LE PARTAGE EST ARBITRÉ.** Par
base : `position`, `fondation`, `disposition`, `garnison`, `armee`, `economie`,
`champs`, `obstacles`, `satellites`, `reserveReparation`,
`dernierDeplacementTick`. Globaux : `version`, `graine`, `rng`, `horloge`,
`tutoriel`, `recherche`, `sitesEntames`, `basesRasees`, `poisAcquis`,
`rapports`, `attaque`. `poisAcquis` est global — Ethan, 02/09 : « acquis une
fois, valable partout » ; `attaque` aussi, sa réserve étant unique et son
plafond mérité par les ARMÉES du moment, au pluriel.
⚠⚠ **LES DEUX `basesDuJoueur` ONT TENU LEUR PROMESSE, ET ELLES SEULES ONT
CHANGÉ.** Celle de `points-attaque.js` rendait `[etat]` en annonçant « le jour où
`etat.bases` existera, cette fonction seule changera » ; celle de
`territoire.js` rendait `[etat.position]`. Les deux rendent aujourd'hui le vrai
pluriel, et **rien d'autre de ces deux modules n'a bougé**. ⚠ Elles portent le
même nom court et **PAS le même type** — l'une rend des BASES, l'autre des
POSITIONS : ne jamais importer l'une pour l'autre.
⚠ **LES SIGNATURES DES GESTES DU JOUEUR N'ONT PAS CHANGÉ, ET C'EST UNE DÉCISION
À RELIRE.** Le brief demandait de faire prendre une BASE à toute fonction de
`sim/` qui ne lit que des champs par-base. Appliqué aux fonctions INTERNES
(`verifierForce`) ; **refusé pour l'API des gestes** — `poser`, `ameliorer`,
`poserEffectif` et leurs voisines totalisent **220 sites d'appel de test**, et
les réécrire dans un lot dont le critère est « rien ne change » aurait été du
brassage qu'aucun test de ce lot ne pouvait éprouver, faute d'une seconde base.
Elles agissent sur la base COURANTE, et `etat.baseCourante` est exactement ce
qui la nomme. À reprendre à `BASES-1`, avec deux bases pour le mesurer.
⚠ **LA GARDE DU NUMÉRO DE VERSION A ÉTÉ DÉPLACÉE, PAS RETIRÉE.**
`points-attaque.test.js` écrit la règle depuis le lot SITE-ENTAMÉ : « la garde du
numéro appartient au maillon le plus RÉCENT de la chaîne, une seule fois ».
Quatre fichiers gardaient encore le leur à 22 et seraient devenus rouges pour une
raison qui ne les regarde pas ; ils vérifient désormais que LEUR maillon est
encore là. Le `assert.equal(SAVE_VERSION, 23)` vit dans `bases.test.js`.
⚠ **UNE ASSERTION A ÉTÉ RETIRÉE, ET ELLE SE DÉCLARE** — `recherche.test.js`
portait `migre.version === SAVE_VERSION` ET `migre.version === 22` sur deux
lignes voisines ; la seconde étant devenue identique à la première, elle
n'assertait plus rien.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot DÉPLACEMENT :**
`npm test` → **872 pass / 0 fail**, `npm run build` → `dist/index.html`,
**1 383 723 octets**, 0 référence externe.
⚠⚠ **CE LOT COÛTE +6 814 OCTETS ET IL DÉBLOQUE LE RESTE DU JEU.** Ethan, 02/09 :
« tout se débloque lorsqu'on pourra bouger la base ». La base se déplace de
**dix cases au maximum, en euclidien**, avec un délai qui va de 1 h à 24 h selon
son niveau. Aucune image n'entre — **16 `data:` avant, 16 après**. Marge T10
**16 277 octets, 1,16 %** : c'est la marge la plus mince du dépôt, et le
prochain lot qui fait entrer une image devra relever la borne EN ÉCRIVANT
POURQUOI.
⚠⚠ **UN DÉFAUT ANTÉRIEUR AU LOT A ÉTÉ TROUVÉ ET CORRIGÉ, ET IL RENDAIT LA CARTE
À MOITIÉ INUTILISABLE.** `ciblageDuSite` demandait le coût du raid AVANT les
problèmes ; or `coutDuRaid` LÈVE au-delà du rayon d'attaque. Toucher n'importe
quel site à plus de dix cases faisait donc lever `ouvrirPanneau`, et **le panneau
ne s'ouvrait pas** — le joueur ne pouvait consulter aucun site lointain, sur
toute la carte. **Mesuré dans Chromium : 0 panneau ouvert sur un balayage complet
de l'écran avant, 32 après.** Le coût vaut `null` hors de portée, jamais zéro —
« 0 point d'attaque » se lirait « gratuit ».
⚠⚠ **UN SEUL CODE DÉPLACE LA BASE, ET C'EST `poserLaBaseSur`.** `raserLaBase`
gardait sa propre ligne `etat.position.rangee = …` depuis RAID-B ; elle appelle
désormais la fonction commune. Ce qui reste chez elle est ce qui lui est PROPRE :
une seule direction, une distance fixe, et le rabotage sur le bord. Un test
balaie `src/sim/` et exige qu'un SEUL fichier écrive `etat.position`.
⚠⚠ **ON REFUSE, ON NE RABOTE PAS — ET LA DIFFÉRENCE EST UNE RÈGLE.** Une
sanction n'a personne à qui répondre : elle pousse la base aussi loin qu'elle
peut. Un déplacement voulu a deux axes et un joueur qui a DÉSIGNÉ une case : il
obtient celle-là ou un refus motivé.
⚠⚠ **LE TERRAIN NE SUIT PAS, ET C'EST CE QUI REND LE DÉPLACEMENT SÛR.**
`champs` et `obstacles` dérivent de `fondation`, que ce lot ne touche jamais :
**aucun bâtiment ne peut basculer sur un obstacle, aucun collecteur ne perd son
champ**. Mesuré sur une base construite, avant et après : champs, obstacles,
fondation et disposition identiques au caractère.
⚠ **LE DÉLAI EST UN HORODATAGE, JAMAIS UN COMPTE À REBOURS** — un résiduel qui
décroît diverge au rattrapage. Et il se lit en **DIXIÈMES** de niveau : une base
à 25,5 attend 12,5 h ; lue en entier elle attendrait 24 h, le plafond. C'est le
piège que `sim/reparation.js` a déjà payé avec `niveauDeLArmee`.
⚠ **PREMIER DÉPLACEMENT : `null`, PAS ZÉRO.** Un zéro se lirait « déplacée au
tick 0 » — vrai par accident aujourd'hui, faux sur une partie de trois jours, où
il accorderait le déplacement sans délai pour une raison fausse.
⚠ **UN RASAGE NE CONSOMME PAS LE DÉLAI DU JOUEUR, ET C'EST UNE LECTURE.** La
sanction est déjà la plus lourde du jeu ; lui retirer aussi le droit de bouger le
punirait deux fois, et l'empêcherait précisément de fuir l'endroit où il vient
d'être rasé. Une ligne à déplacer si Ethan tranche autrement.
⚠⚠ **DEUX GARDE-FOUS ONT ÉTÉ RESSERRÉS, PAS ASSOUPLIS, ET ILS SE DÉCLARENT.**
(1) `monde.test.js` interdisait `fillText` PARTOUT dans l'écran Monde — la
flèche porte un nombre, donc l'interdiction NOMME désormais son unique
exception, `dessinerFleche`, et reste totale ailleurs : une lettre ne peut pas
revenir sur un emblème. (2) Le panneau de site n'admettait que « Fermer » ;
il admet « Déplacer la base », **qui n'apparaît que sur SA PROPRE base**, et les
quatre mots promis-mais-absents restent interdits.
⚠ **M1 : LE NOMBRE DE CIBLES NE BOUGE PAS, MAIS 60 % D'ENTRE ELLES SONT
NEUVES.** Sur 150 graines, un saut de dix cases vers le haut fait passer les
cibles à portée de 34,29 à 34,37 — la densité est uniforme — mais **leur niveau
moyen monte de 20,0 à 22,0**. Ce que le déplacement achète, ce n'est pas plus de
cibles : ce sont d'autres cibles, plus hautes.
⚠ **`SAVE_VERSION` PASSE À 22** : l'état porte `dernierDeplacementTick`. La
migration 21 → 22 pose `null` — une v21 n'avait aucun moyen de déplacer la base
autrement que par un rasage, qui ne consomme pas le délai.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot EUCLIDE :**
`npm test` → **855 pass / 0 fail**, `npm run build` → `dist/index.html`,
**1 376 909 octets**, 0 référence externe.
⚠⚠ **CE LOT NE COÛTE QUE +602 OCTETS ET IL CHANGE LA CARTE DE CHAQUE GRAINE.**
C'est le rapport le plus déséquilibré du dépôt entre ce qu'un lot pèse et ce
qu'il déplace : trois fonctions de distance, deux constantes, et **toutes les
positions de toutes les bases et de tous les POI bougent**. Marge T10
**23 091 octets, 1,65 %**.
⚠⚠ **TROIS DISTANCES DE PORTÉE PASSENT DE TCHEBYCHEV À EUCLIDE, ET ELLES
BASCULENT ENSEMBLE** — la portée du raid, la garde du peuplement, les anneaux
des satellites. C'est ce « ensemble » qui sauve l'argument que l'ancien
commentaire de `distanceTchebychev` défendait : la cohérence n'est pas perdue,
elle a changé de métrique. **Mesuré : 316 cases à portée au lieu de 440** (les
124 coins du carré tombent), **697 cases interdites par la garde au lieu de
841** (144 libérées, toutes en diagonale), et la base ennemie la plus proche
peut désormais se poser à **onze cases de grille du départ au lieu de quinze**.
⚠⚠ **AU CARRÉ DES DEUX CÔTÉS, JAMAIS DE RACINE.** `d² ≤ rayon²` : deux entiers,
une comparaison exacte. La seule racine du lot est `casesArrondiesAuSuperieur`,
qui est une boucle ENTIÈRE et ne sert qu'à écrire une phrase — un refus doit
dire un nombre, et dans la métrique qui a décidé du refus.
⚠⚠ **LE « ×2 DU PEUPLEMENT » DU BRIEF ÉTAIT IMPOSSIBLE, ET LA BORNE EST
MATHÉMATIQUE.** Une case est retenue si elle est un MAXIMUM LOCAL STRICT du
hachage parmi ses huit voisines : la densité de ces maxima vaut exactement
**1/9**, soit **16 par 12 × 12**, quelle que soit `probabiliteCandidate`. Mesuré
sur 120 graines : p = 0,14 → 11,97 ; 0,30 → 15,53 ; 0,50 → 16,31 ; **1,00 →
16,35**. 24 était hors d'atteinte tant que l'exclusion 3 × 3 tient. Ethan,
02/09 : **« ignore le 24 […] tu conserves la règle du 3 × 3 et tu augmentes la
densité au maximum, je retire le maximum un peu moins pour que ce soit pas un
cadre parfaitement rectangulaire comme une sylviculture »**.
⚠⚠ **D'OÙ `probabiliteCandidate: 0,35` ET `basesParDouzeCarre: 16`, ET LE
« UN PEU MOINS » SE MESURE.** 0,35 rend 15,88, soit 97 % du plafond ; c'est la
dernière valeur avant que la courbe ne s'aplatisse. Au-delà on ne gagne plus de
densité — 0,45 rend 0,4 base de plus, 1,00 n'en rend aucune — **on ne fait que
resserrer le semis** : la part des blocs 3 × 3 entièrement vides tombe de
**22,1 % à 0,35** à **20,5 % à 0,50**, et la part des bases collées au minimum
permis monte de 89,9 % à 91,4 %. C'est exactement la sylviculture qu'Ethan
refuse.
⚠ **`SAVE_VERSION` PASSE À 21, ET LA MIGRATION VIDE PLUTÔT QUE DE FAIRE
SEMBLANT.** `sitesEntames` et `poisAcquis` désignent la carte PAR POSITION : les
recopier donnerait un site marqué à moitié détruit là où il n'y a plus rien.
**`basesRasees` et `satellites` ne sont PAS vidés** — le premier dit qu'une case
ne doit plus rien rendre, le second porte de l'histoire ; les vider ferait
reparaître une base rasée et déplacerait un camp que le joueur a vu.
⚠ **LES SAUVEGARDES SONT PERDUES, ET C'EST ACCEPTÉ.** Ethan, 02/09 : « ignore
problème de sauvegarde, je réinstalle le jeu, je suis le seul testeur ».
⚠⚠ **LES ZONES D'INFLUENCE RESTENT EN TCHEBYCHEV, ET C'EST UNE LECTURE.** Rayon
2 pour le joueur, 3 pour l'Ouvrage : ce sont des CARRÉS que `sim/territoire.js`
PEINT case par case sur l'écran Monde. Les passer à Euclide dans le barème du
raid sans les repeindre là-bas ferait payer le tarif de proximité sur des cases
que la carte ne montre pas comme siennes — la pire divergence, celle que le
joueur constate sans pouvoir l'expliquer. Si Ethan veut le disque, ce sont
`estEnTerritoireAllie` ET la boucle de `territoire.js` qui changent, ensemble.
⚠⚠ **LE BARÈME DU RAID GARDE LA DISTANCE DE GRILLE, ET C'EST L'AUTRE LECTURE.**
`coutDuRaid` prend un nombre de cases ENTIER ; le passer à `ceil(√d²)`
renchérirait toute diagonale — un raid à (7, 7) passerait de 31 à 40 points —,
c'est-à-dire ferait bouger un nombre d'équilibrage que le §2.8 du brief
interdisait de toucher. La PORTÉE est euclidienne, le PRIX se compte en cases de
grille. Une ligne à changer si Ethan tranche autrement.
⚠ **UNE ASSERTION A ÉTÉ RETIRÉE, ET ELLE SE DÉCLARE** — celle de `POI T20` qui
vérifiait que la chaîne de migrations TOLÈRE un `poisAcquis` déjà présent. Le
maillon v20 → v21 la contredit en bout de chaîne, délibérément. Un premier jet
l'a remplacée par une version « isolée » du maillon qui ne rejouait rien et
passait sur n'importe quel code : **mieux vaut une assertion en moins, déclarée,
qu'une assertion qui ne mesure rien.**
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot RAID-B :**
`npm test` → **843 pass / 0 fail**, `npm run build` → `dist/index.html`,
**1 376 307 octets**, 0 référence externe.
⚠⚠ **CE LOT COÛTE +5 331 OCTETS, N'OUVRE AUCUN ÉCRAN, ET FAIT ARRIVER LA
PREMIÈRE CHOSE DU JEU QUI SE PASSE PENDANT QUE LE JOUEUR NE REGARDE PAS.**
L'Ouvrage attaque la base. Aucune image n'entre — **16 `data:` avant, 16 après**.
Marge T10 **23 693 octets, 1,69 %** : c'est la marge la plus mince depuis
RETOURS-DU-31, et le prochain lot qui fait entrer une image devra relever la
borne EN ÉCRIVANT POURQUOI.
⚠⚠ **`rattraperJeu` NE FAIT PLUS UN SEUL APPEL PAR SYSTÈME : IL DÉCOUPE SA
FENÊTRE.** C'est le premier système du jeu qui ne s'y plie pas, et il fallait le
dire au lieu de le contourner. Un raid arrive à un INSTANT et MODIFIE l'état pour
les suivants — il vide la réserve de réparation, met les stocks à zéro, et peut
DÉPLACER la base de vingt cases. Le corps analytique d'avant n'a pas bougé d'une
ligne ; il est simplement appelé une fois par SEGMENT, et les segments s'arrêtent
à chaque raid retenu. `tickJeu` × n ≡ `rattraperJeu(n)` tient donc PAR
CONSTRUCTION : c'est la même fonction, `resoudreLaMinute`, qui résout des deux
côtés. **Mesuré sur 12 h et cinq graines, rasages compris : sérialisations
identiques au caractère.**
⚠⚠ **LA CONDITION DE RUPTURE DE LA L. 397 EST ADVENUE, ET LE COMMENTAIRE A ÉTÉ
RÉÉCRIT.** Il annonçait « le jour où la base pourra se DÉPLACER en cours de
rattrapage, cette ligne cessera d'être juste ». Ce jour est celui du rasage.
`subirUnRaid` rappelle `releverLesPoisAcquis` à l'instant du rasage, et le
découpage fait que, pendant un segment, la base ne bouge pas — par construction.
**Ne jamais laisser un commentaire qui annonce un futur devenu présent** : celui
de `reparerLaGarnison` disait « ÉCRIT ET INATTEIGNABLE EN JEU », il est corrigé
lui aussi, et un test refuse le retour de la formule.
⚠⚠ **LE MOTEUR DE COMBAT CONNAÎT ENFIN LES ONZE BÂTIMENTS DU JOUEUR, ET C'EST
UN ARBITRAGE D'ETHAN DU 02/09.** `src/sim/combat.js` était classé « à ne pas
toucher » par le brief ; or `creerCombat` ne connaissait que les CINQ de
l'Ouvrage, et monter un `chantierDeConstruction` levait « identifiant inconnu ».
C'est le trou que §6 annonçait — « un combat où le joueur défend ne peut porter
aucun bâtiment […] c'est le trou que le raid sur la base du joueur comblera ».
Ethan : **« Ouvrir combat.js »**. `profilBatimentJoueur` réemploie
`profilBatiment` au lieu d'en écrire un second ; `indiceButin` vaut `null` et
`ressource` `{}`, parce que `butin` verse à l'ATTAQUANT et n'est jamais appelé
sur un combat de défense — leur donner un barème aurait inventé un butin que
rien ne verse.
⚠ **`raseLeSite` PORTE LE MÊME NOM DES DEUX CÔTÉS.** `BATIMENTS.souche` le
portait ; `BASE_BATIMENTS.chantierDeConstruction` le porte aussi depuis ce lot.
Le Chantier tombé rase la base exactement comme la Souche rase un site, sans
qu'une ligne de code ne le redise. Et il est le **seul** des onze sans plancher
de PV : le faire plancher rendrait la base INRASABLE, et un test le tient.
⚠⚠ **DEUX LECTURES PRISES, ET ELLES SE DÉFONT CHACUNE EN UNE LIGNE.** (1) Les
verdicts sont vus du côté du joueur qui se défend — rasé = *défaite totale*,
bâtiments entamés = *défaite*, rien touché = *victoire totale* ; c'est le miroir
de `verdictDuRaid`. (2) **Un raid qui passe vide la réserve de réparation**,
comme l'écrit `MODELE-ECONOMIQUE.md` §7 — « qui passe » voulant dire « qui a
fait des dégâts », une attaque entièrement repoussée ne vide rien.
⚠⚠ **UNE PIÈCE POSÉE SUR UN OBSTACLE NE FAIT PAS LEVER LE RAID, ET CE N'ÉTAIT
PAS AU BRIEF.** `CODES_TOLERES_AU_CHARGEMENT` porte `obstacle` — le terrain se
redéduit à chaque chargement, donc un rocher peut se poser sous une pièce placée
légalement la veille — mais `creerCombat` REFUSE une telle pièce. Sans filtre, un
raid de l'Ouvrage aurait LEVÉ sur un état que le jeu déclare jouable. Le montage
porte donc deux listes d'INDICES, comme `composerLesVagues` : la pièce reste dans
la garnison, elle ne se bat simplement pas.
⚠⚠ **M1 : 327 ms AU PIRE, MESURÉ SUR 30 CONFIGURATIONS DE 72 H** — seuil d'arrêt
du brief : une seconde. Le coût brut est de **12,4 ms par raid** ; ce qui borne
le total, c'est que **le rasage est aussi le frein** : il éloigne la base de
vingt cases, donc de ses attaquantes.
⚠⚠ **M2 : 36,5 RAIDS PAR 24 H, SUR 150 GRAINES** — médiane 36 ou 37, min 18,
max 58, à **1,4 % de l'espérance arithmétique**. Le brief supposait « cinq bases
à portée » ; il y en a **entre 30 et 45**, donc sept fois plus de raids que son
exemple. **C'est une MESURE, pas un réglage** : l'équilibrage est à Ethan seul.
⚠ **`SAVE_VERSION` PASSE À 20** : `disposition` porte `degatsMilli`. La migration
19 → 20 pose ZÉRO — une v19 n'avait aucun moyen d'abîmer un bâtiment, rien dans
tout le dépôt n'écrivant de dégât sur la base du joueur avant ce lot.
⚠ **UN BÂTIMENT ABÎMÉ N'A AUCUN EFFET DE JEU AUJOURD'HUI, ET IL FAUT LE SAVOIR.**
Aucun lecteur de `disposition` ne lit `degatsMilli` — recensés : `state.js`,
`chantier.js`, `missions.js`, `monde.js`, `satellites.js`, `reparation.js`,
`raid.js`, tous sur `id`, `rangee`, `colonne`, `niveau`. Les dégâts ne comptent
donc qu'au raid SUIVANT, et **rien ne les répare** : `REPARATION_BASE_JOUEUR.courbe`
vaut toujours `null`. C'est le prochain trou.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot RAID-A :**
`npm test` → **820 pass / 0 fail**, `npm run build` → `dist/index.html`,
**1 370 976 octets**, 0 référence externe.
⚠⚠ **CE LOT COÛTE +30 899 OCTETS ET OUVRE LE SEPTIÈME ÉCRAN.** Du code, du
balisage et de la feuille — **aucune image n'entre** : les trois atlas que le
champ de bataille demandait (bâtiment, défense, socle) étaient déjà dans la
feuille pour le fond CSS du Chantier, et leur donner une balise `<img>` ne les
inline pas une seconde fois. **Mesuré : 16 `data:` avant, 16 après.** Marge T10
**29 024 octets, 2,07 %** — le prochain lot qui fait entrer une image devra
relever la borne EN ÉCRIVANT POURQUOI.
⚠⚠ **UN BOGUE DE MOTEUR A ÉTÉ TROUVÉ ET CORRIGÉ, ET IL ÉTAIT ANTÉRIEUR AU LOT.**
Le **troisième raid d'affilée** sur une même cible LEVAIT — « 0 PV rangés pour 3
pièces ». `montageCourant` régénère le site ENTIER et applique les PV rangés
POSITION PAR POSITION ; `enregistrerLeRaid`, lui, les rangeait sur le montage qui
venait de se battre, d'où les mortes étaient déjà retirées. Raid 1 range
`[0,0,0]`, raid 2 se bat à zéro défenseur et range `[]`, raid 3 régénère les
trois et n'a plus rien à leur appliquer. **Reproduit en simulation pure, sans
interface** : aucun test n'enchaînait trois raids, et aucun écran ne savait
attaquer — c'est l'écran qui l'a rendu atteignable, pas lui qui l'a créé.
`reprojeter` range désormais sur la composition PLEINE. Onze raids d'affilée
mènent maintenant au rasage.
⚠⚠ **ET « % RESTANT » MONTAIT QUAND ON CASSAIT.** Une pièce détruite QUITTE le
montage, donc quittait aussi le dénominateur : relevé **74 % puis 76 %** après
une passe qui avait pourtant détruit un bâtiment de plus. Le dénominateur est
maintenant le site **PLEIN**, monté une fois par `montageDuSite` — même détour
que `butinSiToutTombe`. Les onze raids descendent 90 → 78 → 69 → … → 17.
⚠⚠ **LES SIX CHAMPS DU RAPPORT SE CALCULENT DANS `executerRaid`, JAMAIS DANS
L'ÉCRAN** — `restantDefense`, `restantBatiments`, `restantSouche`, `restantEtai`,
`reparationInduite`, `verdict`. C'est toute la raison d'être de RAID-0 :
`simulerRaid` appelle `executerRaid` sur une copie, donc le simulateur est exact
**par construction**. Les DEUX panneaux de fin rendent la même fonction pure,
`lignesDuResultat` : ils ne peuvent pas diverger.
⚠ **`sansBatiment` EXISTE PARCE QUE ZÉRO VEUT DIRE DEUX CHOSES.** Un châssis
intact et un châssis sans Caserne rendent tous deux `0 s` de réparation ;
annoncer « aucune réparation » à un joueur dont l'infanterie est en miettes et
irréparable serait un mensonge par omission.
⚠⚠ **LE BOOT SANS TÊTE A TROUVÉ CE QU'AUCUN TEST NE POUVAIT VOIR.** Chromium est
préinstallé dans l'environnement d'exécution ; `playwright-core` s'installe
**hors du dépôt** — `CLAUDE.md` §3 interdit d'ajouter une dépendance de test, et
cette règle tient. Deux défauts trouvés là : le `ResizeObserver` mesurait le
canevas ENCORE CACHÉ (« viewport 1 × 1 »), et le bogue du troisième raid.
⚠ **`SAVE_VERSION` PASSE À 19** : l'état garde les **dix derniers rapports, en
tout** — la borne est dans `APRES_RAID.rapportsGardes`, jamais dans l'écran. On
garde le RAPPORT, jamais le `resultat` : mesuré **695 octets par rapport**, un
état passe de 1 814 à 8 765 octets. La migration 18 → 19 pose une liste vide.
⚠ **TROIS LECTURES PRISES, ET ELLES SE CHANGENT CHACUNE EN UNE LIGNE** : le
bandeau `#navigation` est masqué sur l'écran de raid (un compteur des bases DU
JOUEUR n'a aucun sens devant une base ennemie) ; `reparationInduite` est un
pourcentage **de la réserve du châssis** ; et le glisser-déposer coexiste avec
les modes tactiles d'`ui/offense.js` sur la même grille 4 × 9 — **dette
d'ergonomie assumée**, demandée deux fois par Ethan.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot RAID-0 :**
`npm test` → 808 pass / 0 fail, `npm run build` → `dist/index.html`,
1 340 077 octets, 0 référence externe.
⚠ **CE LOT COÛTE +264 OCTETS ET N'OUVRE AUCUN ÉCRAN.** Il donne au moteur les
deux choses que l'écran de raid demandera : simuler sans commettre, et laisser
une unité à la maison. Marge T10 **59 923 octets, 4,28 %**.
⚠⚠ **`simulerRaid` EST UNE COPIE ET UN SEUL CHEMIN DE CODE, JAMAIS DEUX.** Le
découpage « extraire la partie pure, puis PROJETER les conséquences » a été
refusé, et pas par confort : `verser` écrit dans l'économie, `enregistrerLeRaid`
sur le site, `reporterLesDegats` sur l'armée. Les reproduire en lecture seule
ferait tenir la même logique en DEUX exemplaires, et deux exemplaires divergent —
c'est exactement la divergence réparation/document du 01/09. Le simulateur est
donc exact **par construction**, pas par vérification.
⚠ **`structuredClone` SE PROUVE, IL NE SE SUPPOSE PAS.** L'état traverse déjà
`serialiser`, donc il est fait de données simples ; T2 compare la sérialisation
d'avant à celle d'après, **chaîne contre chaîne**. Mesuré (M1) : **0,078 ms par
copie** sur une partie avancée — 64 fois sous le seuil de 5 ms du brief.
⚠⚠ **« ELLE PART » EST LE DÉFAUT, ET C'EST `=== false` QUI LE DIT.** Une pièce
sans le champ — sauvegarde v17 non migrée, montage qui l'ignore — porte
`undefined` : écrit `!piece.actif`, elle resterait à la maison sans que personne
l'ait demandé. **Mesuré à la falsification : ce seul mot fait tomber la moitié
de `raid.test.js`**, tous les montages du dépôt partant alors avec une armée
vide. C'est T5 qui existe pour ça.
⚠⚠ **LA LISTE DU `push` DE `poserEffectif` EST FERMÉE, ET LE BRIEF NE LA NOMMAIT
PAS.** C'est le piège d'`ajouterEntite` (§6) sous un autre nom : un champ que
l'appelant passe et qui n'est pas nommé dans ce `push` **disparaît en silence**.
Servir le défaut plus haut sans l'ajouter là aurait donné une pièce active à la
validation et une pièce SANS le champ dans la sauvegarde — donc active quand
même, si bien que le drapeau n'aurait jamais rien retenu et qu'aucun raid de
référence n'aurait bronché.
⚠ **LES INDICES DE `composerLesVagues` DOIVENT RESTER ALIGNÉS.**
`reporterLesDegats` LÈVE si le compte des attaquants ne tombe pas juste, mais le
filtre doit précéder les DEUX `push` : sauter une pièce sans sauter son indice
ferait retomber les dégâts sur la mauvaise unité.
⚠⚠ **UNE INACTIVE COMPTE DANS `niveauDeLArmee`, ET C'EST UN EXPLOIT REFERMÉ.**
Si elle en sortait, désactiver ses unités de bas niveau ferait monter le niveau
d'armée, donc **le plafond de réserve de réparation** — douze heures de réserve
en deux clics. T6 le fige, avec la contre-mesure qui prouve que le test mord.
⚠ **`SAVE_VERSION` PASSE À 18.** La migration pose `actif: true` sur toute
`s.armee` : une v17 n'avait aucun moyen de désactiver, donc tout partait.
**La garnison n'en reçoit pas** — « actif » veut dire « part au raid », et
`FORCES.garnison.porteLActivite` le dit du côté de la pose.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot RÉSERVE :**
`npm test` → 799 pass / 0 fail, `npm run build` → `dist/index.html`,
1 339 813 octets, 0 référence externe.
⚠⚠ **CE LOT REND 10 OCTETS, ET C'EST LE PREMIER DEPUIS BÂTIMENTS-1024.** Il
remplace un chronomètre par trois compteurs : `lancerLaReparation`,
`avancerLaReparation`, `annulerLaReparation` et `problemesDeLaReparationEnCours`
sortent, `crediterLesReserves` et quatre fonctions plus courtes entrent. La borne
T10 NE BOUGE PAS — marge **60 187 octets, 4,30 %**.
⚠⚠ **LE TEMPS DE RÉPARATION EST DEVENU UN STOCK, ET L'ANCIEN CODE ÉTAIT UNE
DIVERGENCE, PAS UN CHOIX.** `MODELE-REPARATION-1.md` §4 dit depuis le **24/08**
que le temps de réparation « est une grandeur qui s'accumule, à la manière d'un
idle, et que toute réparation consomme ». Le module avait implémenté une
réparation qui DURE. Personne ne l'a vu pendant huit jours **parce qu'aucun écran
n'appelait jamais la réparation** : `npm run check` était vert, et rien ne pouvait
le dire. Un document arbitré et son code se confrontent, ou ils divergent en
silence.
⚠⚠ **TROIS RÉSERVOIRS, UN PAR CHÂSSIS — ET LE PARALLÉLISME A CHANGÉ DE PORTEUR.**
`MODELE-ECONOMIQUE.md` §7 le faisait jouer sur une DURÉE (`temps = max`) ; il n'y
a plus de durée. Il joue maintenant sur trois stocks qui se remplissent ENSEMBLE
et se vident SÉPARÉMENT. La phrase d'Ethan du 29/08 — « je répare complètement
mes véhicules, j'ai 20 minutes d'infanterie gratuites » — reste vraie mot pour
mot, et pour une raison plus simple : le temps d'infanterie n'a jamais été
dépensé.
⚠ **EN TICKS ENTIERS, JAMAIS EN SECONDES FLOTTANTES.** C'est ce qui rend
`tickJeu` × n identique à `rattraperJeu(n)` : l'addition d'entiers et le `min` du
plafond sont exacts. La condition de rupture est ÉCRITE dans les deux fichiers —
l'équivalence tient parce que le plafond ne bouge pas hors ligne, l'armée ne se
composant pas pendant une absence.
⚠ **PLAFOND 12 H + 1 H PAR NIVEAU D'ARMÉE, ET `niveauDeLArmee` REND DES
DIXIÈMES.** Les deux nombres vivent dans `REPARATION` de `data/sites.js`. Sans la
division par dix le plafond serait **dix fois trop grand** ; un test le mesure
avec l'appât qui va avec.
⚠⚠ **UNE UNITÉ PEUT ÊTRE IRRÉPARABLE, ET C'EST ARBITRÉ.** Mesuré (M1) : une
Enclume de niveau 50 avec un Aérodrome de niveau 1 coûte **1 512 409 s, soit
420,1 h**, contre un plafond de 62 h — **6,8 fois au-dessus**. Soumis à Ethan le
01/09, réponse : « si le joueur est stupide pour avoir une enclume 50 avec un
aérodrome 1 c'est son problème ». **La sortie existe** : au niveau 50 de
l'Aérodrome, le même coût tombe à 2,19 h. Le premier niveau irréparable sous un
bâtiment de niveau 1 est le **35**. Un test fige les deux faits.
⚠ **ET UNE SECONDE MESURE, QUI N'ÉTAIT PAS CELLE QU'ON CHERCHAIT : LA SCORIE MORD
BIEN AVANT LE TEMPS.** `partDuCoutDeMontee` vaut 1, donc remettre à neuf cette
même Enclume coûte **10 995 172 196 de scorie**. Le nombre était déjà marqué « à
arbitrer » dans `REPARATION` ; il reste ouvert, et un test le fige.
⚠ **`SAVE_VERSION` PASSE À 17**, et la migration 16 → 17 **RETIRE** un champ — ce
que seule la v2 → v3 avait fait avant elle. `reparation` sort, les trois
réservoirs entrent à ZÉRO : créditer le temps déjà écoulé donnerait douze heures
de réserve pour un mécanisme qui n'existait pas quand le joueur jouait.
⚠ **LE RAID NE TOUCHE PLUS À LA RÉPARATION.** L'arbitrage du 29/08 — « les points
de réparation bonus disparaissent si on refait un raid » — portait sur le modèle
à durée : il est **CADUC, pas contredit**. Il n'y a plus rien en vol à annuler.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot POI :**
`npm test` → 792 pass / 0 fail, `npm run build` → `dist/index.html`,
1 339 823 octets, 0 référence externe.
⚠⚠ **CE LOT A COÛTÉ +6 132 OCTETS ET N'A FAIT ENTRER AUCUNE IMAGE.** Les sept
sprites de POI étaient dans l'atlas `carte` depuis le lot CARTE-EMBLÈMES, payés
et invisibles : ce qui entre ici, c'est le MODÈLE qui les demande. La borne T10
NE BOUGE PAS — marge **60 177 octets, 4,30 %**.
⚠⚠ **LE PRÉ-BRANCHEMENT DU 26/08 A TENU SA PROMESSE, ET C'EST MESURABLE.**
`render/embleme.js` promettait : « le jour où le modèle en produira, SEUL le
modèle changera ». Le jour est venu ; côté dessin, `spriteDuSite` a gagné DEUX
lignes et aucun sprite n'a été retouché. L'interdiction inverse que le même
fichier portait — « ne pas ajouter `poi_reacteur` à `EMBLEMES_CARTE` » — a été
RÉÉCRITE, pas enjambée : un garde-fou qu'on franchit sans le récrire est un
garde-fou qui mentira au lecteur suivant.
⚠⚠ **SOIXANTE-DIX POI SONT GÉNÉRÉS, DESSINÉS, CLIQUABLES ET TESTÉS — ET AUCUN
N'EST ACQUÉRABLE EN PARTIE NORMALE.** Le redéploiement n'est pas écrit (« on
verra ça après », Ethan, 31/08). Le brief du lot annonçait « seuls les POI qui
tombent dans les vingt-cinq cases autour de la rangée 295 / colonne 16 pourront
être acquis » ; **mesuré sur 200 graines, il n'y en a aucun, et il ne peut pas y
en avoir.** Les deux règles sont disjointes PAR CONSTRUCTION : un POI est hors de
la garde, donc à quinze cases au moins du départ ; le territoire du joueur est le
disque de rayon 2 autour de sa base, qui EST le départ tant qu'elle ne bouge pas.
Quinze et deux ne se rencontrent jamais. `POI T24` fige le fait et **tombera le
jour où la mobilité arrivera** — c'est ce qu'on lui demande. Lire ce lot comme
« le système est jouable » serait faux.
⚠ **`SAVE_VERSION` PASSE À 16** : l'état porte `poisAcquis`, une liste de paires
`{ type, bande }`, triée. La migration 15 → 16 pose une liste VIDE et n'accorde
rien rétroactivement — le premier tick relève de lui-même ce que le territoire
porte.
⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
MUR-DE-CONTOUR, ci-dessous.

**Auparavant, après le lot MUR-DE-CONTOUR :** 768 tests, `dist/index.html`
1 333 691 octets, marge 66 309, 4,7 %.
⚠⚠ **CE LOT A COÛTÉ +59 311 OCTETS, DONT 52 864 D'IMAGES, ET LA BORNE T10 EST
RELEVÉE DE 1 300 000 À 1 400 000.** C'est le douzième et dernier retour d'Ethan
du 31/08 — « les murs contour ne sont pas là » —, et c'est le lot qui fait entrer
le mur du pourtour de la base : cinq images pour le camp du joueur, un mur du
haut, deux murs de côté, deux angles. Marge **66 309 octets, 4,7 %**.
⚠⚠ **ET LA RÉSOLUTION EST UN ARBITRAGE, PAS UN CHOIX DE CONFORT.** Le même mur
conditionné comme un sprite de case — 64 × 64, quatorze teintes, cousu en atlas —
pesait **3 792 octets en tout**, quatorze fois moins. Ethan l'a refusé de face :
« mais c'est quoi cette chiasse de pixel. divise par deux l'asset original. et
garde la colorisation. le mur fera 512x64. » Le prix est écrit pour qu'on sache
ce qu'on a acheté. La marge repasse au-dessus des quatre pour cent : 4,4 % ·
3,1 % · 3,05 % · 2,94 % · 2,91 % · 2,86 % · 2,80 % · 2,73 % · 1,97 % · **4,7 %**.
⚠⚠ **`bord/` N'EST PLUS UNE FAMILLE COUSUE, ET NE PEUT PAS L'ÊTRE.** Ses images
font 512 × 64, 64 × 512 et 64 × 64 ; `tools/atlas.py` n'accepte que des cellules
CARRÉES d'un même côté. Chacune entre par son propre marqueur de
`tools/build.js`, comme les deux grosses bases de l'Ouvrage. Le dossier n'a plus
de sous-dossiers de grille : seize fichiers, à plat.
⚠⚠ **LE MUR FAIT UN U — LE BAS RESTE SANS MUR**, arbitré le même jour. La base
s'ouvre sur sa propre bande de défense, qui commence exactement là où la sienne
finit. Il est **à cheval sur le bord** et **peint entre le SOL et les PIÈCES** :
trois étages, arbitrés par la mesure et non par l'ordre du document — voir §6,
« les murs de contour ».
⚠ **`python3 tools/verifier.py` → 1 386 identiques · 2 différents (les deux
déclarés) · 0 nouveau · 0 MANQUANT**, verdict VERT, en 131 s. Il était dû : le
lot touche `art/sprites/` et `tools/`.
⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 15.** Un mur est un dessin : il ne
touche ni l'état, ni la sauvegarde, ni une seule règle de jeu.

**Auparavant, après le lot RETOURS-DU-31 :** 764 tests, `dist/index.html`
1 274 380 octets, marge 25 620, 1,97 %.
⚠ **CE LOT A COÛTÉ +9 869 OCTETS ET N'A FAIT ENTRER AUCUN ATLAS.** C'est du code,
du balisage et de la feuille : douze retours d'Ethan traités en un lot, dont
quatre CORRECTIFS de défauts visibles.
⚠⚠ **LE DÉFAUT LE PLUS GRAVE ÉTAIT MUET : LA CARTE N'AFFICHAIT AUCUN EMBLÈME.**
`ui/monde.js` lisait `cellule.x/.y/.cote` sur ce que rend `celluleDuSprite`, qui
rend des INDICES et jamais des pixels ; `drawImage` avec un rectangle source non
fini NE DESSINE RIEN ET NE LÈVE PAS. Mesuré dans Chromium : 88 appels, 88
rectangles non finis. La géométrie est descendue dans `render/embleme.js`, qui
est pur, où deux gardes l'atteignent.
⚠ **`SAVE_VERSION` PASSE À 15** : les satellites portent une date de relève.
⚠ **LES DEUX BOUTS DU COULOIR ONT BOUGÉ** — départ rangée 275 → **295**,
terminale rangée 26 → **15**, arbitrés par Ethan. La strate de départ SUIT et
tombe à **1** : les avant-postes du début sont désormais de niveau 1.
⚠ **`python3 tools/verifier.py` y rendait déjà 1 418 identiques · 2 différents
· 0 nouveau · 0 MANQUANT**, verdict VERT, en 118 s.
⚠⚠ **`node tools/audit-maquette.mjs` EST PASSÉ DE 7 ÉCARTS À UN SEUL, ET CE
N'EST PAS UN CORRECTIF — C'EST UN EFFET DE BORD DU DÉPLACEMENT DU DÉPART.**
Il reste ROUGE (code 1), sur « emplacements 11 / 12 », qui était déjà des sept.
Les six autres — terrain, disposition légale, trois débits, raffinerie — ont
disparu ENSEMBLE parce qu'ils dérivent tous de `champsDeLaBase(275, 16)` : cette
position était le DÉPART, donc servie par la table `TERRAIN_INITIAL`, qui ne
porte pas de champ sous les cinq collecteurs de la maquette. La table a suivi la
base en rangée 295 ; `(275, 16)` redonne donc le TIRAGE, c'est-à-dire exactement
le terrain sur lequel la maquette avait été relevée avant le 29/08.
⚠ **MESURÉ, PAS DÉDUIT** : `champsDeLaBase(295, 16)` rend la table
(`tentatives: 0`), `champsDeLaBase(275, 16)` rend un tirage (`tentatives: 1`).
⚠ **NE PAS LIRE ÇA COMME « LA MAQUETTE EST REVENUE À JOUR ».** Elle n'a pas
bougé ; c'est sa RÉFÉRENCE qui a cessé d'être surchargée. Le jour où le départ
rebougera, les six écarts reviendront ou non selon la case — et l'audit dira la
vérité dans les deux cas.
⚠ **IL RESTE UN SEUL MODULE SANS EFFET : la GARNISON**, toujours en attente
d'arbitrage — c'est le dernier de la liste des quatorze.

**Auparavant, après le lot MODULES-F :** 731 tests, `dist/index.html`
1 264 511 octets, marge 35 489, 2,73 %. Les deux derniers modules de combat —
Munition spéciale et Vol de vie — et le canal de l'Ouvrage armé par
`apparitionModule`. `SAVE_VERSION` à 14.

**Auparavant, après le lot MODULES-C :** 702 tests, `dist/index.html`
**1 262 193 octets**, marge 37 807, 2,91 %. Un module câblé — le Bouclier —
pour +405 octets, `SAVE_VERSION` déjà à 14.

**Auparavant, après le lot MODULES-B :** 683 tests, `dist/index.html`
**1 261 788 octets**, marge 38 212, 2,94 %. Trois modules câblés — Flashbang,
EMP, Camouflage — pour +1 463 octets, `SAVE_VERSION` déjà à 14.

**Auparavant, après le lot MODULES-A :** 667 tests, `dist/index.html`
**1 260 325 octets**, marge 39 675, 3,05 %. Deux modules câblés — Tir de
barrage, Booster — pour +1 233 octets, `SAVE_VERSION` déjà à 14.

**Auparavant, après le lot RECHERCHE :** 658 tests, `dist/index.html`
**1 259 092 octets**, marge 40 908, 3,1 %.
⚠ **RECHERCHE A COÛTÉ +16 596 OCTETS ET N'A FAIT ENTRER AUCUN ATLAS.** C'est du
code, de la feuille et un écran de plus ; l'arbre réemploie les sprites d'unité
et d'ouvrage qui étaient au livrable depuis SPRITES-ET-ZOOM.
⚠⚠ **ET IL A RETOURNÉ LE COUPLAGE DES ATLAS PARTAGÉS. VOIR §6.** Quatre d'entre
eux servent à la fois en fond CSS et en `drawImage` ; les déclarer aux deux
endroits les inlinerait DEUX fois — 507 464 octets mesurés. La déclaration vit
dans la feuille, `garnirLesAtlas` de `ui/session.js` en donne l'adresse aux
`<img>` au démarrage, et **le JS n'écrit jamais d'appel `url()`** : le build le
refuserait, et le contourner serait passer sous un garde-fou en silence.
⚠ **`tools/verifier.py` N'A PAS ÉTÉ LANCÉ À CE LOT, ET C'ÉTAIT CONFORME** : il
n'a touché ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
FINITIONS, ci-dessous.

**Auparavant, après le lot FINITIONS :** 619 tests, `dist/index.html`
**1 230 416 octets**. ⚠ La ligne d'historique n'écrit PAS « N pass / 0 fail » en
gras : la garde de `documentation.test.js` cherche cette forme-là et prendrait la
PREMIÈRE qu'elle trouve. Une seule ligne de ce fichier a le droit de la porter.
⚠ **FINITIONS A COÛTÉ +1 142 OCTETS ALORS QU'IL DEVAIT EN RENDRE.** Il retire
les lettres de la carte et leur seuil, mais il branche l'hexagone de la base
terminale — chargement, attente de décodage, table des côtés — et le câblage
pèse plus que la lettre retirée. Mesuré, pas estimé.
`python3 tools/verifier.py` → **1 370 identiques · 2 différents (les deux
déclarés) · 0 nouveau · 0 MANQUANT**, verdict VERT, en 127 s : le terrain est
devenu une SOURCE DÉCLARÉE (arbitrage d'Ethan du 30/08), et les 56 manquants du
lot CHAÎNE-VÉRIFIÉE sont soldés.
Auparavant, CARTE-EMBLÈMES avait coûté **+155 204 octets**, dont **152 443
d'images** : l'atlas `carte` (43 sprites, 115 405 o en base64) et les deux
grosses bases hors atlas (37 038 o). **La borne T10 est passée de 1 150 000 à
1 300 000**, marge 69 584 après FINITIONS, soit 5,4 % — elle monte parce qu'une
ressource entre légitimement, jamais pour faire passer un débordement.
Auparavant, CHAÎNE-VÉRIFIÉE n'avait touché ni `src/` ni `test/` : le HTML était
ressorti identique à l'octet, SHA-256 compris, donc **sa version n'avait PAS été
bumpée**, et la référence était 600 pass / 1 074 070 octets / 0.46.0 · build 47.
`python3 tools/verifier.py` → **1 370 identiques · 2 différents (les deux
déclarés) · 0 nouveau · 56 MANQUANTS**, en 125 s, code de sortie **1**.
⚠ **CES 56 MANQUANTS SONT SOLDÉS DEPUIS LE LOT FINITIONS**, par un arbitrage
d'Ethan et non par une correction : « déclarer le terrain comme une source ».
`SOURCES_DECLAREES` de `tools/verifier.py` porte les 54 tuiles et les 2 fichiers
de `carte/`, chacun avec sa raison — et **l'assertion inverse**, qui fait tomber
le vérificateur le jour où un outil se remet à produire l'un d'eux.
⚠ **LE PRIX EST ÉCRIT DANS LA TABLE** : un futur changement de palette ne pourra
pas être appliqué au terrain automatiquement, les planches d'origine ayant été
supprimées par la migration qui les a consommées. STRUCTURES-AU-COMBAT a coûté
**+832 octets** — aucun atlas ajouté, aucun sprite : c'est du code, et c'est un
DÉPLACEMENT de code. Le lot RÉPARATION avait laissé la référence à 593 tests et
1 073 238 octets. Le lot POINTS-D'ATTAQUE a coûté
**+1 828 octets** — de la simulation pure, aucun écran, comme SATELLITES avant
lui. SITE-D'UNE-CASE a coûté **zéro**, faute d'appelant : `esbuild` l'élaguait.
SITE-ENTAMÉ a fait entrer les deux d'un coup, +2 868, en branchant la
réparation dans le tick. BUTIN-SOLDÉ, +237 ; RECHERCHE-AU-PRORATA, +57 ; MULTIPLICATEUR, +52 ; ACTE-DE-RAID, +158 ; RÉPARATION, +1 163.

⚠ **`dist/` N'EST PAS SUIVI PAR GIT, DONC AUCUN TEST NE CONFRONTE CE NOMBRE.**
C'est le seul chiffre de ce fichier qu'aucune garde ne protège, et il a déjà été
faux de 814 octets : 130 488 annoncé le 27/08 au soir, 131 302 mesurés sur un
clone neuf. Ce nombre-ci se mesure, il ne se recopie pas.

⚠ **LE HTML BOUGE MAINTENANT À CHAQUE LOT D'INTERFACE.** Il était figé à 81 236
octets depuis le lot RÉSIDU ; ÉCRAN-CHANTIER l'a porté à 123 785 en branchant la
session de jeu, ÉCRAN-NAVIGATION à 130 488 en ajoutant l'écran Offense, les lots DÉMARRAGE
et SOL à 131 302, POSE-À-L'ÉCRAN à 133 455 en rendant la palette vivante,
AMORCE-ET-SIGNATURE à 134 118, ÉCRAN-ACTIONS à 137 225 en branchant améliorer
et démolir, PANNEAU-ET-MARGES à 151 187 en ajoutant le panneau de détail d'un
bâtiment et les marges des barres système, STOCKAGE-ET-VOISINAGE à 153 506,
QUEUE-DE-COURBE à 153 505,
MISE-EN-PAGE à 156 633 en sortant l'en-tête des écrans,
POSE-ET-DÉPLACEMENT à 161 583, TUTORIEL à 167 308 en ouvrant l'onglet Mission,
GARNISON-ET-ARMÉE à 179 928 en donnant un état à la garnison et à l'armée,
puis en branchant l'écran Offense et la bande Défense,
CARTE (données) à 181 014 — le seul lot depuis longtemps qui ne touche pas
l'interface, d'où le +1 086 : c'est un module de simulation et deux tables.
OBSTACLES à 183 645, en les branchant dans l'état et en les dessinant,
SATELLITES à 188 451 — de la simulation pure, aucun écran.

⚠⚠ **ET LE LOT ÉCRAN-CARTE A TOUT CHANGÉ D'ÉCHELLE : 503 724 OCTETS.** Le saut
est de +315 273, dont **299 400 pour le seul atlas de terrain** — 64 tuiles,
224 548 octets de PNG, inlinés en base64 par `tools/build.js`. C'est la première
ressource BINAIRE du livrable, et c'est le prix de l'offline : une image en
`data:` pèse un tiers de plus qu'un fichier, et un fichier à côté serait une
référence externe, ce que le build refuse.

⚠ **LA BORNE DE T10 EST PASSÉE DE 200 000 À 600 000 OCTETS**, et elle a changé
de sens en même temps. Ce que T10 tient VRAIMENT, c'est que le HTML ne référence
rien d'extérieur — cette assertion-là n'a pas bougé d'un mot. La taille n'est
qu'un ordre de grandeur destiné à attraper une explosion : un bundle parti en
boucle, une image entrée deux fois. Elle se relève quand une ressource entre
légitimement, et le lot le dit ; jamais pour faire passer un débordement.
Marge actuelle : **6,6 %** (75 930 octets) — la borne N'A PAS BOUGÉ au lot
STRUCTURES-AU-COMBAT, et c'est le fait : il n'a fait entrer aucune ressource, il
a retiré une duplication. La borne est passée à 1 150 000 au lot
UNITÉS-AU-COMBAT, qui a porté le HTML à **1 073 238 octets** en faisant entrer
les trois dernières familles d'unité : `unite` (36 sprites, 66 861 o de base64),
`chassis` (10, 20 429 o) et `tourelle-unite` (80, 120 774 o), soit **208 064
octets**. Les sept familles sont désormais toutes cousues, sauf `carte` et
`effet` — la première attend trois arbitrages, la seconde un événement de mort
que le moteur ne publie pas.
Auparavant, la borne était passée à 900 000 au lot BRANCHEMENT-DÉFENSE, qui a porté le HTML à **859 646 octets** en faisant entrer
`defense` (204 sprites en 15 × 14, la grille la plus dense du dépôt) et `socle`
(36 en 6 × 6), soit **243 364 octets de base64**.
⚠⚠ **ET IL NE RESTE QUE 40 354 OCTETS.** Les trois familles encore non cousues —
unite, tourelle-unite, carte — pèsent bien au-delà : le prochain lot qui en fait
entrer une devra relever la borne EN ÉCRIVANT POURQUOI. Une piste mesurée si le
poids devient un problème : découper les atlas par CAMP en plus de la famille
épargnerait 80 068 octets — mais c'est un second axe dans l'index pour un écran
de raid qui n'existe pas, et c'est un arbitrage d'Ethan.
Auparavant, la borne était passée à 700 000 au lot RUINES, et
le lot PRODUCTION avait porté le HTML à 608 040 octets : l'atlas des bâtiments
passe de 16 à 34 sprites, sa grille de 4×4 à 6×6, et son poids inliné de 27 278 à
**57 489 octets**. Auparavant, le lot PREMIÈRE-COUCHE avait porté le HTML à
581 125 octets, et le lot BÂTIMENTS-1024 l'a RAMENÉ à **577 357** : les seize
bâtiments de la V2 se compressent mieux, l'atlas passant de 23 285 à 20 459
octets. Une bascule d'illustration peut donc rendre des octets, et celle-ci en a
rendu 3 768. Le lot TUTORIEL-EN-BAS l'avait mené à 523 905 (+10 993 : les
dix-sept missions dictées, la mini-fenêtre du bas, le compteur par objectif et le
bouton de réouverture de l'onglet Mission), puis la boucle du raid à 530 268.

⚠⚠ **ET LE LOT PREMIÈRE-COUCHE A MANGÉ LA MOITIÉ DE CE QUI RESTAIT : +50 857.**
Deux atlas de sprites entrent en `data:` — **45 111 octets de base64** pour les
16 bâtiments et les 18 tuiles de terrain —, le reste étant le code qui les pose.
C'est la deuxième et la troisième ressource BINAIRE du livrable, après l'atlas de
la carte du monde, et c'est encore le prix de l'offline.

⚠⚠ **LA BORNE DE 600 000 N'A PAS ÉTÉ TOUCHÉE, ET LA MARGE EST MAINTENANT MINCE.**
18 875 octets, soit 3,1 % : les cinq familles de sprites NON cousues — socle,
defense, unite, tourelle-unite, carte, 477 sprites — ne tiendront pas dedans.
Mesuré le 30/08 par `tools/atlas.py` lui-même : sept atlas pèsent **697 898
octets en base64**, à eux seuls. Le prochain lot qui en fait entrer une devra
donc relever la borne EN ÉCRIVANT POURQUOI, jamais rogner un atlas pour passer
dessous. C'est la règle §5 — « baisser une borne pour faire passer un lot :
jamais » — prise par l'autre bout : une ressource qui entre légitimement fait
monter la borne, et le lot le dit.

Le compte de tests a BAISSÉ de sept au lot ORPHELIN — `test/economy.test.js`
est parti avec le module qu'il testait — puis remonté d'un au lot HOMONYMES, de
quatorze au lot ÉCRAN-CHANTIER (treize pour `test/chantier.test.js`, un pour la
garde §11 scindée en deux), et de onze au lot ÉCRAN-NAVIGATION (six pour
`test/offense.test.js`, trois d'orientation dans `test/rendu.test.js`, deux dans
`test/chantier.test.js` — la barre à deux bandes et la pastille de pose), et de
cinq au lot POSE-À-L'ÉCRAN et de **dix** au lot PANNEAU-ET-MARGES, tous dans
`test/chantier.test.js`, et de **cinq** au lot STOCKAGE-ET-VOISINAGE (trois dans
`chantier.test.js`, un dans `disposition.test.js`, un dans `state.test.js`), et de
**six** au lot MISE-EN-PAGE, tous dans `chantier.test.js`, et de **six** au lot
POSE-ET-DÉPLACEMENT (trois dans `chantier.test.js`, deux dans `state.test.js`, un
dans `documentation.test.js` — celui-là n'était pas au brief : il garde le compte
de teintes annoncé par ce fichier-ci, qui venait d'être trouvé faux de cinq), et
de **onze** au lot TUTORIEL : dix dans le nouveau `test/missions.test.js` — le
dixième écrit APRÈS coup, quand la falsification a trouvé que l'écran
recalculait la mission courante au lieu de la demander au moteur — et un dans
`donnees.test.js`, né d'une CI rouge (voir §6, « les types de `package.json` »).
et de **quarante-neuf** au lot GARNISON-ET-ARMÉE, le plus gros saut du projet :
quinze dans le nouveau `test/couts-militaires.test.js` (l'arbitrage des coûts),
dix-huit dans `state.test.js` et `niveau-de-base.test.js` (les deux forces, la
migration, les deux niveaux), sept dans `offense.test.js` et neuf dans
`chantier.test.js`. Quatre gardes de `chantier.test.js` ont CHANGÉ DE CIBLE sans
s'assouplir — leurs littéraux sont passés dans des fonctions — et une cinquième
a été resserrée : elle comparait deux `indexOf` sur tout le module, et une
déclaration remontée l'a fait tomber sans qu'aucun geste ait changé.
Puis de **trois** au lot CITATION (29/08), dans `donnees.test.js` : les deux
courbes confrontées au relevé qui les a mesurées, et l'écart voulu sur les
dégâts exigé DÉCLARÉ dans le fichier qui le commet.
Puis de **neuf** au lot RETOURS-ETHAN (29/08), répartis sur quatre fichiers —
deux dans `base.test.js` (le bâtiment de production par châssis, la réparation
indexée sur le Chantier), deux dans `state.test.js` (le plafond du Chantier, la
règle du bâtiment hors de `verifierEtat`), trois dans `chantier.test.js` (la
géométrie du trait, son accord avec le glyphe, le calque SVG) et deux dans
`offense.test.js` (la barre contextuelle, la palette qui ne défile plus). Aucun
fichier neuf : les six retours d'Ethan touchent du code qui existait déjà.
Puis de **neuf** au lot TUTORIEL-EN-BAS (29/08), tous dans
`test/missions.test.js` — le fichier a été RÉÉCRIT, pas allongé : dix tests
portaient la chaîne de cinq missions du 28/08, dix-neuf portent celle de
dix-sept dictée le 29. Deux d'entre eux ont été RESSERRÉS après falsification :
celui des emplacements passait VERT sur une chaîne devenue injouable, parce
qu'il ne mesurait que le montage écrit dans le test et pas la table de
`data/missions.js` — il lit maintenant la CHAÎNE ; et celui de la mise en page a
changé de cible en même temps que la fenêtre quittait `position: absolute`.
Et de **trente et un** au lot ÉCRAN-CARTE (29/08), dans deux fichiers neufs :
treize dans `test/terrain.test.js` — le pavage, confronté à l'atlas RÉEL décodé
sur place — et dix-huit dans `test/monde.test.js`. Deux d'entre eux ont été
resserrés APRÈS coup, la falsification les ayant trouvés verts sur du code
cassé : celui qui cherchait `ecranMonde.masquer()` n'importe où passait sur un
appel enfermé dans un `if (false)`, et celui qui comparait deux dalles par
`deepEqual` mettait cent secondes à dire « rouge » sur 65 536 pixels — un test
qu'on n'attend pas ne se relance pas.

Et de **onze** au lot PREMIÈRE-COUCHE (30/08) : sept dans le nouveau
`test/sprite.test.js` — l'index confronté au disque, la géométrie confrontée aux
en-têtes des PNG cousus, la formule de cadrage REFAITE plutôt que recopiée, la
levée sur un nom absent, les onze bâtiments résolus, la variante stable et
bornée, et le flux de la simulation intact après une peinture — et quatre dans
`chantier.test.js`. **Aucune assertion existante n'a été retirée ni assouplie**,
et le compte de `chantier.test.js` est passé de 583 à 609.
⚠ Une garde de ce lot est passée VERTE sur du code cassé au premier essai, et
elle a été resserrée : celle qui refuse `etat.rng` dans `variante.js` tombait sur
le COMMENTAIRE du module, qui nomme `etat.rng` pour dire qu'il n'y touche pas.
C'est la troisième fois que le dépôt commet cette faute-là — après
`viewport-fit=cover` et `MENTION_SATURE`. Elle lit maintenant la source
décommentée, et un appât prouve que le motif reconnaît encore la vraie faute.

Une baisse n'est pas forcément une régression, mais elle se justifie, toujours.

---

## 1. Qui fait autorité

Dans cet ordre, sans exception :

| Rang | Fichier | Statut |
|---|---|---|
| 1 | `SPEC-FOYER-ZERO.md` | **la spécification. Arbitrée par Ethan. Fait autorité.** |
| 2 | `src/data/*.js` | transcription figée de la spec, **seule source lue par le code** |
| 3 | `PASSATION-*.md` (la plus récente) | état du projet, décisions du jour, pièges |
| 4 | `MODELE-REPARATION-1.md`, `COURBE-DE-NIVEAU-2.md`, `BASE-DU-JOUEUR-1.md`, `PATCH-grille-vagues-portrait.md` | arbitrages des 24–25/08, dictés par Ethan |
| 5 | `ANNEXE-STATS.md`, `MODELE-COMBAT.md`, `MODELE-ECONOMIQUE.md`, `ROSTER.md`, `ARBRE-RECHERCHE.md` | appui, partiellement périmés |
| 6 | `RELEVE-TA-*.md`, `REFERENCE-TA.md`, `COMPTE-RENDU.md`, `AUDIT-CALIBRAGE.md`, `SESSION-RELEVE-BUTIN.md`, `SYNTHESE-ET-PLAN.md`, `RAPPORT-*.md` | matière première et historique |

**Pour les sprites, une hiérarchie à part** — `FICHE-STYLE.md` dit COMMENT
dessiner et fait foi sur le style ; `INVENTAIRE-SPRITES.md` dit QUOI dessiner et
sous quel nom de fichier, et fait foi sur la liste ; `BRIEF-SPRITES-IA.md` dit
COMMENT LE DEMANDER à un modèle d'image. Les trois se lisent ensemble, aucun ne
remplace les deux autres. Les étalons visuels sont dans `art/etalon/`.

⚠ **Les suffixes numériques font partie des noms.** Les documents du rang 4 se
citaient entre eux SANS leur suffixe — `MODELE-REPARATION.md`,
`COURBE-DE-NIVEAU.md`, `BASE-DU-JOUEUR.md`, plus `FOYER-ZERO-CALIBRAGE.xlsx` :
neuf références vers des fichiers qui n'existent pas sous ce nom. **Réparées le
26/08** dans les cinq documents concernés. Les fichiers n'ont PAS été renommés,
délibérément : les renommer aurait cassé toutes les citations des passations et
des rapports, qui font l'historique. En écrire une nouvelle : copier le nom de
fichier, ne jamais le retaper.

Trois références restent volontairement sans cible : `BRIEF-lot5B-*.md` et
`BRIEF-lot5C-*.md` (livrables hors dépôt, `PASSATION-2026-08-25.md` §6) et
`chantier-economie.xlsx` (`RAPPORT-LOT-1.md`). Elles se disent telles.

### Les classeurs `.xlsx` ne sont PAS des sources

`FOYER-ZERO-BATIMENTS-JOUEUR.xlsx`, `FOYER-ZERO-CALIBRAGE-2.xlsx`,
`FOYER-ZERO-LEXIQUE.xlsx`, `FOYER-ZERO-PROPORTIONS-IA.xlsx`,
`FOYER-ZERO-RECHERCHE.xlsx`, `GABARIT-CALIBRAGE-vide.xlsx` sont des **feuilles
de saisie**. Le classeur de calibrage est resté à l'état d'avant l'audit du
23/08 : noms d'unités manquants, Perceurs déclaré anti-véhicule, Broyeur
anti-structure, Guetteur anti-véhicule en défense, colonne `credit` alors que
les crédits n'existent plus, formules de couverture latérale cassées.

**Ne jamais lire un `.xlsx` pour coder.** Tout ce qui est arbitré est déjà dans
`src/data/`. Si une valeur manque, elle se demande à Ethan — elle ne se récupère
pas dans le classeur.

### Sections périmées, à ne pas suivre

- ~~`SPEC-FOYER-ZERO.md` l. 281, « couloir 9 × 300 »~~ — **corrigé le 26/08**,
  la cellule dit maintenant 30 × 300, conforme à `GEOGRAPHIE.carte` de
  `sites.js`. C'était le fichier de rang 1 qui mentait.
- `SPEC-FOYER-ZERO.md` §1 et §2, constante « réparation gratuite 70 % » :
  **périmée**, c'est 100 % en une heure (`MODELE-REPARATION-1.md` §3). Idem pour
  « plancher de PV des défenseurs : 1 % » — c'est **1 PV**, et ce n'est pas une
  grandeur du moteur de combat mais une écriture d'après-raid.
- `ROSTER.md` §4 (grille 5 × 4 des châssis) et §9 (cases vides) : périmés par la
  suppression des châssis *Pièce* et *Masse*. Trois châssis seulement.
- `ROSTER.md` : contrainte Affût/Dard du palier 5, dette DA du Dard — **tombées**,
  il n'y a plus d'anti-aérien offensif.
- `MODELE-ECONOMIQUE.md` §5 (composition de site, butin par bâtiment) : remplacé
  par `SPEC-FOYER-ZERO.md` §8 et `src/data/sites.js`.

---

## 2. Arborescence réelle

Relevée le **27/08/2026**, fichier par fichier. **La lister quand même.**

```
src/index.src.html      point d'entrée ; son <script type="module"> est LE point d'entrée JS

src/data/               toutes les valeurs de calibrage — 11 fichiers ; RIEN d'autre n'a le droit d'en porter
  combat.js             grille, unités, défenses, QUI porte quel module, ciblage, écrasement, obstacles
  modules.js            ce que FAIT chaque module : libellé, description d'Ethan, état de câblage
  recherche.js          l'arbre de recherche du joueur — la SEULE porte qui ouvre une pièce
  sites.js              bâtiments de site, butin, densité, garnisons, vagues, recherche, géographie
  niveaux.js            courbe de niveau du COMBAT — PV et dégâts
  economie.js           courbe des COÛTS et de la PRODUCTION — distincte de la précédente
  base.js               les onze bâtiments de la base du joueur ; lu par champs, disposition et le tick
  couts-militaires.js   l'ancre du niveau 2 de la défense et de l'offense, entité par entité
  missions.js           la chaîne du tutoriel dictée par Ethan : objectifs, niveaux visés, comptes
  atlas.js              l'index des atlas de sprites — ⚠ GÉNÉRÉ, voir ci-dessous
  ancres-chassis.js     où se pose la tourelle sur chaque coque de blindé du joueur
  ⤷ ⚠⚠ `ancres-chassis.js` EST UNE TRANSCRIPTION À LA MAIN de
    `art/sprites/ancres-chassis.json`, et un test les confronte — clés et valeurs
    SIGNÉES. Le JSON est mesuré par `tools/chassis.py` sur les images ; il ne peut
    pas entrer dans le livrable, `tools/build.js` n'inlinant que des images et
    `render/scene.js` ne lisant aucun fichier. Une transcription qui ne se
    confronte pas à sa source est une copie qui vieillit.
  ⤷ ⚠ NEUF `y_pct` SUR DIX SONT NÉGATIFS, PAS LES DIX — `off_j_fendeur_chassis_def`
    vaut +1,0. Le brief du lot annonçait les dix : mesuré, c'est faux. Un test qui
    asserterait « toutes négatives » inviterait à corriger une donnée juste.
  ⤷ ⚠⚠ `atlas.js` EST ÉCRIT PAR `tools/atlas.py`, PAS À LA MAIN. Sa première
    ligne le déclare généré, et elle reste. Il dit ce que chaque atlas contient
    et dans quel ordre — rien que les noms cousus et la géométrie de la grille,
    AUCUNE coordonnée : la cellule d'un sprite se calcule de son rang, et écrire
    les paires de nombres ici ferait deux calculs qui peuvent diverger. Le
    régénérer : `python3 tools/atlas.py --ecrire`. Un test le confronte au
    contenu réel de `art/sprites/`, si bien qu'un sprite ajouté sans que l'outil
    soit relancé fait ROUGIR la suite au lieu de faire dessiner de travers.

src/sim/                simulation déterministe, sans DOM — 28 fichiers
  rng.js  clock.js  state.js  grille.js  combat.js  generateur.js
  base-courante.js      l'accesseur de base courante — SANS AUCUN IMPORT
  champs.js             terrain d'une base : 12 champs et 10 obstacles, tirés de la POSITION
  peuplement.js         où sont les bases de l'Ouvrage : dérivé de la graine, jamais stocké
  satellites.js         camps et avant-poste du joueur : de l'HISTOIRE, donc sauvegardée
  disposition.js        validation, voisinage TYPÉ, débits d'une base posée
  economie-base.js      le TICK : stocks, saturation, rattrapage analytique
  carte.js              distances de GEOGRAPHIE → coordonnées, niveau d'une rangée
  territoire.js         les deux zones d'influence de la spec, et leurs bordures
  niveau-de-base.js     les trois niveaux du JOUEUR : moyennes, en dixièmes
  points-attaque.js     le régulateur de session : plafond à cliquet, barème du raid, territoire
  poi.js                les soixante-dix points d'intérêt : où ils tombent, ce qu'ils donnent
  site-de-la-case.js    une case de la carte → un site jouable : deux graines, saveur, résumé
  site-entame.js        l'après-raid : planchers, ce qui reste debout, ce qui repousse
  raid.js               l'acte, et sa simulation : payer, partir, encaisser, revenir abîmé
  raid-ouvrage.js       l'autre sens : quand l'Ouvrage vient, ce qu'il casse, ce qu'il rase
  deplacement.js        la base bouge : portée, délai, et LE seul écrivain de `position`
  fondation.js          fonder une base de plus : où c'est permis, ce qu'on écrase, qui encaisse
  transfert.js          envoyer des ressources d'une base à l'autre : distance, taxe, refus
  reparation.js         la réserve de temps : trois stocks par châssis, crédit et débit
  missions.js           le tutoriel : des QUESTIONS posées à la base, jamais une écriture
  rendu-pose.js         où poser un sprite sur une case : ancrage et variante, sans DOM
  recherche.js          l'achat : acquises, modules, coûts en BigInt, problèmes chiffrés
  ⤷ ⚠ DEUX `recherche.js`, UN DANS `data/` ET UN DANS `sim/`, et c'est le motif
    déjà en place pour `combat.js` et `missions.js` : la TABLE d'un côté, le
    MOTEUR de l'autre. Un import qui se trompe de dossier ne compile pas — les
    exports n'ont aucun nom en commun.

src/render/             rendu, sans DOM non plus : rend des primitives — 9 fichiers
  projection.js  canvas2d.js  interpolation.js  scene.js
  orientation.js        où une rangée tombe à l'écran, et la réciproque
  terrain.js            le pavage du fond de carte : il rend des pixels, pas un dessin
  sprite.js             où tombe un sprite dans son atlas : deux chaînes CSS, rien de plus
  variante.js           quel dessin porte une case : pur, stable, sans toucher au tirage
  embleme.js            quel dessin porte un site de la carte : palier, saveur, emprise
  ⤷ ⚠⚠ AU SINGULIER, ET CE N'EST PAS NÉGOCIABLE. `tools/emblemes.py` produit les
    sprites que ce module nomme ; un sélecteur de téléphone n'affiche que les
    noms courts, et deux fichiers qui ne diffèrent que par un `s` final sont
    exactement l'accident du 27/08 où le moteur de combat a été écrasé (§6,
    homonymes).
  ⤷ ⚠ IL PORTE LE PRÉ-BRANCHEMENT DES NEUF SPRITES QUE RIEN NE DESSINE — les
    sept POI et les deux grosses bases. Le modèle ne produit aucun POI et une
    base ne connaît pas sa taille ; ajouter ces types à `EMBLEMES_CARTE` écrirait
    dans la table du MODÈLE une entrée que le modèle ne produit pas. Le
    pré-branchement se fait donc entièrement du côté du DESSIN.
  ⤷ ⚠⚠ LE LECTEUR D'ATLAS NE PORTE PAS LE NOM COURT DE SA PROPRE SOURCE, et ce
    n'est pas négociable : la table qu'il lit vit dans `src/data/` sous un nom
    que le sélecteur d'un téléphone afficherait à l'identique. C'est exactement
    l'accident du 27/08 où le moteur de combat a été écrasé (§6, homonymes).
  ⤷ ⚠⚠ `sprite.js` SAIT POSER UNE CELLULE DANS UN QUARTIER DE L'ÉLÉMENT depuis
    le 30/08 — `fondDeCellule`, dont le cadrage plein n'est que le cas « un seul
    quartier ». Le SOL DE LA BASE en pose quatre par case, découpées dans
    l'atlas du MONDE. La formule est écrite une fois, et un test la refait sur
    les deux usages plutôt que de la recopier.
  ⤷ ⚠⚠ ET UNE NOTE `⤷` NE S'INSÈRE JAMAIS ENTRE DEUX FICHIERS D'UN BLOC. Le
    parseur de §2, dans `documentation.test.js`, arrête le bloc à la première
    ligne qui n'est pas « deux espaces puis une minuscule » : une note glissée
    au milieu tronque la liste, et le test accuse alors les fichiers qui la
    suivent d'avoir disparu. Elles vont à la FIN du bloc. Payé une fois.
  ⤷ ⚠ ET LE CHOIX D'UNE VARIANTE NE CONSOMME PAS `etat.rng`. Le flux de l'état
    est celui de la SIMULATION : y prendre un tirage pour choisir une texture
    décalerait tout ce que le moteur tire ensuite, et la partie cesserait de se
    rejouer à l'identique. Le module salue le hachage de `sim/peuplement.js`,
    sous un sel à lui — il n'en écrit pas un second. Un test le prouve en
    relevant l'état du flux avant et après une peinture complète.

src/ui/                 les sept écrans et leurs éditeurs — 11 fichiers
  session.js            LE SEUL fichier du dépôt qui lise l'horloge murale, une fois
  chantier.js           l'écran de la base : formatage PUR, puis rendu au DOM
  offense.js            l'écran des quatre vagues : il compose l'armée et l'écrit
  mission.js            l'écran du tutoriel — il coche, il ne décide rien
  monde.js              l'écran de la carte : canevas, quatre crans, défilement au doigt
  raid.js               l'écran de raid : la cible, l'armée, le combat rejoué
  recherche.js          l'arbre du joueur : trois panneaux sur un rail, achat en deux touchers
  transfert.js          le panneau de transfert : il annonce le REÇU, il ne décide de rien
  banc.js               le banc d'essai, désormais derrière un geste de debug
  arsenal.js            éditeur d'assaut — module PUR
  defense.js            éditeur de garnison — module PUR
  ⤷ le DOM reste confiné à ce dossier, mais il n'y a plus UN seul fichier qui y
    touche : `banc.js` et `chantier.js` le font tous les deux, et `session.js`
    les met en scène. La garde de `banc.test.js` porte sur le DOSSIER, pas sur
    un nom.
  ⤷ l'écran de la base est en LECTURE ET EN ÉCRITURE depuis le 27/08 : pose,
    amélioration, démolition, et depuis le 28/08 un panneau de détail. La ligne
    « en lecture » de son en-tête a été fausse pendant deux lots.
  ⤷ ⚠ SES DEUX BANDES SONT ÉDITABLES depuis le lot GARNISON-ET-ARMÉE, et elles
    partagent UN SEUL geste. La table `TERRAINS` porte la seule chose qui les
    sépare — d'où viennent les pièces, quel roster les propose, quelles
    fonctions du moteur on interroge. Un test compte les occurrences des
    fonctions de geste et refuse tout cas particulier nommé à la main.
  ⤷ ⚠ LA PAGE A CINQ ÉCRANS ET UN EN-TÊTE COMMUN — quatre depuis le 28/08, cinq
    depuis le lot ÉCRAN-CARTE, qui a ouvert l'onglet Monde. Les onglets,
    le bandeau des ressources, la bascule entre bases et la barre du bas vivent
    AU-DESSUS des écrans, dans `#jeu` : changer d'écran ne les fait plus
    disparaître. Le fichier de la base construit tout ce chrome — il a les
    formateurs et l'état — mais il ne change pas d'écran lui-même : il le
    DEMANDE à la session par `versEcran`.

test/                   48 fichiers *.test.js (node:test) ; QUATRE n'en sont PAS
  arsenal  assaut  banc  base  carte  champs  chantier  cible  clock  combat
  defense
  disposition  documentation  donnees  economie-base  generateur
  couts-militaires  peuplement  satellites  terrain  monde
  grille  missions  niveau-de-base  offense  points-attaque  poi  raid  rendu  repli  rng
  raid-ouvrage  euclide  deplacement
  accent  icone  rendu-pose  reparation  roster  site-de-la-case  site-entame
  sprite  state  recherche  maj  territoire  bases  transfert
  ⤷ ⚠ QUATRE FICHIERS DE `test/` NE SONT PAS DES TESTS, et ils sont NOMMÉS dans
    la liste blanche de `documentation.test.js` — tout autre fichier déposé ici
    la fait ROUGIR, ce qui est l'accident du 26/08 pris par l'autre bout.
    `prereglages-lot3a.js` porte les montages du banc ; `png-rgba.js` porte le
    décodeur PNG RVBA, extrait de `sprite.test.js` au lot ACCENT-CONFRONTÉ quand
    un SECOND test en a eu besoin — le dupliquer aurait donné deux décodeurs
    voisins dont un seul serait éprouvé. Les deux derniers sont entrés au lot
    BASES-0 : `temoins-bases-0.js` porte les empreintes capturées AVANT le
    dépliage — ce n'est pas un test, c'est sa RÉFÉRENCE, et elle ne se
    rafraîchit pas —, et `aplatir-sauvegarde.js` porte l'inverse de la migration
    22 → 23, dont HUIT fichiers ont eu besoin le même jour.
  ⤷ documentation.test.js : les COMPTES **et les NOMS** de ce fichier-ci sont
    assertés contre le disque — noms de `test/` et noms de chaque dossier de
    `src/`. Ajouter, retirer ou déplacer un fichier sans mettre §0 et §2 à jour
    rend la suite ROUGE. C'est voulu — §2 a menti deux fois, §0 quatre, et le
    compte seul a laissé passer un écrasement le 27/08 (§6, homonymes).
  ⤷ base.test.js croise base.js et sites.js : ne pas le déplacer sans lire
    pourquoi (appariements Ouvrage, dans les deux sens).
  ⤷ base.test.js : invariants de src/data/base.js — roster des onze, classes
    de coût, emplacements, géométrie, champs, débits, stockage. AJOUTÉ le
    26/08 (lot BASE-0) : le fichier vivait depuis un mois sans un seul test.
  ⤷ donnees.test.js : invariants des tables de src/data/ — sommes, bornes,
    références croisées. Il REMPLACE l'ancien verif.mjs de la racine.

tools/                  24 fichiers, dont UN SEUL sert au build — RECOMPTÉ le 02/09
                        au lot PIXELS, fichier par fichier (hors `__pycache__`,
                        qui est ignoré par git). Le vingt-quatrième est
                        `portes.py`, qui porte les seuils de quantification et
                        n'importe RIEN, pour que le couseur d'atlas puisse les
                        lire sans traîner `scipy`.
                        ⚠ CETTE LIGNE A ANNONCÉ TROIS, PUIS SEPT, PUIS HUIT, PUIS
                        DIX-SEPT, et le dix-sept était déjà faux de deux quand il a
                        été écrit : le disque en portait dix-neuf. La chaîne de
                        production graphique apporte ses scripts sans que personne
                        ne recompte, et ce lot-ci en ajoute deux — d'où vingt et un.
                        ⚠ AUCUNE GARDE NE COMPTE CE DOSSIER — le test de §2 ne porte
                        que sur les quatre dossiers de src/ et sur test/ —, et c'est
                        exactement pourquoi il dérive. Le recompter à chaque lot qui
                        y touche est la seule chose qui le tienne.
  build.js              src/ → dist/index.html, un seul fichier autonome, images comprises
  conditionneur.html    outil hors ligne, sans rapport avec le build
  audit-maquette.mjs    confronte foyer-zero-ui.html aux tables — À LA MAIN
  ⤷ les VINGT ET UN autres sont du Python, hors chaîne de build et hors
    `npm run check`. Ils se répartissent en quatre rôles :
      • DOUZE PRODUCTEURS de sprites, qui lisent `art/sources/` et écrivent dans
        `art/sprites/` — le douzième est `bords.py`, entré le 31/08 ;
      • TROIS BIBLIOTHÈQUES qu'ils importent — la palette et le conditionnement,
        le portage de la coupe 1024, et les SEUILS DE QUANTIFICATION depuis le
        02/09 ; une quatrième, `align_chenilles.py`, n'a plus d'appelant depuis
        que la grille 32 est sortie, et reste au dépôt sans être citée ;
      • DEUX SCRIPTS HISTORIQUES à usage unique, dont les chemins pointent vers
        une machine qui n'existe plus : ils se lisent au passé ;
      • le COUSEUR d'atlas, le module de CHEMINS, le VÉRIFICATEUR, et
        l'outil d'ICÔNE — qui écrit dans `android/`, donc hors du périmètre du
        vérificateur : c'est un angle mort assumé, dit au rapport de FINITIONS.
  ⤷ ⚠⚠ LA DESTINATION DES ONZE PRODUCTEURS EST DÉROUTABLE DEPUIS LE 30/08, et
    c'est ce qui rend la chaîne vérifiable. Chacun portait sa propre ligne vers
    `art/sprites/` ; ils demandent maintenant ce dossier au module de chemins,
    qui honore la variable d'environnement `FZ_SPRITES`. **La SOURCE, elle, n'est
    PAS déroutable** — la dérouter aussi ferait tourner le vérificateur sur un
    dossier vide, et il rendrait « tout va bien » sur rien.
  ⤷ ⚠ LE COUSEUR D'ATLAS RESTE À PART, délibérément : il écrit aussi
    `src/data/atlas.js`, qui n'est pas un sprite, et il porte déjà son propre
    mode de vérification. Le vérificateur l'APPELLE au lieu de le dérouter.
  ⤷ ⚠ ET LE VÉRIFICATEUR N'ÉCRIT JAMAIS DANS `art/sprites/`. C'est son invariant
    le plus important — un contrôle qui écrit là où il compare est un piège — et
    il se mesure par empreinte de l'arbre avant et après, pas par relecture.
android/                enveloppe WebView (app/) + module maj/ (Kotlin, 7 classes, 7 tests JVM)
art/etalon/             étalons visuels des sprites : joueur/, ennemi_pale/, ennemi_sombre/
art/sources/            sprites bruts, hors chaîne de build — 165 fichiers à la
                        racine, 428 en comptant `carte/`. RECOMPTÉ le 30/08 au
                        lot BORDS-DE-BASE.
                        ⚠ CETTE LIGNE ANNONÇAIT 87 « depuis le RANGEMENT », et
                          elle était fausse de 61 : le disque en portait 148
                          avant ce lot-ci. Aucune garde ne compte ce dossier —
                          `documentation.test.js` ne porte que sur `test/` et
                          les quatre dossiers de `src/` —, donc rien ne le
                          corrige tout seul. Même dérive que `tools/` et
                          `art/sprites/`, pour la même raison.
                        ⚠ IL NE S'AMPUTE JAMAIS, et c'est ce qui le distingue
                          d'`art/sprites/` : rien ici n'est un produit, tout y
                          est un original. Un lot n'y AJOUTE que.
art/sprites/            les sprites conditionnés — DIX-NEUF dossiers de grille
                        et 970 fichiers, recomptés le 02/09 au lot PIXELS, plus
                        SEIZE atlas `.webp` à la racine, DEUX fichiers générés —
                        `ancres-chassis.json` et `atlas-empreintes.json` — et les
                        SEIZE images à plat de `bord/`.
                        NEUF familles en 128 et 64 : unité, bâtiment, terrain,
                        defense, tourelle-unite, socle, carte, effet, chassis.
                        La dixième, `bord`, n'a pas de grille.
                        ⤷ ⚠⚠ LA GRILLE 32 EST SORTIE AU LOT PIXELS — 465
                          fichiers retirés, ni le jeu ni les tests ne la
                          lisaient. **SAUF `terrain/32`**, qui reste : `terrain/`
                          est une SOURCE DÉCLARÉE, ses planches d'origine ont été
                          supprimées par la migration qui les a consommées, donc
                          ses 18 tuiles sont IRRÉCUPÉRABLES. `art/sprites/` est
                          reproductible, sauf là où le vérificateur dit qu'il ne
                          l'est pas.
                        ⤷ ⚠⚠ LES ATLAS SONT EN `.webp`, LES SPRITES EN `.png`.
                          Sans le WebP les huit atlas pèseraient ×3,5 depuis que
                          la chaîne ne quantifie plus ; et sans le PNG côté
                          sprites, `test/png-rgba.js` ne lirait plus rien —
                          accent, trous, murs de contour. DEUX grilles sont
                          cousues, la 64 seule est embarquée.
                        ⤷ ⚠⚠ `bord/` EST À PLAT, SANS DOSSIER DE GRILLE, ET
                          IL N'EST DANS AUCUN ATLAS. Ses images ne tiennent pas
                          dans une case : 512 × 64 pour un mur, 64 × 512 pour
                          l'autre sens, 64 × 64 pour un angle — arbitrage
                          d'Ethan du 31/08 —, quand `tools/atlas.py` n'accepte
                          que des cellules CARRÉES d'un même côté. Les seize
                          sortent de `tools/bords.py` ; CINQ entrent dans le
                          livrable, celles du joueur, pour 52 864 octets de
                          base64. Voir §6, « les murs de contour ».
                        ⤷ ⚠ LE COMPTE A BAISSÉ DE 156, ET CE N'EST PAS UNE PERTE.
                          Le lot en a AJOUTÉ 84 — 54 états détruits et ruines,
                          30 châssis — et RETIRÉ 240 : les tourelles de blindé de
                          l'Ouvrage, arbitrées inutiles le 30/08 parce que ses
                          coques portent la tourelle cuite dans le dos. Mesuré
                          sur `P3.3` et `P3.4` : leur seul creux fait 1 à 16 % de
                          la largeur de caisse, contre 18 à 50 % côté joueur.
                          Une baisse se justifie, elle ne se constate pas.
                        ⤷ ⚠ CE BLOC A ANNONCÉ « NEUF DOSSIERS, 144 FICHIERS »
                          PENDANT TROIS LOTS. Aucune garde ne compte ce dossier —
                          `documentation.test.js` ne porte que sur `test/` et les
                          quatre dossiers de `src/` —, donc rien ne le corrige
                          tout seul. Le recompter à chaque lot qui y touche est
                          la seule chose qui le tienne, comme pour `tools/`.
                        ⤷ ⚠ `effet/` EST LE SEUL DOSSIER HORS DES DEUX RAMPES :
                          les explosions portent leur propre palette de seize
                          teintes. Voir `INVENTAIRE-SPRITES.md` §8, amendé le
                          30/08, et `tools/effets.py`.
                        ⤷ seuls `carte/` et les deux atlas de la racine entrent
                          dans le livrable ; le reste n'est cité par aucun
                          fichier de `src/`.
art/sprites/carte/      ⚠ LE SEUL DOSSIER D'IMAGES QUI ENTRE DANS LE LIVRABLE.
                        ⚠⚠ ET SON ATLAS SERT DEUX ÉCRANS DEPUIS LE 30/08 : le
                        fond de la carte ET LE SOL DE LA BASE. Sa palette EST la
                        rampe « sol joueur » de FICHE-STYLE (les cinq mêmes
                        teintes, vérifié sur la table PLTE), donc les deux sols
                        sont la même matière. Le sol de la base y prend QUATRE
                        cellules de 64 par case, ce qui n'a coûté aucun octet :
                        l'atlas était déjà payé.
                        L'atlas de terrain y est LU PAR LE BUILD et inliné en
                        base64 ; son absence fait sortir le build en erreur, pas
                        rendre une carte noire. Le second fichier est l'image de
                        contrôle du pavage, citée par le rapport du lot.
rapports/               rapports et passations de plus de 48 h ; les récents restent à la racine
.github/workflows/ci.yml   web (build + tests) · android (tests JVM + APK) · pages (main seul)
```

`dist/` est un produit de build, jamais commité. Le job `pages` **rebuilde le
HTML dans le job** et génère le manifeste à partir de CE HTML : la
désynchronisation code/livrable est structurellement impossible.

### La racine a été rangée le 28/08, et rien n'a été supprimé

Trente-neuf fichiers **déplacés**, zéro retiré : vingt PNG de sprites déposés
par erreur à la racine sont partis dans `art/sources/`, et dix-sept
`RAPPORT-*.md` plus deux `PASSATION-*.md` de plus de 48 h dans `rapports/`.

⚠ **Les vingt PNG étaient bien ORPHELINS, et ça se mesure.** Aucun des vingt
n'est cité nulle part dans le dépôt — vérifié fichier par fichier avant de
bouger quoi que ce soit, pas seulement dans `src/`.

⚠ **QUATRE CITATIONS POINTENT VERS DES FICHIERS QUI ONT DÉMÉNAGÉ**, et elles
tiennent : `CLAUDE.md` cite `RAPPORT-LOT-1.md` et `PASSATION-2026-08-25.md`,
`PASSATION-2026-08-26-soir.md` cite `PASSATION-2026-08-26.md`, et
`test/champs.test.js` cite `RAPPORT-lotCHAMPS-generateur.md`. **Les quatre sont
de la PROSE, aucune n'est un chemin lu** — c'est ce qui a été vérifié avant le
déplacement, et c'est pourquoi la suite est restée verte. Le jour où l'une
devient un chemin, elle casse.

⚠ **AUCUNE GARDE NE COMPTE LA RACINE.** `documentation.test.js` asserte les
noms de `test/` et des quatre dossiers de `src/`, rien d'autre : ces deux
dossiers-ci ne sont donc décrits que par la §2 ci-dessus, et elle a déjà menti
deux fois.

### Un fichier de la racine qui n'est pas ce qu'il paraît

**`foyer-zero-ui.html` est une maquette**, pas un livrable ni une source du
build. Le jeu est `src/index.src.html`.

Elle est **auditée**, pas testée : `node tools/audit-maquette.mjs` confronte ses
noms, son terrain, ses débits, ses capacités et sa palette aux tables du dépôt.
Il ne vit PAS dans `npm run check`, et c'est délibéré — la faire garder par la
suite ferait passer `main` au rouge pour un fichier que le joueur ne verra
jamais. Il se lance quand on touche à la maquette. **C'est l'une des DEUX
exceptions à
« un audit hors de `npm run check` n'existe pas »**, et elle tient parce que la
maquette n'est pas du code livré.

⚠ **LA SECONDE EST `tools/verifier.py`** (30/08), et elle tient pour la même
raison : ce qu'elle garde n'est pas du code livré non plus, c'est la
correspondance entre un outil et les fichiers qu'il a produits. Elle est en
Python, hors de la chaîne de build ; l'entrer dans `npm run check` demanderait
une dépendance Python à la CI, ce qui est un changement d'architecture. Voir §3.
**Il n'y en a pas de troisième**, et la prochaine devra dire pourquoi elle n'est
pas un test.

⚠ **La version précédente de ce paragraphe annonçait sa mort « le jour où
l'écran de jeu aura ses propres tests ».** Ce jour est venu le 27/08 —
`test/chantier.test.js` existe — et l'audit ne meurt PAS. Les deux ne mesurent
pas la même chose : `chantier.test.js` vérifie que l'écran LIT le moteur,
`audit-maquette.mjs` vérifie que la MAQUETTE ne ment pas. Tant qu'on dessine une
décision d'interface dans la maquette avant de l'écrire, elle a besoin de son
garde-fou. Il mourra le jour où plus personne ne la touchera.

### `verif.mjs` a été supprimé le 26/08 — et pourquoi

Il portait seize invariants de données et **aucune commande ne le lançait**. Il
avait pourri sans que rien ne le dise : il importait `MATRICE_COLONNES`,
renommé `COLONNES_DEGATS` depuis, donc il plantait à l'import. Et même l'import
réparé, sa boucle testait `u.matrice` sur des entités qui portent `u.degats` :
elle aurait sauté toutes les entités **en silence** et affiché « ok ».

Ses invariants vivent maintenant dans `test/donnees.test.js`, dans
`npm run check`. **Un audit hors de `npm run check` ne s'exécute pas, donc
n'existe pas** — ne pas en recréer un.

---

## 3. Commandes

```
npm ci
npm run build     # node tools/build.js → dist/index.html
npm test          # node --test "test/*.test.js"
npm run check     # build + tests, à passer avant toute livraison
```

Le build **sort en erreur** si le HTML produit référence quoi que ce soit
d'extérieur. L'offline est non négociable.

⚠ **Le dépôt n'a ni jsdom ni navigateur de test.** `esbuild` est sa seule
dépendance de développement, et ce n'est pas un oubli. Ce qui touche le DOM ne
s'automatise donc pas ici : ça se teste sur appareil, et un test appareil non
exécuté se déclare **non exécuté**, jamais passé.

### La chaîne graphique — hors de `npm run check`, et pour une raison

```
python3 -m pip install Pillow numpy scipy    # ⚠ SANS EUX IL NE DÉMARRE PAS
python3 tools/verifier.py                    # toute la chaîne, ~2 min
python3 tools/verifier.py --outil emblemes   # un seul outil, pour itérer
```

⚠⚠ **LES TROIS PAQUETS NE SONT PAS DANS L'ENVIRONNEMENT D'EXÉCUTION, ET IL FAUT
LE SAVOIR AVANT DE CONCLURE.** `tools/planches.py` importe `PIL`, `numpy` et
`scipy` ; sur un conteneur neuf, aucun n'est là. Le vérificateur sort alors en
**1** dès le premier outil, avec une trace Python — il ne ment pas, mais on peut
lire « chaîne cassée » là où il manque une dépendance. Mesuré le 30/08 au lot
SPRITES-S11, où il a fallu trois installations pour l'amener au bout.
⚠ Le « ~2 min » ci-dessus suppose donc qu'il DÉMARRE. Les onze outils rejoués
prennent 110 s, la comparaison le reste.

⚠ **ELLE N'ENTRE PAS DANS `npm run check`, ET C'EST DÉLIBÉRÉ.** Les outils sont
en Python, hors de la chaîne de build ; y ajouter une dépendance Python serait un
changement d'architecture, et la CI n'en a pas. C'est **la seconde exception** à
« un audit hors de `npm run check` n'existe pas », après `audit-maquette.mjs`, et
elle tient pour la même raison : ce qu'elle garde n'est pas du code livré, c'est
la correspondance entre un outil et ce qu'il a produit.

⚠ **CE QU'ELLE RÉPOND :** la chaîne produit-elle encore, à l'octet, les 1 429
sprites du dépôt ? Le 30/08, la réponse était **non** — `tools/emblemes.py` avait
été corrigé et ses six PNG n'avaient pas été régénérés, `npm run check` était
vert, et rien ne pouvait le voir. Le vérificateur déroute `FZ_SPRITES` sur un
dossier temporaire, rejoue les onze producteurs dedans, et compare. **Il n'écrit
jamais dans `art/sprites/`.**

⚠ **QUATRE CATÉGORIES, ET « MANQUANT » SE LIT DANS LE SENS DE LA CHAÎNE** : c'est
le dépôt qui porte le fichier et aucun outil qui le produit — un orphelin, pas un
trou. Son symétrique, « nouveau », est ce que la chaîne produit et que le dépôt
n'a pas. `planches.py` n'en connaît que trois ; celle qui manquait est la plus
utile, et c'est elle qui aurait vu les 240 tourelles de blindé de l'Ouvrage si
elles étaient restées au dépôt après le lot PRODUCTION.

⚠ **DEUX MINUTES, MESURÉES.** C'est le prix de onze outils rejoués en entier.
Un contrôle qu'on n'a pas la patience de lancer ne protège de rien : il se lance
aux lots qui touchent à l'art, pas à chaque lot.

---

## 4. Conventions

- **ESM**, `"type": "module"`. Français dans le code, les commentaires et les
  messages.
- **Toutes les valeurs de calibrage vivent dans `src/data/`**, jamais en dur dans
  `src/sim/`. **Une seule table fait foi par grandeur** : ne jamais dupliquer un
  niveau de déblocage ou un barème d'une table à l'autre. Et quand deux
  grandeurs qui partageaient une constante divergent, **séparer les fichiers** —
  un commentaire ne suffit pas (c'est l'origine d'`economie.js`).
- **Déterminisme strict** : PRNG explicite, boucle de combat à 10 Hz,
  arithmétique entière pour l'économie par tick. Aucun `Math.random`, aucune
  dépendance à l'horloge murale dans la simulation.
- **Aucun débit ne s'arrondit par tick.** Un débit se range PAR HEURE, entier,
  et le porteur garde un résidu — voir §6, « Sur l'économie ». La conversion
  passe par `TICKS_PAR_HEURE` de `sim/clock.js`, et par elle seule.
- **Deux jeux de noms.** Le joueur emploie le vocabulaire d'une armée régulière
  (Fusiliers, Grenadiers, Mur de défense…), l'Ouvrage celui des outils et des
  bêtes (Meute, Perceurs, Merlon…). Même ligne de données, `nom.joueur` et
  `nom.ouvrage`. Ne jamais les mélanger dans une chaîne affichée.
  ⚠ **La clé est le PROPRIÉTAIRE, pas le camp.** `camp` désigne un côté de la
  grille, `proprietaire` désigne à qui c'est. Le joueur peut défendre.
- **Rien ne se retire en silence.** Quand le contexte bouge sous une composition
  déjà faite — niveau descendu, obstacle apparu — on le SIGNALE dans le bilan et
  on propose de purger. Jamais d'amputation automatique.
- **Un indice n'est pas une interdiction.** Le joueur doit pouvoir se tromper
  exprès.
- `node --check` ne prouve que la syntaxe. Un fichier de données se valide **en
  l'important et en asseyant ses invariants** (sommes, bornes, références
  croisées).

---

## 5. Livraison

**Deux chemins, et la ligne de partage n'est pas la taille du lot — c'est la
vérifiabilité.**

- **Vérifiable par exécution ici** (module pur, données, tests, moteur) → le
  fichier s'écrit directement, se vérifie (`node --check` + suite complète sur
  une copie du dépôt), se livre dans `/mnt/user-data/outputs/` avec le REPO et
  le DOSSIER exacts. **Pas de brief.** C'est Ethan qui commite.
- **Pas vérifiable ici** (tout ce qui touche le DOM) → brief pour Claude Code,
  qui ouvre une **PR**.

Dans les deux cas :

- Le **merge sur `main` appartient à Ethan seul.**
- Toujours dire si la livraison laisse la suite **verte ou rouge, mesuré et non
  estimé**, et découper pour que ce qui peut être commité tout de suite le soit
  sans casser `main`. **Et dire quand ce n'est PAS découpable** : un lot qui
  change une unité de mesure se commite d'un bloc ou laisse `main` rouge.
- Un lot confié à Claude Code produit un `RAPPORT-<lot>.md` **écrit sur disque**,
  nom descriptif. Contenu minimal : version et build réellement produits,
  fichiers touchés, résultat de chaque test (PASS/KO et montage effectif),
  écarts par rapport au brief et leurs raisons, points laissés en suspens.
- Bumper `version` et `config.build` de `package.json` **ensemble**, au numéro
  disponible au moment de l'exécution, et **seulement quand `dist/index.html`
  change**. Un lot qui ne touche que des tests ou de la documentation laisse le
  HTML identique à l'octet, donc son SHA-256 et le manifeste de Pages aussi :
  bumper y pousserait une mise à jour aux appareils pour rien. S'en abstenir, et
  le dire. Un brief ne propose jamais de numéro.

### ⚠ La forme de la livraison — Ethan travaille sur TÉLÉPHONE

**Dès qu'une livraison compte strictement plus de DEUX fichiers, livrer une
archive ZIP unique.** Son arborescence reproduit celle du dépôt (racine,
`src/sim/`, `test/`…), elle inclut le `RAPPORT-*.md`, et un
`LISEZ-MOI-DEPOT.md` en tête donne les étapes de dépôt. À deux fichiers ou
moins, livrer les fichiers tels quels.

⚠ **Ne jamais écrire « décompresse le zip à la racine du dépôt » : GitHub ne
décompresse pas une archive.** Le gain du zip est sur le TÉLÉCHARGEMENT — un
fichier au lieu de onze. L'extraction se fait sur le téléphone, et le
téléversement dossier par dossier via *Add file → Upload files*. Piège à
signaler : téléverser depuis la racine des fichiers destinés à `test/` les
dépose à la racine.

**Vérifier le zip dans les conditions d'usage** : le décompresser sur une copie
fraîche de `main` et y relancer `npm run check` avant de le livrer.

### Le rapport de lot entre au dépôt

`RAPPORT-<lot>.md` se commite à la racine, avec les autres. Sans lui, ce
document affirme des seuils — « 100 ppm », « 19 fois », « 471 fois au-dessus »
— sans que rien ne dise d'où ils sortent.
- Ne jamais signaler un défaut connu au moment de livrer : le corriger avant.

### Les tests ne s'assouplissent jamais

Recalculer un seuil parce qu'une constante a bougé : oui. Retourner un garde-fou
en écrivant pourquoi : oui. **Baisser une borne pour faire passer un lot :
jamais.** Auditer le compte d'assertions avant et après, et ne jamais supprimer
une assertion sans le dire.

Les seuils **se calculent, ne se devinent pas**. Cinq graines et une médiane au
minimum : une seule graine ne mesure rien.

**Un montage doit être falsifiable.** Asserter d'abord que le montage mesure
quelque chose — qu'un débit n'est pas divisible avant de tester un résidu, qu'un
bonus n'est pas nul avant de le comparer, qu'un stock sature bien dans la
fenêtre. Un test qui passerait aussi sur du code cassé ne prouve rien.

---

## 6. Pièges connus

### Sur les données

- Le classeur et la spec divergent (§1). La spec gagne, toujours.
- `CIBLAGE-DEFENSE` du classeur porte trois niveaux d'apparition divergents de
  `UNITES` : **`UNITES` fait foi**, arbitré le 24/08. Il n'existe **pas** de
  champ `defense.apparition` — l'asserter par `hasOwnProperty`, jamais par
  `!== undefined` sur une valeur calculée.
- La carte fait **31 × 300**, pas 9 × 300 : le « 9 » de la §10 de la spec est une
  contamination de la largeur de la grille de combat. Arbitré le 24/08.
  ⚠ **ELLE FAISAIT 30 JUSQU'AU 29/08.** Une largeur paire n'a pas de centre :
  `colonneCentre()` devait trancher entre 15 et 16, et avait retenu 16. À 31,
  16 EST le centre — la fonction rend le même nombre, le départ du joueur
  (275, 16 à l'époque) et la base terminale ne bougent pas d'une case. 29 aurait mis le
  centre en 15, donc déplacé tout ce qui était déjà arbitré.
- Le glossaire des modules ne dit pas qui les porte. Les affectations sont dans
  `UNITES[x].module` / `moduleOuvrage`, pas dans la colonne de description.
- **La base du joueur n'a pas de géométrie propre.** Elle EST la bande
  `batiments` de `GRILLE` (`data/combat.js`) : rangées 11–18 × 9 colonnes,
  72 cases. Arbitré le 26/08 — base du joueur, base de l'Ouvrage, camp et
  avant-poste ont la même géométrie. `GEOMETRIE_BASE` de `base.js` la
  RÉFÉRENCE ; en écrire une seconde, même identique, casserait la propagation.
  Corollaire : le plafond d'emplacements du Chantier (40) mord toujours, il
  reste 32 cases qu'aucun niveau n'ouvrira.
- **`sim/state.js` tourne sur `economie-base`** depuis le 26/08.
  `SAVE_VERSION` vaut **7** depuis le lot GARNISON-ET-ARMÉE. L'état porte
  `position` (où la base est sur la
  carte AUJOURD'HUI), `fondation` (où elle a été POSÉE), `disposition`
  (bâtiments placés à la case) et `economie` (trois ressources).
  ⚠ **LE TERRAIN EST GELÉ À LA FONDATION.** Arbitré par Ethan le 27/08 : « une
  fois qu'il a posé sa base, les champs de quartz et de scorie ne changent plus
  jamais, sinon ça casserait les collecteurs et le schéma ». Un redéploiement
  change donc la position, mais pas les douze cases : le joueur ne perd jamais
  la disposition de ses collecteurs en se repliant.
  ⚠ **`position` et `fondation` ne se confondent JAMAIS.** `position` sert la
  carte et le niveau, `fondation` ne sert QUE le terrain. Elles coïncident à la
  création et à ce seul instant, et ce sont **deux objets distincts** : partager
  la référence marcherait jusqu'au premier redéploiement, puis déplacerait le
  terrain en silence. Un test l'asserte par identité, pas par valeur.
  ⚠ **La migration 4 → 5 NE PERD RIEN** — la première dans ce cas depuis la
  v2. Sous la v4 le terrain se déduisait de `position` ; écrire
  `fondation = position` rend donc exactement le terrain que la sauvegarde
  avait.
  ⚠ **`sim/economy.js` ET `src/data/params.js` N'EXISTENT PLUS** — retirés le
  27/08 (lot ORPHELIN) avec `test/economy.test.js`. Le moteur du lot 1 est
  entièrement remplacé par `sim/economie-base.js` + `sim/disposition.js` +
  `data/base.js` + `data/economie.js`. Toute mention de l'un ou de l'autre
  ailleurs dans ce fichier, dans le code ou dans un rapport est de l'HISTOIRE :
  elle se lit au passé, et rien ne doit être recréé sous ces noms.
  ⚠ **La passation du 26/08 annonçait quatre champs morts** — `params.batiments`,
  `params.stockage`, `params.courbes`, `params.adjacence`. Mesuré au retrait :
  ils étaient **huit sur huit**, plus l'export `RHO`. Personne n'importait plus
  `data/params.js`. Une liste de morts se recompte avant d'être crue.
  ⚠ **LE TERRAIN N'EST PAS SAUVEGARDÉ.** `serialiser` l'omet, `charger` le
  redéduit de `fondation`.
  ⚠ **`instantSauvegardeMs` FAIT LE CHEMIN INVERSE** — v6, 27/08. Le terrain vit
  dans l'état et sort de la sauvegarde ; l'instant mural vit dans la sauvegarde
  et n'entre **jamais** dans l'état. Une fois la partie chargée il ne veut plus
  rien dire, et le garder en mémoire inviterait quelqu'un à s'en servir comme
  d'une horloge.
  ⚠ **`serialiser(etat, instantMs)` ET `charger(json, instantMs)` PRENNENT
  L'INSTANT EN ARGUMENT**, obligatoire. Aucun fichier de `src/` n'a le droit
  d'appeler l'horloge système — `banc.test.js` §11 balaie `Date.now` sur tout
  `src/` **et** sur `index.src.html`. Le temps mural entre par la couche qui
  touche au DOM, et par elle seule. C'est la même discipline qu'`accumuler()`
  de `sim/clock.js`, qui reçoit une durée au lieu d'aller la chercher.
  ⚠ **`charger` RATTRAPE, il ne fait pas que restaurer.** Un état chargé mais
  pas rattrapé afficherait les stocks d'hier soir. Le seul moment où l'on
  connaît à la fois la sauvegarde et l'instant présent, c'est celui-là.
  ⚠ **UNE HORLOGE QUI RECULE NE FAIT RIEN, ELLE NE LÈVE PAS.** Fuseau, NTP,
  joueur qui change la date : la durée peut être négative, elle est ramenée à
  zéro. Refuser la sauvegarde punirait le joueur pour l'heure de son téléphone.
  ⚠ **DIX ANS D'ABSENCE SATURENT SANS DÉBORDER**, mesuré et non supposé :
  3,15 milliards de ticks, stock exactement égal à la capacité, aucune levée.
  Un mois et dix ans donnent le même stock — c'est la définition de saturé.
  ⚠ **La migration 5 → 6 NE DONNE AUCUNE ABSENCE.** Une sauvegarde v5 ne dit pas
  quand elle a été écrite ; lui inventer une durée fabriquerait des ressources.
  `instantSauvegardeMs` y vaut `null`, et `charger` réancre sur maintenant. Le recalculer par tick coûterait 71,6 µs — plus du
  double du tick économique ; le sauvegarder créerait une SECONDE source de
  vérité, donc une occasion de divergence muette. Un seul endroit peut mentir,
  et c'est celui qui est écrit.
  ⚠ **La migration 3 → 4 REFONDE, elle ne convertit pas.** Aucune
  correspondance entre une `foreuse` sans coordonnée et un collecteur qui doit
  se poser sur un champ. Ce qui survit : la graine, le tirage, l'horloge — le
  TEMPS de la partie, pas son contenu. Légitime uniquement parce qu'aucune
  sauvegarde n'existait (26/08) ; le jour où il y en aura, il faudra prévenir
  le joueur AVANT.
  ⚠ **`verifierEtat` LÈVE là où `problemesDeDisposition` rend une liste.** En
  cours de partie, une disposition illégale est un fait de JEU (on la montre,
  le joueur purge) ; au CHARGEMENT, c'est un fait de programme.
- **Le coût du tick monte vite avec la taille de la base** — 2,0 µs à un
  bâtiment, 21 à neuf, 108 à vingt, **280,7 à quarante**. Une base pleine coûte
  neuf fois le chiffre longtemps cité, qui n'avait été mesuré qu'en un point.
  2,8 ms par seconde de jeu reste acceptable, mais la croissance est
  superlinéaire.
  ⚠ **Conséquence sur les TESTS, pas seulement sur le jeu.** Simuler 72 h tick
  par tick fait 2,6 millions de ticks : la suite est passée de 13 à 74 secondes
  à la bascule. Les horizons de boucle ont été rabotés à 2 h, et les longues
  absences se testent par COMPOSITION — rattraper deux fois vaut rattraper une
  fois — qui est en temps constant et va jusqu'à un mois. Suite ramenée à 20 s.
  **Une suite qu'on hésite à lancer cesse d'être lancée.**
  ⚠ **UN STOCK AU-DESSUS DU PLAFOND EST GELÉ, JAMAIS AMPUTÉ.** Arbitré le 26/08.
  Perdre une raffinerie ne prend rien au joueur : le stock cesse de monter, il
  ne tombe pas. Le plafond effectif d'un tick est `max(cap, stock)`, pas `cap`.
  C'est « rien ne se retire en silence » appliqué au stock.
  ⚠ **Le résidu est par (bâtiment, RESSOURCE), pas par bâtiment.** Une
  raffinerie produit dans deux ressources à la fois ; un résidu unique les
  mélangerait et les deux flux dériveraient sans que le total bouge.
  ⚠ **La marge d'exactitude est de 5,47, pas de 19.** Le 19 avait été mesuré sur
  le collecteur de niveau 50 SEUL, avant que le voisinage n'entre au modèle. Le
  pire cas réel est un collecteur niveau 50 entouré de huit raffineries :
  45 738 385 u/h.
- ⚠⚠ **LE BLOCAGE DU DÉMARRAGE EST LEVÉ — PAR L'AMORCE, ET LA CHAÎNE EST
  MESURÉE (28/08).** Ce paragraphe annonçait « la partie est instartable » et
  « capacité 0 » ; les deux sont **périmés**, et les garder aurait fait rouvrir
  un arbitrage déjà rendu. Ce qui les a périmés : le lot AMORCE (30 quartz,
  30 scorie, 20 électricité à la fondation) et la poche du Chantier
  (`stockagePropre`, 50 · 50 · 40 au niveau 1). La chaîne, simulée et non déduite :

  | Geste | Stocks | Capacités | Emplac. |
  |---|---|---|---|
  | base neuve | 30 / 30 / 20 | 50 / 50 / 40 | 1 / **3** |
  | Chantier → niv. 2 (**8 quartz**) | 22 / 30 / 20 | 63 / 63 / 50 | 1 / **6** |
  | + Collecteur sur un champ | 22 / 30 / 20 | 63 / 63 / 50 | 2 / 6 |
  | + Raffinerie voisine | 22 / 30 / 20 | **83** / 83 / 50 | 3 / 6 |
  | après 1 h | **83** (saturé) / 30 / 20 | 83 / 83 / 50 | 3 / 6 |

  ⚠ **LA COLONNE DES EMPLACEMENTS A ÉTÉ REMESURÉE LE 29/08** — la table dictée
  par Ethan ouvre 3 puis 6 emplacements là où l'ancienne courbe en ouvrait 2 puis
  4. Les stocks et les capacités, eux, n'ont pas bougé d'une unité : c'est la
  MÊME chaîne, avec deux bâtiments de marge en plus.
  ⚠⚠ **ET LE PREMIER GESTE N'EST PLUS SEULEMENT LE MEILLEUR, IL EST LE SEUL.**
  Le Chantier plafonne désormais le niveau de toute la base : tant qu'il est au
  niveau 1, aucun autre bâtiment ne monte. Monter le Chantier était déjà la
  première ligne de ce tableau ; c'est maintenant la seule montée payable d'une
  partie neuve, et un test de `state.test.js` le vérifie au lieu de le supposer.

  ⚠ **CE TABLEAU A ÉTÉ REMESURÉ LE 28/08 APRÈS LA NOUVELLE COURBE DE STOCKAGE,
  ET IL EST BEAUCOUP PLUS SERRÉ QU'AVANT.** La raffinerie de niveau 1 apportait
  2 880 de capacité ; elle en apporte **20**. L'ouverture ne se joue donc plus
  en posant une raffinerie mais en la MONTANT — ses premiers paliers coûtent 2,
  3 puis 4 quartz et doublent la capacité à chaque fois, ce qui reste payable
  sous un plafond de 83. La boucle est vérifiée, pas supposée.
  ⚠ **ET CETTE FENÊTRE SERRÉE EST VOULUE.** La mesure a été soumise à Ethan le
  28/08 ; réponse : « c'est voulu ». Ce n'est donc pas un défaut d'équilibrage à
  corriger au prochain lot — c'est le démarrage du jeu.

  ⚠ **MAIS LE PLAFOND MORD AVANT LA PREMIÈRE RAFFINERIE, ET C'EST CE QUI A ÉTÉ
  RAPPORTÉ COMME UN BOGUE.** Un Collecteur posé seul produit 240/h contre une
  capacité de 50 : le stock touche le plafond en **cinq minutes**, puis ne bouge
  plus jamais. Ethan a rapporté le 28/08 « aucun bâtiment ne produit de
  ressources » et « pas de calcul hors ligne » — c'est le même plafond, vu deux
  fois, et le moteur avait raison dans les deux cas. Mesuré sur le HTML livré :
  huit heures d'absence rendent exactement zéro quand le stock est saturé, ce
  qui est la définition de saturé.
  ⚠ **LE REMÈDE EST DE L'INTERFACE, PAS DU MOTEUR** — lot PANNEAU-ET-MARGES :
  la capacité saturée porte maintenant le mot « saturé », et le panneau de
  détail du Chantier annonce « emplacements 2 → 4, coût 8 quartz », ce qui rend
  la sortie visible. Ne pas « corriger » le moteur : il n'a rien de faux.

- **TOUTE base neuve du joueur est un Chantier de construction niveau 1, en
  (18, 5)** — pas seulement la première. Arbitré le 26/08 : « toutes les bases
  que le joueur pose suivront la même logique ». `BASE_NEUVE` de `data/base.js`,
  `dispositionNouvelleBase()` de `sim/disposition.js`, qui rend une COPIE.
  ⚠ **Ne pas dire « base initiale ».** Le nom ferait croire à un cas particulier
  du démarrage, et quelqu'un écrirait une seconde fonction pour les bases
  suivantes. La première base n'est que la première application de la règle.
  ⚠ **Un seul bâtiment suffit parce que le niveau 1 ne coûte rien**
  (`ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2). Le Chantier ouvre deux
  emplacements et en prend un : il en reste exactement UN, le premier vrai
  choix. Le tutoriel guide à partir de là.
  ⚠ **« EN HAUT » EST AMBIGU, NE PAS L'EMPLOYER.** Selon qu'on regarde l'écran
  ou les numéros de rangée, il désigne l'un ou l'autre bout de la bande — et la
  confusion a coûté un lot le 26/08. La rangée 18 est le **FOND** : l'assaillant
  part des rangées 1–2 et monte en numéro, donc la 18 est la dernière qu'il
  atteint. C'est cohérent avec le Chantier, seul bâtiment sans plancher de PV et
  dont la perte force le redéploiement. La fonction s'appelle `caseDuChantier`,
  jamais `caseHaute` ni `caseBasse`.
  ⚠ **Cette case ne porte JAMAIS de champ**, quelle que soit la graine : les
  champs se tiennent entre les rangées 12 et 17. La fondation est légale partout
  **par construction** — ce qui compte d'autant plus que la règle vaut pour des
  positions inconnues à l'avance. Un test le vérifie sur 65 terrains tirés.
- **`sim/carte.js` traduit les DISTANCES de `GEOGRAPHIE` en COORDONNÉES**, et
  c'est le seul endroit qui a le droit de le faire. Deux conventions y vivent :
  **rangée 1 = bord HAUT**, `hauteur` = bord bas (même sens que la grille de
  combat) ; et le **centre d'une largeur paire est 16 sur 30**, employé par les
  deux bouts du couloir.
  ⚠ **Le décalage de rangée n'a pas été choisi, il a été DÉDUIT.**
  `departJoueur` porte deux faits liés — `strate: 5` et `casesDepuisBordBas: 25`
  — et un seul décalage les rend vrais tous les deux. Un test asserte qu'aucune
  rangée voisine n'y arrive.
  ⚠ **Le joueur ne démarre PAS au bord bas**, malgré la formule « tout en bas ».
  Le bord vaudrait le niveau 0. Il démarre **rangée 295, colonne 16**, cinq cases
  plus haut, dans une **strate 1**. La base terminale est rangée 15, colonne 16,
  strate 50.
  ⚠⚠ **LES DEUX ONT BOUGÉ LE 31/08, ET C'EST UN ARBITRAGE D'ETHAN** — « décaler
  la base du joueur de 25 cases vers le bas et base terminale 25 cases vers le
  haut », lu, après confrontation des deux conventions de rangée, « comptés
  depuis mon bord : 295 et 15 ». Le départ était rangée 275 (strate 5), la
  terminale rangée 26. Les deux bouts du couloir sont maintenant contre leurs
  bords, et le couloir fait 280 cases au lieu de 249.
  ⚠ **LA STRATE N'A PAS ÉTÉ CHOISIE, ELLE SUIT** : `round(5 × 0,2)` plafonné à 1.
  Écrire 5 dans `GEOGRAPHIE` ferait mentir la table sur ce que le joueur trouve
  autour de lui — les avant-postes du début sont désormais de niveau 1, les camps
  restent indexés sur le niveau du joueur.
  ⚠ **ET LA TERMINALE NE PEUT PAS MONTER PLUS HAUT QUE LA RANGÉE 2** : son
  hexagone couvre 3 × 3 cases et `empriseDeLaGrosseBase` LÈVE quand le carré
  déborde la carte — une levée dans la boucle de dessin viderait tout l'écran
  Monde. La rangée 15 tient largement.
  ⚠ **CINQ TESTS ONT EU RAISON DE TOMBER, ET AUCUN NE MESURAIT UNE POSITION.**
  Trois portaient `champsDeLaBase(275, 16)` en dur — ils voulaient le terrain de
  DÉPART, servi par `TERRAIN_INITIAL`, et ils le DEMANDENT maintenant. Un
  quatrième cherchait un avant-poste à une case écrite à la main. Le cinquième
  envoyait six Meutes sur un camp dont la létalité tenait au dessin de la case.
  Un montage qui écrit une coordonnée ne garde que lui-même.
  ⚠ **« STRATE 5 » N'EST PAS « BASE DE NIVEAU 5 ».** C'est le niveau des sites
  de l'OUVRAGE à cet endroit de la carte — ce que le joueur y trouvera à
  attaquer. Sa propre base n'a aucun niveau qui vienne de la carte. Écrire
  « le joueur démarre au niveau 5 » est faux, et la formule a traîné dans ce
  fichier jusqu'au 27/08.
- **LA BASE DU JOUEUR PORTE TROIS NIVEAUX, ET CE SONT DES MOYENNES.** Arbitré
  par Ethan le 27/08 : « les niveaux, ça concerne uniquement l'Ouvrage. Les
  niveaux du joueur, par base, il en a trois : le niveau de ses bâtiments, le
  niveau de sa défense et le niveau de son armée offensive. À chaque fois c'est
  une moyenne. »
  ⚠ **Aucun des trois ne dépend de la position sur la carte.** Ils se
  recalculent depuis ce que le joueur a posé, et rien d'autre. Un redéploiement
  ne les change pas.
  ⚠ **La même règle vaut déjà côté Ouvrage** : `GEOGRAPHIE.niveauBase` de
  `data/sites.js` dit « moyenne des niveaux de ses bâtiments » depuis le début.
  Ce qui est neuf le 27/08, c'est qu'elle vaut aussi pour le joueur, et qu'il y
  en a TROIS au lieu d'une.
  ⚠ **UNE DÉCIMALE, ET SEULEMENT CE QUI EST POSÉ.** Arbitré le 27/08 : la
  moyenne se donne à une décimale (5,8) et porte sur les bâtiments POSÉS. Un
  emplacement vide ne compte pas pour zéro, il ne compte pas du tout ; le
  Chantier de construction compte comme les autres.
  ⚠ **RANGÉE EN DIXIÈMES ENTIERS** — `5,8` se range `58`, jamais en flottant.
  Même discipline que les milli-unités de l'économie : une décimale en flottant
  s'additionne mal et se sérialise en `5.799999999999999`. L'arrondi se fait à
  la demie supérieure, `(somme × 20 + n) / 2n` tronqué, sans jamais quitter les
  entiers. `sim/niveau-de-base.js`, et lui seul.
  ⚠ **L'affichage divise par dix et montre TOUJOURS la décimale** — « 6,0 »,
  jamais « 6 ». C'est de l'interface, ça ne descend pas dans `sim/`.
  ⚠ **DEUX DES TROIS NE SONT PAS ÉCRITS**, et c'est délibéré. `sim/state.js` ne
  porte que les bâtiments ; la garnison et l'armée d'assaut du joueur se
  composent dans `ui/defense.js` et `ui/arsenal.js`, qui sont des ÉDITEURS —
  rien de ce qu'ils produisent n'est sauvegardé. Les écrire aujourd'hui
  reviendrait à choisir seul la forme de cet état. Ils appelleront
  `moyenneEnDixiemes`, jamais une seconde moyenne à eux.
- **Livraison : `src/` et `test/` ne voyagent JAMAIS dans la même archive.**
  Le dépôt se met à jour depuis un téléphone et le sélecteur n'affiche que les
  noms courts : `disposition.js` et `disposition.test.js` s'y confondent. Deux
  dépôts de suite sont tombés à côté avant que la règle soit posée. Archive 1 = tout ce
  qui va dans `src/`, archive 2 = `test/` + racine. `main` est ROUGE entre les
  deux, et c'est le garde-fou qui le dit — c'est voulu.
  ⚠ **ET UNE ARCHIVE NE PROPOSE JAMAIS DEUX DOSSIERS DE DESTINATION QUAND UN
  NOM COURT EST AMBIGU ENTRE EUX.** Le 27/08, une archive portait `src/data/`
  et `src/sim/` : la paire de `src/data/` est partie deux fois, une fois au bon
  endroit et une fois dans `src/sim/`. `src/sim/base.js` est apparu, et
  **`src/sim/combat.js` — le moteur de combat, 1 450 lignes — a été remplacé
  par la table de données du même nom court.** Une archive plate, une seule
  destination, aucun choix à faire : c'est ce qui a réparé.
- **DEUX FICHIERS SANS RAPPORT PORTENT LE MÊME NOM COURT** : `combat.js` est à
  la fois une table de `src/data/` et le moteur de `src/sim/`. C'est légitime —
  les dossiers disent le rôle — mais ça rend tout dépôt manuel dangereux, et
  le sélecteur d'un téléphone n'affiche que le nom court.
  ⚠ **Le COMPTE de §2 n'a rien vu de l'écrasement** : `src/sim/` avait toujours
  ses onze fichiers, un module de moins et un intrus de plus. Seul le BUILD est
  tombé, et il ne tourne pas sur le téléphone. D'où le garde-fou des NOMS de
  `src/` (lot HOMONYMES, 27/08) : `documentation.test.js` asserte désormais la
  liste nominale de `src/data/`, `src/sim/`, `src/render/` et `src/ui/` contre
  le disque, comme il le faisait déjà pour `test/`.
  ⚠ **Conséquence sur la prose de §2** : les lignes de description d'un bloc de
  `src/` ne doivent nommer aucun fichier en `.js`, elles seraient lues comme des
  déclarations.
- **Un état ne se construit pas qu'avec le constructeur du module.** Les douze
  premiers tests d'`economie-base` partaient tous de `creerEtatEconomie`, donc de
  zéro — et depuis zéro un stock ne peut jamais dépasser sa capacité, ce qui
  était EXACTEMENT le seul état où tick et rattrapage divergeaient. 197
  divergences sur 300 bases, invisibles à douze tests verts. Les états HÉRITÉS
  (sauvegarde d'avant, base amputée par un raid) se posent à la main.
- **`sim/disposition.js` compte les voisins et calcule les débits**, et il ne
  fait QUE ça : il ne pose rien, ne retire rien, ne corrige rien.
  `problemesDeDisposition` rend une LISTE de défauts — tous, pas le premier — et
  ne lève JAMAIS pour une faute de jeu. Elle ne lève que pour une faute de
  programme (structure absente, indice hors liste). C'est « rien ne se retire en
  silence » (§4) appliqué : on signale au joueur, il purge.
  ⚠ **DEUX BÂTIMENTS UNIQUES NE PEUVENT PAS ÊTRE VOISINS** — arbitré le 28/08.
  Sept des onze le sont, donc la règle force la base à s'étaler : c'est elle qui
  lui donne sa géométrie. « À côté » est le voisinage de `casesVoisines`, les
  huit cases — **jamais une seconde notion de voisinage** : le bonus de
  proximité et cette interdiction doivent parler du même 3 × 3, sinon le joueur
  apprendrait deux géométries pour le même mot.
  ⚠⚠ **ELLE EST TOLÉRÉE AU CHARGEMENT, ET C'EST OBLIGATOIRE.** La règle est née
  APRÈS des sauvegardes qui la violent : la base d'Ethan, mesurée sur sa capture
  du 28/08, porte le Centre de commandement, le QG de défense et le Chantier
  côte à côte. Faire lever `verifierEtat` là-dessus aurait rendu sa partie
  **injouable**, pour une faute qu'il n'a pas commise. D'où
  `CODES_TOLERES_AU_CHARGEMENT` dans `sim/state.js`.
  ⚠ **TOLÉRÉ N'EST PAS EFFACÉ.** Le défaut reste signalé, l'écran le montre, et
  il interdit toujours toute NOUVELLE pose au contact d'un unique — car
  `problemesDeLaPose` ne filtre que les défauts PRÉEXISTANTS. Le joueur voit, le
  joueur purge.
  ⚠ **N'Y METTRE QU'UNE RÈGLE NÉE APRÈS DES SAUVEGARDES.** Un code structurel —
  `sans-chantier`, `superposition`, `hors-base` — n'a jamais été légal, donc
  aucune sauvegarde honnête ne le porte, et le tolérer ferait tourner le moteur
  sur un état incohérent. Un test l'asserte de face.
  ⚠ **Aucun plafond de voisins autre que la géométrie.** Le lot 1 plafonnait à
  deux voisins (dans l'ancien `data/params.js`, retiré le 27/08) ; ce modèle-ci
  compte les huit cases. Confondre les deux divise la production par quatre.
  ⚠ **L'arrondi se fait PAR TYPE de voisin, puis se multiplie.** Arrondir la
  somme donne 281 là où le jeu dit 282 (centrale niveau 3, trois champs) — un
  écart d'une unité qui se creuse ensuite, et un test le mesure exprès.
  ⚠ **`productionParRessource` est le point d'entrée, pas `ressourceProduite`.**
  Cette dernière rend `null` dans DEUX situations sans rapport — « mal posé » et
  « plusieurs ressources à la fois ».
  ⚠ **« La ressource du voisin » NE SE GÉNÉRALISE PAS**, et c'est le piège de
  tout ce modèle. Une centrale qui touche trois champs de scorie produit de
  l'ÉLECTRICITÉ, pas de la scorie. Le discriminant est `BASE_BATIMENTS[x].ressource` :
  `quartzOuScorie` et `electricite` ont une ressource propre et tout y va, bonus
  compris ; seule la raffinerie (`quartzEtScorie`) n'en a pas, et alors chaque
  voisin apporte la sienne. Arbitré le 26/08 — une raffinerie niveau 1 entourée
  de 2 collecteurs à quartz et 3 à scorie produit **144/h de quartz et 216/h de
  scorie**, jamais 360 d'un mélange.
  ⚠ **`indetermine` est un signal, pas une valeur.** Ce qui n'a pas pu être
  attribué — l'apport d'un collecteur posé hors champ — y tombe plutôt que
  d'être versé au hasard. Sur une disposition valide il n'apparaît jamais.
  ⚠ **Une disposition se décrit comme un site de l'Ouvrage** :
  `{ id, rangee, colonne, niveau }`, un bâtiment par case. C'est déjà la forme
  que produit `placerBatiments` du générateur — même géométrie, même écriture.
- **Le tirage des champs vit dans `sim/champs.js`.** `champsDeLaBase(rangée,
  colonne)` rend le terrain, fonction de la SEULE position. Deux règles y sont
  DÉDUITES et non dictées, et il faut le savoir avant de les changer : deux
  blocs de même ressource ne se touchent jamais par un côté (sinon deux blocs de
  deux se lisent comme un bloc de quatre), et le contact en diagonale reste
  permis. Les blocs se recomptent depuis les cases par composantes connexes —
  ne jamais vérifier une taille de bloc en relisant ce que le tirage croit avoir
  posé, il serait juge de sa propre partie.
- **Le champ décide de la ressource du collecteur** qui s'y pose — arbitré le
  26/08. C'est pourquoi `BASE_BATIMENTS.collecteur.ressource` vaut
  `quartzOuScorie` : la réponse n'est pas dans la ligne du bâtiment, elle est
  sous lui. **Et c'est tout ce que le terrain lui donne** : arbitré le 26/08,
  le Collecteur ne touche AUCUN bonus par champ voisin. **Asymétrie voulue**,
  pas trou : la production suit ×1,25 quand les coûts suivent ×1,32, et c'est ce
  décrochage qui pousse vers le raid — un multiplicateur de terrain sur le
  Collecteur amplifierait le canal qu'on a laissé décrocher exprès.
  ⚠ `champDeScorie: 60` sur la Centrale est donc **LE SEUL bonus de terrain de
  toute la table**, et un test l'asserte de face. Un autre asserte la forme
  EXACTE de chaque `parVoisin` : les égalités de valeurs laissaient passer un
  AJOUT de clé, et c'est par là qu'un bonus de terrain serait entré sans qu'on
  revoie la décision.
- **`DEBITS` est complète : SEPT valeurs**, pas six. 120 · 60 · 72 · 48 · 240 ·
  72 · 72, comptées par exécution. Le compte se vérifie, il ne se fait pas de
  tête — je l'ai annoncé à six le 26/08, et c'était faux.
- **`quartzOuScorie` est EXCLUSIF, `quartzEtScorie` est INCLUSIF.** Le
  collecteur produit l'un ou l'autre — le champ sous lui tranche. La raffinerie
  tient les deux à la fois, et `capaciteDuNiveau` vaut **par ressource** : une
  raffinerie qui rend 2 880 tient 2 880 de quartz ET 2 880 de scorie. La prendre
  pour un total divise le stockage par deux. `capaciteParRessource` dit qui est
  concerné, et seule la raffinerie porte la clé.
- **La raffinerie n'a PAS de pendant Ouvrage**, et c'est arbitré, pas oublié.
  Côté Ouvrage le stockage est DEUX bâtiments — Gangue (quartz) et Terril
  (scorie) — parce que c'est du butin ; côté joueur c'est UN qui tient les deux.
  Un vers deux : aucun nom ne convient. Trois appariements seulement : Souche,
  Étai, Nœud.
  ⚠ **Le champ `ta` n'a pas le même sens dans les deux fichiers.** Dans
  `data/base.js` c'est le nom Tiberium Alliances anglais (« Harvester ») ; dans
  `data/sites.js` c'est le nom FRANÇAIS du pendant joueur (« Collecteur »), le
  nom TA étant en commentaire de fin de ligne. Un test croise les deux tables
  dans les deux sens — c'est ce renvoi qui a révélé l'appariement de trop.
- **Les champs de ressource sont le socle des collecteurs, pas un voisinage.**
  Douze cases par base, réparties 5/7, 6/6 ou 7/5 entre quartz et scorie, en
  blocs de 1, 2 ou 3 cases contiguës (triplets droits ou coudés), tirées
  déterministement depuis la POSITION sur la carte. Jamais sur le pourtour :
  l'intérieur d'un 8 × 9 fait **6 × 7 = 42 cases**, rangées 12–17, colonnes 2–8
  (et non 7 × 5, qui serait l'intérieur d'un 9 × 7). Seul le collecteur s'y
  pose, donc **douze collecteurs au maximum**.
- **Les colis n'existent plus.** Abandonnés le 25/08, reconfirmés le 26 (« tous
  les bâtiments font de la production continue »), et RETIRÉS le 26/08 :
  le champ `colis` de `params.js`, `intervalleColisTicks`, les deux blocs de
  `economy.js`, le champ `colis` de `creerBatiment` et le test 9. **`SAVE_VERSION`
  est passée à 3.** Les deux fichiers cités ont eux-mêmes disparu le 27/08.
  ⚠ **La migration 2 → 3 SUPPRIME un champ**, ce qu'aucune autre ne faisait —
  les deux précédentes en ajoutaient. C'était le choix délibéré : une sauvegarde
  qui porte `colis` alors que plus une ligne ne le lit fait croire, six mois plus
  tard, qu'il sert encore. Ce qui est retiré est un compteur mort, pas une
  ressource du joueur.
  ⚠ `BASE-DU-JOUEUR-1.md` §3 affirme encore l'inverse. Il est du 24/08 et de
  rang 4.
- **Le bâtiment des blindés s'appelle « Dépôt de véhicules »**, clé
  `depotDeVehicules`. Trois noms avaient coexisté dans le dépôt — `usine` (la
  clé), « dépôt de véhicules » (le commentaire de `COUT_NIVEAU_DEUX`, qui avait
  raison) et « atelier » (`MODELE-REPARATION-1.md` §3). Arbitré le 26/08 et
  corrigé partout où c'était un NOM DE BÂTIMENT. Il reste cinq occurrences du
  mot, toutes légitimes et vérifiées : quatre qui racontent la correction
  elle-même (`base.js`, `MODELE-REPARATION-1.md` §6.3, `test/base.test.js`, ici)
  et une où « atelier » est un nom commun d'exemple, sans rapport
  (`MODELE-ECONOMIQUE.md` l. 184, « un atelier un silo »).
- **Deux courbes, à ne jamais confondre.** `NIVEAU` (`niveaux.js`) est la courbe
  du COMBAT — pente unique 1,1 depuis le 25/08. `BUTIN` et `ECONOMIE_NIVEAU`
  portent la courbe ÉCONOMIQUE — deux régimes, 1,259 puis 1,32. `facteurMilli`
  sert la première, `facteurEconomiqueMilli` la seconde. Un test asserte que la
  divergence est bien celle qu'on a voulue, et il tombera si on les réaligne.

- ⚠⚠ **L'ÉTAT PORTE DEUX FORCES DEPUIS LE 28/08 : `garnison` ET `armee`.**
  C'est ce qui débloquait d'un coup l'écran Offense, la bande Défense, les deux
  compteurs du bandeau et le filtrage des palettes. Deux LISTES CREUSES, à la
  même forme que `disposition` — un objet par pièce posée, rien pour une case
  vide : `{ id, rangee|vague, colonne, niveau, degatsMilli }`.
  ⚠ **`degatsMilli` ET NON `pvMilli`.** Une pièce intacte se sérialise à `0`, et
  surtout : le jour où un PV de `data/combat.js` change, une valeur ABSOLUE
  enregistrée peut dépasser le maximum et rendre la sauvegarde incohérente en
  silence. Des dégâts se BORNENT à la lecture. Milli-PV parce que c'est l'unité
  du moteur de combat.
  ⚠ **UNE PIÈCE DÉTRUITE RESTE DANS SA CASE.** Arbitré par Ethan le 28/08 :
  « les unités sont détruites mais pas perdues, doivent être réparées ». Elle
  compte encore dans la moyenne de niveau ET dans les points engagés — la
  décompter ferait de la destruction une façon de poser plus d'unités.
  ⚠ **AUCUN TABLEAU PARALLÈLE.** Niveau et dégâts vivent DANS la pièce. C'est
  exprès : le couplage `economie.residus` ↔ `disposition` est ce qui rend
  `deplacer` délicat, et on ne l'a pas recréé.
  ⚠ **LE NIVEAU EST PAR PIÈCE, MAIS RIEN NE PERMET D'EN POSER DEUX DIFFÉRENTS.**
  Les éditeurs portent UN niveau pour toute la grille et le recopient. Le ranger
  par pièce coûte zéro et évite une SECONDE migration le jour où la mécanique
  sera arbitrée. Comment se choisit le niveau d'une pièce posée n'est PAS tranché.
  ⚠⚠ **`verifierEtat` NE VÉRIFIE NI LE BUDGET NI L'APPARITION, ET C'EST VOULU.**
  Une composition trop chère arrive pour de bon dès que le budget BAISSE — QG
  démoli, QG tombé au raid — sous une armée déjà posée. La refuser au chargement
  rendrait la partie injouable pour une faute que le joueur n'a pas commise,
  exactement comme l'aurait fait `uniques-voisins`. On SIGNALE, le joueur purge.
  ⚠⚠ **`purger` NE S'APPLIQUE JAMAIS TOUTE SEULE** — décidé à ce lot, et c'est
  « rien ne se retire en silence » (§4) appliqué. Un test balaie `src/ui/` pour
  qu'aucun écran ne l'appelle de lui-même. L'écran Offense affiche le
  dépassement en toutes lettres, et dit que rien n'est retiré tout seul.
  ⚠ **La migration 6 → 7 N'AJOUTE QUE DEUX LISTES VIDES.** Une sauvegarde v6 ne
  porte aucune composition : il n'y a rien à convertir. C'est la migration la
  plus sûre de la chaîne.

- **`niveauDeCommandement` EST LE SEUL ENDROIT QUI LISE LE NIVEAU D'UN BUDGET.**
  `POINTS_ARMEE` de `data/sites.js` nomme déjà le bâtiment de chaque côté —
  Centre de commandement pour l'offense, QG de défense pour la défense — et le
  budget comme le filtrage des palettes en découlent tous les deux.
  ⚠ **IL REND `null`, PAS ZÉRO.** Les deux bâtiments sont `unique: true` et
  aucun n'est dans la base neuve : tant qu'ils ne sont pas posés, il n'y a pas
  de budget du tout, ce qui n'est pas un budget nul. « 0 / 0 » ferait croire à
  un plafond atteint là où il n'y en a aucun.
  ⚠ **« PAS DE BÂTIMENT, PAS DE BUDGET » N'EST PAS ARBITRÉ.** C'est le défaut
  retenu, cohérent avec une base neuve qui ne porte qu'un Chantier. Il tient en
  une ligne chez l'appelant, exprès : si Ethan tranche autrement, il n'y a qu'un
  endroit à changer.

- ⚠⚠ **LES COÛTS DE CONSTRUCTION DE LA DÉFENSE ET DE L'OFFENSE SONT ARBITRÉS
  (28/08), et ils vivent dans `data/couts-militaires.js`.** Le niveau 1 est
  gratuit des deux côtés — c'est `premierNiveauPayant`, pas une seconde
  constante — et l'ancre du niveau 2 est donnée entité par entité. Au-delà, la
  courbe est celle d'`ECONOMIE_NIVEAU`, la même que pour les bâtiments.
  ⚠⚠ **LA MÊME UNITÉ NE COÛTE PAS LE MÊME PRIX EN DÉFENSE ET EN OFFENSE.**
  Mesuré : cinq unités sur huit changent de prix selon le rôle (le Voltigeur
  vaut 5 en assaut et 2 en garnison), trois coïncident. Il y a donc DEUX tables
  d'ancres, jamais une seule indexée par unité — une table unique aurait paru
  marcher sur trois cas et faussé les cinq autres en silence.
  ⚠⚠ **LA DÉFENSE SE PAIE DANS DEUX RESSOURCES.** Les six ouvrages fixes — mur,
  barbelés, barrière anti-char, tourelle mitrailleuse, canon anti-char, DCA — en
  QUARTZ ; les trois artilleries et les huit unités de garnison en SCORIE. La
  ressource est écrite LIGNE PAR LIGNE : aucune règle ne la résume sans mentir
  sur au moins une entité. Le partage n'est pourtant pas arbitraire —
  `data/combat.js` disait déjà que les trois artilleries sont des VÉHICULES et
  non des structures — et un test asserte la corrélation sans l'exploiter.
  ⚠ **`RESSOURCE_DE_COUT` A PERDU SA CLÉ `defense`, ET L'ABSENCE EST LE
  MESSAGE.** Elle valait « scorie » depuis le 27/08, en anticipation et sans que
  rien ne la lise ; l'arbitrage la falsifie pour six entités sur dix-sept. Un
  test asserte son absence.
  ⚠ **LA RAMPE DE COÛT A QUITTÉ `data/base.js` POUR `data/economie.js`**, à côté
  de la courbe qu'elle applique. La recopier aurait fait deux implémentations du
  même arrondi palier par palier, et la première divergence se serait lue comme
  un déséquilibre de jeu. Ce qui change de famille en famille, c'est l'ANCRE.
  ⚠ **L'ÉLECTRICITÉ EST LA MÊME RÈGLE QUE POUR LES BÂTIMENTS** — le quart, à
  partir du niveau 3, par `COUT_ELECTRICITE`. C'est ce que dit
  `RELEVE-TA-COURBES-2.md` §5 : « l'électricité vaut systématiquement le quart de
  la monnaie principale ». Aucune fraction propre au militaire n'est arbitrée,
  et c'est la seule lecture de ce lot qui va au-delà du message d'Ethan.

### Sur l'économie

- **Un débit se range PAR HEURE, jamais par tick.** La règle est née dans
  `sim/economy.js` (lot RÉSIDU) et vit désormais dans `sim/economie-base.js`,
  qui l'a reprise telle quelle. Chaque bâtiment porte un résidu ; l'erreur
  d'arrondi par tick est exactement nulle, à n'importe quelle fréquence. Un
  `fluxMilliParTick` n'existe nulle part, et le recréer réintroduirait un
  arrondi qui coûtait jusqu'à 0,71 % de production.
- **Le rattrapage ne calcule JAMAIS `nbTicks × debit`.** Sur une longue absence
  ce produit atteint 4,2 × 10¹⁸, soit 471 fois au-dessus de l'entier sûr — la
  formule fermée « évidente » dérive en silence. Il décompose `nbTicks` en
  heures pleines + reste (arithmétique modulaire) et **borne les heures pleines
  à ce qu'il faut pour saturer** : au-delà le stock vaut la capacité de toute
  façon, donc le produit n'a plus à être exact, donc il n'a plus le droit d'être
  grand.
- **`DEBIT_MILLI_PAR_HEURE_MAX`** (2,502 × 10¹¹ milli/h à 10 Hz) est le seuil
  au-delà duquel l'exactitude tomberait. Le débit le plus lourd du jeu —
  collecteur niveau 50 de `data/base.js`, 13 452 465 unités/h — est **19 fois
  dessous seulement**. La marge est réelle et pas confortable : le rattrapage
  **lève** si elle est franchie, plutôt que de dériver. Une donnée future qui
  multiplierait un débit par 20 doit faire descendre la fréquence de tick, pas
  franchir le seuil.
- **Le résidu avance MÊME stockage plein.** Le geler casserait l'exactitude du
  rattrapage : la composition `min(cap, min(cap, x+a)+b) = min(cap, x+a+b)` ne
  tient que si les gains sont indépendants de l'état du stock. Un test le garde,
  avec le commentaire qui dit pourquoi.
- **Il n'y a plus de capacité de stockage GLOBALE.** Le lot 1 en avait une,
  unique, dans l'ancien `data/params.js`. Depuis la bascule la capacité est
  **par bâtiment et par ressource** : `capaciteDuNiveau()` de `data/base.js`,
  ancrée sur `STOCKAGE.autonomieHeures`, lue par `sim/economie-base.js`.
  ⚠ **Le « `base.js` n'est lu par personne » de la version précédente de cette
  ligne était périmé** : `champs.js`, `disposition.js` et `economie-base.js`
  l'importent tous les trois. Un fait d'orphelinage se remesure, il ne se
  reconduit pas.
- ⚠⚠ **LA COURBE DE STOCKAGE A CHANGÉ DE NATURE LE 28/08, ET `autonomieHeures`
  N'EXISTE PLUS.** Ethan a jugé l'ancienne « chelou » et l'a remplacée par des
  chiffres absolus : **20 pour la raffinerie, 15 pour l'accumulateur au niveau
  1, × 2 par palier jusqu'au niveau 10, puis un multiplicateur décroissant
  linéairement jusqu'à 1,333 au niveau 50**. La capacité ne se déduit donc plus
  du débit du producteur apparié : c'est la règle §4 appliquée — deux grandeurs
  qui partageaient une constante ont divergé, on les a séparées.
  ⚠ **L'AUTONOMIE N'EST PLUS CONSTANTE, ET L'ÉCART EST ÉNORME.** Mesurée face à
  un collecteur de même niveau : **cinq minutes au niveau 1, quarante et un ans
  au niveau 50**. L'ancienne courbe donnait 12 h partout. C'est délibéré, et
  c'est ce qui fait du stockage l'investissement qui structure la partie.
  ⚠⚠ **SA QUEUE A ÉTÉ ÉCRASÉE LE MÊME JOUR, ET IL FAUT SAVOIR POURQUOI.** La
  première écriture montait à × 1,333 au niveau 50 : une seule raffinerie de
  niveau 50 valait alors 53 % de l'entier sûr de JavaScript **à elle seule**, et
  deux le dépassaient. Ethan, mis devant la mesure : « fais au mieux pour les
  courbes stockage mais j'aime bien le × 2 des dix premiers. Sinon écrase les
  derniers niveaux pour que ça rentre. » Le × 2 est donc INTACT, et c'est la fin
  de la rampe qui est descendue : de 1,333 à **1,05**.
  ⚠ **LA CIBLE EST LA BASE LÉGALE LA PLUS GROSSE, PAS UNE BASE PLAUSIBLE** :
  40 emplacements au niveau 50, moins le Chantier, donc **39 bâtiments de
  stockage**. Dégénéré mais légal, et l'exactitude arithmétique ne se règle pas
  sur ce qui est vraisemblable. Mesuré : 3,18 × 10¹⁵ milli, soit **2,8 fois de
  marge** ; 5,5 fois à vingt raffineries, 110 fois à une seule.
  ⚠ **ET AUCUN PALIER N'EST MORT.** Écraser n'est pas aplatir : le
  multiplicateur descend de 1,976 au palier 11 à 1,05 au palier 50, donc le
  dernier niveau apporte encore +5 %. Un multiplicateur de 1 aurait laissé
  davantage de marge et rendu les derniers niveaux inutiles à acheter — un test
  refuse les deux bouts.
  ⚠ **`CAPACITE_MILLI_MAX` EST DÉSORMAIS UNE GARDE MORTE, ET C'EST CE QU'ON LUI
  DEMANDE.** Il ne mord sur AUCUNE base légale, et un test l'asserte de face. Le
  jour où il recommencerait à mordre, c'est que les données auraient dérivé.
  ⚠ **ON ÉCRÊTE, ON NE LÈVE PAS** — le contraire du choix fait pour
  `DEBIT_MILLI_PAR_HEURE_MAX`. Un débit qui déborde fausse le rattrapage en
  silence ; une capacité qui déborde ne fausse rien, elle borne.
- **BigInt reste obligatoire** pour les points de recherche : le plafond du
  barème tient largement, mais le produit complet atteint encore 5,2 × 10²¹.
- **`butinPlein` n'est délibérément PAS refactorisé.** La multiplication
  flottante n'est pas associative : regrouper les facteurs autrement déplace le
  butin d'une unité, et six tests le mesurent au champ près.

### Sur le moteur de combat

- **Un obstacle interdit de POSER, rien d'autre.** Il ne bloque le déplacement
  de personne : pour un attaquant il ne fait que ralentir. Et aucun défenseur ne
  bouge aujourd'hui — `deplacement()` écarte tout ce qui n'est pas
  `camp === 'attaque'`.
- **La portée se teste en euclidien 2D et sans direction** :
  `d² = (Δrangée)² + (Δcolonne)²`. Raisonner en rangées seules donne des
  conclusions fausses — c'est ce qui avait fait écrire, à tort, qu'« une
  artillerie avancée est inerte ».
- **`ajouterEntite` destructure une LISTE FERMÉE.** Un champ passé par
  l'appelant et absent de cette liste disparaît en silence. L'ajouter, c'est
  l'ajouter aux DEUX endroits.
- Un montage veut un **type** d'obstacle : `infanterie`, `vehicule` ou
  `les_deux`. Un type inconnu fait lever `creerCombat`.
- **Changer la clé d'une fonction oblige à suivre TOUS ses appelants.**
  `nomAffiche` est passé du camp au propriétaire, et le panneau de fin lui
  forgeait son argument à la main : les survivants du joueur se sont affichés
  « Meute » pendant un commit entier. Le T18 de `defense.test.js` garde la
  régression **et le piège**.
- ⚠⚠ **`distanceCarree` REND UN CARRÉ DE MILLI-CASES, PAS DE CASES.** Deux
  cases voisines sont à **1 000 000**, pas à 1. Un rayon de 2,5 cases s'écrit
  donc `2500 * 2500`, jamais `2.5 * 2.5` : la seconde forme passe `node
  --check`, passe le build, et réduit la portée à la case du porteur sans
  qu'aucune erreur ne le dise. C'est le piège que MODULES-C a désamorcé, et
  `MODULES-C T1` le tient à la milli-case près.
- ⚠ **LE DÉPLACEMENT EST L'ÉTAPE 7, LES DÉGÂTS L'ÉTAPE 5.** La position qui
  compte pour tout ce que fait `appliquerDegats` est celle d'**avant** le tick.
  Une première écriture des tests de MODULES-C a mesuré après coup et a conclu,
  à tort, que la borne du rayon était exclue.
- ⚠ **LES DÉGÂTS D'UN TIR SUIVENT LA SANTÉ DU TIREUR** (`degatsDUnTir` :
  `degatsColonne × pvCourant / pvMax`). Un défenseur qu'on entame frappe moins
  fort au tick suivant : **un montage de test ne doit jamais soustraire les
  mesures de deux ticks différents.** Coûté 4 893 milli-PV d'écart inexpliqué à
  MODULES-C avant d'être compris.
- ⚠ **LE TAMPON DE `tir` EST UNE `Map`, ET SON ORDRE EST CELUI D'INSERTION.**
  Il était SANS EFFET tant que chaque cible ne touchait que ses propres PV.
  Depuis MODULES-C il porte un **réservoir partagé** — le Bouclier —, donc
  `appliquerDegats` **trie par indice de cible croissant** avant d'appliquer.
  Tout mécanisme futur qui partage une ressource entre plusieurs cibles doit
  passer par ce tri, sinon le résultat d'un raid dépendra de l'ordre où les
  défenseurs ont été déclarés. `MODULES-C T6` le garde.
- ⚠ **`estActive` NE VOIT PAS UN MORT DU TICK COURANT.** `vivant` n'est écrit
  qu'à l'étape 6, `retirerLesMorts` : pendant toute l'étape 5, une entité à
  zéro PV est encore « active ». Qui a besoin de « mort maintenant » doit tester
  `pvMilli <= 0` **en plus**.

### Sur les types de `package.json`

- ⚠⚠ **`config.build` ET `version` SONT DES CHAÎNES, PAS DES NOMBRES.**
  `android/app/build.gradle.kts` les lit `as String` — `version` directement,
  `config.build` puis `.toInt()`. Un nombre y fait lever
  « class java.lang.Integer cannot be cast to class java.lang.String », et le
  build Android tombe à la CONFIGURATION, avant le moindre test.
  ⚠ **AUCUN TEST JS NE LE VOYAIT, ET C'EST CE QUI L'A RENDU COÛTEUX.**
  `tools/build.js` fait `pkg.config?.build ?? '0'` et l'interpole ; le workflow
  l'interpole aussi. Les deux marchent avec l'un comme avec l'autre type. Seul
  Kotlin s'en soucie, et **le job `android` est le seul qui ne tourne pas ici**.
  Commis le 28/08 en réécrivant `package.json` avec un sérialiseur JSON, qui a
  rendu `"26"` en `26`.
  ⚠ **LA GARDE LIT LE GRADLE, ELLE NE RECOPIE PAS LA LISTE DES CHAMPS.**
  `donnees.test.js` extrait de `build.gradle.kts` les champs coulés `as String`
  et exige que `package.json` les porte en chaînes. Recopier « version et
  build » aurait vieilli au premier champ ajouté ; un test refuse aussi que les
  motifs ne trouvent plus rien, ce qui arriverait si le Gradle était reformaté.
  ⚠ **ET LE MANIFESTE DE PAGES, LUI, VEUT UN NOMBRE.** Le workflow interpole
  `config.build` **sans guillemets** dans `manifest.json`, et `Manifeste.analyser`
  du module `maj` le relit `as? Long`. Les deux sont cohérents tant que la
  chaîne est un entier décimal — ce que la garde asserte aussi.
  ⚠ **`:maj:test` NE SUFFIT PAS À LE VÉRIFIER ICI.** Sans SDK Android,
  `settings.gradle.kts` EXCLUT `:app`, donc `app/build.gradle.kts` n'est jamais
  évalué : la suite Kotlin passe en local pendant que la CI tombe. Le seul
  garde-fou exécutable ici est celui de `donnees.test.js`.

### Sur les tests et l'outillage

- ~~**La garde du lot 1** scannait avec `/\bdocument\b/`~~ — **corrigée le
  26/08.** `\b` est ASCII en JavaScript, si bien que « documenté » déclenchait
  la garde (la frontière tombe entre le « t » et le « é ») alors que
  « documentation » passait. On avait pris l'habitude d'écrire « consigné » dans
  `src/sim/` pour la contourner : **ce n'est plus nécessaire.** Les motifs sont
  bornés en Unicode par `` (?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_]) ``, et le
  test 4 asserte désormais les deux sens — cinq mots français innocents ne
  déclenchent rien, quatre vraies violations sont attrapées.
  ⚠ **La leçon reste vraie ailleurs** : `\b` est ASCII, et le projet écrit son
  code en français. Tout nouveau motif de mot doit être borné en Unicode.
- **Un montage de test doit tenir dans le budget** — sinon il ne prouve rien.
  Huit Faucheuses au niveau 30 font 202 points pour un budget de 190.
- **`[hidden]` ne cache rien contre un sélecteur d'id.** `#banc-arsenal` fixe
  `display: flex` (spécificité 1,0,0) et l'emporte sur `[hidden]` (0,1,0). D'où
  le `!important` en tête de feuille.
- **`isDisabled()` de Playwright ne connaît pas `<option>`** — il rend toujours
  `false`. Lire `element.disabled`.
- **L'API GitHub est en rate-limit partagé.** Passer par
  `codeload.github.com/<repo>/tar.gz/refs/heads/main`, et pour une PR par
  `refs/pull/<n>/head`.

- **`poser(etat, id, rangee, colonne)` et `problemesDeLaPose`** vivent dans
  `sim/state.js` depuis le 27/08 (lot POSE). **Poser ne coûte rien** —
  `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2, le niveau 1 est gratuit pour les
  onze — et c'est pourquoi la pose a pu être écrite sans attendre l'arbitrage
  sur la répartition quartz/scorie, qui ne concerne que l'AMÉLIORATION.
  ⚠ **Aucune règle de pose n'est réécrite.** La légalité d'une pose est celle de
  la disposition qui en résulterait : on construit la candidate et on la soumet
  à `problemesDeDisposition`. Une seconde liste de règles finirait par diverger.
  ⚠ **Les défauts PRÉEXISTANTS sont filtrés.** Une base amputée par un raid
  resterait constructible : faire remonter ses propres défauts sur chaque pose
  enfermerait le joueur pour des fautes qui ne sont pas les siennes.
  ⚠ **Le résidu suit le bâtiment.** Poser sans allonger `economie.residus` fait
  lever le TICK suivant, pas la pose — donc loin de la faute.

### Sur l'interface

- ⚠⚠ **LE TEMPS VIENT DE L'HORLOGE, JAMAIS DE L'HORODATAGE D'IMAGE.** Défaut le
  plus coûteux de l'écran, trouvé le 27/08 en essayant le jeu sur GitHub Pages.
  La boucle mesurait l'écoulement sur les horodatages de
  `requestAnimationFrame` : ils sont **monotones et ne courent pas pendant qu'une
  page est gelée**. Tant qu'un `visibilitychange` encadrait le gel,
  `reprendre()` réparait — mais **quand l'évènement ne se déclenche pas, le temps
  est perdu pour toujours**, et sur Android c'est le cas courant, pas le cas rare.
  ⚠ **Mesuré, pas supposé** : deux minutes de gel sans évènement produisaient
  **0,006 unité au lieu de 8**. Ethan voyait un compteur qui n'avance que
  pendant qu'on le regarde — « je suis parti quelques minutes et le compteur n'a
  pas bougé ».
  ⚠ **Le remède n'est PAS un évènement de plus.** Ajouter `pageshow`, `focus` ou
  `resume`, c'est parier que celui-là se déclenchera toujours. `creerChronometre`
  de `ui/session.js` ne dépend d'aucun : `requestAnimationFrame` dit QUAND
  dessiner, l'horloge dit COMBIEN de temps a passé. Un gel manqué se répare à la
  première image du retour, où l'écart mesuré est simplement grand.
  ⚠ **La source de l'heure est INJECTÉE** dans le chronomètre — testable sans DOM
  ni horloge système, et `maintenantMs` reste seule lectrice de l'horloge dans
  tout `src/`, comme la garde §11 l'exige.

- **LA PALETTE EST FERMÉE : trente-trois teintes, plus un seul `rgba`.**
  `banc.test.js` balaie `src/render/`, `src/ui/` et `src/index.src.html` et
  refuse toute couleur hors de `FICHE-STYLE.md`, ainsi que tout `rgba` autre que
  `rgba(0,0,0,0.31)`. Aucune transparence, donc — ni tuile pâle, ni gris
  intermédiaire. Les trente-trois : cinq de châssis kaki, cinq de sol joueur,
  cinq de sol Ouvrage, cinq d'ardoise Ouvrage, quatre d'accents de terrain,
  trois de métal, six d'accents fonctionnels.
  ⚠ **CE PARAGRAPHE DISAIT « VINGT-HUIT » JUSQU'AU 28/08 AU SOIR, ET IL AVAIT
  TORT DE CINQ.** Son énumération avait perdu une rampe entière — les cinq tons
  du sol de l'Ouvrage — exactement comme la liste de `banc.test.js` en avait
  perdu trois la veille. La GARDE, elle, était juste : elle porte les
  trente-trois et un test l'égale à la fiche dans les deux sens. C'est la PROSE
  qui avait vieilli, et rien ne la confrontait.
  ⚠ **DÉSORMAIS SI** — `documentation.test.js` décode le nombre écrit en lettres
  ici, somme l'énumération, et exige que les deux valent le compte de teintes
  distinctes de `FICHE-STYLE.md`. Le total ET le détail : annoncer
  « trente-trois » au-dessus d'une énumération qui fait vingt-huit passerait
  sous une garde qui ne lirait que le total.
  ⚠ **LA GARDE N'EN CONNAISSAIT QUE QUATORZE PENDANT UNE JOURNÉE.** `FICHE-STYLE.md`
  est passé en v4 le 27/08 avec trois rampes de plus ; la liste de `banc.test.js`
  se disait « transcrite » et ne l'était plus. Elle serait restée VERTE
  indéfiniment — elle ne regarde que du code qui n'emploie pas encore ces
  teintes — tout en refusant quatorze couleurs parfaitement légitimes au premier
  écran qui s'en servirait.
  ⚠ **Une transcription qui ne se confronte pas à sa source est une copie qui
  vieillit.** La liste reste ÉCRITE — pour qu'un ajout se voie en relecture, et
  pour qu'une faute de frappe dans la fiche n'autorise pas une couleur en
  silence — et un test l'asserte contre le document **dans les deux sens**.
  Même garde dans `tools/audit-maquette.mjs`.
  ⚠ **DEUX ÉCHAPPATOIRES EXISTENT, ET ELLES SONT INTERDITES D'USAGE.** Le motif
  de la garde est `` #[0-9A-Fa-f]{6}(?![0-9A-Za-z]) `` : un hex à **trois**
  chiffres (`#000`) et un hex à **huit** (`#F5F3E80D`) passent tous les deux au
  travers. S'en servir contournerait la garde en silence, ce qui coûte plus cher
  que la contrainte qu'elle pose. `tools/audit-maquette.mjs` refuse les deux de
  face, pour que la maquette n'apprenne pas la triche à l'écran.
- **La maquette a été dessinée sous la contrainte à quatorze teintes**, avant
  la v4 de la fiche. Elle tient, mais elle ne connaît pas encore les couleurs de
  terrain que la fiche porte maintenant : `#9FB3C5` · `#C1CEDA` pour le quartz,
  `#382E47` pour la scorie. À reprendre quand Ethan dira comment il veut qu'un
  champ se lise — c'est une décision de style, et la fiche fait autorité.
  ⚠ **LA MAQUETTE A SUIVI LE RETOURNEMENT ET LA BARRE À DEUX BANDES** (27/08 au
  soir) — sans quoi elle aurait enseigné une navigation que le jeu ne fait plus.
  Elle ne porte PAS l'écran Offense : elle en montre le renvoi et rien d'autre.
  `audit-maquette.mjs` ne regarde pas la navigation et ne l'aurait pas dit.
  ⚠ **L'ÉCRAN DE JEU A REPRIS LE RENDU DE LA MAQUETTE, PAS CES TROIS TEINTES**,
  et c'est délibéré : leur emploi n'est pas arbitré, et trancher seul aurait fixé
  la lecture d'un champ sans que personne la revoie. Le champ est donc, à
  l'écran comme sur la maquette, un fond kaki plein avec un liseré. **Les deux
  se reprendront ENSEMBLE** le jour de l'arbitrage — les laisser diverger
  reviendrait à dessiner dans la maquette une décision que l'écran ignore.
- **Ce que la contrainte a donné, le 27/08, et qui vaut mieux que ce qu'elle a
  remplacé.** Les trois bandes de la grille n'ont plus de fond propre : la fiche
  n'a pas trois gris voisins, le RAIL disait déjà où l'on est, et une nuance de
  noir ne se distingue pas sur un téléphone au soleil. Un champ de ressource
  n'est plus une teinte pâle mais un fond kaki plein, avec un liseré qui dit la
  ressource — os pour le quartz, ambre pour la scorie.
- **La grille de la base fait 9 colonnes.** Arbitré le 27/08 après que la
  maquette en ait montré 8 pendant trois jours. `GRILLE.largeur` fait foi, et
  `audit-maquette.mjs` l'asserte contre la maquette.
- **LE TEMPS MURAL A SON POINT D'ENTRÉE DEPUIS LE 27/08, ET IL EST UNIQUE.**
  `charger` et `serialiser` l'attendaient en argument depuis la v6 sans que
  personne le leur passe ; le lot ÉCRAN-CHANTIER a branché l'écran, donc
  **retourné la garde §11** exactement dans la forme que cette ligne annonçait.
  Elle dit maintenant : interdiction TOTALE sur `src/sim/`, `src/data/` et
  `src/render/` ; **exactement une** occurrence dans `src/ui/session.js`, nommé
  dans le test. Le compte est **asserté, pas borné** — « au plus une » laisserait
  passer zéro, c'est-à-dire la disparition silencieuse du seul point d'entrée du
  temps réel, et le jeu réafficherait les stocks d'hier soir sans qu'un test
  tombe. Le verdict vit dans `fautesDHorloge`, séparé de la mesure pour être
  falsifiable : on lui donne zéro, deux, et une occurrence ailleurs, et il
  refuse les trois.
  ⚠ **Tout `src/` porte la fonction `maintenantMs()` et ELLE SEULE.** Ce qui a
  besoin de l'heure l'appelle ; personne n'écrit une seconde fois le nom de
  l'horloge du langage.
  ⚠ **LES DEUX CONTOURNEMENTS SONT INTERDITS PARTOUT, PORTEUR COMPRIS** —
  `new Date` et `performance.timeOrigin` donnent l'heure murale sans écrire le
  nom que la garde cherche. Le test les refuse de face, avec un appât pour
  chacun. Même discipline que les hex à trois et à huit chiffres de la garde de
  palette.
  ⚠ **DEUX CHEMINS DE RETOUR, PAS UN.** Une application TUÉE repasse par
  `charger`, qui rattrape. Une application seulement REPLIÉE ne repasse par
  rien : les horodatages de `requestAnimationFrame` sont monotones et ne
  courent pas pendant qu'on ne regarde pas. D'où l'instant retenu au masquage et
  la reprise qui rattrape la différence — sans quoi la vérification appareil
  n° 4 échouerait pour la moitié des façons de fermer le jeu.
- **Le banc d'essai RESTE dans le HTML livré**, caché derrière un appui long de
  1,5 s sur le numéro de version — arbitré le 27/08, branché le même jour.
  C'est ce que T10 de `banc.test.js` exige déjà : il asserte la présence de
  `banc-canvas`, `banc-graine`, `banc-lancer` et `banc-pas` dans
  `dist/index.html`. Le sortir aurait mis ce test au rouge.
  ⚠ **`initialiserBanc` n'est appelé QU'À L'OUVERTURE**, jamais au chargement :
  il pose des écouteurs, un ResizeObserver et une projection, et mesure son
  canvas au câblage — un élément caché mesure zéro. Le démasquage vient donc
  avant l'appel, et l'appel n'a lieu qu'une fois.
- **LA GRILLE SE DESSINE À L'ENVERS DES NUMÉROS DE RANGÉE, ET C'EST VOULU.**
  Arbitré le 27/08 au soir : la base d'abord, puis la défense, puis les deux
  rangées de déploiement. La transformation vit dans `src/render/orientation.js`
  et nulle part ailleurs — `ligne d'écran = GRILLE.longueur + 1 − rangée`, avec
  sa réciproque. **Le modèle ne bouge pas** : la rangée 1 reste celle où les
  vagues paraissent, la rangée 18 reste le fond.
  ⚠ **ELLE EST DANS `render/` PARCE QUE LA MÊME VUE SERVIRA AU RAID.** Ethan :
  « il faut toujours que la base, quoi qu'il arrive, joueur ou Ouvrage, soit
  [en premier], puis défense, puis les deux petites rangées ». C'est la même
  géométrie des deux côtés — d'où `GEOMETRIE_BASE` qui RÉFÉRENCE `GRILLE`.
  Écrite en dur dans l'écran Chantier, elle serait recopiée pour l'écran de
  raid, et les deux copies divergeraient.
  ⚠ **`render/projection.js` PORTAIT DÉJÀ CETTE CONVENTION**, depuis le lot 3A :
  `yDeRangee` vaut `margeY + (GRILLE.longueur − rangee) × tailleCase`. Le canvas
  du banc dessinait donc dans le bon sens ; l'écran DOM du lot ÉCRAN-CHANTIER
  était le SEUL à la contredire, parce qu'il posait ses cases dans l'ordre
  naturel de sa boucle. Un test asserte désormais que les deux chemins
  s'accordent, pour qu'on ne puisse plus en corriger un seul.
  ⚠ **POUR UNE BANDE, LA LIGNE DE DÉPART SE CALCULE DEPUIS SA RANGÉE LA PLUS
  HAUTE EN NUMÉRO.** Prendre `premiere` par symétrie apparente décale chaque
  bande de sa propre longueur — la défense se poserait sur les bâtiments, et le
  rail désignerait la mauvaise bande **sans que rien ne casse**.
- **LA BARRE DU BAS PORTE DEUX BANDES, PAS TROIS.** Chantier et Défense, dans un
  seul défilement continu : ce sont deux repères de la même grille, pas deux
  écrans. Le jeu s'ouvre sur le Chantier.
  ⚠ **LE BOUTON « ASSAUT » ÉTAIT UNE FAUTE, retirée le 27/08 au soir.** Il
  pointait sur les rangées 1–2, qui sont l'endroit où les vagues PARAISSENT
  pendant un combat — pas celui où on les COMPOSE. Il promettait un éditeur et
  livrait du sol nu. La composition a désormais son écran, et un test refuse
  qu'un bouton « Assaut » reparaisse dans la page.
- **L'ÉCRAN OFFENSE EST UNE COQUILLE, ET IL SE DIT COQUILLE.** Trente-six
  emplacements — quatre vagues de neuf, `EMPLACEMENTS_ASSAUT` — dessinés et
  vides, niveau et budget à « — », palette présente et désactivée, et un mot qui
  dit que la composition d'armée n'existe pas encore. L'état ne porte pas
  d'armée ; en inventer la forme reviendrait à trancher seul.
  ⚠ **LA PALETTE N'EST PAS FILTRÉE PAR NIVEAU.** `unitesDisponibles(niveau)` de
  l'Arsenal ne montre que `apparition <= niveau` — mais le joueur n'a pas de
  niveau d'armée. En choisir un pour pouvoir filtrer, c'est l'inventer.
  ⚠ **`GRILLE.intervalleVagueSec` VAUT 5, PAS 10.** La capture de référence
  fournie avec l'amendement affiche « +10 s » : c'est un autre jeu. La table du
  dépôt fait foi, et un test l'asserte de face.
  ⚠ **CHANGER D'ÉCRAN N'ARRÊTE PAS LA BOUCLE.** `suspendre()` et `reprendre()`
  de `session.js` existent pour le BANC, qui remplace la page, et pour le
  masquage de l'application. Les brancher sur la navigation interne gèlerait
  l'économie — et **le défaut serait invisible** : au retour, le rattrapage par
  l'horloge murale rendrait les ressources manquantes, si bien que le gel ne se
  lirait que sur un chronomètre. Un test lit la source pour l'empêcher.
- **POSER UN BÂTIMENT NE COÛTE RIEN, ET LA VIGNETTE DOIT LE DIRE.**
  `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2 : le niveau 1 est gratuit pour
  les onze. Le lot ÉCRAN-CHANTIER affichait pourtant `COUT_NIVEAU_DEUX` en
  chiffre nu dans un coin de chaque vignette — « 3 » sur un Collecteur posable
  se lit « poser coûte 3 » — alors qu'un commentaire du même fichier écrivait
  noir sur blanc que la pose est gratuite. La vignette annonce maintenant
  « gratuit » ; le coût de la première amélioration vit dans son titre, et le
  champ s'appelle `coutPremiereAmelioration`, pour que le point d'appel ne
  puisse plus se tromper sans que ça se voie.
  ⚠ **AUCUNE RESSOURCE N'EST NOMMÉE AVEC CE NOMBRE.** `COUT_NIVEAU_DEUX` donne
  un nombre unique et `COUT_ELECTRICITE` une fraction du coût EN QUARTZ ; rien
  ne dit comment le total se répartit entre quartz et scorie depuis que le
  modèle du lot 1 est parti avec `data/params.js`. Un nombre sans ressource, dit
  comme tel, est plus honnête qu'un « 3 quartz » faux.
- **LES TROIS ACTIONS SONT BRANCHÉES DEPUIS LE 27/08, SUR LE MODÈLE « ARMER
  PUIS TOUCHER ».** C'est l'INVERSE de ce qui existait : on ne sélectionne plus
  un bâtiment pour activer les boutons, on arme un bouton puis on touche le
  bâtiment. Quatre règles, toutes arbitrées :
  retoucher l'action armée la désarme ; armer une action désarme l'autre ; armer
  une action défait aussi la palette — **un seul mode à la fois** ; et toucher
  une case VIDE désarme **sans rien dire**, comme un clic à côté d'un menu.
  L'action se désarme dans tous les cas, réussite comme refus.
  ⚠ **LES BOUTONS NE SONT PLUS DÉSACTIVÉS**, et ils ne peuvent plus l'être :
  c'est le bouton qu'on touche EN PREMIER. Un test refuse qu'un `disabled`
  revienne sur les trois, ce qui rendrait tout le modèle inatteignable au doigt.
  ⚠ **RÉPARER N'A PAS DE MOTEUR, ET SON REFUS EST LA SEULE PHRASE ÉCRITE DANS
  L'INTERFACE.** `REPARATION_BASE_JOUEUR` est une table de calibrage, aucune
  fonction ne répare, aucun bâtiment ne porte de dégâts. Le bouton suit quand
  même le chemin complet — il s'arme, il se désarme — et dit ce qui est vrai.
  Un test asserte que `sim/state.js` n'exporte toujours rien qui répare : **il
  est fait pour tomber** le jour où le moteur en gagne une, et dire quoi
  brancher.
  ⚠ **ON DEMANDE, PUIS ON AGIT — ET LA GARDE VISE AUSSI LE POINT D'APPEL
  INDIRECT.** L'écran n'appelle pas `ameliorer(...)`, il appelle
  `action.agir(...)` par la table `ACTIONS`. Une garde qui ne cherchait que les
  noms directs laissait passer un `try` autour de la répartition — la seule
  forme sous laquelle la faute se commettrait ici, et la falsification l'a
  débusquée. Elle refuse maintenant les deux.
- **LA POSE EST BRANCHÉE DEPUIS LE 27/08.** La palette est vivante, le joueur
  choisit un bâtiment, il touche, ça se pose.
  ⚠ **SEUL LE COLLECTEUR VOIT SES CASES CERCLÉES** (27/08). C'est le seul
  bâtiment pour qui le TERRAIN décide — `CHAMPS.posableDessus` ne contient que
  lui — et cercler soixante cases sur soixante-douze pour les dix autres
  n'apprend rien. **C'est l'AFFICHAGE qui disparaît, pas la règle** :
  `problemesDeLaPose` est interrogée exactement comme avant, et une case
  illégale dit toujours pourquoi. L'écran LIT la table, il n'écrit pas
  « collecteur » en dur — un test le garde.
  ⚠ **LA PALETTE SE DÉSÉLECTIONNE APRÈS LA POSE** (27/08). Poser deux bâtiments
  de suite demande de rechoisir, contre le risque de poser par inadvertance au
  toucher suivant. Et la SAUVEGARDE passe avant le repeint, pas après.
  ⚠ **LE COMPTEUR D'EMPLACEMENTS A DISPARU AVEC LA BARRE DE GAUCHE** (27/08).
  Ce qu'il disait se dit maintenant au toucher d'une vignette : si la base est
  pleine, un toast le dit AVANT que le joueur cherche une case. La grandeur
  reste calculée par `resumeDeLaBase` — c'est l'affichage permanent qui part.
  ⚠ **LA GRILLE SE CENTRE PAR LA MISE EN PAGE, JAMAIS PAR UNE TRANSFORMATION.**
  Un `transform: scale()` décrocherait le doigt de la case qu'il vise : le
  dessin bougerait, pas la géométrie du pointage. La largeur de la grille est
  plafonnée (`--case-max`, 46 px, la borne haute mesurée par la passation du
  27/08) et `margin-inline: auto` répartit également ce qui reste.
  ⚠ **UN TOAST N'EST PAS UN BANDEAU.** Les refus d'action répondent à un geste
  et s'effacent seuls ; les messages de la SESSION — sauvegarde impossible,
  sauvegarde illisible — décrivent un état qui dure et ne s'effacent pas. Les
  deux passent par `#chantier-avis`, et `avis()` l'emporte sur `toast()`.
  ⚠ **ON DEMANDE, PUIS ON POSE — ET JAMAIS DE `try` AUTOUR DE `poser`.**
  `problemesDeLaPose` rend une LISTE, `poser` LÈVE, et la différence est la règle
  du dépôt : une pose refusée est un fait de JEU qu'on montre au joueur, une
  levée est un fait de PROGRAMME. Rattraper la levée traiterait la seconde comme
  la première et masquerait le jour où l'écran appellerait vraiment de travers.
  Un test balaie `src/ui/` bloc `try` par bloc `try`.
  ⚠ **`src/ui/` PORTE DEUX FONCTIONS `poser` SANS RAPPORT** : celle de
  `sim/state.js` (un bâtiment dans la base) et celle d'`ui/arsenal.js` (une unité
  dans une vague). `ui/banc.js` entoure la seconde d'un `try`, et il a RAISON —
  le contrat de l'Arsenal est de lever sur un dépassement de budget, qui est un
  fait de jeu. D'où l'import sous le nom `poserBatiment` dans `chantier.js` :
  sans lui, la garde accuserait le banc d'une faute qu'il ne commet pas.
  ⚠ **LES CASES LÉGALES SE CALCULENT, ELLES NE SE DEVINENT PAS.**
  `casesPosables` interroge `problemesDeLaPose` sur les 72 cases de la bande des
  bâtiments — 1,5 ms, un geste et non une boucle de rendu. Réimplémenter les
  règles dans l'écran pour aller plus vite ferait diverger une seconde lecture
  de `sim/disposition.js`, qui est la seule table de règles. **Ne balayer QUE la
  bande des bâtiments** : ailleurs, la réponse serait `hors-base` 90 fois.
  ⚠ **LES MESSAGES DE REFUS SE REPRENNENT MOT POUR MOT.** Ils sont déjà écrits
  en français lisible dans `sim/disposition.js`. Les reformuler dans l'écran
  créerait une seconde formulation qui finirait par dire autre chose que la
  règle.
  ⚠ **UNE POSE SE SAUVEGARDE TOUT DE SUITE.** C'est la première action
  irréversible du jeu ; la perdre parce que l'application a été tuée avant
  l'enregistrement périodique serait la pire façon de perdre la confiance du
  joueur. L'écran dit QUAND (`apresPose`), la session sait COMMENT.
  ⚠ **POSER UN NIVEAU 1 FAIT BAISSER LE NIVEAU MOYEN**, et ça se verra à
  l'écran : 4,6 → 4,3 en posant une raffinerie sur la base de la maquette. C'est
  une MOYENNE, pas un total. Un test l'asserte pour qu'on ne le prenne jamais
  pour un défaut de calcul.
  ⚠ **LE BANDEAU D'AVIS APPARTIENT À `chantier.js`.** La session lui parle par
  `ecran.avis()` au lieu d'écrire dans l'élément : depuis que la pose s'y exprime
  aussi, deux modules qui l'écriraient sans se connaître s'effaceraient l'un
  l'autre.

- ⚠⚠ **LES BARRES SYSTÈME D'ANDROID MORDAIENT SUR L'ÉCRAN, ET LE JEU EN ÉTAIT
  INJOUABLE.** Rapporté par Ethan le 28/08, capture à l'appui : la rangée
  d'onglets passait sous l'horloge, la palette sous les trois boutons de
  navigation. **En navigateur aussi**, dès que la page passe en plein écran.
  ⚠ **LA CAUSE ÉTAIT UNE MOITIÉ DE MÉCANISME, PAS UN OUBLI ENTIER.**
  `viewport-fit=cover` était posé depuis le premier jour — il DEMANDE
  explicitement à dessiner sous les barres — et pas un seul
  `env(safe-area-inset-*)` ne rendait la place. L'enveloppe vise `targetSdk 35`,
  où l'affichage bord à bord est imposé : la WebView occupe toute la dalle.
  ⚠ **LE CORRECTIF EST DANS LE HTML, PAS DANS L'ENVELOPPE, et c'est délibéré.**
  Le HTML se met à jour tout seul par Pages ; corriger côté Android demanderait
  de reconstruire et de réinstaller l'APK, et se battrait de toute façon contre
  `viewport-fit=cover`. Les quatre côtés sont pris sur `body`, qui est le parent
  des trois écrans : un quatrième en héritera sans qu'on y pense.
  ⚠ **LES DEUX VONT ENSEMBLE.** `viewport-fit=cover` seul est exactement le
  défaut ; les `env()` seuls sont inertes, car sans lui les quatre valent zéro.
  Un test l'écrit pour qu'on ne puisse pas retirer l'un en croyant garder
  l'autre.

- ⚠⚠ **UNE CLASSE QUE LE JS BASCULE ET QUE LA FEUILLE IGNORE EST UN LOT ENTIER
  QUI NE SE VOIT PAS.** Le lot ÉCRAN-ACTIONS posait `classList.toggle('arme')`
  sur les trois boutons — le JavaScript était juste — et **aucune règle CSS ne
  peignait `arme`** : armer une action ne changeait strictement rien à l'écran,
  donc le modèle « armer puis toucher » était invisible au doigt. Livré comme ça,
  et relevé sur appareil.
  ⚠ **AUCUN TEST NE POUVAIT LE VOIR, ET C'EST RÉPARÉ D'UNE AUTRE MANIÈRE.** Une
  classe sans règle n'est pas du JS faux, c'est du CSS absent, et le dépôt n'a
  pas de navigateur. Ce qui SE teste sans navigateur, c'est la confrontation des
  deux sources : `chantier.test.js` extrait les littéraux de
  `classList.toggle/add` de tout `src/ui/` et exige de chacun une règle dans
  `index.src.html`. La garde ne dit pas que le style est BEAU, elle dit qu'il
  EXISTE — et c'est exactement ce qui manquait.
  ⚠ **ELLE LIT LA FEUILLE DÉCOMMENTÉE.** Deux gardes de ce lot se sont d'abord
  satisfaites de leur propre prose : celle des marges trouvait
  `viewport-fit=cover` dans le paragraphe qui l'explique, celle du mot
  « saturé » trouvait `MENTION_SATURE` dans sa propre déclaration. **Une garde
  qui lit ce qu'on a écrit à son sujet ne garde rien.** Les deux ont été
  resserrées — balise `<meta>` réelle, usage dans un `textContent =` — après
  falsification.

- **LE PANNEAU DE DÉTAIL PROJETTE AVEC LES FONCTIONS DU MOTEUR, JAMAIS AVEC UNE
  FORMULE.** `apercuDuBatiment` fabrique la disposition CANDIDATE — la même
  liste, ce bâtiment monté d'un niveau — et la soumet à `debitDuBatiment` et
  `capacitesMilli`. Une projection écrite dans l'écran (« × 1,25 par niveau »)
  serait une seconde lecture des règles, et elle aurait **déjà tort** : la poche
  du Chantier, le voisinage et le stockage ne suivent pas la même pente, et
  `capacitesMilli` somme des bâtiments dont un seul monte.
  ⚠ **AU PLAFOND, TOUT LE VOLET « APRÈS » VAUT `null`, PAS ZÉRO.**
  `coutDeMontee` et `capaciteDuNiveau` LÈVENT au-delà de `niveauPlafond` ; et un
  « améliorer pour 0 » se lirait comme gratuit.
  ⚠ **LE COÛT SE NOMME MAINTENANT AVEC SA RESSOURCE**, ce que le lot précédent
  ne pouvait pas faire. `coutDeMontee` rend les trois et c'est exactement ce
  qu'`ameliorer` débite : le panneau LIT la table. Mesuré le 28/08 sur 11
  bâtiments × 49 paliers — **la scorie ne coûte jamais rien** (0 sur 539) et
  l'électricité coûte à partir du niveau 3 (527 paliers). Seules les ressources
  non nulles sont nommées : « 8 quartz · 0 scorie » enverrait chercher une
  dépense qui n'existe pas.

- **LA LIGNE D'AVIS PORTE TROIS REGISTRES, ET LA PRIORITÉ EST ÉCRITE** —
  `session` > `toast` > `mode`, dans `ligneAAfficher`, qui est pure.
  ⚠ **AVANT, TROIS APPELANTS ÉCRIVAIENT AU MÊME ENDROIT SANS SE CONNAÎTRE.**
  `armer()` posait `avis('')` : armer une action effaçait donc au passage une
  alerte de sauvegarde que personne n'avait lue. Et le MODE n'écrivait rien du
  tout — armer « Démolir » ne disait rien, et le bâtiment suivant qu'on touchait
  disparaissait.
  ⚠ **LE TOAST PASSE DEVANT LE MODE, ET NON L'INVERSE.** « il manque 8 de
  quartz » répond au doigt qui vient de se poser ; « mode Améliorer » est un
  rappel qu'on peut relire quatre secondes plus tard.
  ⚠ **UN MODE N'EST PAS UNE ALERTE** : métal, pas rouge. Le rouge des refus lui
  donnerait l'air d'une panne, et le joueur chercherait ce qu'il a cassé.

- **LE COMPTEUR D'EMPLACEMENTS EST REVENU (28/08), ET LE TOAST RESTE.** Il avait
  été retiré la veille avec la barre de gauche, au motif que la saturation se
  dirait au toucher d'une vignette. Ethan : « il n'y a plus la limite de
  bâtiment ». **Un plafond qu'on ne découvre qu'en le heurtant n'est pas un
  plafond, c'est une surprise.**
  ⚠ **ET LA SATURATION SE DIT PAR UNE LIGNE DE MODE, PLUS PAR UN TOAST.** Elle
  décrit un état qui dure aussi longtemps que le mode de pose ; en toast, elle
  s'effaçait au bout de quatre secondes et laissait reparaître « touchez une
  case libre » alors qu'il n'y en a aucune. Il se range avec les ressources — il se lit
  comme un stock plafonné, « 1 / 2 » — et non dans un bandeau à lui : c'est le
  BANDEAU qui est mort, pas le chiffre.

- **LE PANNEAU S'OUVRE AU TOUCHER, PAS À LA SÉLECTION.** `peindre()` sélectionne
  le Chantier d'office à la première image : ouvrir sur une sélection ferait
  reparaître le panneau après chaque pose et chaque amélioration, par-dessus la
  grille que le joueur regarde.
  ⚠ **SON BOUTON « AMÉLIORER » AGIT DIRECTEMENT, SANS ARMER**, et ce n'est pas
  une entorse au modèle « armer puis toucher ». Ce modèle existe parce que les
  boutons du bandeau contextuel n'ont pas de cible ; celui-ci en a une — le
  bâtiment dont le panneau parle — et lui demander de viser ensuite serait un
  geste pour rien.
  ⚠ **IL RESTE VIF QUAND C'EST IMPOSSIBLE.** « Un indice n'est pas une
  interdiction » (§4) : le refus chiffré du moteur en apprend plus qu'un bouton
  mort, et il faut pouvoir le lire en appuyant.
  ⚠ **IL SE FERME EXPLICITEMENT AU CÂBLAGE.** Le `hidden` du balisage suffit
  aujourd'hui, mais il serait la SEULE chose à le tenir fermé au démarrage : un
  attribut oublié à la prochaine reprise du HTML l'ouvrirait par-dessus la
  grille sans qu'aucun test le voie.

- **LE PANNEAU PORTE UN CHRONOMÈTRE, ET SA CONDITION EST DANS L'ARBITRAGE.**
  Ethan, 28/08 : « quand l'amélioration n'est pas possible, indiquer un
  chronomètre. **Si le stock requis est sous le seuil du stockage maximum.** »
  La seconde phrase porte tout : un coût plus grand que la capacité de la base
  n'arrivera JAMAIS, et un compte à rebours dessus tournerait sans atteindre
  zéro. `delaiAvantAmelioration` rend donc trois réponses distinctes — une
  attente chiffrée, un mur de stockage, une ressource que rien ne produit — et
  `null` quand c'est payable tout de suite.
  ⚠ **LE DÉLAI EST LE MAXIMUM SUR LES RESSOURCES, PAS LEUR SOMME** : les trois
  montent en parallèle, c'est la dernière à arriver qui décide.
  ⚠ **ARRONDI VERS LE HAUT, ET LA FALSIFICATION L'A EXIGÉ.** Annoncer une
  seconde de moins que la vérité ferait cliquer le joueur sur un refus. Le
  premier montage du test tombait sur une division exacte, où `floor` et `ceil`
  rendent le même nombre : il passait sur les deux codes, donc il ne mesurait
  pas l'arrondi. **Un montage qui tombe rond ne mesure pas un arrondi.**

- **LES PASTILLES DE CASE LIBRE SONT PARTIES (28/08), LE COMPTEUR RESTE.** Elles
  marquaient en haut de la grille autant de cases vides qu'il restait
  d'emplacements — un NOMBRE dessiné à des endroits sans rapport avec les cases
  que le joueur choisirait. « Emplac. 3 / 4 » dit la même grandeur sans mentir
  sur la géométrie.

- ⚠⚠ **« TU COMPRESSES TOUT DANS L'UI » — CONSIGNE PERMANENTE D'ETHAN, 28/08.**
  Elle est plus forte que « pas de dépassement » : **tout doit TENIR dans
  l'écran, rien ne déborde, rien ne défile horizontalement, aucune barre n'en
  pousse une autre hors du cadre.** Un lot qui ajoute un contrôle le fait entrer
  dans la place existante — le bandeau contextuel est passé de trois à quatre
  boutons sans grandir d'un pixel, ce sont les écarts et le bloc de gauche qui
  ont cédé.
  ⚠ **UNE GARDE LA TIENT, AUTANT QU'UN DÉPÔT SANS NAVIGATEUR LE PERMET.**
  `chantier.test.js` somme les hauteurs fixes des six barres de la colonne de
  jeu — 40 + 44 + 26 + 46 + 46 + 86 = **288 px** — et refuse au-delà de 320. La
  borne se justifie : sur la dalle la plus courte encore en service (568 px de
  haut en CSS), 320 px de chrome laissent 248 px de grille, soit cinq rangées.
  Elle asserte aussi la LISTE des barres à hauteur fixe : une septième la fait
  tomber, ce qui force à regarder plutôt qu'à ajouter.

- ⚠⚠ **L'EN-TÊTE A QUITTÉ L'ÉCRAN DE LA BASE (28/08), ET C'EST STRUCTUREL.**
  Les onglets et le bandeau des ressources vivaient DANS `#ecran-chantier` :
  passer à l'Offense les faisait disparaître. Ethan : « garder la barre quartz
  scories etc et monde option dans le menu offense ». Ils sont maintenant dans
  `#jeu`, au-dessus de `#ecrans`, et tout écran à venir en hérite — même
  raisonnement que les marges système posées sur `body`.
  ⚠ **L'ORDRE DU DOCUMENT EST L'ORDRE DE L'ÉCRAN, jamais un `order` CSS.** Le
  même dessin obtenu par `order` casserait la navigation au clavier et la
  lecture par un lecteur d'écran. Un test compare les POSITIONS des identifiants
  dans le HTML produit.
  ⚠ **L'ÉCRAN DEMANDE, LA SESSION DÉCIDE.** `ui/chantier.js` construit la barre
  du bas — il a les formateurs et l'état — mais un de ses trois boutons change
  d'ÉCRAN, ce que seule la session sait faire : il appelle `versEcran`, comme il
  appelle `apresPose` pour écrire. Un test refuse que l'écran de la base nomme
  `ecran-offense` en dur.

- ⚠⚠ **LE NUMÉRO DE VERSION A DÉMÉNAGÉ DANS LES OPTIONS, ET IL A FALLU CRÉER
  L'ÉCRAN POUR ÇA.** Ethan voulait la barre du bas entière pour ses trois
  boutons. Or ce numéro PORTE l'appui long de 1,5 s qui ouvre le banc d'essai :
  le déplacer sans abri l'aurait rendu inatteignable — et **T10 de
  `banc.test.js` serait resté VERT**, puisqu'il exige la PRÉSENCE des contrôles
  dans le HTML, pas leur accessibilité. D'où `#ecran-options`, et l'onglet
  Options qui cesse d'être mort.
  ⚠ **LE BANC CACHE `#jeu`, PLUS LES ÉCRANS UN PAR UN.** Il en nommait deux ;
  avec trois écrans et deux barres communes, en oublier un n'était qu'une
  question de temps — le banc se serait ouvert par-dessus les onglets restés
  visibles.

- **LE COMPTEUR DU BANDEAU CHANGE DE LIBELLÉ AVEC LE CONTEXTE**, et deux de ses
  trois valeurs sont un tiret. Arbitré le 28/08 : « quand on passe en défense, le
  nombre d'emplacement change pour celui des points de défense. Idem pour
  offense. » Le LIBELLÉ change ; la valeur reste « — » parce que l'état ne porte
  ni garnison ni armée. `CONTEXTES[x].chiffre` dit si la grandeur EXISTE, pas si
  elle vaut zéro.
  ⚠ **L'ÉCRAN L'EMPORTE SUR LA BANDE** pour décider du contexte : sur l'Offense,
  allumer « Base » parce que le défilement s'y était arrêté dirait au joueur
  qu'il regarde sa base alors qu'il regarde ses vagues.

- **LES DEUX PALETTES NE DÉFILENT PLUS, ELLES TIENNENT.** Deux rangées, et le
  nombre de colonnes se CALCULE — `Math.ceil(longueur / 2)`. Celle du Chantier
  avait des colonnes de 82 px et un défilement horizontal : la première vignette
  était coupée et deux bâtiments vivaient hors de l'écran. Écrire « 6 »
  marcherait aujourd'hui et mentirait au douzième bâtiment.
  ⚠ **CELLE DE L'OFFENSE A SUIVI LE 29/08, ET ELLE Y ÉTAIT FORCÉE.** Elle gardait
  ses colonnes de 82 px et son `overflow-x: auto` : tolérable tant qu'elle
  FILTRAIT et n'en montrait que trois ou quatre, insupportable depuis qu'elle
  grise et en montre quatorze. À sept colonnes sur 360 px la vignette fait 47 px,
  et le libellé a besoin d'`overflow-wrap: anywhere` — sans quoi « Cuirassiers »
  se lit « UIRASSIER ». Vu à l'essai dans un navigateur, pas à la relecture.

- ⚠⚠ **L'ONGLET MISSION EST VIVANT DEPUIS LE 28/08 : C'EST LE TUTORIEL.** Il
  était « bouton mort pour l'instant, futur tuto » dans la liste d'Ethan ; le
  futur est arrivé. Arbitré le 28/08 : **des missions qui se cochent toutes
  seules, sans récompense.**
  ⚠ **UNE MISSION EST UNE QUESTION POSÉE À LA BASE, PAS UN COMPTEUR.**
  `sim/missions.js` LIT `disposition` et `champs` et dit si le geste décrit est
  accompli. Elle n'écrit rien, ne récompense rien, ne débloque rien. Un test
  photographie l'état et exige qu'il soit intact après lecture.
  ⚠ **AUCUNE PROGRESSION N'EST SAUVEGARDÉE, ET `SAVE_VERSION` RESTE À 6.**
  Retenir « mission 3 faite » créerait une SECONDE source de vérité sur ce que
  le joueur a construit, alors que la première — sa base — est déjà là et ne
  peut pas mentir. Conséquence assumée et testée : démolir décoche.
  ⚠ **LA CHAÎNE EST L'OUVERTURE MESURÉE DE §6**, pas une idée de l'ouverture :
  Chantier au niveau 2 → Collecteur sur un champ → Raffinerie au contact →
  monter la Raffinerie → Centrale. C'est exactement le passage où le plafond de
  stockage mord, et où Ethan s'était arrêté en croyant que rien ne produisait.
  ⚠ **ELLE TIENT DANS LES EMPLACEMENTS QU'ELLE FAIT OUVRIR** — quatre bâtiments
  pour les quatre emplacements du Chantier de niveau 2, jouée par le vrai
  moteur dans le test. Une sixième mission demandant un cinquième bâtiment
  rendrait le tutoriel INFINISSABLE, et rien à la relecture ne le dirait.
  ⚠ **AUCUN NOMBRE N'EST ÉCRIT EN DUR DANS LES TEXTES.** Le niveau visé vient
  d'`ECONOMIE_NIVEAU.premierNiveauPayant`, les noms de `nom.joueur`, et le
  niveau où l'électricité commence à coûter se **MESURE** sur `coutDeMontee` —
  3, sur les onze bâtiments. Un test refuse tout nom de l'Ouvrage dans le
  tutoriel, et exige que les noms du joueur y soient.
  ⚠ **L'ÉCRAN SE PEINT À L'OUVERTURE, ET SEULEMENT LÀ.** Rien ne peut changer
  pendant qu'on le regarde : toutes les missions portent sur ce que le joueur a
  POSÉ ou AMÉLIORÉ, gestes qui se font sur l'écran de la base. **Ce n'est vrai
  que tant qu'aucune mission ne lit l'ÉCONOMIE** — une mission « accumule 100
  quartz » avancerait sous les yeux du joueur sans que rien ne se redessine.
  Un test balaie `sim/missions.js` pour l'interdire, imports ôtés :
  `data/economie.js` est la table des COÛTS, pas les stocks, et la première
  version de la garde tombait sur cet import légitime.
  ⚠ **QUEL ONGLET S'ALLUME POUR QUEL ÉCRAN EST UNE TABLE, PLUS UNE CONDITION.**
  `session.js` écrivait « actif si ce n'est pas Options », ce qui allumait
  « Base » sur l'écran Mission le jour de son arrivée. `ONGLET_DE_L_ECRAN` le
  dit, et un test exige qu'elle couvre exactement `ECRANS`.
  ⚠ **DEUX ONGLETS MORTS RESTENT — Recherche et Monde — ET ILS SE NOMMENT.**
  Les deux gardes qui les surveillaient les COMPTAIENT, et l'une annonçait
  « Recherche, Monde et Options » alors qu'Options était vivant depuis le lot
  MISE EN PAGE : le message mentait déjà. Un nombre nu ne dit pas lequel des
  trois vient de bouger.

- **LES FLÈCHES DE BASCULE ENTRE BASES SONT UNE COQUILLE, ET ELLES LE DISENT.**
  L'état porte UNE `disposition` : il n'y a structurellement qu'une base. Les
  deux flèches sont désactivées et le libellé « Base 1 / 1 » dit pourquoi. Les
  rendre vives sur du vide promettrait une bascule qui n'existe pas — la faute
  exacte du bouton « Assaut » du lot ÉCRAN-CHANTIER.

- **LA POSE SE FAIT EN DEUX TOUCHERS DEPUIS LE 28/08.** Ethan : « il y a
  d'abord un clic et le bâtiment/sprite transparent, et les flèches bonus
  proximité s'affiche si il y en a, un deux clique pose le bâtiment ». Le
  premier toucher MONTRE — un fantôme et les flèches — et c'est ce temps-là qui
  rend le voisinage visible AVANT qu'on s'engage. Toucher une autre case déplace
  l'aperçu ; toucher la même pose.
  ⚠ **PAS DE TRANSPARENCE POUR LE FANTÔME.** La palette est fermée à
  trente-trois teintes et ne tolère qu'un seul `rgba`, réservé à autre chose. Un
  liseré tireté et un sigle éteint disent « pas encore là » aussi bien, sans
  ouvrir de brèche dans la garde de palette.

- **LES FLÈCHES DE VOISINAGE SE MONTRENT À TROIS MOMENTS, ET UNE SEULE FONCTION
  LES DESSINE** : l'aperçu de pose, le bâtiment en main pendant un déplacement,
  et l'ouverture du panneau — ce dernier demandé tel quel par Ethan. Les écrire
  trois fois donnerait trois lectures du voisinage ; un test compte les appels.
  ⚠ **`voisinsQualifiantsParCase` VIT DANS `sim/disposition.js`**, à côté de
  `voisinsQualifiants` dont elle est la variante « avec les coordonnées ». Elle
  ne dit RIEN de l'écran : ni direction, ni glyphe. Le sens de la flèche se
  décide dans `ui/`, qui seul connaît `render/orientation.js`.
  ⚠ **ET LE COMMENTAIRE DE CE BLOC A ÉTÉ FAUX PENDANT UNE HEURE.** Il affirmait
  que déduire le glyphe du signe de `rangee` « retourne les huit flèches ».
  C'est FAUX, et la falsification l'a montré : avec
  `ligne = longueur + 1 − rangee`, les deux formules donnent le même signe, le
  +19 se simplifiant. Passer par `ligneEcranDeLaRangee` ne corrige rien
  aujourd'hui — ça dit qu'on raisonne en lignes d'écran, et ça restera juste si
  la transformation cesse d'être affine. **La faute qui se commet vraiment est
  l'inversion du signe**, et c'est elle que le test attrape.

- **DÉPLACER UN BÂTIMENT EST LA SEULE ACTION À DEUX TOUCHERS**, et la table le
  dit : `ACTIONS.deplacer.cible` vaut `true`. L'écran LIT ce champ au lieu de
  reconnaître « deplacer » par son nom — un cas particulier écrit à la main
  serait le premier à diverger. Un test refuse un `=== 'deplacer'` dans l'écran.
  ⚠ **`deplacer` MODIFIE LA CASE EN PLACE, JAMAIS PAR `splice` PUIS `push`.**
  `economie.residus` est parallèle à `disposition` : réécrire la liste dans un
  autre ordre décalerait les résidus d'un cran et ferait produire à chaque
  bâtiment le reste de son voisin. Le montage du test porte TROIS bâtiments
  exprès — avec deux, le déplacé est le dernier et un `splice`/`push` le remet
  au même indice, si bien que le test passerait sur du code cassé.
  ⚠ **LES DÉFAUTS PRÉEXISTANTS SONT FILTRÉS, comme pour la pose, et c'est ici
  que ça compte le plus.** Une base peut porter deux uniques voisins, tolérés au
  chargement ; déplacer est précisément ce qui permet de la réparer. Le montage
  déplace un bâtiment INNOCENT pendant que le défaut demeure — éloigner le
  fautif rend la base saine, donc ne distingue pas les deux codes.
  ⚠ **RESTER SUR PLACE EST LÉGAL.** Le refuser obligerait l'écran à connaître
  cette exception, et priverait le joueur de toute annulation.
  ⚠ **DÉPLACER NE COÛTE RIEN**, faute d'arbitrage. En inventer un prix serait
  trancher seul une mécanique de jeu.

- **UN UNIQUE DÉJÀ POSÉ RESTE DANS LA PALETTE, GRISÉ.** Arbitré le 28/08 :
  « griser le bouton, pas le faire disparaître ». La palette perdait une
  vignette à chaque unique posé, donc elle changeait de longueur et les autres
  se déplaçaient sous le doigt entre deux gestes.
  ⚠ **ET LA VIGNETTE GRISÉE RÉPOND QUAND ON LA TOUCHE.** « Un indice n'est pas
  une interdiction » (§4) : un bouton inerte n'apprend rien, un toast qui dit
  « il est unique, et il est déjà posé » apprend la règle.

- ⚠⚠ **LES DEUX BANDES DE LA GRILLE SONT ÉDITABLES DEPUIS LE 28/08, ET ELLES
  PARTAGENT UN SEUL GESTE.** La bande Défense était en lecture seule faute
  d'état à écrire ; `etat.garnison` existe. Elle se compose à la palette, en
  deux touchers, avec fantôme et déplacement gratuit — exactement le geste des
  bâtiments. `TERRAINS` de `ui/chantier.js` porte la SEULE chose qui les sépare.
  ⚠ **UN TEST REFUSE UNE SECONDE IMPLÉMENTATION.** Il compte les occurrences
  des fonctions de geste et refuse tout `=== 'defense'` écrit à la main. Les
  deux bandes vivent dans le même écran, sous le même doigt : deux
  implémentations auraient divergé au premier ajustement, et la divergence se
  lirait comme un bogue de jeu.
  ⚠ **LE PANNEAU DE DÉTAIL NE S'OUVRE PAS SUR UNE PIÈCE DE GARNISON.** Il
  chiffre production, capacité et voisinage, qu'une pièce n'a pas. La table le
  dit par `panneau: false`, et une garde de ceinture empêche `peindrePanneau`
  de se repeindre avec un indice qui pointe dans l'autre liste — `rafraichir`
  passe dix fois par seconde.
  ⚠ **DEUX PLAFONDS SANS RAPPORT, ET IL FAUT DIRE LEQUEL MORD.** Le Chantier
  borne le NOMBRE de bâtiments par ses emplacements, le QG borne les POINTS
  d'armée par son budget. Dire « c'est plein » sans dire de quoi enverrait le
  joueur améliorer le mauvais bâtiment.
  ⚠ **AMÉLIORER ET RÉPARER N'ONT PAS DE MOTEUR EN DÉFENSE, ET LE DISENT.**
  `null` dans la table, pas un bouton inerte — « un indice n'est pas une
  interdiction » (§4). Le COÛT d'une amélioration existe depuis l'arbitrage du
  28/08 ; la mécanique, non : ce que gagne une unité améliorée n'est pas
  arbitré. C'est le prochain trou à combler.
  ⚠ **LA PALETTE SUIT LA BANDE, ET IL A FALLU LE BRANCHER.** `bandeCourante`
  bouge à chaque évènement de défilement, mais la palette n'était repeinte que
  par trois autres chemins : le joueur serait descendu sur la Défense avec les
  vignettes des onze bâtiments sous les yeux. Elle se repeint au changement de
  TERRAIN, et à lui seul — reconstruire dix-sept boutons par pixel les ferait
  clignoter sous le doigt.
  ⚠ **LES SIGLES DE DÉFENSE SONT DISTINCTS DE CEUX DES BÂTIMENTS.** Vingt-huit
  en tout, tous différents : les deux se dessinent sur la MÊME grille. « CHA »
  étant pris par le Chantier, le Chasseur porte « CHS ».

- ⚠⚠ **L'ÉCRAN OFFENSE N'EST PLUS UNE COQUILLE.** Il lit `etat.armee`, il y
  écrit, et son en-tête de fichier a été réécrit — laisser un commentaire qui
  décrit un état révolu est la faute que ce fichier-ci nomme ailleurs.
  ⚠ **SA GRAMMAIRE EST CELLE DU CHANTIER, ET SES MOTS VIENNENT DE LÀ.** Deux
  touchers pour poser ; une unité posée se prend en main, puis se déplace sur
  une case libre ou se retire en retouchant la sienne. Pas de bouton de plus :
  la consigne « tout doit tenir dans l'écran » interdisait une septième barre.
  ⚠⚠ **SA PALETTE GRISAIT-ELLE OU FILTRAIT-ELLE ? ELLE GRISE, DEPUIS LE 29/08,
  ET C'EST UN CHANGEMENT DE DÉCISION.** Elle RETIRAIT ce que le niveau
  verrouille — « une unité qu'on ne peut pas construire n'a pas à occuper
  l'écran », lot 5A. Ethan a rapporté le 29/08 deux unités « indisponibles »
  qu'il attendait : une palette qui CACHE ne peut pas répondre à ça. Les deux
  palettes se comportent donc enfin pareil, et le gain n'est pas cosmétique —
  le joueur voit ce qui existe, la règle du bâtiment de production s'apprend au
  lieu de se deviner, et la palette garde une LONGUEUR FIXE, si bien que les
  vignettes ne se déplacent plus sous le doigt entre deux gestes.
  ⚠ **L'EXPLICATION DU BUDGET ABSENT VA DANS LE REGISTRE `mode`, PAS `session`.**
  `session` est prioritaire dans `ligneAAfficher` : il aurait masqué les refus
  de geste dans le cas exact où ils arrivent — une armée posée puis le QG
  démoli. Et `mode` a le bon ton : métal, pas rouge ; rien n'est cassé, il
  manque un bâtiment.

- **LE COMPTEUR DU BANDEAU PORTE UN NOMBRE DANS LES TROIS CONTEXTES.**
  `CONTEXTES[x].chiffre` vaut `true` partout depuis le 28/08 : le champ dit si
  la grandeur EXISTE, et les points engagés existent maintenant.
  ⚠ **C'EST LA CAPACITÉ QUI DISPARAÎT SANS BÂTIMENT DE COMMANDEMENT, PAS LA
  VALEUR.** Zéro point engagé est un fait vrai et affichable ; c'est le budget
  qui n'existe pas. « 0 / 0 » ferait croire à un plafond atteint.
  ⚠ **LE BUDGET N'EST PAS RECALCULÉ.** Sa formule vit dans les deux éditeurs, et
  `CONTEXTES` porte la FONCTION plutôt qu'une troisième copie.

- **LES TROIS NIVEAUX DU JOUEUR SONT ENFIN TROIS MOYENNES.** `resumeDeLaBase`
  rendait `defense: null, assaut: null` en dur. `niveauDeLaDefense` et
  `niveauDeLArmee` de `sim/niveau-de-base.js` appellent `moyenneEnDixiemes`,
  sans la réécrire.
  ⚠ **UNE SEULE DIVERGENCE AVEC LEUR JUMEAU : LA LISTE VIDE.**
  `niveauDesBatiments` LÈVE dessus — une base sans bâtiment n'existe pas — mais
  une garnison vide et une armée vide sont l'état NORMAL d'une base neuve. Les
  deux rendent `null`, ce que `formaterNiveau` affiche « — ». Zéro se lirait
  « niveau zéro », c'est-à-dire une force posée et nulle.

- **LA CARTE EST DÉRIVÉE, PAS STOCKÉE** — lot CARTE, 29/08. Une base de
  l'Ouvrage est une FONCTION de la graine et de la case : `estBaseOuvrage` de
  `sim/peuplement.js`. Neuf mille trois cents cases pèseraient plus que tout le
  reste de la sauvegarde réunie. Ce qui se journalisera plus tard, ce sont les
  ÉCARTS — un site rasé, un camp qui réapparaît —, jamais la carte.
  ⚠ **LA RÈGLE DES 8 CASES EST LOCALE.** Une case candidate devient une base si
  son hachage DOMINE celui de ses huit voisines candidates : deux voisines ne
  peuvent donc pas gagner ensemble, et le contact est impossible **par
  construction**, sans jamais parcourir la carte. Neuf hachages par case au lieu
  d'un, et zéro passe globale.
  ⚠ **DEUX SELS, ET ILS DOIVENT RESTER INDÉPENDANTS.** Le sel 0 dit « candidate »,
  le sel 1 départage. S'ils rendaient la même valeur, la case la plus susceptible
  d'être candidate serait aussi celle qui gagne ses duels, et les bases se
  regrouperaient au lieu de se répartir. Un test compte les collisions et exige
  zéro.
  ⚠ **LA DENSITÉ SE MESURE HORS DE LA GARDE.** Une fenêtre 12×12 prise dans les
  quinze cases autour du départ porte zéro base par construction ; les compter
  fait tomber la moyenne de 12,2 à 10,8 et donne l'impression d'un réglage faux.
  ⚠ **ET LA GARDE SE MESURE DEPUIS LE DÉPART, QUI EST FIXE** — pas depuis la base
  du joueur. Si elle le suivait, les bases apparaîtraient et disparaîtraient à
  chaque redéploiement, et il faudrait toutes les journaliser. Le joueur
  s'approche des bases ; les bases ne s'écartent pas de lui.

- **LE TERRAIN DE LA PREMIÈRE BASE EST UNE TABLE** — `TERRAIN_INITIAL` de
  `data/base.js`, dessiné par Ethan le 29/08. La question était posée dans
  l'autre sens (« changer le seed de la 1re base ») et la réponse est MESURÉE :
  le terrain ne dépend pas de la graine du monde mais de la seule POSITION, et le
  dessin n'est atteignable par AUCUNE des 9 300 positions — le plus proche en
  diffère de neuf cases.
  ⚠ **LA CLÉ EST LA FONDATION, PAS LA POSITION COURANTE.** Le terrain est gelé à
  la fondation, il voyage avec la base au redéploiement, et il lui survit au
  rasage (« la base garde sa disposition », 29/08). La fondation initiale ne
  change donc jamais, et la table est servie pour toujours. C'est aussi ce qui
  donne à `fondation` son seul rôle actuel : il n'est plus une position sur la
  carte, il est l'IDENTITÉ du terrain. Il redeviendra une position le jour d'une
  deuxième base, et sera alors un champ PAR base — ne pas le supprimer en le
  croyant orphelin.
  ⚠ **`tentatives: 0` DIT « TABLE ».** Écrire 1 ferait passer une table pour un
  tirage réussi du premier coup, et la mesure de `tentativesMax` compterait une
  position qui n'en est pas une.
  ⚠ **LA TABLE EST SOUMISE AUX MÊMES RÈGLES QUE LE TIRAGE**, et un test les lui
  applique — zone, tailles de bloc reconstruites par composantes connexes,
  non-contact entre blocs de même ressource. Une table dispensée des règles serait
  la première à les contredire.

- **LES OBSTACLES SONT DANS LA BANDE DE DÉFENSE, ET NULLE PART AILLEURS** —
  arbitré le 29/08. Ils couvraient les rangées 3 à 18. Le motif est un motif de
  jeu : un obstacle chez les bâtiments mange un emplacement de construction, un
  obstacle en défense ralentit l'assaillant.
  ⚠ **CE CHANGEMENT A DÉPLACÉ SEPT CONSTANTES DE COMBAT MESURÉES**, dans les deux
  sens — le raid T4 de `cible.test.js` passe de 383 à 313 ticks, le raid A de
  `roster.test.js` perd 26 % de butin pendant que B en gagne 6 %. Un allongement
  uniforme n'aurait pas fait ça : dix obstacles sur 72 cases au lieu de 144, tous
  sur le chemin de l'assaut, changent QUI meurt et QUAND.
  ⚠ **ET QUATRE RAIDS SUR 54 TOUCHENT MAINTENANT LE PLAFOND DE 90 SECONDES**, au
  lieu de deux. Aucun n'est un gel — vérifié en portant `dureeMaxCombatSec` à
  600, ils se concluent tous par `attaquants`. Mais l'un d'eux demande **4 645
  ticks, soit 464 secondes** : ce n'est plus un dépassement, c'est un autre
  régime, et c'est à remonter.
  ⚠ **DEUX TIRAGES D'OBSTACLES COEXISTENT**, et il faut le savoir : celui du
  générateur de sites part de la graine du SITE (donc change à chaque instance),
  celui de `obstaclesDeLaBase` part de la CASE (donc tient d'une instance à
  l'autre, ce qu'Ethan a arbitré pour les camps successifs). Les deux devront se
  rejoindre le jour où un site de l'Ouvrage saura d'où il est.

- **LES OBSTACLES SONT DANS L'ÉTAT, ET ILS N'Y SONT PAS SAUVEGARDÉS** — lot
  OBSTACLES, 29/08. `etat.obstacles` est dérivé de la FONDATION comme `champs`,
  et `serialiser` retire les deux. Aucune migration : la sauvegarde n'a pas
  changé d'un octet, `SAVE_VERSION` reste à 7.
  ⚠ **SEULE LA GARNISON EST SUR LE TERRAIN**, et `FORCES[x].surLeTerrain` le dit.
  Les cases de la garnison SONT celles du champ de bataille ; les quatre vagues
  de l'armée sont une grille de COMPOSITION, dont les rangées ne sont pas des
  rangées de la grille. Reconnaître « garnison » par son nom serait le premier
  cas particulier écrit à la main — un test pose une unité sur chaque numéro de
  vague qui coïncide avec une rangée obstruée et exige qu'elle passe.
  ⚠ **`obstacle` ET `superposition` SONT DEUX CODES.** Le joueur déplace ce qui
  occupe ; il ne déplacera jamais un rocher. « Cette case est déjà occupée »
  devant un obstacle l'enverrait chercher une pièce à retirer.
  ⚠ **`obstacle` EST TOLÉRÉ AU CHARGEMENT.** Le cas ne peut plus se créer par le
  jeu, mais il apparaîtra tout seul le jour où le tirage des obstacles changera :
  le terrain se REDÉDUIT à chaque chargement, donc un obstacle peut se poser sous
  une pièce posée légalement la veille. Même raisonnement que `uniques-voisins`.
  ⚠ **LA BANDE DE DÉFENSE N'A PLUS 72 CASES POSABLES MAIS 62.** Le budget maximal
  y tient encore — 290 points, défenseur le moins cher à 5, donc 58 pièces au
  plus — mais la marge est passée de 14 à 4 cases. Le test le CALCULE au lieu de
  réécrire 62 : le jour où `OBSTACLES.nombre` bougera, il suivra.
  ⚠ **LES OBSTACLES NE COMPTENT PAS DANS LES SIX OCCUPANTS PAR RANGÉE.** C'est
  pour ça que `OBSTACLES_DE_BASE.maxParRangee` vaut 2 : neuf colonnes moins deux
  en laissent sept, donc les six restent atteignables partout. Les faire compter
  serait l'autre solution ; ce n'est pas celle-là qui a été retenue.

- **LES SATELLITES SONT DE L'HISTOIRE, PAS UNE FONCTION** — lot SATELLITES,
  29/08. `sim/peuplement.js` recalcule les bases de l'Ouvrage à partir de la
  graine ; `etat.satellites` ne peut pas se recalculer, parce qu'il dépend de ce
  que le joueur a FAIT — où il s'est posé, quand, combien de fois il a rasé le
  même camp. C'est le premier champ du dépôt qui porte de l'histoire, et il est
  SAUVEGARDÉ. `SAVE_VERSION` passe à **8**.
  ⚠ **AUCUN TIRAGE NE PASSE PAR `etat.rng`, ET C'EST UNE CONTRAINTE DE
  CORRECTION.** `rattraperJeu` est ANALYTIQUE : il avance de mille ticks d'un
  coup là où `tickJeu` en fait mille. La graine d'une apparition se dérive donc
  de la partie et du NUMÉRO D'INSTANCE, qui sont les mêmes des deux côtés.
  ⚠⚠ **ET LE TEST DES DEUX CHEMINS NE TIENT PAS CETTE RÈGLE — MESURÉ.** Remplacer
  la graine dérivée par `etat.rng` laissait la suite ENTIÈREMENT VERTE : rien
  d'autre ne consomme le flux pendant un tick aujourd'hui, donc les deux chemins
  le consomment identiquement. C'est un test DÉDIÉ qui la mesure, en comparant
  l'état du flux avant et après une apparition. Trois des quatre falsifications
  de ce lot sont passées vertes au premier essai ; les trois tests qui les
  attrapent ont été écrits après.
  ⚠ **`resoudreSatellites` NE BOUCLE PAS PAR TICK**, elle ne lit que l'horloge
  courante. C'est ce qui la rend compatible avec le rattrapage — et c'est aussi
  pourquoi elle ne peut RIEN faire qui dépende de l'instant précis d'une
  apparition. Le jour où ce sera nécessaire, cette équivalence tombe.
  ⚠ **LE NUMÉRO D'INSTANCE EST TOUT LE JOURNAL, ET IL TIENT DANS UN ENTIER.** Le
  terrain d'un camp se dérive de la CASE, ses bâtiments de la case ET de
  l'instance : deux camps successifs au même endroit ont les mêmes champs et une
  autre disposition, ce qu'Ethan a arbitré le 29/08. Stocker les bâtiments serait
  ranger ce qu'on sait recalculer. ⚠ Le compteur ne se remet JAMAIS à zéro, pas
  même à un déménagement — un test refuse un `presents[].instance` au-delà de
  `prochaineInstance`, qui est la forme que prendrait cette faute.
  ⚠ **UNE ATTENTE NON SATISFAITE SE REPORTE, ELLE NE SE PERD PAS.** Un anneau
  saturé de bases de l'Ouvrage est possible ; jeter l'attente ferait disparaître
  un camp en silence.
  ⚠ **LA MIGRATION 7 → 8 PROGRAMME, ELLE NE POSE PAS.** Poser d'office mettrait
  trois sites sur la carte à l'instant du chargement, en sautant les cinq minutes
  arbitrées, et le joueur les verrait apparaître pendant qu'il regarde ailleurs.
  Elle compte l'échéance depuis `horloge.nbTicks` de la SAUVEGARDE, pas depuis
  zéro : sinon une partie vieille de deux heures verrait paraître ses trois
  satellites au chargement.

- **DEUX CHOSES NE SONT PAS ARBITRÉES DANS CE LOT, et le code le dit** : le
  DÉLAI et la CASE d'un respawn. Ethan a dit « respawn automatique », sans plus.
  Retenu : le même délai de cinq minutes et un nouveau tirage dans l'anneau —
  c'est le même mécanisme rejoué. Les deux tiennent en une ligne chacun.
  Troisième lecture plutôt qu'arbitrage : **les anciens satellites disparaissent
  au déménagement**, parce que la spec §10 indexe l'avant-poste sur « le rayon et
  la PRÉSENCE du joueur ». Si Ethan veut qu'ils restent, c'est
  `planifierSatellites` qui change, et elle seule.

- ⚠⚠ **LE FOND DE CARTE N'EST PAS DE LA COMPOSITION ALPHA, ET C'EST TOUT LE LOT
  ÉCRAN-CARTE.** Le pavage accumule à la main dans un `Float32Array` et rend
  `μ + (Σ wᵢ·(tᵢ − μ)) / √(Σ wᵢ²)`. `drawImage` avec `globalAlpha` calcule
  `Σwᵢtᵢ / Σwᵢ`, ce qui divise l'écart-type par √N : le fond devient plat.
  Mesuré sur le dépôt, écart-type de luminance d'une dalle — **19,6 avec la
  formule contre 15,1 en alpha ordinaire**, aux quatre crans. Le chemin alpha
  existe dans le module sous une option, et il n'existe QUE pour que le test le
  mesure : sans lui, « ce n'est pas de l'alpha » serait une opinion.
  ⚠ **LE RACCOURCI A ÉTÉ ESSAYÉ ET IL NE MARCHE PAS** : composer en alpha puis
  répartir par quintiles amplifie le bruit au lieu de rendre le relief.
- **L'ATLAS EST DÉJÀ QUINTILÉ, LA SORTIE NE L'EST PAS.** Mesuré : les cinq
  indices de `atlas-terrain-64.png` couvrent 20,0 % de sa surface chacun, moyenne
  2,000, écart-type √2. Mais la SORTIE est la somme pondérée d'environ cinq
  tuiles, donc à peu près gaussienne : découper avec les seuils de l'atlas
  (0,5 · 1,5 · 2,5 · 3,5) donnerait 14 % aux teintes extrêmes et 28 % au milieu.
  `TERRAIN_CARTE.seuilsDeTeinte` porte les quintiles de la sortie, relevés sur
  2 949 120 pixels, et un test refait la mesure — 20 % ± 2 par teinte.
  ⚠ **ET LES SEUILS SONT GLOBAUX, PAS PAR DALLE.** Le brief dit « par quantiles
  sur la dalle » ; des seuils calculés dalle par dalle feraient deux découpages
  différents de part et d'autre d'un bord, donc une couture — et casseraient
  l'invariant qui compte le plus, celui qui veut qu'une zone rendue en une dalle
  soit identique à la même rendue en quatre. C'est le seul écart au brief du lot,
  et il est mesuré : les quatre crans s'accordent à 0,05 près sur ces seuils.
- **L'INDICE DE TEINTE EST LA LUMINANCE, À UNE TRANSFORMATION AFFINE PRÈS.**
  L'atlas est indexé sur la rampe du joueur ; ses cinq tons ont des clartés
  régulières (L* 58,1 · 62,9 · 68,0 · 73,0 · 77,9, pas de 4,95 ± 0,15). La
  formule et les quantiles étant invariants par transformation affine, travailler
  sur l'indice 0–4 donne EXACTEMENT le même découpage qu'une luminance en 0–255,
  pour un quart du travail. Et c'est ce qui permet aux deux rampes de partager le
  même atlas : le camp choisit la rampe, l'indice ne bouge pas.
- **`hachageBrut` EST LE HACHAGE DE `sim/peuplement.js`, RENDU EN ENTIER.**
  `hachageDeCase` le divise par 2³² ; le pavage a besoin de BITS. En écrire un
  second aurait mis deux tirages voisins dans le dépôt, tous deux « FNV, à peu
  près », dont un seul serait testé.
  ⚠ **UN HACHAGE FAIT TRENTE-DEUX BITS, ET ILS SE COMPTENT AVANT DE SE
  DÉCOUPER.** Le pavage veut deux décalages (16 bits chacun), un numéro de tuile
  (6), une rotation (2), un miroir (1) et un tirage d'appartenance : quarante-neuf
  bits. D'où DEUX sels. Lire un champ dans `h >>> 29` n'en laisse que trois, donc
  une valeur toujours minuscule — c'est la faute qui faisait basculer *toutes* les
  tuiles du même côté pendant la maquette, et elle s'est vue à l'œil, pas par
  relecture. Un test mesure la distribution de chaque champ, avec l'appât qui va
  avec.
- **LE PAS DU RÉSEAU EST PLUS PETIT QUE LA TUILE, ET C'EST CE QUI BOUCHE LES
  TROUS.** 56 px source pour une tuile de 128. Le masque tombe à zéro au bord
  d'une tuile : à 84 px de pas, des pixels ne sont couverts par AUCUNE tuile et le
  fond rend du noir. `rendreDalle` rend `couvertureMin` — le plus petit `Σw` de la
  dalle — pour qu'un test puisse mesurer que le plancher NE MORD PAS. Mesuré :
  0,165 au plus bas, sur quatre crans et trois graines.
  ⚠ **ET C'EST CETTE MESURE QUI GARDE, PAS « AUCUN PIXEL NOIR ».** Falsifié : à
  84 px de pas, la garde `Σw ≤ 0` rend la teinte moyenne, donc l'image n'a
  TOUJOURS aucun pixel noir et le test des couleurs reste vert. Seule la
  couverture tombe à zéro, et c'est elle qui le dit.
- **LA PART D'OUVRAGE DU SOL EST UNE PROPOSITION, PAS UN ARBITRAGE.** Une tuile
  est de l'Ouvrage avec la probabilité `(niveau(rangée du centre) − 1) / 49`, puis
  chaque pixel prend la rampe de la majorité pondérée. Mesuré : 0,0 % au bord bas,
  **4,2 % à la rangée de départ du joueur**, 47,7 % au milieu, 100 % dès la
  rangée 50. Elle vit dans `data/` avec ce commentaire, et une ligne suffit à la
  changer.

- ⚠⚠ **L'ONGLET MONDE EST VIVANT DEPUIS LE LOT ÉCRAN-CARTE (29/08), ET IL NE
  RESTE QU'UN ONGLET MORT : RECHERCHE.** L'écran porte un canevas, quatre crans
  de zoom, le défilement au doigt, le pavage du fond et les emblèmes des sites.
  Il ne calcule AUCUNE donnée de jeu : les bases de l'Ouvrage viennent de
  `basesDeLaFenetre`, les camps de `satellites.presents`, le niveau d'une rangée
  de `sim/carte.js`, les bornes et les crans de `data/sites.js`.
  ⚠ **`basesDeLaFenetre` REND UNE FENÊTRE, PAS LA CARTE.** Elle rogne d'elle-même
  sur les bords et se rappelle à chaque changement de vue. Ne jamais l'appeler
  sur les 9 300 cases : au cran le plus large la fenêtre en fait moins de 1 500.
  ⚠⚠ **ET LE NIVEAU DU JOUEUR N'EST PAS CELUI DE SA RANGÉE.** Le panneau de sa
  base affiche « — trois moyennes, sur l'écran Base », jamais le niveau de la
  rangée 295. C'est la faute que `sim/carte.js` existe pour empêcher, et un test
  refuse que ce nombre apparaisse dans cette ligne.
- **LE PANNEAU D'UN SITE NE PORTE AUCUN BOUTON D'ACTION, ET C'EST UNE RÈGLE.**
  Type, niveau, distance, position — et rien d'autre : le raid n'existe pas. Un
  bouton « Attaquer » serait le bouton « Assaut » du lot ÉCRAN-CHANTIER, qui
  promettait un éditeur et livrait du sol nu. Un test balaie le bloc du panneau
  dans le HTML PRODUIT et exige qu'il n'y ait que « Fermer ».
- **LES EMBLÈMES SONT DES GABARITS, ET ILS LE DISENT.** Les treize emblèmes du
  lot 6 sont spécifiés par `INVENTAIRE-SPRITES.md` et aucun fichier n'existe : un
  site se dessine en carré arrondi, bord, lettre, et la lettre n'apparaît qu'à
  partir de 40 px CSS par case.
  ⚠ **LE BORD ROUGE EST RÉSERVÉ À CE QUI ATTAQUE LE JOUEUR**, et c'est une
  information de jeu. Un test croise `EMBLEMES_CARTE` et `TYPES_SITE` :
  l'ensemble des bords rouges DOIT être exactement celui des
  `attaqueLeJoueur`. Camp et avant-poste sont en ambre parce qu'ils sont du
  butin, pas une menace.
- **L'ÉCRAN N'AJOUTE AUCUNE BARRE À HAUTEUR FIXE**, et c'est la consigne « tu
  compresses tout dans l'UI » appliquée. Les deux boutons de zoom et le panneau
  de site se POSENT sur la carte, en `absolute` : le chrome fixe reste à 288 px et
  sa garde ne bouge pas. Le canevas porte `touch-action: none`, sans quoi le
  navigateur avale le glissement pour faire défiler la page.
- **LE DÉFILEMENT SE GARDE EN FLOTTANT, LE DESSIN SE FAIT EN ENTIERS.** Un
  `drawImage` à une position fractionnaire rééchantillonne la dalle et rend le
  pixel art flou. Arrondir la position de vue elle-même perdrait un demi-pixel par
  évènement de glissement, et la carte traînerait derrière le doigt.
  ⚠ **ET CE QUI TIENT ENTIER SE CENTRE, IL NE SE COLLE PAS À GAUCHE.** Au cran le
  plus large les 31 colonnes tiennent dans 331 px CSS sur les 360 d'un téléphone :
  borner à zéro laisserait une bande vide d'un seul côté, ce qui se lit comme un
  bord de carte qui n'existe pas.
- **UNE DALLE COÛTE CHER, ET LE CACHE N'EST PAS « FENÊTRE + MARGE ».** Une dalle
  de 512 demande 1,37 million d'accumulations — mesuré à **19 ms ici, dans Node,
  et non sur l'appareil**. Le cache garde trente dalles, à éviction de la moins
  récemment employée, et se VIDE au changement de cran : une dalle est un rendu à
  un cran donné. Avec une marge plutôt qu'un cache, chaque franchissement de bord
  referait près de 7 000 poses de tuile, puis encore au retour.
  ⚠ **AU PLUS DEUX DALLES PAR IMAGE.** Un défilement qui traverse un bord en
  réclame trois d'un coup ; les calculer dans la même image ferait un à-coup de
  trois fois 19 ms. Ce qui manque se peint de la teinte MOYENNE de son camp —
  jamais du noir — et se complète à l'image suivante.
- ⚠ **LE TEMPS DE RENDU D'UNE DALLE SUR L'APPAREIL N'A PAS ÉTÉ MESURÉ**, et le
  brief le demandait. Il n'y a pas d'appareil ici, et un test appareil non exécuté
  se déclare non exécuté (§3). Si les 30 ms sont dépassées sur le téléphone, le
  curseur à tourner est `TERRAIN_CARTE.dalleCotePx` — 512 → 256 divise l'à-coup
  par quatre à travail total constant, et il faut alors monter `dallesEnCache` de
  30 à 64 pour tenir la même fenêtre. Le pas du réseau est le MAUVAIS curseur : il
  décide de la couverture, donc du noir.
- **L'ATLAS SE DÉCODE À LA PREMIÈRE OUVERTURE DE LA CARTE, PAS AU DÉMARRAGE.**
  Un million de pixels à relire coûte quelques millisecondes ; les dépenser au
  lancement pour un écran que le joueur n'ouvrira peut-être pas retarderait
  l'affichage de sa base. Même raisonnement qu'`initialiserBanc`.
  ⚠ **ET LA CARTE SE RETIRE DE LA SCÈNE QUAND ON LA QUITTE.** C'est le seul écran
  qui porte une boucle à lui. `montrerEcran` appelle `masquer()` sur tout autre
  écran ; un test exige la branche `else` NUE — sa première version cherchait le
  nom de l'appel n'importe où, et une falsification qui l'enfermait dans un
  `if (false)` passait au vert.
- **`rafraichir` NE REDESSINE QUE SI LES SATELLITES ONT BOUGÉ.** La session
  l'appelle dix fois par seconde ; refaire la liste des sites coûte neuf hachages
  par case de la fenêtre pour redessiner exactement la même image. Le fond, lui,
  est une fonction de la graine : il ne change jamais.

- ⚠⚠ **LE CHANTIER PLAFONNE LE NIVEAU DE TOUTE LA BASE** — arbitré le 29/08 par
  Ethan : « le chantier de construction définit le niveau max des bâtiments.
  Donc aucun bâtiment ne peut avoir un niveau supérieur à celui du chantier. »
  C'est ce qui fait du Chantier le rythme de la partie : on ne monte plus rien
  tant qu'il n'est pas monté lui-même. Code `plafond-chantier`, dans
  `problemesDeLAmelioration`.
  ⚠ **IL NE SE PLAFONNE PAS LUI-MÊME.** Il EST la référence ; lui appliquer la
  règle le figerait à son niveau de départ, et plus rien ne monterait jamais.
  ⚠ **ET CE N'EST PAS UNE RÈGLE DE `verifierEtat`.** C'est une règle
  d'AMÉLIORATION : aucune sauvegarde ne devient illisible, aucune migration
  n'est due, `SAVE_VERSION` reste à 8.
- **LE CHANTIER DÉFINIT AUSSI LES TEMPS DE RÉPARATION** — même arbitrage.
  `REPARATION_BASE_JOUEUR.indexeeSur` NOMME le bâtiment, comme `POINTS_ARMEE`
  nomme déjà celui de chaque budget.
  ⚠ **MAIS LA COURBE N'EST PAS DONNÉE, DONC ELLE N'EST PAS ÉCRITE.** Ethan a dit
  QUI décide, pas de combien. `courbe: null`, et un test l'asserte de face :
  inventer un barème le figerait sous l'apparence d'une donnée relevée, ce qui
  est la faute que §6 raconte déjà pour la pente de `data/niveaux.js`.
- ⚠⚠ **LA TABLE D'EMPLACEMENTS DU CHANTIER EST DICTÉE, NIVEAU PAR NIVEAU**
  (29/08) : **3 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 19 · 20** pour les dix
  premiers. Les écarts ne se résument pas — +3, +3, puis +2 six fois, puis +1
  deux fois — et aucune expression close ne les rend. On écrit les dix.
  ⚠ **AU-DELÀ DE DIX, RIEN N'A CHANGÉ** : un par niveau, plafond 40 au niveau 30.
  La table rejoint l'ancienne courbe exactement au niveau 10, à 20 des deux
  côtés, si bien que les niveaux 11 à 50 rendent les mêmes nombres qu'avant.
  ⚠ **CE QUI A CHANGÉ POUR LE JOUEUR, C'EST LE DÉBUT DE PARTIE.** DEUX
  emplacements libres au niveau 1 au lieu d'un, et le niveau 3 suffit aux sept
  obligatoires là où il fallait le niveau 4.
- ⚠⚠ **UNE UNITÉ NE SE CONSTRUIT PAS SANS SON BÂTIMENT DE PRODUCTION** — arbitré
  le 29/08 : « Infanterie inconstructible sans caserne. Même règle pour véhicule
  et avion. » `BATIMENT_DE_CHASSIS` de `data/base.js` porte les trois lignes ;
  la question se pose à `batimentDeProductionManquant` de `sim/state.js`.
  ⚠ **LA CLÉ EST LE CHÂSSIS, PAS LE NOM DE L'UNITÉ.** `UNITES[x].chassis` classe
  déjà les quatorze en escouade / blindé / aéronef : la règle tient en trois
  lignes, pas quatorze, et une unité qui arriverait demain en hérite.
  ⚠ **ELLE VAUT POUR LES DEUX FORCES, ET C'EST UNE LECTURE.** Ethan a énoncé une
  règle sur les UNITÉS, sans dire « à l'assaut » ni « en garnison » : la
  restreindre à un écran aurait été le choix arbitraire. Les six ouvrages fixes
  et les trois artilleries ne sont pas dans `UNITES`, n'ont pas de châssis, et ne
  sont donc pas concernés — un mur n'a jamais eu besoin d'une caserne.
  ⚠⚠ **ET ELLE N'EST PAS DANS `verifierEtat`, EXACTEMENT COMME LE BUDGET.** Elle
  peut devenir fausse SOUS une composition déjà posée — la Caserne démolie, ou
  tombée au raid — et refuser le chargement rendrait la partie injouable pour une
  faute que le joueur n'a pas commise. On SIGNALE au geste, le joueur purge.
  C'est aussi ce qui évite une migration.
- **« GUARDIAN ET PALADIN INDISPONIBLES » — CE QUI A ÉTÉ FAIT, ET CE QUI NE L'A
  PAS ÉTÉ.** Mesuré : `ratisseur` (Guardian) apparaît au niveau **18**,
  `busard` (Paladin) au niveau **14**, et l'ancienne palette les RETIRAIT en
  dessous. Elle les montre maintenant, éteints, avec la raison — « apparaît au
  niveau 18 », « sans Aérodrome, pas d'avion ». **Les seuils eux-mêmes n'ont pas
  été touchés** : ils viennent de `RELEVE-TA-ARSENAL.md` et `UNITES` fait foi
  (§6, arbitré le 24/08). Si Ethan voulait dire que les seuils sont faux, c'est
  un arbitrage de données qui reste à rendre.
- ⚠⚠ **L'ÉCRAN OFFENSE A UNE BARRE CONTEXTUELLE DEPUIS LE 29/08.** Ethan : « on
  ne peut pas supprimer une unité en cliquant dessus. D'ailleurs les boutons
  réparer, améliorer etc. n'apparaissent pas dans le menu offense. » L'écran
  retirait bien une unité — en DEUX touchers implicites qu'aucun bouton
  n'annonçait. C'est la barre du Chantier, aux mêmes quatre boutons et au même
  modèle « armer puis toucher », avec les mêmes quatre règles.
  ⚠ **« RETIRER », PAS « DÉMOLIR ».** On ne démolit pas des Fusiliers.
  ⚠ **RÉPARER ET AMÉLIORER N'ONT TOUJOURS PAS DE MOTEUR, ET LE DISENT.** `null`
  dans `ACTIONS_ARMEE`, pas un bouton inerte.
  ⚠ **ET LE CHROME DE L'OFFENSE FAIT EXACTEMENT 288 PX, comme celui du
  Chantier** : 40 + 44 + 26 + 46 + 86 + 46. La garde de `chantier.test.js` somme
  désormais les deux écrans.
  ⚠ **LES MESSAGES DE REFUS NOMMENT CE DONT ILS PARLENT.** `actionSansMoteur`
  disait « pour la défense » en dur et `PAS_DE_REPARATION` « aucun bâtiment » :
  juste tant que la barre n'existait qu'au Chantier, faux dès qu'elle est apparue
  à l'Offense. Le terrain donne le CONSTAT ENTIER — « aucune unité n'est
  endommagée » — et non le seul nom : recomposer une phrase française morceau par
  morceau a produit « aucun unité », puis « aucune unité n'est endommagé », en
  deux essais. Les deux se sont vues à l'essai, pas à la relecture.
- ⚠⚠ **LES FLÈCHES DE VOISINAGE SONT UN TRAIT ÉPAIS DE CENTRE À CENTRE** —
  Ethan, 29/08 : « les flèches de la base (collecteur raffinerie) sont bien trop
  petites. Elle doit partir du centre d'une case à l'autre. Trait épais. » Ce qui
  existait était un GLYPHE de 11 px posé dans un coin de la case voisine :
  lisible sur une capture de bureau, invisible au doigt sur un téléphone.
  ⚠ **UN TRAIT RELIE DEUX CASES, IL NE PEUT DONC PAS VIVRE DANS UNE CASE.** D'où
  un calque SVG posé sur `#chantier-grille`, dont le `viewBox` prend la CASE pour
  unité : l'épaisseur est une fraction de case (0,16) et suit la taille de
  l'appareil, là où un nombre de pixels serait gros sur un petit écran et maigre
  sur un grand.
  ⚠ **`pointer-events: none`, SANS EXCEPTION.** Un trait posé par-dessus une case
  qui avalerait le toucher serait la même faute que le `transform: scale()` que
  le dépôt interdit sur la grille : le doigt se décrocherait de la case qu'il
  vise. Un test l'asserte.
  ⚠ **LE GLYPHE SURVIT DANS L'INFOBULLE, ET UN TEST LES ACCORDE.** Le glyphe est
  le LIBELLÉ de la flèche, le couple départ/arrivée est son DESSIN : deux
  représentations d'un fait, donc une garde qui les compare plutôt qu'une
  duplication laissée seule.
- ⚠ **L'ESPACE DE NOMS SVG EST LA SEULE URL TOLÉRÉE DU LIVRABLE.**
  `http://www.w3.org/2000/svg` est l'argument obligatoire de `createElementNS` :
  un IDENTIFIANT, jamais une adresse — rien n'est téléchargé depuis là. La garde
  offline de `tools/build.js` et T10 le retirent à l'identique et refusent tout
  le reste, `w3.org` compris. **Ne pas contourner en assemblant l'URL à
  l'exécution** : ce serait passer sous un garde-fou en silence, comme les hex à
  trois chiffres.

- ⚠⚠ **LE TUTORIEL A UNE MINI-FENÊTRE EN BAS DE L'ÉCRAN DE LA BASE, ET ELLE EST
  DANS LE FLUX.** Ethan, 29/08 : « faire apparaître les missions en bas au début
  du jeu, au-dessus des boutons améliorer etc. Sous la forme d'une mini fenêtre.
  Texte court, compteur d'objectif. Le joueur peut quitter le tuto grâce à une
  croix comme n'importe quelle fenêtre. Il le retrouve dans l'onglet mission. »
  ⚠⚠ **ÉCRITE EN `position: absolute`, ELLE AVALAIT LE TOUCHER — MESURÉ, PAS
  SUPPOSÉ.** Posée sur `#chantier-champ` comme le panneau de détail, elle
  couvrait le bas de la grille : dans un navigateur, `elementFromPoint` sur la
  première case légale rendait `#tuto-objectifs`, et **poser un Collecteur était
  devenu impossible** — c'est-à-dire la première mission du tutoriel que la
  fenêtre venait d'annoncer. C'est la faute que le dépôt interdit déjà au calque
  des traits (`pointer-events: none`) et au `transform: scale()` de la grille.
  Elle PREND donc sa place : `#chantier-champ` est une colonne, `#chantier-defile`
  absorbe ce qui reste, la grille se fait plus courte et défile.
  ⚠ **ELLE N'EST PAS UNE SEPTIÈME BARRE**, et la nuance porte la consigne « tu
  compresses tout dans l'UI ». Sa hauteur vaut une, deux ou trois lignes
  d'objectif — `flex: 0 0 auto`, jamais `0 0 Npx` — donc elle n'entre pas dans
  les 288 px de chrome, et elle disparaît quand le tutoriel est fini. La garde
  des 288 px énumère les hauteurs FIXES et serait restée muette : c'est un test
  de `missions.test.js` qui tient celle-là.
  ⚠ **LE PANNEAU DE DÉTAIL PASSE TOUJOURS DEVANT**, puisqu'il est en `absolute`
  dans le même champ : il répond à un geste, la fenêtre est un rappel permanent.
  ⚠ **LES DEUX VUES VIVENT DANS `ui/mission.js`**, la mini-fenêtre et l'onglet.
  Les écrire séparément aurait donné deux formatages du même compteur.
  ⚠ **ET LE TITRE NE SE RÉPÈTE PAS AU-DESSUS DE SES PROPRES OBJECTIFS.** Le
  titre est COMPOSÉ des libellés d'objectif ; l'écrire puis les lister donnait
  « Collecteur sur quartz / Collecteur sur quartz 0 / 1 ». Vu à l'essai dans un
  navigateur, pas à la relecture.

- ⚠⚠ **LA CHAÎNE DU TUTORIEL EST DICTÉE, ET ELLE VIT DANS `data/missions.js`.**
  Dix-sept missions données par Ethan le 29/08, avec leurs niveaux visés et
  leurs comptes : c'est du CALIBRAGE, donc §4 le veut dans `src/data/`.
  `sim/missions.js` les INTERPRÈTE et ne porte aucun de ces nombres — un test
  balaie le moteur et refuse tout identifiant ou nom de la chaîne.
  ⚠ **LE TITRE D'UNE MISSION N'EST ÉCRIT NULLE PART**, il est composé des
  libellés de ses objectifs, eux-mêmes tirés de `nom.joueur` et des niveaux de
  la table. Seules les missions sans moteur portent un libellé de la main
  d'Ethan : il n'y a rien à en dériver. Un test l'asserte dans les deux sens.
  ⚠ **LE COMPTEUR EST PAR OBJECTIF, ET SON DÉNOMINATEUR PEUT BOUGER.** « chaque
  bâtiment au niveau 5 » compte les bâtiments POSÉS : poser du neuf le fait
  monter, donc DÉCOCHE une mission de mise à niveau déjà faite. C'est « rien
  n'est mémorisé » vu de l'autre côté, pas un défaut de calcul — la chaîne le
  fait vraiment, entre les missions 7 et 8.
  ⚠ **ELLE TIENT EXACTEMENT DANS SES EMPLACEMENTS, SANS UNE CASE DE MARGE** :
  douze bâtiments pour les douze qu'un Chantier de niveau 5 ouvre. Une mission
  de plus rendrait le tutoriel infinissable.
  ⚠⚠ **ET LA GARDE QUI LE VÉRIFIE EST PASSÉE VERTE SUR DU CODE CASSÉ, AU PREMIER
  ESSAI.** Elle jouait un montage écrit à la main dans le test : ajouter deux
  bâtiments à `data/missions.js` ne le changeait pas, donc elle ne voyait rien.
  Elle lit maintenant la CHAÎNE — ce que les objectifs exigent depuis le début
  contre ce que les Chantiers déjà demandés ont ouvert. **Un montage écrit à la
  main ne garde que lui-même.**

- ⚠⚠ **QUATRE MISSIONS N'ONT PAS DE MOTEUR, ET ELLES LE DISENT DE FACE.**
  Détruire un camp, se rapprocher des bases de l'Ouvrage, détruire une base,
  construire une seconde base : le raid, le redéploiement et la seconde base
  n'existent pas dans le dépôt au 29/08. Les taire aurait amputé la feuille de
  route d'Ethan ; les compter aurait donné un compteur qui n'atteint jamais son
  plafond, c'est-à-dire le tutoriel infinissable que §6 nomme déjà.
  ⚠ **ELLES SONT AFFICHÉES, MARQUÉES `⋯`, ET SANS COMPTEUR.** « 0 / 1 » sur une
  ligne qu'aucun geste ne peut cocher se lirait comme un retard du joueur.
  ⚠ **LE DÉNOMINATEUR EST CELUI DES VÉRIFIABLES — 13 SUR 17** — et il grandira
  tout seul le jour où le raid arrivera : c'est la ligne de `data/missions.js`
  qui change, et rien d'autre.

- ⚠⚠ **LA CHAÎNE DEMANDE DES PIÈCES QUE SES PROPRES NIVEAUX N'OUVRENT PAS, ET
  C'EST MESURÉ.** L'Éclaireur (`ratisseur`) apparaît au niveau **18** du Centre
  de commandement, que la chaîne ne fait monter qu'au **7** ; le Mur de défense
  (`merlon`) au **6** et la Tourelle mitrailleuse (`casemate`) au **8** du QG de
  défense, que la chaîne ne fait monter qu'au **5**. Le joueur PEUT y arriver —
  rien ne l'empêche de monter plus haut — mais le tutoriel ne le lui dit pas.
  ⚠ **LES SEUILS N'ONT PAS ÉTÉ TOUCHÉS.** `UNITES` et `DEFENSES` font foi (§6,
  arbitré le 24/08) ; les baisser serait un arbitrage de données, et il reste à
  rendre. C'est la même tension que « Guardien et Paladin indisponibles » du lot
  RETOURS-ETHAN, vue une deuxième fois.
  ⚠ **CE QUI A ÉTÉ FAIT À LA PLACE : LE TUTORIEL LE DIT.** Chaque mission
  d'effectif porte des PRÉREQUIS dérivés — l'apparition lue dans la table et le
  bâtiment de production lu dans `BATIMENT_DE_CHASSIS` — au lieu de laisser le
  joueur chercher pourquoi sa palette reste grise. Le jour où Ethan descend un
  seuil, la phrase suit toute seule, et un test l'asserte contre les tables.

- ⚠⚠ **`SAVE_VERSION` VAUT 9 : L'ÉTAT PORTE `tutoriel`, ET CE N'EST PAS DE LA
  PROGRESSION.** Ce qui est FAIT se recalcule depuis la base à chaque demande et
  n'est écrit nulle part — c'est la règle du 28/08, intacte. Ce qui est écrit,
  c'est « j'ai quitté le tuto » : une décision du joueur qu'aucune base ne peut
  exprimer, donc de l'histoire, au même titre que `satellites`.
  ⚠ **LA MIGRATION 8 → 9 AJOUTE `{ ferme: false }` ET RIEN D'AUTRE.** Une
  sauvegarde v8 n'a jamais eu de croix à cliquer ; la déclarer fermée priverait
  son joueur du tutoriel pour un geste qu'il n'a pas fait. Même genre que la
  v6 → v7 : elle ajoute un champ neuf avec sa valeur neutre.
  ⚠ **`tutorielEstFerme` LÈVE SI LE CHAMP MANQUE**, elle ne rend pas `false` par
  défaut : un défaut par tolérance rouvrirait la fenêtre au joueur qui l'a
  fermée, sans que rien ne le dise.
  ⚠ **L'ÉCRAN N'ÉCRIT PAS DANS L'ÉTAT** : `reglerTutoriel` est dans
  `sim/state.js`, comme `poser` et `ameliorer`. Deux vues touchent ce champ — la
  croix et le bouton de l'onglet Mission — et sans elle chacune l'aurait écrit
  de son côté.
  ⚠ **ROUVRIR CHANGE D'ÉCRAN.** Rouvrir en restant sur l'onglet Mission ne
  montrerait rien : la fenêtre redemandée est en bas d'un AUTRE écran, et le
  joueur croirait le bouton mort.

- **LA MINI-FENÊTRE SE RAFRAÎCHIT À CHAQUE IMAGE, L'ONGLET À L'OUVERTURE.** La
  différence est voulue : l'onglet, on l'ouvre exprès, et rien ne bouge pendant
  qu'on le regarde ; la fenêtre est sous les yeux du joueur PENDANT qu'il pose.
  ⚠ **MAIS ELLE NE SE RECONSTRUIT QUE QUAND SON CONTENU CHANGE.** `rafraichir`
  passe dix fois par seconde ; refaire les nœuds à chaque passage les ferait
  clignoter sous le doigt. `signatureDuTutoriel` décide, et elle porte les
  LIBELLÉS et pas seulement l'identifiant de la mission — un dénominateur qui
  bouge sans changer de mission serait resté figé à l'écran.
  ⚠ **ET UN SEUL POINT D'APPEL RAFRAÎCHIT L'ÉCRAN DE LA BASE ET SA FENÊTRE.**
  `rafraichirLaBase` de `session.js` : les trois instants sont les mêmes — chaque
  image, un retour de veille, un chargement — et trois paires d'appels côte à
  côte finissent toujours par n'en être plus que deux.

- **LE LIBELLÉ N'EST PAS LA CLÉ, ET LES TROIS MOYENNES L'ONT RAPPELÉ.** Les
  objectifs de niveau moyen affichaient « armee en moyenne au niveau 6,0 » — la
  clé de code, sans accent, sous les yeux du joueur. Même faute qu'`axe` contre
  `axeLibelle` dans `data/combat.js`, et elle ne se voit qu'à l'écran : un test
  balaie désormais tous les textes du tutoriel et refuse les clés connues.

### Sur les sprites et les atlas

- ⚠⚠ **UN ATLAS EST UN FICHIER COMMITÉ, IL NE SE RECOUD PAS TOUT SEUL — ET SA
  PÉREMPTION EST MUETTE.** Le lot BÂTIMENTS-1024 (30/08) a régénéré les seize
  sprites de `art/sprites/bâtiment/64/` ; `art/sprites/atlas-batiment-64.png`,
  lui, porte des PIXELS, et il est resté celui de la veille. **Mesuré, pas
  supposé** : dans cet état, `npm run check` rendait **559 pass / 0 fail** et
  `dist/index.html` ne bougeait pas d'un octet. Le jeu aurait affiché l'ANCIEN
  dessin pendant que le dépôt portait le nouveau.
  ⚠ **AUCUNE GARDE EXISTANTE NE POUVAIT LE VOIR, et il faut savoir pourquoi.**
  `src/data/atlas.js` ne porte que des NOMS, et une bascule d'illustration n'en
  renomme aucun : l'index restait exact, la géométrie restait exacte, les onze
  bâtiments se résolvaient toujours. Seuls les pixels avaient divergé.
  ⚠ **D'OÙ LA GARDE QUI LES COMPARE.** `test/sprite.test.js` décode l'atlas et
  chaque sprite source, et exige que la cellule du rang `i` soit le sprite
  `noms[i]`, ligne par ligne. Falsifiée en remettant l'atlas de la veille sous
  les sprites du jour : elle tombe, et elle est la SEULE à tomber.
  ⚠ **LA RÈGLE QUI EN DÉCOULE : tout lot qui touche à `art/sprites/<famille>/64/`
  relance `python3 tools/atlas.py --ecrire`**, et le HTML change, donc la version
  se bumpe. Les autres grilles — 32 et 128 — ne sont cousues dans aucun atlas
  aujourd'hui et ne déclenchent rien.
- **`art/sources/` N'EST JAMAIS AMPUTÉ.** Aucun fichier, aucune série. Les sept
  planches de la V1 des bâtiments restent au dépôt alors que plus une ligne ne
  les cite : elles sont la seule trace de ce qui a produit les fichiers qu'on a
  effacés. Rien dans ce dossier n'est un produit, tout y est un original — c'est
  ce qui le distingue de `art/sprites/`, qui est entièrement reproductible.
- **`planches.py` N'ÉCRASE JAMAIS UN FICHIER QUI NE SE REPRODUIT PAS**, et c'est
  un garde-fou, pas une gêne. Une bascule de source se fait donc en DEUX temps :
  supprimer d'abord, écrire ensuite. Dans l'autre ordre, la commande sort autant
  de lignes `ÉCART` qu'il y a de fichiers et n'écrit rien — vérifié le 30/08 :
  50 `ÉCART`, et `git status` ne montrait pas une seule modification.

- ⚠⚠ **LA BOUSSOLE DE `sim/rendu-pose.js` A PORTÉ DEUX NORDS CONTRADICTOIRES,
  ET LES DEUX ÉTAIENT GARDÉS.** Corrigé le 30/08 au lot BRANCHEMENT-DÉFENSE.
  `orientationVers` posait que le nord est la rangée DÉCROISSANTE ;
  `ORIENTATION_PAR_DEFAUT` fait regarder la garnison au SUD, or elle fait face au
  déploiement, donc aux rangées 1 et 2, donc aux rangées décroissantes. Les deux
  ne pouvaient pas être vrais ensemble : **une tourelle au repos visait juste et
  se retournait à 180° dès qu'elle acquérait une cible.**
  ⚠ **MESURÉ, PAS SOUPÇONNÉ** : une garnison en rangée 5 visant un assaillant en
  rangée 2 rendait `n`, quand `render/orientation.js` pose la cible en ligne
  d'écran 17 contre 14 pour le tireur — donc PLUS BAS. Les trois montages du
  brief se sont reproduits à l'identique.
  ⚠ **LE NORD EST LA RANGÉE CROISSANTE**, c'est-à-dire la rangée 18, le fond de
  la base, la première ligne d'écran. Ce sens rend trois choses vraies EN MÊME
  TEMPS : la garnison au repos regarde au sud vers l'assaut, l'armée au repos
  regarde au nord vers la base qu'elle attaque, et le sprite `_s` pointe vers le
  bas de l'image comme vers le bas de l'écran. `ORIENTATION_PAR_DEFAUT` n'a pas
  bougé — c'est lui qui avait raison.
  ⚠⚠ **CE QUI A LAISSÉ PASSER LA CONTRADICTION, C'EST L'ABSENCE D'UN TEST QUI
  CROISE LES DEUX MODULES.** Chacun était juste séparément et gardé séparément.
  Le test existe désormais : il ne connaît aucune valeur d'orientation, il
  compare un SENS à une ligne d'écran, et il resterait vrai si les seize noms
  changeaient. **Deux modules justes séparément peuvent être faux ensemble.**
  ⚠ **AUCUN APPELANT DE PRODUCTION N'A ÉTÉ TOUCHÉ, ET C'EST MESURÉ** : au moment
  du correctif, rien hors du fichier de test n'appelait la boussole — ni le
  résolveur de combat, ni le banc. `ui/chantier.js` en est le premier appelant.

- **UN CROCHET PEUT ÊTRE INVOQUÉ PAR UN COMMENTAIRE SANS AVOIR JAMAIS EXISTÉ.**
  Le commentaire de `.jeton.sprite` dans `index.src.html` renvoyait à
  `TERRAINS[x].familleAtlas` : **zéro occurrence dans tout le dépôt**, le champ
  s'appelle `spriteDe`. Écrit au lot PREMIÈRE-COUCHE, relevé au lot
  BRANCHEMENT-DÉFENSE. Un commentaire qui nomme une chose inexistante envoie
  chercher un mécanisme qu'on ne trouvera pas — et aucune garde ne lit les
  commentaires.

- ⚠⚠ **`render/scene.js` A UNE PRIMITIVE `sprite` DEPUIS LE 30/08, ET IL RESTE
  PUR.** C'est un OBJET, au même titre que `rect` ou `disque` : aucune image
  n'entre dans ce module, aucun contexte. `canvas2d.js` gagne une branche qui
  appelle `drawImage` et rien d'autre.
  ⚠ **LA PRIMITIVE PORTE SON RECTANGLE SOURCE — `sx sy sl sh`.** Le brief la
  donnait sans ; mais découper dans l'atlas est un CALCUL DE POSITION, et
  `canvas2d.js` n'en fait aucun pour aucune autre forme. Le calcul se fait une
  fois dans `scene.js`, et l'exécutant recopie huit nombres.
  ⚠ **`executer(ctx, liste, atlas)` LÈVE sur une famille absente**, il ne saute
  pas en silence : une unité invisible est un défaut qu'on doit voir.
  ⚠ **`imageSmoothingEnabled = false` EST DANS `ui/banc.js`**, chez celui qui
  crée le contexte — c'est une décision, et `canvas2d.js` n'en prend aucune.
- ⚠⚠ **LES UNITÉS PERDENT LEUR ACCENT À L'ÉCRAN, ET C'EST UNE PERTE
  D'INFORMATION DE JEU.** Une escouade émettait six primitives dont un casque à
  la teinte de sa colonne de dégâts dominante — « ambre vise les véhicules » ;
  elle émet maintenant UN sprite, qui ne porte pas de couleur. `accentDe` reste
  juste et testée, mais son affichage sur l'unité a disparu ; il ne survit que
  dans la légende. **Non tranché par le lot** : soit l'accent revient en couche
  mince par-dessus le sprite, soit le joueur lit le type à la silhouette. Un test
  d'`arsenal.test.js` est RETOURNÉ pour tomber si un accent reparaît sans
  décision.
- **LA LÉGENDE GARDE SA GÉOMÉTRIE, ET LÉGITIMEMENT.** `ENTREES_LEGENDE` liste des
  couples CLASSE × ACCENT — « escouade à accent véhicule » —, pas des unités
  nommées : elle n'a aucun identifiant à résoudre, et surtout c'est l'ACCENT
  qu'elle explique, ce qu'un sprite ne porte pas. L'Arsenal et la composition de
  défense, eux, ont des identifiants et sont passés aux sprites avec le champ —
  T8 l'exige depuis le lot 5A, et il est tombé au premier jet qui l'oubliait.
  **Deux modules justes séparément peuvent être faux ensemble**, et c'est encore
  un test croisé qui l'a dit.

- ⚠⚠ **UN OBJET, UN DESSIN : LES STRUCTURES ONT REJOINT LES UNITÉS LE 30/08.**
  Une casemate se dessinait de TROIS façons — en sprites sur l'écran Chantier,
  en primitives géométriques dans l'éditeur Défense, en primitives au combat —
  et aucun test ne pouvait le voir, chacun des trois chemins étant juste
  séparément. `couchesDeLEntite(d, contexte)` de `render/scene.js` est désormais
  LE point d'entrée des trois genres, et les cinq appelants y passent :
  `listeAffichage`, `listeArsenal`, `listeDefense`, `listeLegende` et
  `ui/chantier.js`.
  ⚠ **LE GESTE EST UN DÉPLACEMENT, PAS UNE ADDITION.** `couchesDeLaDefense`
  vivait dans `ui/chantier.js` et `spriteDuBatiment` aussi, ce dernier écrivant
  `bat_j_` EN DUR : correct tant que seul le joueur avait des bâtiments
  dessinés, faux dès que le champ dessine ceux de l'Ouvrage. Les deux sont
  MONTÉES dans `scene.js` ; en garder une copie dans l'écran aurait été la
  seconde vérité que le lot existe pour retirer.
  ⚠ **LES DEUX ORDRES DE COUCHE SONT INVERSES, ET L'INVERSION SE FAIT UNE FOIS.**
  `couchesDeLEntite` rend de la plus BASSE à la plus haute — l'ordre du canvas,
  où la dernière est au-dessus. Une liste `background-image` CSS dessine sa
  PREMIÈRE ligne au-dessus : `poserCouches` de `ui/chantier.js` retourne donc la
  liste, et lui seul. Unifier sans retourner aurait mis le socle par-dessus la
  tourelle **avec les mêmes deux noms**, donc sans faire tomber un seul test —
  d'où les deux assertions d'indice de `sprite.test.js`.
  ⚠ **`NB_PRIMITIVES` DIT LE CHAMP ET LES ÉDITEURS, PAS LA LÉGENDE.** Les
  structures émettent 1, 1, 2 et 2 couches là où elles émettaient 2, 3, 4 et 5
  primitives ; la légende, elle, garde la géométrie et ses anciens comptes. T5
  de `rendu.test.js` est passé de 44 à 35 — il avait RAISON de tomber, il mesure
  exactement ce que le lot change.
  ⚠⚠ **ET LE CHAÎNAGE DES MURS ÉTAIT MORT AU COMBAT, MESURÉ.** La liste des
  voisines que composait `listeAffichage` portait `e.rangee`, qui n'existe pas
  sur une entité — le moteur range `rangeeMilli`. Chaque comparaison de rangée
  échouait, tout rendait `isole`, et deux merlons côte à côte se rejoignaient
  sur l'écran Chantier sans se rejoindre au combat. **Le premier montage du test
  ne pouvait pas le voir** : il écrivait ses voisines à la main, et retirer
  `visible(e)` du filtre le laissait vert. Il passe maintenant par
  `listeAffichage` et par un combat où `proprietaireDefense` vaut `joueur` —
  sans quoi rien n'est observable, l'Ouvrage ne chaînant pas. **Un montage écrit
  à la main ne garde que lui-même**, pour la deuxième fois en trois lots.
  ⚠ **110 DES 125 SPRITES DORMANTS SONT DEVENUS ATTEIGNABLES**, compté et non
  estimé. Les quinze qui restent se nomment dans `sprite.test.js` : douze par
  ARBITRAGE — l'Ouvrage ne chaîne pas, ses socles et merlons raccordés ne
  peuvent pas être demandés — et trois par conséquence, les socles NUS des trois
  tourelles de contact du joueur ne servant jamais, leurs quatre variantes
  raccordées couvrant les quatre liaisons, `isole` compris.
  ⚠ **AUCUNE FONCTION GÉOMÉTRIQUE N'EST DEVENUE MORTE, ET C'EST MESURÉ.**
  `dessinerStructure`, `dessinerBatiment`, `dessinerEscouade`, `dessinerBlinde`
  et `dessinerAeronef` restent joignables par `dessinerVignette` : la légende
  émet 120 primitives et zéro sprite. Rien n'a donc été retiré — le nettoyage
  annoncé par le brief n'avait pas lieu d'être.
  ⚠ **UN COMBAT OÙ LE JOUEUR DÉFEND NE PEUT PORTER AUCUN BÂTIMENT.**
  `creerCombat` ne connaît que les cinq de l'Ouvrage ; en poser un sous un
  propriétaire joueur demande `bat_j_gangue`, qui n'existe pas, et le rendu
  LÈVE. C'est le bon comportement — « une unité invisible est un défaut qu'on
  doit voir » — et c'est le trou que le raid sur la base du joueur comblera.

- ⚠⚠ **QUATRE ATLAS SERVENT DES DEUX CÔTÉS, ET ILS NE SE DÉCLARENT QU'UNE FOIS**
  — lot SPRITES-ET-ZOOM, 30/08. `--atlas-sol`, `--atlas-unite`,
  `--atlas-chassis`, `--atlas-tourelle-unite` sont employés en fond CSS **et**
  donnés à `drawImage`, qui exige un élément et pas une adresse. Les écrire dans
  la feuille ET sur une balise `img` les inlinerait DEUX fois : **507 464 octets
  mesurés**, plus de sept fois la marge sous la borne de T10. Vérifié par
  falsification — remettre le `src` sur une seule image porte le livrable de
  1 242 496 à 1 541 447 octets.
  ⚠⚠ **LE SENS DU COUPLAGE N'EST PAS INTERCHANGEABLE.** L'autre sens — le `src`
  dans le balisage, la variable écrite par le JS — a été essayé, et **le build
  l'a refusé** : une adresse d'image assemblée à l'exécution est indistinguable
  d'une vraie référence externe pour la garde offline. La faire taire aurait été
  passer sous un garde-fou en silence, ce que §6 interdit déjà pour les hex à
  trois chiffres et pour l'espace de noms SVG. `garnirLesAtlas` de
  `ui/session.js` ne fait donc que **lire** ce que le build a écrit, et une
  garde balaie `src/ui/` pour qu'aucun appel `url()` n'y soit fabriqué.
  ⚠ **ET LA GARDE OFFLINE LIT LE HTML COMMENTAIRES COMPRIS.** Deux mentions en
  prose de la fonction CSS — dans le commentaire qui expliquait justement
  pourquoi on ne l'écrit pas — ont fait tomber le build. C'est « une garde qui
  lit ce qu'on a écrit à son sujet » pris par l'autre bout.

- ⚠⚠ **LA GARNISON N'EST PAS FAITE QUE DE DÉFENSES, ET L'OUBLIER FAISAIT ÉCRAN
  BLANC** — trouvé et réparé le 30/08, mais **le défaut était sur `main`**.
  `rosterDefensif()` compose les dix-sept pièces posables à partir de DEUX
  tables : les neuf de `DEFENSES`, plus les **huit unités** de `UNITES` dont
  `defense.present` est vrai. `ui/chantier.js` demandait `genre: 'defense'` pour
  les dix-sept ; `couchesDeLEntite` lève sur les huit unités, et la levée part de
  `peindre` — **poser des Fusiliers en garnison laissait toute la base blanche.**
  ⚠ **AUCUN TEST NE POUVAIT LE VOIR**, et la raison est celle qu'on a déjà payée
  deux fois : le test qui gardait la garnison montait une base des **neuf**
  `DEFENSES`, soit exactement la moitié du roster qui marchait. **Un montage
  écrit à la main ne garde que lui-même.** Le nouveau part de `rosterDefensif()`
  et mesure d'abord qu'il y a bien deux genres.
  ⚠ **LA QUESTION SE POSE À LA TABLE** : `genreDeLaGarnison` de
  `render/scene.js` fait `DEFENSES[id] ?? UNITES[id]`, comme
  `nomDeLaPieceDeDefense` le faisait déjà. Une liste de huit noms écrite à la
  main serait la première à diverger.

- ⚠⚠ **LE PAVAGE DE LA CARTE POSE QUATRE TUILES PAR CASE, ET C'EST GRATUIT** —
  30/08. Ethan a rapporté un « gros carré moche » ; mesuré : l'art de l'atlas a
  un **grain de 4 pixels source**, et comme une tuile couvrait exactement une
  case, le cran le plus serré AGRANDISSAIT la source d'un facteur deux — le
  grain se lisait en carrés de 8 px alignés sur les axes.
  `ZOOM_CARTE.pixelsParTuile` est scindé en `coteTuile` (128) et `tuilesParCase`
  (2) : une case vaut 256 pixels source, le cran 256 tombe au **1:1**, et aucun
  cran n'agrandit plus.
  ⚠ **NI UN OCTET NI UNE MILLISECONDE.** C'est le MÊME fichier lu à une autre
  échelle — il n'y avait rien à « redécouper », contrairement à ce que le brief
  supposait. Et le pas du réseau étant lui aussi en pixels source, le nombre de
  tuiles superposées **par pixel d'écran** vaut `(coteTuile / pasSourcePx)²`
  quelle que soit l'échelle : le coût d'une dalle ne bouge pas.
  ⚠ **LES SEUILS DE TEINTE ONT ÉTÉ RELEVÉS À NOUVEAU** (0,656 · 1,574 · 2,418 ·
  3,338) et l'accord entre crans est passé de 0,05 à **0,094**. La tolérance du
  test n'a pas bougé.

- ⚠⚠ **LE ZOOM DE LA BASE CHANGE LA TAILLE D'UNE CASE, JAMAIS L'ÉCHELLE DU
  DESSIN** — 30/08. `transform: scale()` reste interdit sur cette grille pour la
  raison de toujours : il déplace le dessin sans déplacer la géométrie du
  pointage, et le doigt cesse de tomber sur la case qu'il vise. C'est
  `--case-cote`, en pixels, que le JS écrit.
  ⚠ **LES DEUX BORNES SE LISENT.** Le plancher est la taille qui fait tenir les
  neuf colonnes, MESURÉE sur `clientWidth` ; le plafond est `COTE_SPRITE`, lu
  dans l'atlas — au-delà on agrandirait du pixel art au-dessus de sa propre
  définition. Le défaut d'ouverture vit dans la feuille (`--case-defaut`).
  ⚠⚠ **ET LES DEUX PINCEMENTS N'EMPLOIENT PAS LA MÊME API, DÉLIBÉRÉMENT.** La
  carte est un canevas en `touch-action: none` : rien ne lui dispute le geste,
  les évènements de POINTEUR y sont fiables. La base est un conteneur qui défile
  NATIVEMENT : sous `touch-action: pan-x pan-y` le navigateur garde le droit de
  défiler à deux doigts, et quand il prend la main il envoie `pointercancel` —
  le pincement se perdrait au milieu du geste. D'où un `touchmove` **non
  passif** là-bas. ⚠ `{ passive: false }` est la moitié qui compte : sans lui
  `preventDefault` est IGNORÉ, le code a l'air juste et le navigateur défile
  quand même.
  ⚠ **LE ZOOM DE LA CARTE RESTE PAR CRANS**, et ce n'est pas un demi-travail :
  `rendreDalle` lève hors table parce qu'à chaque cran la tuile ET l'emblème
  restent à un facteur d'échelle ENTIER. Le geste est continu, son EFFET est
  discret — on franchit un cran à √2, la moyenne géométrique entre deux crans
  qui vont du simple au double.

- **LE SOL DE LA BASE EST DÉCOUPÉ DANS L'ATLAS DU MONDE** — 30/08, demandé par
  Ethan (« utiliser les sprites terrain monde en 2×2 »). Sa palette EST la rampe
  « sol joueur » de `FICHE-STYLE.md`, aux cinq teintes près : les deux sols sont
  la même matière. Seize cellules de 64 par axe, **quatre par case**.
  ⚠ **LA VARIANTE SE PREND SUR LA SOUS-CASE, PAS SUR LA CASE.** `variante` est
  une fonction de (graine, rangée, colonne) : quatre appels sur les mêmes
  coordonnées rendraient quatre fois le même quartier, et le 2 × 2 n'apporterait
  rien. Un test le MESURE au lieu de le lire.

- **CE QUI SORT DE L'ÉCRAN NE SORT PAS DU JEU** — trois retraits du 30/08, trois
  déménagements. La lettre de l'obstacle (qui est ralenti) va dans le `title` de
  la case ; le cadre de famille du jeton (prod · mil · pivot) dans le `title` du
  jeton, et la palette le peint toujours ; le nom de l'unité de l'Offense dans
  le `title` de l'emplacement. « Rien ne se retire en silence » (§4) vaut aussi
  quand c'est Ethan qui demande le retrait : il demande un DESSIN en moins, pas
  une donnée.
  ⚠ **ET LES CLASSES QUI NE PEIGNENT PLUS RIEN PARTENT AVEC LEURS RÈGLES.**
  `champ`, `quartz`, `scorie`, `obstacle` ne sont plus posées du tout : leur
  garder une règle pour satisfaire la garde des classes aurait été écrire une
  décoration pour un test, ce que la feuille refuse nommément.

- ⚠⚠ **LES TERRITOIRES SONT DESSINÉS DEPUIS LE 31/08, ET RIEN N'A ÉTÉ INVENTÉ
  POUR ÇA.** La règle était dans la spec depuis le début : §10 porte « zone
  d'influence joueur : rayon 2, fixe » et « ennemie : rayon 3 », §8 précise que
  « le territoire allié est l'union des zones d'influence de toutes les bases du
  joueur ». `sim/territoire.js` en tire une carte d'occupation, `ui/monde.js`
  trace les côtés exposés. **Chercher la réponse dans le dépôt avant de demander
  un arbitrage a payé ici** : la question n'avait pas à être posée.
  ⚠ **SEULS LES CÔTÉS EXPOSÉS SE DESSINENT, JAMAIS UN REMPLISSAGE.** Ethan : « cf
  screenshots, seuls les bordures sont dessinés ». Et mesuré : l'Ouvrage tient
  **100 % des rangées au-dessus de la garde de départ** — un aplat noierait
  l'écran. Ce qu'on voit, c'est la frontière du no man's land autour du joueur.
  ⚠⚠ **LA CARTE D'OCCUPATION DÉBORDE D'UNE CASE CE QU'ELLE REND**, et c'est la
  seule faute que ce module puisse commettre : sans anneau de contexte, la
  voisine hors tableau se lit « neutre » et le bord de la VUE devient une
  frontière — un cadre qui suit le défilement. **Le premier montage du test ne
  le voyait pas** : à rayon 3 autour du joueur, le carré 5 × 5 tient entier avec
  une case de marge. Il regarde maintenant un rayon 1, au cœur du territoire, et
  exige ZÉRO bordure.
  ⚠⚠ **LE JOUEUR L'EMPORTE PAR UN GARDE-FOU, PLUS PAR L'ORDRE DES BOUCLES.**
  L'Ouvrage était peint d'abord et le joueur par-dessus : la priorité tenait à
  l'ordre, et on pouvait retirer le `if (occupant[i] === JOUEUR) continue` sans
  qu'un test tombe — mesuré. Le joueur est peint EN PREMIER désormais, et c'est
  le refus d'écraser qui décide.
  ⚠ **DEUX LECTURES, PAS DES ARBITRAGES, et le code les nomme** : le joueur
  l'emporte sur le recouvrement, et seules les BASES de l'Ouvrage projettent son
  influence (pas les camps ni les avant-postes, qui sont du butin qui suit le
  joueur). Chacune tient en une ligne.
  ⚠ **LES DEUX TEINTES VIENNENT D'`EMBLEMES_CARTE`**, elles n'en inventent pas de
  troisième : l'os borde déjà la base du joueur, le rouge borde EXACTEMENT ce qui
  attaque le joueur. Le territoire de l'Ouvrage est l'emprise de ces bases-là.

- ⚠⚠ **LES MURS DE CONTOUR SONT DESSINÉS DEPUIS LE 31/08, ET ILS NE PASSENT PAS
  PAR LA CHAÎNE DES SPRITES DE CASE.** Ethan, dans l'ordre : « les murs contour
  ne sont pas là », « à cheval sur le bord / le brun orangé joueur le violet
  ouvrage », puis, devant un premier conditionnement ramené à 64 × 64 : « mais
  c'est quoi cette chiasse de pixel. divise par deux l'asset original. et garde
  la colorisation. le mur fera 512x64. et le mur fait un U, le bas reste sans
  mur. » Les quatre planches étaient au dépôt depuis le lot BORDS-DE-BASE ;
  `tools/bords.py` en tire seize images, `tuilesDuContour` de `ui/chantier.js`
  en pose cinq autour de la bande des bâtiments.
  ⚠⚠ **UN MUR N'EST PAS UN SPRITE DE CASE, ET C'EST TOUT LE LOT.**
  `planches.py`, `final128.py` et leurs cousins ramènent un dessin de 1 024 à une
  case de 64, quantifié sur les quatorze teintes de `cond.py` : juste pour une
  unité, qui doit tenir dans une case. Un mur court le long d'un côté entier, et
  le réduire au seizième détruit le seul détail qui le fait lire comme une
  construction. **Mesuré des deux côtés** : le mur conditionné pesait 3 792
  octets de base64 en tout, celui-ci en pèse 52 864 — quatorze fois plus, et
  c'est le prix que l'arbitrage a fixé.
  ⚠ **« DIVISE PAR DEUX » SE PREND AU MOT.** La planche fait 2 048 × 2 048, donc
  quatre cellules de 1 024 ; le trait occupe les 128 lignes CENTRALES de sa
  cellule et l'angle le carré central de 128. Ramené d'un facteur deux : **512 ×
  64** pour un mur, 64 × 512 pour l'autre sens, 64 × 64 pour un angle. À
  `COTE_SPRITE` pixels par case — le plafond du zoom — un mur couvre donc HUIT
  cases au rapport 1:1, et c'est exactement ce que le U demande sur cette
  grille-ci.
  ⚠ **LA FENÊTRE DE DÉCOUPE EST FIXE, ELLE NE SE MESURE PAS SUR L'IMAGE.**
  L'étendue exacte du trait varie d'un pixel d'une cellule à l'autre
  (`y = 448..574` sur l'une, `448..575` sur l'autre) : découper sur la boîte
  englobante donnerait des sprites de tailles différentes, qui ne se
  raccorderaient plus. L'outil découpe la fenêtre CENTRALE et **asserte** qu'aucun
  pixel opaque n'en sort.
  ⚠⚠ **« GARDE LA COLORISATION » : PAS DE PALETTE DU DÉPÔT ICI.** `quantifier` de
  `cond.py` apparie sur les quatorze teintes de la fiche, réglées pour les unités
  ; sur ces bruns-ci la porte du ROUGE s'ouvre et le mur ressort semé de
  `#E43E32`, la teinte que le dépôt réserve à ce qui ATTAQUE LE JOUEUR (mesuré au
  premier jet). Les couleurs retenues sont celles du dessin, **réduites à seize
  PAR CAMP** — par camp et non par sprite, sinon l'angle et le mur qu'il joint ne
  tomberaient pas sur la même teinte. Seize est un compromis mesuré : `mur_h_a`
  pèse 6 507 octets à 8 couleurs, 10 670 à 16, 16 057 à 32, 41 790 au rendu
  d'origine (22 000 couleurs, de l'anti-crénelage et pas une intention) ; sous
  seize le détail des briques s'aplatit à l'œil.
  ⚠ **LA RÉDUCTION EST ALPHA-CORRECTE.** Le fond des planches est magenta ;
  réduire le RVB sans le prémultiplier par l'alpha ferait baver ce magenta dans
  le liseré du mur sur toute sa longueur — invisible sur une vignette, flagrant
  sur 512 pixels. L'alpha redevient binaire : le dépôt n'a aucune transparence
  partielle.
  ⚠⚠ **`bord/` N'EST DONC DANS AUCUN ATLAS, ET NE PEUT PAS L'ÊTRE.** `coudre` de
  `tools/atlas.py` exige des cellules carrées d'un même côté. Chaque image entre
  par son propre marqueur de `tools/build.js`, comme les deux grosses bases de
  l'Ouvrage. **Et seul le camp du joueur entre** : cinq images, 52 864 octets de
  base64 ; les cinq de l'Ouvrage sont produites et attendent l'écran de raid.
  C'est une économie que seul le passage aux fichiers séparés rend possible — un
  atlas aurait été tout ou rien.
  ⚠⚠ **LE MUR FAIT UN U, LE BAS RESTE SANS MUR.** La base s'ouvre sur sa propre
  bande de défense, qui commence exactement là où la sienne finit : c'est le seul
  des quatre côtés qui donne sur du terrain à soi, et le seul que l'assaillant
  franchit. Deux angles, trois murs, cinq nœuds — et **rien ne se recouvre** :
  les angles prennent une case chacun, le mur du haut court exactement entre eux,
  les murs de côté du bas de leur angle au bord de la base.
  ⚠ **LES DEUX VARIANTES SERVENT DE PART ET D'AUTRE**, ce pour quoi elles ont été
  dessinées : `mur_v_a` est éclairée à gauche, `mur_v_b` à droite. `mur_h_b`, qui
  éclaire par le bas, est le pendant du mur que le U n'a pas — elle reste
  produite et ne sert pas.
  ⚠ **LES LONGUEURS SE CALCULENT, ELLES NE S'ÉCRIVENT PAS.** Sur cette grille
  elles tombent à huit cases, soit très exactement les 512 pixels de l'asset au
  plafond du zoom ; le jour où la base changera de taille, le
  `background-size: 100% 100%` de la feuille étirera l'image plutôt que de
  laisser un trou. Un test RELÈVE cette coïncidence au lieu de l'imposer.
  ⚠⚠ **À CHEVAL, DONC LA GRILLE PORTE UNE DEMI-CASE DE `padding`.** Un mur fait
  une case d'épaisseur et se centre sur la ligne du bord, donc il mord d'une
  demi-case de chaque côté. Sans ce `padding`, la moitié extérieure sortirait de
  la boîte et le champ défilerait horizontalement au repos (mesuré : 414 px de
  grille dans 360). D'où aussi `coteQuiTient` qui divise par `GRILLE.largeur + 1`
  et la marge passée à `bornesDeDefilement`.
  ⚠⚠ **TROIS ÉTAGES, ET LE MUR EST CELUI DU MILIEU : le SOL, puis le MUR, puis
  les JETONS et le calque des traits.** Le premier rendu s'en remettait à l'ordre
  du document, qui mettait le calque SOUS les cases : mesuré dans Chromium, la
  moitié intérieure du trait était cachée par le sol, et **pas la même moitié en
  haut qu'en bas**. Invisible tant que le trait faisait un huitième de case ;
  flagrant à la moitié.
  ⚠ **ET `.case.choisie` A PERDU SON `z-index`, APRÈS MESURE.** Il ne peignait
  rien — `outline-offset: -2px` tient le liseré à l'intérieur de la case, où
  aucune voisine ne le recouvre : montage de douze cases légales autour d'une
  choisie, capture avec et sans, **zéro pixel de différence sur 457 600**. Il
  coûtait en revanche cher depuis le mur : un `z-index` sur une case en fait un
  CONTEXTE D'EMPILEMENT, donc son jeton restait prisonnier de l'étage 1 et le mur
  lui passait dessus — le bâtiment sélectionné aurait été le seul barré par son
  propre mur.
  ⚠ **ET LE VÉRIFICATEUR CONNAÎT L'OUTIL** (`CHAINE`, dans `tools/verifier.py`).
  Sans cette ligne, les seize fichiers seraient comptés MANQUANTS à chaque
  exécution — « le dépôt les porte, aucun outil ne les produit », le contraire
  de la vérité.

- ⚠⚠ **LES SATELLITES SE RELÈVENT DEPUIS LE 31/08, ET LA VÉRIFICATION DEMANDÉE
  AVAIT POUR RÉPONSE « NON ».** Ethan : « vérifier que les camps et avant-poste
  change de spawn aléatoirement si personne ne les attaque ». Avant ce lot, un
  satellite posé ne bougeait JAMAIS ; seule une destruction en raid le faisait
  reparaître ailleurs. Six heures de vie, quatre heures de sursis quand il est
  attaqué — **les deux durées sont un CHOIX, pas une mesure** : Ethan a donné le
  sens (« quelques heures de plus ») et pas les nombres.
  ⚠⚠ **`resoudreSatellites` BOUCLE MAINTENANT PAR ÉVÈNEMENT, ET C'EST LE JOUR QUE
  SON EN-TÊTE ANNONÇAIT.** Elle disait : « elle ne peut RIEN faire qui dépende de
  l'instant précis d'une apparition — le jour où ce sera nécessaire, cette
  équivalence tombe ». La relève en dépend. L'équivalence des deux chemins
  d'avancement n'est donc plus gratuite, elle est CONSTRUITE : on rejoue les
  évènements à leur date.
  ⚠ **ELLE AVANCE PAR ÉVÈNEMENT, JAMAIS PAR TICK**, et c'est ce qui la rend
  payable. Mesuré : une pose d'avant-poste coûte 13,3 µs, donc dix ans d'absence
  — 14 600 relèves de trois satellites — coûtent **581 ms**, une fois, au
  chargement ; un mois en coûte 7.
  ⚠ **L'ÉCHÉANCE SE COMPTE DEPUIS LE TICK DE LA POSE, jamais depuis
  `etat.horloge.nbTicks`.** Les deux coïncident tick par tick et DIVERGENT au
  rattrapage, qui pose en une fois ce que mille ticks auraient posé à des
  instants différents.
  ⚠ **UNE ATTENTE QU'ON NE PEUT PAS SATISFAIRE SORT DE LA BOUCLE, elle ne se
  reprogramme pas.** Un anneau plein est un état du MONDE, pas un délai : lui
  donner une nouvelle échéance la ferait attendre cinq minutes de plus pour rien.
  Mais elle doit QUITTER `attentes` pendant la boucle, sinon la même échéance
  déjà passée serait reprise indéfiniment et la boucle ne terminerait pas.
  ⚠ **LE SURSIS SE COMPTE DEPUIS LE RAID, et il ne raccourcit jamais une vie.**
  La faute qui se commettrait vraiment est un appel DÉSORDONNÉ dans le temps ;
  un raid ordinaire allonge toujours, puisqu'il vient après la pose.

- ⚠⚠ **UN PONT JAVASCRIPT EXISTE DANS L'ENVELOPPE DEPUIS LE 31/08, ET IL RETOURNE
  UNE DÉCISION ÉCRITE.** `MainActivity` disait « aucune interface JS native :
  chaque pont serait une surface d'attaque ». Ethan a demandé un bouton
  « vérifier maj » dans les Options ; **la page ne PEUT pas le faire seule** —
  `tools/build.js` refuse toute URL dans le HTML produit, et §6 interdit
  d'assembler l'adresse à l'exécution pour passer dessous.
  ⚠ **CE QUI REND CE PONT ACCEPTABLE TIENT EN QUATRE LIGNES, ET IL FAUT QU'ELLES
  RESTENT VRAIES** : la WebView ne charge que le HTML autonome fourni en mémoire ;
  toute navigation et toute sous-requête sont refusées ; les DEUX méthodes
  exposées ne prennent AUCUN argument, donc rien venu de la page ne traverse ;
  elles ne rendent qu'une phrase et un entier, jamais une adresse.
  ⚠ **LA DÉCISION ET LA FORMULATION VIVENT DANS `:maj`, PAS DANS `:app`.** Sans
  SDK Android, `settings.gradle.kts` EXCLUT `:app` : ce qui vit là-bas n'est
  compilé par personne ici et la CI ne le voit pas non plus. `EtatMiseAJour` est
  donc testé en JVM, et `:app` ne garde que le transport et le pont.
  ⚠ **UN REFUS « RETOUR EN ARRIÈRE » N'EST PAS UNE PANNE**, c'est le cas NORMAL
  quand on est déjà à jour : le manifeste annonce le build qu'on a déjà et la
  politique anti-retour le rejette. Le compter comme un échec ferait dire
  « erreur » à une vérification réussie.

- ⚠⚠ **LES SOIXANTE-DIX POI SONT DÉRIVÉS, ET SEULS LES ACQUIS SE SAUVEGARDENT** —
  31/08, lot POI. Sept types × dix bandes de cinq niveaux ; `sim/poi.js` tire
  leurs POSITIONS de la seule graine, comme `sim/peuplement.js` et pour la même
  raison. Ce qui entre dans la sauvegarde, c'est le couple `{ type, bande }` de
  chaque POI ACQUIS — de l'HISTOIRE, au même titre que `satellites`.
  ⚠⚠ **LE POI ESQUIVE LA BASE DE L'OUVRAGE, JAMAIS L'INVERSE.**
  `sim/peuplement.js` n'a pas changé d'une ligne et ne doit jamais connaître le
  mot « poi » : c'est ce qui garantit qu'ajouter les POI ne déplace AUCUNE base
  sur AUCUNE carte existante. Un test compare `estBaseOuvrage` à des comptes
  relevés sur le fichier d'AVANT le lot, et balaie sa source.
  ⚠ **LA GARDE EST CELLE DU PEUPLEMENT, ET SA FORME SURPREND.** Tchebychev,
  rayon 15, autour de la rangée 295 / colonne 16, sur une carte large de 31 : les
  rangées 273 à 280 sont ENTIÈREMENT hors garde, et sur les rangées 281 à 300
  **seules les colonnes 1 et 31** le sont. Un POI de bande 1 tombe donc soit
  au-dessus du joueur, soit collé à un bord — c'est le « à droite et à gauche,
  comme les bases Ouvrage » d'Ethan, et un test le fige.
  ⚠ **`ESSAIS_MAX` LÈVE, IL NE REND PAS `null`.** Une carte à qui il manque un POI
  est un fait de PROGRAMME. Mesuré sur les graines 1 à 300 : **pire cas 30
  essais**, moyenne du pire par graine 8,0 ; le plafond est à 1 000. Coût d'une
  carte complète : **0,050 ms**.
  ⚠ **LE BIAIS DU MODULO EST ACCEPTÉ, UNE FOIS, PAR ÉCRIT** — moins de 6 × 10⁻⁷
  sur un domaine d'au plus 2 232. Le « corriger » déplacerait tout le monde.
  ⚠ **SELS 2 ET 3**, la rangée et la colonne. Les sels 0 et 1 sont ceux du
  peuplement, et un champ qui manque de bits se tire d'un second hachage salé,
  jamais du même en le pressant.

- ⚠⚠ **UN POI VAUT +10 %, FIXE, ET LES POI DE MÊME TYPE S'ADDITIONNENT** —
  arbitré par Ethan le 31/08. Le NIVEAU d'un POI ne change pas ce qu'il donne :
  il dit seulement où il est, donc à quel prix on va le chercher. Dix veines de
  quartz font **+100 %, pas +159 %**.
  ⚠ **EN POUR-CENT ENTIERS DANS LA TABLE, JAMAIS EN FACTEUR FLOTTANT.** Toute
  l'arithmétique en aval est entière — milli-unités, milli-PV — et un `1.1` écrit
  dans `POI` ferait diverger le rattrapage hors ligne du tick à tick.
  ⚠⚠ **C'EST LE DÉBIT QU'ON MAJORE, ET C'EST CE QUI GARDE LES DEUX CHEMINS
  ÉQUIVALENTS.** `debitsMilliParHeure` prend un troisième argument, à défaut vide ;
  `tickEconomieBase` et `rattrapageEconomieBase` héritent donc de la majoration
  par construction, sans qu'une ligne les relie. Majorer le *gain* d'un tick ou le
  *stock* ferait diverger les deux, et la divergence serait invisible sur les
  petits nombres.
  ⚠ **LA BORNE `DEBIT_MILLI_PAR_HEURE_MAX` SE VÉRIFIE SUR LA VALEUR MAJORÉE.** Un
  débit à 99 % du seuil qui passe à +100 % le franchit — c'est le cas que la borne
  existe pour attraper.
  ⚠ **ET LA MAJORATION NE TOUCHE PAS `capacitesMilli`.** Ethan a écrit
  « production bonus », pas « stockage bonus » : un POI fait produire plus vite,
  il n'agrandit aucun entrepôt. Un test balaie la fonction pour l'exiger.
  ⚠⚠ **UN MONTAGE QUI TOMBE ROND NE MESURE PAS UN ARRONDI, POUR LA DEUXIÈME
  FOIS.** Le test d'équivalence des deux chemins est passé VERT sur un montage à
  +20 % : le débit du collecteur y vaut 144 000 milli/h, soit EXACTEMENT quatre
  fois `TICKS_PAR_HEURE`, donc le résidu — le seul endroit où les deux chemins
  peuvent diverger — retombe à zéro à chaque tick. Il est à +30 % désormais, et
  une assertion exige que les résidus soient non nuls avant de les comparer.

- ⚠⚠ **UN POI DE COMBAT ENTRE PAR LE MONTAGE, JAMAIS PAR L'ÉTAT LU AU VOL** —
  même règle que les modules, et pour la raison qu'`executerRaid` porte déjà : le
  combat est déterministe et rejouable, donc tout ce qui gouverne la boucle doit
  être dans le montage, qui est sérialisé. Le champ s'appelle `majorationsPoi`, il
  a **la même forme pour les deux propriétaires** — `{ joueur, ouvrage }`, quatre
  clés à zéro — et `creerCombat` LÈVE sur une forme présente et fausse.
  ⚠⚠ **`camp` ET `proprietaire` SONT DEUX CHOSES, ET LES TROIS POI OFFENSIFS
  DEMANDENT LES DEUX.** Sans la condition de camp, les Cuirassiers que le joueur
  met en GARNISON profiteraient d'un bonus d'assaut. La Redoute, elle, majore tout
  ce que le joueur pose en défense, **quel que soit le genre**.
  ⚠ **`p.chassis` VAUT `null` POUR UNE DÉFENSE ET POUR UN BÂTIMENT** : la
  comparaison part du châssis et refuse `null`, jamais une égalité entre deux
  valeurs qui pourraient être nulles toutes les deux.
  ⚠ **`franchissementColonne` N'EST PAS MAJORÉ**, et c'est le précédent exact de
  la Munition spéciale : il passe par `degatsDeFranchissement`, sa propre table en
  milli-PV et son propre barème. Aucune ligne d'Ethan ne l'y rattache — **choix
  réversible d'une ligne**.
  ⚠ **ET AUCUNE DÉFENSE NE PORTE À LA FOIS DES DÉGÂTS ET DU FRANCHISSEMENT** —
  mesuré : `ronce` et `herse` franchissent et ne frappent pas, les sept autres
  l'inverse. Le test du franchissement a donc besoin de DEUX entités : la barrière
  pour le témoin négatif, la tourelle pour prouver que la majoration mord dans le
  même combat.

- ⚠ **UN SATELLITE NE SE POSE PAS SUR UN POI**, et le motif est celui des bases de
  l'Ouvrage mot pour mot : ils sont dérivés de la graine, donc ils étaient là
  AVANT. **Conséquence assumée** : le filtre rétrécit `libres`, donc l'indice tiré
  change, donc les FUTURES apparitions d'une partie en cours ne tombent plus aux
  mêmes cases qu'avant le lot. Les satellites DÉJÀ POSÉS ne bougent pas — ils sont
  dans la sauvegarde.

- ⚠ **`sim/poi.js` EST LE PREMIER MODULE DE `sim/` À IMPORTER `render/`**, et il
  faut le savoir. La direction habituelle est l'inverse — `render/terrain.js` et
  `render/variante.js` lisent `sim/`. L'emprise de la base terminale n'existe qu'à
  un seul endroit, `empriseDeLaGrosseBase`, et la réécrire en « ±1 » aurait été la
  seconde vérité que tout ce module refuse par ailleurs. Il n'y a **pas de cycle
  aujourd'hui** — `render/embleme.js` ne lit rien de `sim/` — mais le jour où il en
  lirait, c'est cette ligne qu'il faudra défaire, en montant la géométrie dans
  `sim/` plutôt qu'en recopiant le décalage.

- ⚠ **UN POI N'EST PAS UNE CIBLE.** `TYPES_ATTAQUABLES` se dérive de `TYPES_SITE`,
  où les POI ne sont pas ; `siteDeLaCase` ne connaît que les satellites et les
  bases de l'Ouvrage. Un POI ne s'attaque pas, ne se défend pas, et le panneau de
  l'écran Monde ne lui donne aucun bouton — c'est la règle que la carte porte
  depuis le lot ÉCRAN-CARTE.
  ⚠ **AUCUN HALO DE PROPRIÉTÉ.** `INVENTAIRE-SPRITES.md` §6.2 en décrit un ;
  Ethan ne l'a pas demandé. Le panneau dit « acquis » ou « à prendre », et c'est
  tout. Suite possible, pas trou.
  ⚠ **LE `nom` D'UN POI NE S'ÉCRIT QU'UNE FOIS.** `EMBLEMES_CARTE` le LIT dans
  `POI`, qui fait foi sur les identifiants, les noms affichés, les sprites et les
  effets. Deux tables qui porteraient le même libellé divergeraient au premier
  renommage, et le joueur verrait deux noms pour le même gisement.
  ⚠⚠ **ET AUCUN N'EST ACQUÉRABLE TANT QUE LA BASE NE BOUGE PAS.** La garde du
  peuplement écarte les POI de quinze cases du DÉPART ; le territoire du joueur
  est le disque de rayon 2 autour de sa base, qui est le départ. Les deux
  ensembles sont disjoints par construction, et `POI T24` le mesure case par case
  plutôt que de le déduire. Il tombera le jour du redéploiement, et c'est ce qu'on
  lui demande.
  ⚠ **ET AUCUN BORD ROUGE POUR LES SEPT.** `#E43E32` est réservé à ce qui ATTAQUE
  le joueur ; l'accent de branche — blanc, rouge, jaune — vit dans le SPRITE, pas
  dans le gabarit de repli. Les sept lettres sont Q · S · E · N · R · P · D.

### Sur le vocabulaire

- Ne jamais dire « l'IA » en parlant de l'adversaire : c'est **l'Ouvrage**.
- Sur l'écran de Défense : **« engagement réduit »**, jamais « inerte ».
- Le champ du bilan s'appelle `verrouilles` en défense et `verrouillees` à
  l'Arsenal. Les deux grilles ne portent pas les mêmes objets, et recopier le
  nom de l'Arsenal donne `undefined.length`.

### Sur la méthode

- ⚠⚠ **UNE CITATION QUI RENVOIE À UNE SOURCE QU'ON S'INTERDIT DE LIRE NE VAUT
  PAS MIEUX QUE PAS DE CITATION.** L'en-tête de `data/niveaux.js` a annoncé
  pendant quatre jours que sa pente venait d'un « onglet COURBE du classeur
  FOYER-ZERO-BATIMENTS-JOUEUR.xlsx ». Or §1 interdit de lire un `.xlsx` pour
  coder et déclare celui-ci périmé. La source était donc INVÉRIFIABLE : la
  pente 1,1 a eu l'air inventée, et la session du 29/08 a conclu — à tort — que
  le code contredisait un arbitrage d'Ethan. Elle était en fait **mesurée**,
  dans `RELEVE-TA-COURBES-2.md` §0, au dépôt depuis le 24/08.
  ⚠ **CORRIGER LES MOTS N'AURAIT PAS SUFFI.** La prochaine session aurait cru
  un commentaire, comme celle-ci l'a fait. Trois tests de `donnees.test.js`
  confrontent désormais `NIVEAU` et `ECONOMIE_NIVEAU` au tableau des cinq lois
  du relevé, et exigent que l'écart voulu sur les dégâts (×1,086 mesuré, 1,1
  codé, pour tenir le miroir) reste ÉCRIT dans le fichier qui le commet.
  ⚠ **`data/base.js` ET `data/economie.js` CITENT ENCORE LE CLASSEUR.** Ce
  n'est pas la même faute — Ethan l'a pointé lui-même pour ces deux-là — mais
  le jour où l'une de ces valeurs sera contestée, la piste sera aussi courte.

- **LA RECHERCHE SEULE OUVRE LES PIÈCES** — 30/08, lot RECHERCHE, arbitrages 1
  à 3 d'Ethan. `apparition` redevient une table de l'OUVRAGE : elle dit ce que
  `sim/generateur.js` peuple sur ses sites, et **plus aucun chemin du joueur ne
  la lit** — un test balaie `ui/arsenal.js`, `ui/defense.js`, `ui/chantier.js` et
  `ui/offense.js` pour l'exiger. Ce qui se pose se lit dans
  `etat.recherche.acquises`, écrit par `sim/recherche.js`.
  ⚠ **NI LE NIVEAU SEUL, NI LE NIVEAU *ET* LA RECHERCHE.** Les deux ont été
  proposés et refusés : le niveau du Centre de commandement ne borne plus que le
  BUDGET d'armée, jamais le catalogue. Une pièce déjà posée ne se verrouille donc
  plus quand un bâtiment redescend de niveau.
  ⚠ **UNE PIÈCE S'ACHÈTE DEUX FOIS, UNE PAR BRANCHE**, comme dans Tiberium
  Alliances : le Chasseur coûte 300 000 en offense et 135 000 en défense, et
  l'un n'ouvre pas l'autre.
  ⚠ **TREIZE MODULES SUR QUATORZE S'AFFICHAIENT ET NE S'ACHETAIENT PAS.**
  `data/modules.js` porte un drapeau `cable` par module ; `sim/recherche.js`
  refuse l'achat par le code `effetNonCable`. Prendre les points du joueur
  contre un effet qui n'existe pas serait un vol. À ce lot-là, seul l'Écraseur
  était câblé ; **depuis MODULES-A ils sont trois, et le drapeau est par
  BRANCHE** — voir l'entrée suivante.
  ⚠ **L'ÉCRAN ACHÈTE EN DEUX TOUCHERS.** Le premier arme le bouton, le second
  paie ; toucher ailleurs désarme, et une peinture désarme tout. Deux milliards
  et demi de points ne partent pas sur un frôlement.

- **UN MODULE EST CÂBLÉ PAR BRANCHE, PAS PAR MODULE** — 31/08, lot MODULES-A.
  `data/modules.js` porte `cable: {offense, defense}` et `moduleEstCable(nom,
  branche)` prend DEUX arguments ; une branche inconnue LÈVE. Le drapeau global
  mentait par construction : les trois modules câblés le sont tous en offense et
  aucun en défense, parce que le moteur ne lit `p.module` que du côté qui
  attaque. Un drapeau unique aurait vendu au joueur, sur la ligne défense des
  Grenadiers, un Tir de barrage qui n'aurait jamais tiré.
  ⚠ **ET LE REFUS DIT LAQUELLE DES DEUX.** `effetNonCable` écrit « n'a pas
  d'effet en défense » quand l'autre branche est câblée, « n'a pas encore
  d'effet en jeu » quand aucune ne l'est. Le premier message est un fait
  définitif, le second une attente : les confondre ferait patienter le joueur
  devant une case qui ne s'ouvrira jamais. ⚠ Le mot vient de
  `MOT_DE_LA_BRANCHE`, pas de la clé — `branche` vaut `defense`, sans accent, et
  ce message part tel quel sous la ligne.
  ⚠ **TIR DE BARRAGE : 30 % AUX VOISINS, STRUCTURES SEULEMENT, CIBLE EXCLUE.**
  Rayon 1 en Tchebychev autour de la cible, camp adverse, genres `defense` et
  `batiment`. ⚠ **`distanceTchebychev` de `sim/points-attaque.js` N'EST PAS
  IMPORTÉE** : elle prend des cases entières et traînerait `clock.js` et
  `niveau-de-base.js` dans `combat.js`, qui ne dépend que de `grille.js`.
  ⚠ **LES ÉCLABOUSSURES PARTENT DANS LE MÊME TAMPON QUE LE TIR PRINCIPAL**, à
  l'étape 4 : elles sont donc simultanées comme tout le reste, et un défenseur
  tué au même tick riposte quand même. Passer par un second appel après
  `appliquerDegats` casserait la simultanéité normative.
  ⚠ **AUCUNE RÉSERVE N'EST CONSOMMÉE POUR ELLES.** L'étape 8 compte les tirs,
  pas les impacts ; facturer les voisins ferait payer deux fois le même coup.
  ⚠ **BOOSTER : ×10 PENDANT 30 TICKS, UNE SEULE FOIS PAR RAID.** Le déclencheur
  est posé à l'étape **6 bis**, après le retrait des morts — lu avant
  `appliquerDegats`, il raterait la blessure du tick même. ⚠ Le tick de la
  blessure COMPTE : la fenêtre est N..N+29, pas N+1..N+30. ⚠ **`modulesActifs`
  est la mémoire, `effetsTemporises` la fenêtre** : le marqueur n'est jamais
  retiré, c'est lui qui interdit la seconde poussée ; l'effet, lui, expire à
  l'étape 1.
  ⚠ **LE ×10 S'APPLIQUE APRÈS LA RÉDUCTION D'OBSTACLE**, jamais avant : 60 → 24
  sous obstacle → 240 boosté. L'inverse rendrait l'obstacle inopérant sous
  boost, et le pas resterait borné par l'invariant des 1 000 milli de
  `peutAvancer`.
  ⚠ **MESURÉ EN RAID, PAS SUPPOSÉ** : sur huit graines, Tir de barrage rend
  **+28,1 % de butin médian** et fait tomber 37 bâtiments sur 64 contre 27 ;
  le Booster se déclenche à chaque raid (3 à 5 Cuirassiers sur 6) et rend
  **−3,7 % de points médians** — il fait courir l'unité blessée droit sur la
  défense. Un module câblé n'est pas un module rentable, et le dire est le
  travail du rapport, pas du code.

- **TROIS MODULES DE PLUS, ET DEUX CROCHETS SEULEMENT** — 31/08, lot MODULES-B.
  Flashbang, EMP et Camouflage sont câblés en **offense seulement** (`cable:
  {offense: true, defense: false}`) ; ils ouvrent deux crochets, pas six : *une
  entité qui ne peut plus tirer* et *une entité qu'on ne peut plus viser*.
  ⚠ **UNE SEULE MÉCANIQUE POUR LE FLASHBANG ET L'EMP**, une table de deux
  lignes (`NEUTRALISATION = {flashbang: 'infanterie', emp: 'vehicule'}`) et
  aucune fonction jumelle : un test compte les occurrences dans la source pour
  qu'aucun cas particulier ne soit nommé à la main. Deux barèmes pour une même
  grandeur, c'est la première correction d'équilibrage qui n'en touche qu'un.
  ⚠ **LA CIBLE EST CHOISIE SUR LA COLONNE DE MATRICE, PAS SUR `cibleIndice`.**
  L'étape **3 bis** cherche sa propre cible, la plus proche de la colonne visée,
  avec **le départage de `ciblage` à la lettre** (distance, puis colonne, puis
  rangée). Prendre la cible du tir ferait dépendre la neutralisation de ce que
  le porteur avait décidé de canarder — deux grandeurs sans rapport.
  ⚠ **`escouade` N'EST PAS `infanterie`.** La table nomme des colonnes de
  matrice ; les défenses n'ont pas de châssis (`chassis: null`) et les trois
  artilleries sont des **véhicules**. Lire `chassis` au lieu de
  `colonneMatrice` ne neutralise plus aucune défense — mesuré, six tests
  tombent.
  ⚠ **50 TICKS, −20 % DE DURÉE PAR NIVEAU D'ÉCART, ET LA PÉNALITÉ EST
  ADDITIVE** (arbitrage d'Ethan : le −20 % porte sur la DURÉE). 50 · 50 · 40 ·
  30 · 20 · 10 · 0 · 0 — à cinq niveaux d'écart la durée est nulle.
  ⚠⚠ **ET UNE DURÉE NULLE NE CONSOMME PAS L'USAGE.** Le porteur ne pose sa
  marque qu'après avoir calculé la durée ; l'inverse brûlerait le seul usage du
  raid contre une cible trop haute, sans le moindre effet. Un test tombe si les
  deux lignes sont interverties.
  ⚠ **LA GARDE EST DANS `tir`, PAS DANS `ciblage`.** Une neutralisée **garde sa
  cible** — elle ne tire plus, c'est tout : ni immobilisée, ni aveugle, ni
  désarmée. Posée dans `ciblage`, `cibleIndice` retomberait à `null` et le
  module ferait bien plus que ce qu'il dit. ⚠ Et la garde est **avant l'appel à
  `tirDeBarrage`** : sinon les éclaboussures d'un porteur neutralisé partiraient
  quand même.
  ⚠ **L'ÉTAPE 3 bis EST ENTRE LE CIBLAGE ET LE TIR.** Après le tir, la
  neutralisation ne mordrait qu'au tick suivant et le premier tir passerait.
  ⚠ **CAMOUFLAGE : L'ENSEMBLE EST CALCULÉ UNE FOIS, EN TÊTE DE `ciblage`.** Un
  camouflé est invisible pour la DÉFENSE tant qu'aucune entité de sa **colonne
  de prédilection** n'est à sa portée ; il cible et tire normalement, et
  `doitSArreter` n'est pas touché. ⚠ **Le `Set` sert DEUX fois** : dans la
  boucle des candidats, et dans le bloc « cible conservée » — sans le second, un
  défenseur qui visait l'unité au moment où elle se recamoufle la viserait
  indéfiniment, et le module serait sans effet dans le cas où il compte le plus.
  ⚠ **LE PRÉ-CALCUL N'EST PAS UNE QUESTION DE SIMULTANÉITÉ — MESURÉ.** `ciblage`
  n'écrit que `cibleIndice`, que le prédicat de camouflage ne lit pas :
  l'évaluer au fil de la boucle donne le MÊME résultat, et aucun test ne tombe.
  Ce qu'on y gagne est O(n) au lieu de O(n²), et une règle qu'on lit d'un bloc.
  Le dire autrement serait inventer une justification.
  ⚠ **LES EFFETS S'EMPILENT, ET LE PLUS LONG FAIT FOI.** Deux porteurs qui
  neutralisent la même cible posent DEUX `neutralise` ; `estNeutralisee` est un
  `.some()`, donc l'échéance courte peut tomber sans lever la neutralisation.
  Constaté en raid, figé par un test — **non demandé par le brief, et non
  arbitré** : remplacer l'effet au lieu de l'empiler raccourcirait la
  neutralisation en silence.
  ⚠ **LE BOOSTER NE FRANCHIT RIEN, ET CE N'EST PAS `peutAvancer` QUI L'EN
  EMPÊCHE** (arbitrage 2 d'Ethan, vérifié sans rien changer au code). Mesuré au
  sabotage : `peutAvancer` forcée à `true`, la Carapace boostée reste bloquée
  devant le mur. Cette fonction est un **pré-calcul** qui alimente `progresse`,
  donc le compteur de repli et le forçage de l'Écraseur ; le refus d'avancer est
  exécuté **à la fin de `deplacement`**, sur la case occupée que `peutEcraser`
  refuse. Les deux passent par `peutEcraser` — le verdict est le même,
  l'attribution ne l'est pas.
  ⚠ **MESURÉ EN RAID, PAS SUPPOSÉ, ET SANS JUGEMENT DE VALEUR** : sur un
  avant-poste réel de niveau 40, l'EMP se déclenche aux ticks 22 et 31 sur deux
  Béliers défensifs (50 ticks sans tir chacun), le Flashbang au tick 87 sur une
  Meute (51 ticks sans tir), et le premier Guetteur camouflé n'est visé qu'au
  tick 60 contre le tick 26 sans le module. ⚠ **Les camps et avant-postes de
  début de partie n'ont ni artillerie ni véhicule** : l'EMP n'y a rien à
  neutraliser, et c'est une propriété du générateur, pas du module.

- **UN CHAMP QUI VOULAIT DIRE DEUX CHOSES** — 31/08, lot MODULES-D. Le profil
  portait un seul `moduleDefense` qui désignait **le module de garnison chez le
  JOUEUR** sur une unité et **celui de l'OUVRAGE** sur une défense. Il est
  scindé en `moduleDefenseJoueur` / `moduleDefenseOuvrage`, et une seule
  fonction, `moduleDeDefense(e, p)`, choisit **sur le propriétaire**.
  ⚠ **L'ANCIEN NOM A DISPARU, IL N'EST PAS RESTÉ EN ALIAS**, et `MODULES-D T1`
  balaie `src/` pour l'interdire. Son motif est **borné à droite**
  (`/moduleDefense(?![\p{L}\p{N}_])/u`) : les deux noms neufs COMMENCENT par
  l'ancien, un `includes` nu ne pourrait jamais tomber.
  ⚠ **LE DÉMÊLAGE SEUL N'A FAIT TOMBER AUCUN TEST**, et c'est un fait, pas un
  soulagement : avant qu'un module défensif ne soit câblé, `moduleDeDefense`
  n'avait qu'un lecteur observable — la ligne de résultat. Les points d'un raid
  de référence sont **identiques au point** avant et après, sur 24 mesures. La
  contre-épreuve montre que l'écart EXISTERAIT si `modulesDebloques.ouvrage`
  était armé : `['flashbang']` rendait 2 291 944 points avant, 2 059 722 après.
- **LA PORTÉE QUITTE LE PROFIL POUR L'ENTITÉ**, même lot, et **elle a QUATRE
  lecteurs, pas trois** : `ensembleCamoufles`, `ciblage`, `cibleDeNeutralisation`
  et `tir`, plus `peutTirer`. Un lecteur oublié donne une entité qui **vise**
  au-delà de sa portée et ne **tire** pas.
  ⚠ **LE CALCUL SE FAIT EN MILLI-CASES, PUIS AU CARRÉ** : `porteeMilli +
  1000`, jamais `porteeCarree + 1` — 2 500 → 3 500 milli, donc 6 250 000 →
  12 250 000. Et **plancher à zéro AVANT l'élévation**, sinon un rayon minimum
  de 0 case redeviendrait positif au carré.
- **QUATRE MODULES ÉCRITS ET INVISIBLES EN JEU, ET C'EST ASSUMÉ** — même lot.
  `proprietaireDefense: 'joueur'` n'est écrit que par `montageDefense` de
  `ui/banc.js`, derrière le geste de debug : la base du joueur n'est jamais
  attaquée. Les trois modules de combat sont donc **vérifiés au banc**, pas en
  jeu. ⚠ **ET L'AUTO-RÉPARATION EST INATTEIGNABLE, PAS SEULEMENT INVISIBLE** :
  **rien, dans tout `src/`, n'écrit `degatsMilli` sur `etat.garnison`** — les
  deux seuls écrivains, `reporterLesDegats` et `avancerLaReparation`, parcourent
  `etat.armee`. La suite de raid sort au premier `continue`, et son test tourne
  sur un **état forgé**.
  ⚠ **PV +20 % NE MAJORE QUE LES PIÈCES MONTÉES PLEINES.** Majorer les PV
  courants d'une pièce entamée réparerait d'un coup toutes les garnisons de la
  carte : acheter le module deviendrait un soin. `pvInitialMilli` suit
  `pvMilli`, jamais `pvMaxMilli`.
  ⚠ **ET LE BUTIN NE PEUT PAS BOUGER** : `butin` ne lit que
  `resultat.batiments`, et aucun bâtiment de site ne porte de module — les deux
  champs du profil bâtiment sont `null`. Un test tient les deux faits de face.

- **UN MODULE ACHETÉ DANS UNE BRANCHE NE SERT QUE DANS CELLE-LÀ** — 31/08, lot
  MODULES-E. `modulesDebloquesDuJoueur` faisait l'**union** des deux branches, et
  **quatre noms existent des deux côtés de l'arbre** — `flashbang`,
  `tirDeBarrage`, `emp`, `garnison`. Le montage devient
  `modulesDebloques: { joueur: { offense, defense }, ouvrage: { offense, defense } }`,
  **la même forme pour les deux propriétaires**, et `creerCombat` **LÈVE** sur
  une liste plate en nommant le propriétaire.
  ⚠⚠ **`camp` ET `branche` NE PORTENT PAS LES MÊMES MOTS, ET C'EST LE PIÈGE.**
  Le camp vaut `attaque` ou `defense`, la branche `offense` ou `defense` : le
  second terme coïncide, le premier NON. Une indexation par `e.camp` rendrait
  `undefined`, `undefined?.includes` ne lève pas — **tous les modules offensifs
  s'éteindraient EN SILENCE, et la moitié défensive continuerait de passer**.
  D'où la table nommée `BRANCHE_DU_CAMP`, sur le modèle de `BATIMENT_DE_CHASSIS`.
  ⚠ **LE SENS DE LA FUITE N'ÉTAIT PAS CELUI QU'ON CROYAIT** — le brief, et mon
  propre rapport MODULES-D, annonçaient « le module DÉFENSE des Perceurs (200 M)
  débloque le Tir de barrage pour l'Obusier en OFFENSE (1 G) ». **Cet achat-là
  lève** : `cable.tirDeBarrage.defense` vaut `false` depuis MODULES-A. Les quatre
  noms sont câblés en **offense seulement** — la fuite partait de l'offense vers
  la garnison, jamais l'inverse. Trois cas réellement atteignables : `flashbang`
  (Meute, 10 M), `tirDeBarrage` (Perceurs, 24 M), `emp` (Crécelle, 150 M).
  ⚠ **ET ELLE N'AVAIT AUCUN EFFET OBSERVABLE EN COMBAT** : `flashbang` et `emp`
  ne sont lus que dans `declencherNeutralisations`, gardée au camp `attaque` ;
  `tirDeBarrage` est bien lu en défense mais son éclaboussure ne vise que les
  genres `defense` et `batiment`. **Ce lot est structurel et préventif, pas un
  correctif d'équilibrage** — le dire autrement serait se vanter d'un effet nul.
  ⚠ **`pointsRecherche` LIT LA BRANCHE `defense` DU `montage.proprietaireDefense`**,
  jamais `'ouvrage'` en dur : quand la base du joueur est attaquée, c'est SA
  liste qui majore. Trois relevés au point sur le raid de référence — 2 059 722
  nu, 2 471 666 la bonne branche du bon propriétaire, 2 059 722 pour l'autre
  branche COMME pour l'autre propriétaire.
  ⚠ **`ouvrage.offense` ET `ouvrage.defense` EXISTENT ET SONT VIDES**, et les
  armer activerait d'un coup TOUS les modules câblés du côté de l'Ouvrage. Ce
  n'est pas un oubli : `sim/generateur.js` livre les deux listes vides sur tous
  les sites, et le jour où on les armera il faudra un barème par niveau de site,
  pas un `push` — sans quoi le premier camp venu porterait le Tir de barrage.
  ⚠ **CE DERNIER POINT EST À MOITIÉ CADUC DEPUIS MODULES-F** : `ouvrage.defense`
  EST armé, par `apparitionModule` et non par un `push` — voir l'entrée
  ci-dessous. `ouvrage.offense` reste vide, et le reste.

- **LE CANAL DE L'OUVRAGE EST ARMÉ, ET LES DEUX DERNIERS MODULES DE COMBAT SONT
  ÉCRITS** — 31/08, lot MODULES-F. `genererSite` remplit
  `modulesDebloques.ouvrage.defense` avec les `moduleOuvrage` des pièces dont
  `apparitionModule` est atteint : **28 Camouflage, 30 Munition spéciale,
  32 PV +20 %, 42 Rayon minimum −1 ET Vol de vie**. `offense` reste vide —
  `moduleOuvrage` ne renseigne pas `p.module`, que lit un module d'attaquant.
  ⚠ **TOUTES LES PIÈCES DES TABLES, pas seulement celles que le site a tirées** :
  c'est un palier de progression de l'Ouvrage, pas une propriété de la garnison
  du jour. Deux sites de même niveau et de graines différentes doivent débloquer
  les mêmes modules, sinon la liste devient un effet de tirage.
  ⚠⚠ **LE JOUEUR NE PEUT ACHETER NI L'UN NI L'AUTRE, ET LES DEUX SONT POURTANT
  `cable: true`.** Le drapeau dit que l'EFFET EXISTE, pas qu'il est achetable :
  les trois tourelles portent `moduleJoueur: 'autoReparation'`, le Broyeur
  `module: 'ecraseur'` et l'Enclume `module: 'bouclier'`. **Zéro ligne nouvelle
  à l'écran, mesuré des deux côtés du lot : 14 en offense, 17 en défense, douze
  modules visibles, listes identiques.**
  ⚠ **LE VOL DE VIE PORTE SUR L'ENCAISSÉ, PAS SUR LE NOMINAL** — les PV
  réellement retirés PLUS la part qu'un Bouclier a absorbée. Un tir de 500 sur
  une cible à 100 PV ne vole que 100 ; un tir entièrement absorbé en vole 500.
  En priver le voleur ferait du Bouclier une contre-mesure au Vol de vie.
  ⚠⚠ **`appliquerDegats` FAIT DEUX PASSES, ET L'ORDRE EST TOUT L'ENJEU.** La
  passe 1 retire les PV de toutes les cibles, la passe 2 seulement rend les PV
  volés. Soigner au fil de la passe 1 ferait dépendre le résultat de l'ordre des
  cibles. **Un voleur tombé dans ce tampon ne se soigne pas** : `vivant` n'étant
  écrit qu'à l'étape 6, le test porte sur `pvMilli > 0`, jamais sur `estActive`.
  ⚠ **L'ENCAISSÉ EST SERVI PAR INDICE DE TIREUR CROISSANT, PAS AU PRORATA** —
  le prorata demanderait un arrondi par tireur et une règle de reste. Le tampon
  est devenu `Map<cible, Array<{tireur, degats}>>` ; **le franchissement d'une
  barrière y range l'indice de la BARRIÈRE**, pas celui de la victime.
  ⚠ **LE CAMOUFLAGE NE FAIT RIEN CÔTÉ OUVRAGE, ET C'EST MESURÉ.**
  `ensembleCamoufles` s'ouvre sur `e.camp !== 'attaque'` : « invisible pour la
  DÉFENSE » désigne un ATTAQUANT que la garnison ne voit pas. Sur un site de
  niveau 28 qui compte quatre Carapaces, l'état sérialisé est IDENTIQUE avec et
  sans le module. **Non symétrisé** : ce serait un changement de règle.
  ⚠⚠ **LES POINTS DE RECHERCHE BOUGENT, ET PAS TOUJOURS DANS LE SENS ATTENDU.**
  Mesuré sur trois graines, armée constante : **niveau 20 identique au point**
  (rien n'est armé sous 28), **niveau 38 en HAUSSE sur 3/3**, **niveau 50 en
  BAISSE sur 3/3**. Le bonus de +20 % de MODULES-E l'emporte tant que la
  garnison ne gagne pas en résistance ; le Vol de vie et le Rayon minimum −1
  renversent le solde. **Aucun barème n'a été touché** — l'arbitrage revient à
  Ethan, et ce n'est pas une régression.

- **Vérifier avant d'affirmer.** Les erreurs les plus coûteuses du projet sont
  toutes des affirmations écrites sans mesure : l'inertie de l'artillerie
  avancée, `depuisDefenseurs` qui « refuserait les cases interdites », le calcul
  des points d'armée offensifs, la borne de débordement de l'économie
  (annoncée « deux fois sous l'entier sûr », mesurée 471 fois au-dessus), la
  marge du seuil de débit (annoncée 19 000, mesurée 19). Une grandeur qui
  s'écrit se calcule d'abord.
