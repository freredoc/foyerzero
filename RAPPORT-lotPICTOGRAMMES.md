# RAPPORT — lot PICTOGRAMMES

**Version 0.99.18 · build 119.** Branche `claude/lot-pictogrammes`, PR ouverte,
non mergée.

Retour d'Ethan du 07/09, point **17** : « implantation pictogramme », avec
l'archive `FoyerZero_S11_UI_complet_v1.zip`.

⚠⚠ **CE LOT PRODUIT LES SPRITES, IL NE LES CÂBLE PAS.** Aucun pictogramme
n'apparaît à l'écran à sa fin, et **aucune ligne n'entre dans `src/ui/`**. C'est
le §6 du brief, et c'est l'arbitrage que SON-CATALOGUE avait pris avant
SON-CÂBLAGE : décider où va chacun des quarante-six, c'est quarante-six
décisions d'interface, et ce n'est pas le même travail que de produire des
images. Le découpage proposé du câblage est au §9.

---

## 1. Base de départ

| | |
|---|---|
| `npm run check` avant le lot | **1307 pass / 0 fail** |
| `dist/index.html` avant le lot | **8 015 213 octets** |
| version avant | 0.99.17 · build 118 |
| `tools/planches.py --verifier` avant | **32 identiques · 0 différent · 0 nouveau** |

⚠ **LE BRIEF ANNONÇAIT 1245 PASS ET 8 003 811 OCTETS EN 0.99.12 · BUILD 113** ;
cinq lots ont été livrés depuis, la base réelle est celle du tableau. Rien de ce
qui suit n'est mesuré contre les chiffres du brief.

⚠⚠ **LE VERDICT « AVANT » DEMANDE LA BONNE VERSION DE PILLOW, ET C'EST LA
PREMIÈRE CHOSE QU'IL A FALLU ÉTABLIR.** Sous **Pillow 12.3.0**, l'installation
par défaut de cette machine, `tools/planches.py --verifier` rend **0 identique /
32 différents** sur un arbre PRISTINE, avant qu'une seule ligne du lot ne soit
écrite. Mesuré fichier par fichier : les 32 ont des **PIXELS IDENTIQUES**, seuls
les octets de l'encodeur PNG diffèrent. Sous **Pillow 10.4.0**, le même outil sur
le même arbre rend **32 identiques / 0 différent**. Tout ce qui suit est mesuré
sous Pillow 10.4.0. **Ne pas lire « chaîne cassée » là où il y a un changement de
bibliothèque** — et ne pas rafraîchir les PNG commités pour faire taire l'outil.

---

## 2. Les grilles, comptées sur les images

Le §1 du brief le demandait en toutes lettres : « compter les cases, ne pas
croire le manifeste ». `art/sources/S11_UI_CONTENU.txt` **n'annonce aucune
grille** — il donne les contenus, et ce sont les NOMS DE FICHIER qui portent
`3x1`, `2x2`, `3x2`, `4x2`. Les neuf planches font toutes **1 024 × 1 024**.

Les gouttières ont été comptées sur les images avant qu'une ligne ne soit
écrite. Verdict : **les neuf grilles annoncées par les noms de fichier sont
justes.** Deux planches demandaient quand même de regarder.

| planche | grille annoncée | grille mesurée | gouttières internes (px) | remarque |
|---|---|---|---|---|
| P11.1 | 3 × 1 | **3 × 1** | 326–358, 648–679 | ⚠ la coupe arithmétique rate la seconde — §4 |
| P11.2 | 2 × 2 | **2 × 2** | 462–539 | |
| P11.3 | 3 × 2 | **3 × 2** | 323–362, 662–701 | |
| P11.4 | 2 × 2 | **2 × 2** | 482–562 | |
| P11.5 | 4 × 2 | **4 × 2** | 234–261, 492–523, **765–774** | la troisième ne fait que 10 px |
| P11.6 | 3 × 2 | **3 × 2** | 327–365, 665–691 | |
| P11.7 | 3 × 2 | **3 × 2** | 332–365, 655–691 | |
| P11.8 | 2 × 2 | **2 × 2** | 414–424, **477–568**, 740–745 | ⚠ trois bandes vides, une seule gouttière |
| P11.9 | 3 × 2 | **3 × 2** | 318–369, 661–697 | ⚠ sixième case VIDE |

⚠⚠ **P11.8 MONTRE TROIS BANDES SANS ENCRE ET N'A QU'UNE GOUTTIÈRE.** Deux ne
font que **11 et 6 px** : ce sont des trous INTERNES au cadenas et à la jauge de
budget, pas des séparations. Une lecture automatique par gouttière l'aurait
découpée en **quatre colonnes** au lieu de deux, et les quatre noms auraient
glissé.

⚠⚠ **ET AUCUN SEUIL NE SÉPARE LES DEUX CAS**, ce qui est la raison pour laquelle
la table est écrite à la main plutôt que déduite : la troisième gouttière de
P11.5 fait **10 px** et c'est une vraie gouttière ; le trou du cadenas de P11.8
en fait **11** et ce n'en est pas une. Un seuil qui garderait l'une prendrait
l'autre.

⚠⚠ **LA SIXIÈME CASE DE P11.9 EST VIDE, MESURÉE À ZÉRO PIXEL D'ENCRE** — pas
« probablement vide », pas « la flèche occupe deux cases » comme le brief le
suggérait : le compte d'encre par cellule rend `[43282, 42769, 64879, 52405,
32440, 0]`. La table de l'outil porte donc un `None` à cette place, et la boucle
le saute. Inventer un nom pour du vide aurait fait un sprite transparent que
`recadrer` refuserait — il cherche la boîte de l'encre, et `xs.max()` lèverait
sur un tableau vide.

⚠ **LES DEUX ÉCARTS AVEC `CONTENU.txt` NE SONT PAS DES ERREURS DE GRILLE**, ce
sont des écarts de NOMMAGE, et ils sont au §3.

---

## 3. Les quatorze modules, identifiés au dessin

Les deux planches s'annoncent « modules 1–8 » et « modules 9–14 ». **Cette
numérotation n'est PAS celle de `src/data/modules.js`** : le cœur « PV +20 % »
est le huitième de la première planche quand `pvPlusVingt` est le **treizième**
de la table. Croire le nom de fichier aurait décalé six noms sur quatorze.

Les quatorze ont donc été identifiés **au dessin**, sur une planche de contact
agrandie. La preuve n'est pas « j'ai regardé » : `PIC T2 bis` confronte l'**UNION**
des huit de P11.5 et des six de P11.6 aux quatorze clés de `MODULES`, converties
en serpent. Une erreur d'attribution ferait manquer une clé et en laisserait une
en trop — l'égalité ne retomberait pas juste.

Deux autres décisions de nommage :

⚠ **`ui_cible_aviation`, PAS `ui_cible_structure_ou_aviation`.** La colonne de
dégâts s'appelle `structureOuAviation` ; le pictogramme dessine **un avion dans
un réticule**, donc la moitié qu'il montre. Le nommer d'après la colonne ferait
promettre une structure que personne n'a dessinée.

⚠ **`ui_points_attaque` reprend le nom de la grandeur**, `POINTS_ATTAQUE`, plutôt
que le « points : attaque » du manifeste.

---

## 4. ⚠⚠ UNE COUPE SUR VINGT TOMBAIT DANS UN DESSIN

**Trouvé par la mesure, pas par la relecture, et corrigé.**

`1024 / 3` ne tombe pas juste. Sur P11.1, la coupe arithmétique tombe à **682**,
alors que la seconde gouttière finit à **679** et que l'éclair d'électricité
commence à **680**. Conséquences mesurées :

- **trois colonnes de l'éclair entraient dans la cellule de la scorie.** Le
  sliver lui-même disparaissait à l'érosion — 2 à 3 colonnes de source ne
  survivent pas à `eroder(m, 3)` —, **mais il gonflait la boîte que `recadrer`
  centre**. Résultat : `ui_scorie` décalé de **11 px vers la gauche sur la
  grille 128**, soit **8,6 % d'une case** ;
- **`ui_electricite` perdait ces trois colonnes-là**, prises dans la cellule
  voisine.

⚠⚠ **LES HUIT AUTRES PLANCHES TOMBENT JUSTE**, mesuré aussi : leurs vingt-huit
autres coupes sont toutes DANS une gouttière. Une seule fait exception, une
seule a une ligne.

La correction tient en deux morceaux dans `tools/planches.py` :

1. **`verifier_les_coupes`** lève si une coupe interne tombe sur une colonne ou
   une ligne encrée. C'est mot pour mot ce que `tools/barrieres.py` dit déjà de
   sa propre coupe en deux : « une coupe qui traverse une pièce n'échoue pas
   bruyamment : elle produit deux sprites tronqués, et personne ne le voit avant
   de regarder les 32 ».
2. **`COUPES_INTERFACE`** porte les coupes explicites de la seule planche qui en
   demande : `[0, 342, 663, 1024]`, les milieux de gouttière.

⚠ **LA GARDE EST FALSIFIABLE, ET ELLE A ÉTÉ FALSIFIÉE** : `COUPES_INTERFACE`
vidée, `taches()` lève `« P11.1_ressources_3x1_1024.png : la coupe en colonne 682
tombe dans le dessin »`. Sans cette vérification, la garde pourrait ne rien
garder.

---

## 5. Ancrage et échelle — la leçon du 06/09, prise par l'autre bout

**Ancrage : `centre`**, qui est le défaut de `recadrer` — donc rien à passer.
`ancrage='bas'` pose les contenus sur une **ligne de sol commune**, ce qui est
juste pour un bâtiment vu de CÔTÉ et faux partout ailleurs : au lot
EMBLÈME-CENTRÉ, il avait donné aux emblèmes de carte **5 px de marge basse à tous
les paliers et jusqu'à 35 px de vide en haut**, soit 28 % d'une case de décalage
vers le sud. **Un pictogramme n'a pas de sol.**

**`cote_ref` : aucun**, c'est-à-dire le défaut `None`, donc **chaque cellule est
normalisée séparément**. La référence commune sert à garder le rapport de taille
entre les paliers d'un MÊME sujet — c'est l'acquis d'EMBLÈMES-ABÎMÉS, où une base
de niveau 1 ressortait à la taille d'une base de niveau 50. **Deux pictogrammes
n'ont aucune échelle commune** : un cadenas n'est pas plus petit qu'un coffre, et
leur imposer un rapport de taille reviendrait à inventer une grandeur qu'aucun
dessin ne porte.

**Emprise : `EMPRISE_INTERFACE = 28`**, et ce n'est pas une valeur neuve :
`cible(pv)` de `tools/final128.py` rend 16 pour le plus petit bâtiment et **28
pour le plus grand**. C'est donc la plus grande emprise que cette chaîne ait
jamais produite, soit **87,5 % de la case**. Un pictogramme se lit petit et n'a
rien à côté de lui : il prend tout ce que la chaîne sait donner, et les 12,5 %
restants sont la marge qui l'empêche de toucher le bord — sans elle, l'érosion de
`conditionner` mordrait dans le dessin.

**Mesure du centrage, sur les 46 × 2 = 92 sprites :**

| | grille 64 | grille 128 |
|---|---|---|
| écart vertical maximal | **1 px** (`ui_moins`) | **1 px** (`ui_pv`) |
| écart horizontal maximal | **1 px** (`ui_pv`) | **1 px** (`ui_recherche`) |

⚠ **1 px EST L'ARRONDI D'UNE HAUTEUR D'ENCRE IMPAIRE DANS UNE CASE PAIRE**, pas
un décalage. `PIC T3` exige `≤ 1` **sur tous les quatre-vingt-douze**, et il
asserte en plus que le pire écart **vaut exactement 1** : un test qui ne
mesurerait rien — dossier vide, boucle qui ne tourne pas — passerait l'inégalité
sans rien dire.

---

## 6. Le détourage

Le fond est le magenta `#FF00FF`, et `est_fond` de `tools/cond.py` le reconnaît —
**vérifié plutôt que supposé** : `cle_de_fond` vote sur les quatre coins, et les
neuf planches votent magenta.

**Aucun pixel de fond ne survit** : `PIC T4` balaye les 92 sprites, mesure la
distance au magenta de clé sur les pixels **opaques seuls**, avec une tolérance
large de 60, et n'en trouve **aucun**.

⚠⚠ **ET LA MESURE PORTE SUR LA CLÉ, PAS SUR `est_fond` — LA NUANCE EST TOUT LE
TEST.** Un premier balayage écrit avec `est_fond` accusait quatre sprites :
`ui_module_bouclier` (17 px en 128), `ui_armee_offensive` (3), `ui_categorie_tourelle`
(1), `ui_module_ecraseur` (1). Aucun n'est du fond : c'est la **seconde porte** du
prédicat — « violet clair quelconque » — qui attrape le **violet du bouclier
lui-même**. C'est très exactement ce que `est_fond_sujet` documente déjà : « la
seconde porte mangeait l'intérieur du sujet ». Un test qui reprendrait ce
prédicat accuserait le détourage d'une faute qui est dans le prédicat.

⚠ **LE VERT DE LA GRANDE FLÈCHE SURVIT, ET IL N'EST DANS AUCUNE DES QUATORZE
TEINTES DE BASE.** Mesuré : **3 447 px verts sur 5 559 opaques**, teinte dominante
`(7, 251, 1)`. C'est possible parce que **la palette ne contraint plus les
couleurs depuis le lot PIXELS** — `ecrire` réduit par FILTRE quand la matière lui
est passée, et `produire` la lui passe. **Aucune teinte n'a été ajoutée à la
palette.** `PIC T4 bis` le mesure et se falsifie sur `ui_fleche_gauche`, qui n'en
porte aucun.

---

## 7. Le poids — la vraie contrainte du brief

⚠⚠ **LE BRIEF ATTENDAIT « LE PLUS GROS AJOUT D'IMAGES DEPUIS LONGTEMPS ».
MESURÉ, LE LIVRABLE PREND +911 OCTETS, ET PAS UN DE PLUS EN IMAGES.**

| poste | avant | après | delta |
|---|---:|---:|---:|
| **total** | **8 015 213** | **8 016 124** | **+911** |
| JavaScript | 361 730 | 362 641 | **+911** |
| feuille | 119 742 | 119 742 | +0 |
| balisage | 39 901 | 39 901 | +0 |
| images | 6 306 280 | 6 306 280 | **+0** |
| audio | 1 187 560 | 1 187 560 | +0 |
| lignes `data:` | 296 | 296 | +0 |
| URI `data:` | 291 | 291 | **+0** |

La somme des cinq postes tombe **exactement** sur le total, dans les deux
mesures. Le « avant » est un livrable **rebâti** depuis l'état du lot précédent,
pas un chiffre recopié.

⚠⚠ **POURQUOI L'ATLAS N'ENTRE PAS, ET CE QUE ÇA RÈGLE.** Un fichier n'entre dans
le livrable que par un **MARQUEUR**, et un marqueur se pose **dans la page**,
c'est-à-dire dans `src/ui/`, où le §6 du brief interdit d'écrire. `tools/build.js`
le dit de lui-même : « on n'en déclare pas POUR PLUS TARD […] chaque famille
entre avec le lot qui la consomme ». La quatorzième famille est donc **cousue et
indexée sans être embarquée**. Les 911 octets sont du JavaScript pur : les
quarante-six noms et la grille 7 × 7 dans `src/data/atlas.js`.

**Ce que le câblage paiera :**

| | disque | en base64 |
|---|---:|---:|
| `atlas-interface-128.webp` | 175 454 | **233 938** |
| `atlas-interface-64.webp` | 79 442 | 105 922 |

| | octets | marge sur T10 | % |
|---|---:|---:|---:|
| aujourd'hui | 8 016 124 | **1 283 876** | **13,81 %** |
| projection après câblage en 128 | 8 250 062 | 1 049 938 | **11,29 %** |
| projection après câblage en 64 | 8 122 046 | 1 177 954 | 12,67 % |

⚠ **LA MARGE NE TOMBE PAS SOUS 10 %**, ni maintenant ni après le câblage. Le
brief demandait de le dire clairement si elle y tombait ; elle n'y tombe pas.
La borne T10 **ne bouge pas**.

---

## 8. ⚠⚠ CE QUE COÛTE LA GRILLE 128, ET LA PROPOSITION

Le §4 du brief : « la 64 suffit peut-être — mesurer ce que coûte la 128 et ce
qu'elle apporte, et proposer de ne produire que la 64 si la seconde ne sert
personne ».

**Ce qu'elle coûte :** **128 016** octets de livrable de plus que la 64, au
câblage. **Zéro aujourd'hui**, puisque ni l'une ni l'autre n'est embarquée.

**Ce qu'elle apporte :** un pictogramme affiché à 64 px CSS sur un téléphone à
`dpr` 3 est rendu sur **192 pixels d'appareil**. La grille 64 y serait
agrandie **trois fois**, la 128 une fois et demie. À quelle taille CSS ils
s'afficheront, personne ne le sait encore : c'est une décision du câblage.

⚠⚠ **ET LE CHOIX NE SE PREND PAS PAR FAMILLE AUJOURD'HUI.** `GRILLE_ATLAS` de
`tools/build.js` est **une constante, et une seule**, pour les NEUF familles
embarquées — son
propre commentaire dit pourquoi : « l'écrire dix fois dans la table ci-dessous, ce
serait dix occasions d'en oublier une, et la faute serait MUETTE ». Embarquer
l'interface en 64 pendant que les autres restent en 128 demanderait de faire de
cette constante une valeur PAR ENTRÉE, plus un test qui épingle la grille de
chaque famille.

**Proposition faite à Ethan :** garder les deux grilles sur le disque, trancher
au lot de câblage quand les tailles d'affichage réelles seront connues, et se
souvenir que choisir la 64 pour cette seule famille demanderait de faire de
`GRILLE_ATLAS` une valeur par entrée — un lot, pas une ligne.

⚠⚠ **ETHAN A TRANCHÉ LE 07/09 : « 128. »** La proposition tombe, et c'est la
réponse la plus simple des trois : **rien à faire**. `GRILLE_ATLAS` vaut déjà
128, `COTE_SPRITE` aussi, et le câblage embarquera `atlas-interface-128.webp`
par le mécanisme ordinaire. Ce que ça fixe :

- le câblage paiera **233 938 octets** de base64, pas 105 922 ;
- projection **8 250 062 octets**, marge **1 049 938**, soit **11,29 %** ;
- **`GRILLE_ATLAS` reste une constante unique**, et la complication d'une valeur
  par famille n'a plus lieu d'être — c'est le vrai gain de cet arbitrage, plus
  encore que les pixels ;
- ⚠ **la grille 64 continue d'être PRODUITE**, comme pour les neuf autres
  familles. Elle ne coûte rien au livrable, et la retirer serait une exception
  de plus dans `tools/planches.py` pour zéro octet gagné.

---

## 9. Les quarante-six pictogrammes, et le découpage proposé du câblage

**Ce que ce lot livre, et rien de plus :** quarante-six PNG en 64 et en 128, deux
atlas, une entrée dans `src/data/atlas.js`. **Aucun n'est affiché.**

| groupe | n | noms |
|---|---:|---|
| ressources | 3 | `ui_quartz` `ui_scorie` `ui_electricite` |
| points stratégiques | 4 | `ui_points_attaque` `ui_armee_offensive` `ui_armee_defensive` `ui_recherche` |
| cibles et châssis | 6 | `ui_cible_infanterie` `ui_cible_vehicule` `ui_cible_aviation` `ui_chassis_escouade` `ui_chassis_blinde` `ui_chassis_aeronef` |
| catégories de défense | 4 | `ui_categorie_mur` `ui_categorie_barriere` `ui_categorie_tourelle` `ui_categorie_artillerie` |
| modules | 14 | `ui_module_flashbang` `ui_module_camouflage` `ui_module_emp` `ui_module_munition_speciale` `ui_module_tir_de_barrage` `ui_module_vol_de_vie` `ui_module_booster` `ui_module_pv_plus_vingt` `ui_module_garnison` `ui_module_rayon_mini_moins_un` `ui_module_ecraseur` `ui_module_rayon_plus_un` `ui_module_auto_reparation` `ui_module_bouclier` |
| stats et actions | 6 | `ui_pv` `ui_degats` `ui_butin` `ui_reparation` `ui_temps` `ui_niveau` |
| états d'interface | 4 | `ui_verrou` `ui_emplacement` `ui_vague` `ui_budget` |
| flèches et signes | 5 | `ui_fleche_gauche` `ui_fleche_droite` `ui_fleche_verte` `ui_plus` `ui_moins` |

**Découpage proposé du câblage — quatre lots, dans cet ordre.**

⚠⚠ **CE QUI REND LE PREMIER DIFFÉRENT DES TROIS AUTRES.** Aujourd'hui l'atlas
d'interface existe sur le disque et dans l'index, mais **la page ne le connaît
pas**. Le rendre visible demande trois gestes, une fois pour toutes :

1. `src/index.src.html` déclare `--atlas-interface: url('%ATLAS_INTERFACE%')`,
   comme il déclare déjà `--atlas-batiment` ;
2. `tools/build.js` ajoute `atlas('interface')` à `FICHIERS_INLINE`, ce qui
   remplace le marqueur par le `data:` — **c'est là que les 233 938 octets
   entrent**, et nulle part ailleurs ;
3. `src/ui/session.js` ajoute `'atlas-interface': '--atlas-interface'` à
   `ATLAS_DE_LA_PAGE` **si et seulement si** un canevas en veut un
   `HTMLImageElement` ; une étiquette en CSS n'en a pas besoin.

**Après ça, poser un pictogramme est une ligne** — `fondDuSprite('interface',
'ui_quartz')` rend déjà l'image, la position et la taille de fond. Les trois lots
suivants ne coûtent donc **pas un octet d'image** : ils ne font que remplacer des
étiquettes par des fonds.

| lot | pictogrammes | écrans | ce qu'il fait, et pourquoi à ce rang |
|---|---:|---|---|
| **1. CÂBLAGE-BANDEAU** | **7** — les 3 ressources + les 4 points stratégiques | `src/index.src.html`, `tools/build.js`, `src/ui/session.js` | **Le seul lot qui paie des octets** : il fait entrer l'atlas dans le livrable (+233 938, marge 11,29 %) et pose la convention d'affichage — taille CSS, alignement sur le texte, comportement à `dpr` 3. Il est premier parce que le bandeau est **sur tous les écrans** : si la convention est mauvaise, ça se voit tout de suite, sur sept pictogrammes et pas sur quarante-six. |
| **2. CÂBLAGE-ARSENAL** | **10** — 3 cibles, 3 châssis, 4 catégories de défense | `src/ui/arsenal.js`, `src/ui/offense.js`, `src/ui/defense.js` | Un **vocabulaire fermé** : les trois palettes affichent déjà ces dix notions en toutes lettres, et les remplacer est une substitution ligne à ligne. Deuxième parce que c'est le premier vrai essai de la convention du lot 1 sur des listes denses. |
| **3. CÂBLAGE-MODULES** | **14** — les quatorze modules | `src/ui/recherche.js`, `src/ui/raid.js` | Le plus gros bloc, et **le seul dont la table de vérité est déjà écrite** : `MODULES` a quatorze clés, `PIC T2 bis` garde déjà la correspondance nom de sprite ↔ clé. Le lot n'a donc pas à décider quel dessin va où, seulement où le poser à l'écran. |
| **4. CÂBLAGE-CHIFFRES** | **15** — 6 stats et actions, 4 états, 5 flèches et signes | `src/ui/chantier.js`, `monde.js`, `mission.js`, et les contrôles | **Le plus diffus, donc le dernier.** `ui_plus`, `ui_moins` et les trois flèches ne sont pas des étiquettes mais des **CONTRÔLES** : ils entrent dans des boutons, donc ils touchent à l'accessibilité, aux zones de touche et aux libellés lus à voix haute. À faire quand les trois lots d'avant auront posé la convention, pas avant. |

⚠ **LE DÉCOUPAGE SUIT LES ÉCRANS, PAS LES PLANCHES.** Un lot par famille de
planche mélangerait quatre écrans dans chaque relecture ; un lot par écran laisse
relire un écran d'un coup. C'est le seul critère qui a servi.

⚠ **ET IL EST DÉSÉQUILIBRÉ EXPRÈS** : 7, 10, 14, 15. Le premier est petit parce
qu'il porte le risque — les octets et la convention ; le dernier est gros parce
qu'à ce moment-là il ne restera plus de décision à prendre.

⚠⚠ **CE DÉCOUPAGE EST UNE PROPOSITION, PAS UNE DÉCISION.** Il tient aussi en
**un seul lot** si tu préfères tout voir d'un coup — c'est alors quarante-six
décisions d'interface dans une seule relecture, et c'est très exactement ce que
le §6 du brief demandait d'éviter.

---

## 10. Les trois flèches vertes non carrées

`ui_fleche_verte_1024x1024.png`, `..._x1_5_1024x1536.png`, `..._x2_1024x2048.png`.

**Elles restent DORMANTES, et ce n'est pas un oubli.** Trois raisons, dans
l'ordre :

1. **La chaîne coud des cellules CARRÉES à la taille de case.** `tools/atlas.py`
   exige `COTE × COTE` ; 1 024 × 1 536 et 1 024 × 2 048 n'entrent dans aucun
   atlas, exactement comme les deux grosses bases de l'Ouvrage et les huit
   planches de sol, qui voyagent par leur propre marqueur.
2. **La flèche verte est DÉJÀ produite**, depuis la cellule 3 de P11.9 :
   `ui_fleche_verte` existe en 64 et en 128, vert compris.
3. **Un marqueur propre est du `src/ui/`**, interdit ici.

⚠ **« DORMANTE » NE VEUT PAS DIRE « MORTE »** — c'est la phrase que
`art/sources-declarees.json` porte lui-même à propos d'`icone_appli.png`. Si le
câblage veut une grande flèche à trois tailles, elle sortira par son propre
marqueur, comme les décors ; les fichiers sont au dépôt.

---

## 11. Verdicts de la chaîne, avant et après

| | avant | après |
|---|---|---|
| `tools/planches.py --verifier` (Pillow 10.4) | **32 id. · 0 diff. · 0 nouv.** | **124 id. · 0 diff. · 0 nouv.** |
| `tools/planches.py --verifier` (Pillow 12.3) | 0 id. · 32 diff. | non rejoué — voir §1 |
| `tools/atlas.py --verifier` | 8 id. · 10 diff. (18 atlas) | **10 id. · 10 diff. (20 atlas)** |
| `src/data/atlas.js` / `atlas-empreintes.json` | — | **identiques** |
| `tools/verifier.py` (chaîne entière) | non lançable ici | **681 id. · 269 diff. · 0 nouv. · 0 MANQUANT** — rejoué APRÈS la correction du §4, mêmes chiffres |

**+92 identiques sur `planches`, soit exactement les 46 pictogrammes × 2
grilles.** Les deux atlas d'interface se reproduisent à l'octet.

⚠⚠ **LES 269 DIFFÉRENTS DE `verifier.py` SONT TOUS ENVIRONNEMENTAUX, ET AUCUN
N'EST UN PICTOGRAMME.** Ventilés : **264 sons**, **1 `sol/`**, **1 `fond/`**,
**1 `carte/`**, et les deux manifestes **`ancres-defense.json`** et
**`ancres-blindes.json`**.

- **Les 264 sons** : `opusenc` est absent de cette machine. `tools/sons.py` sort
  en erreur avec sa commande d'installation, comme la table de `verifier.py`
  l'annonce (« il demande `opusenc`, qui n'est pas plus présent que Pillow sur un
  conteneur neuf »). Les `.opus` ne peuvent pas se reproduire sans lui.
- **Les 3 WebP** : même classe que les 10 atlas — l'encodeur libwebp de cette
  machine n'est pas celui qui a produit les fichiers commités. ⚠ **L'identité
  des pixels a été vérifiée pour les 32 PNG de `planches`, PAS pour ces
  trois-là** : la cause est présumée, pas mesurée, et le dire vaut mieux que de
  l'affirmer.
- **Les 2 JSON** : les treize outils écrivent leurs fichiers texte **sans
  `newline=`**. Sous Windows, le mode texte rend du CRLF ; le dépôt est en LF.

⚠ **AUCUN DE CES CINQ FICHIERS N'EST TOUCHÉ PAR LE LOT.**

---

## 12. Ce que le lot a corrigé dans l'outillage

⚠⚠ **`tools/atlas.py` ÉCRASAIT SANS CONDITION.** Ajouter une famille réécrivait
**dix atlas sur dix-huit** avec les octets de l'encodeur WebP de la machine, pour
des **images identiques** — mesuré sur un arbre PRISTINE avant qu'une ligne du lot
ne soit écrite. L'outil porte désormais l'invariant que `tools/planches.py` a
depuis toujours, mot pour mot : « on n'écrase JAMAIS un fichier existant qui ne se
reproduit pas ; s'il diverge, c'est que sa provenance n'est pas entièrement dans
cette chaîne, et le fichier commité fait foi ».

⚠ **ET L'EMPREINTE SUIT LE FICHIER RETENU**, pas celui qu'on vient de coudre :
`atlas-empreintes.json` doit décrire ce qui est SUR LE DISQUE, sinon
`test/sprite.test.js` tomberait en accusant l'atlas d'avoir changé alors que
c'est le manifeste qui aurait menti.

⚠ **CONSÉQUENCE À CONNAÎTRE : REMPLACER UN ATLAS DEMANDE DE LE SUPPRIMER
D'ABORD.** C'est ce qu'il a fallu faire pour reproduire les deux atlas
d'interface après la correction de coupe du §4 — et c'est exactement la propriété
voulue : le remplacement devient un **geste explicite**.

⚠ **`tools/planches.py` GAGNE `verifier_les_coupes`** — §4.

---

## 13. PASS / KO des tests

| code | ce qu'il prouve | verdict |
|---|---|---|
| **PIC T1** | la chaîne reproduit à l'octet, avant et après | **PASS** — 32/0/0 avant, **124/0/0** après. ⚠ **N'EST PAS UN TEST NODE** : `--verifier` est du Python, et `CLAUDE.md` §3 le garde hors de `npm run check`. Le verdict est ici. |
| **PIC T2** | le compte est celui des grilles mesurées | **PASS** — 46, planche par planche, sur les deux grilles |
| **PIC T2 bis** | les 14 modules sont les 14 clés de `MODULES` | **PASS** |
| **PIC T3** | chaque pictogramme est centré | **PASS** — écart ≤ 1 px sur les 92 sprites et les DEUX AXES, pire écart = 1 |
| **PIC T4** | aucun fond magenta ne survit | **PASS** — 0 sur **343 861** pixels opaques balayés |
| **PIC T4 bis** | le vert de la flèche survit | **PASS** |
| **PIC T5** | la table et les fichiers s'accordent | **PASS** — dans les deux sens |
| **PIC T6** | les atlas d'avant n'ont pas bougé | **PASS** — **18 tailles en clair**, soit les neuf familles d'avant × deux grilles. ⚠ Le brief dit « onze » ; le dépôt en portait **dix-huit fichiers pour neuf familles** au moment du lot. |
| **PIC T7** | le poids est sous la borne, marge en clair | **PASS** — 8 016 124 < 9 300 000, marge 1 283 876 (13,81 %) |

**`npm run check` : 1315 pass / 0 fail.** +8 tests, **aucune assertion retirée ni
assouplie**.

---

## 14. Écarts et points en suspens

1. ⚠⚠ **`PIC T1` N'EST PAS UN TEST NODE, ET NE PEUT PAS L'ÊTRE.** C'est un
   verdict d'outil Python, hors de `npm run check` par arbitrage. Il est au §11.
2. ⚠⚠ **`opusenc` EST ABSENT DE CETTE MACHINE.** `tools/entrees.py --declarer`
   rejoue TOUTE la chaîne, sons compris, et ne peut donc pas tourner tel quel.
   Il a été joué avec un `opusenc` local délégant à `ffmpeg`, **dans le bac à
   sable jetable de la trace**, dont toutes les sorties sont détruites. Le
   résultat est vérifiable de face, et il l'a été : **la déclaration ne bouge que
   des neuf planches**, qui passent de dormantes à consommées — 393 → 402
   consommées, 123 → 114 dormantes, rien d'autre. Les trois flèches vertes
   restent dormantes (§10). ⚠ **`sources-declarees.json` n'a pas été édité à la
   main**, le §2.5 du brief est tenu.
3. ⚠ **LES TREIZE OUTILS ÉCRIVENT LEURS FICHIERS TEXTE SANS `newline=`.** Sous
   Windows, `tools/atlas.py` rend `src/data/atlas.js` et `atlas-empreintes.json`
   en CRLF — un diff de fichier entier pour cinquante lignes ajoutées. **Normalisé
   à la main ici** ; le corriger dans les treize outils est un lot à part, et il
   rendrait aussi les deux `ancres-*.json` du §11.
4. ⚠ **LE RENDU N'A PAS ÉTÉ VU À L'ÉCRAN, ET SE DÉCLARE NON EXÉCUTÉ** — par
   construction : rien n'est câblé. Les quarante-six ont été relus sur une
   **planche de contact**, pas dans le jeu.
5. ⚠⚠ **`PIC T3` MESURE MAINTENANT LES DEUX AXES, ET C'EST UN ÉLARGISSEMENT
   ASSUMÉ DU BRIEF.** Le §5 ne demandait que la marge haute et la marge basse ;
   c'est l'axe horizontal qui a fait sortir la coupe fautive du §4. Après
   correction, le pire écart vaut **1 px sur les deux axes et les deux grilles** —
   contre 5 px en 64 et **11 px en 128** avant. Il reste donc une assertion de
   plus que ce que le brief demandait, et elle garde la correction.
6. ⚠ **CE QU'ETHAN A TRANCHÉ, LE JOUR MÊME** : la grille du câblage sera la
   **128** (§8). Reste ouvert : le découpage des quatre lots de câblage (§9),
   qui est une proposition et pas une décision.
