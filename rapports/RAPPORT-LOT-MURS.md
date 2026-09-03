# RAPPORT — LOT MURS

**Version produite** : `0.73.0` · build `75`.
**Base** : `claude/sprite-refonte-9il369` à `0551b65` (lot OFFENSE).
**`SAVE_VERSION`** : inchangée, **24**.

---

## 0. Ce que le lot fait, en une phrase

Le mur de contour était un **trait** posé à cheval sur le bord de la base ; il
devient un **anneau de blocs pleins** qui la ceint sans rien recouvrir.

Ethan, 03/09 : « déjà refait les murs avec les nouveaux sprites, et pour que ça
passe bien parce que là ça déborde ; les murs vont du haut de la base jusqu'à la
défense et ne ferme pas en bas. »

---

## 1. ⚠⚠ LE LOT REND DES OCTETS — LE PREMIER DEPUIS RÉSERVE

| poste | avant | après | delta |
|---|---|---|---|
| images du mur inlinées | 5 PNG, **52 864** en base64 | 6 WebP, **22 576** | **−30 288** |
| balisage, feuille, code | — | — | +1 461 |
| **`dist/index.html`** | **3 257 192** | **3 228 365** | **−28 827** |
| `art/sprites/bord/` | 16 PNG, 90 621 o | 16 WebP, **52 830 o** | −37 791 |

La borne T10 **ne bouge pas** — 3 400 000, marge **171 635 octets, 5,1 %**. Elle
ne se baisse pas parce qu'un lot rend : ce qu'elle tient est un ordre de
grandeur contre une explosion, pas un plafond ajusté au dernier build.

⚠ **`data:` dans le HTML : 17 avant, 18 après.** Le compte monte d'un alors que
le poids baisse : cinq images en sortent, six entrent.

---

## 2. ⚠⚠ CE QUE LES PLANCHES NEUVES CHANGENT N'EST PAS LA TAILLE

La v1 était un **trait fin** sur fond transparent, `512 × 64`, posé **à cheval**
sur la ligne du bord : il mordait d'une demi-case au-dedans, d'où la demi-case de
`padding` de la feuille — et d'où « ça déborde », doublé depuis que la grille
embarquée est passée à 128.

La v2 est un **bloc plein**, opaque à 97 % de sa boîte, vu de dessus comme le
reste de la base. Il occupe **une case entière** et ne recouvre rien.

**Conséquence : le contour cesse d'être un liseré pour devenir un ANNEAU**, et
c'est une géométrie, pas une épaisseur. Trois choses bougent ensemble :

| | avant | après |
|---|---|---|
| `padding` de `#chantier-grille` | `calc(var(--case-cote) / 2)` | `var(--case-cote)` |
| diviseur de `coteQuiTient` | `GRILLE.largeur + 1` | `GRILLE.largeur + 2` |
| `paddingDeLaGrille()` | `coteCase / 2` | `coteCase` |

Un test exige les trois : en changer une seule décale le mur du contenu, et
personne ne le verrait sans mesurer.

---

## 3. ⚠⚠ LES QUATRE « ANGLES » N'EN SONT PAS, ET ÇA CHANGE LE VOCABULAIRE

Le zip les nomme `angle_bloc_…_1x1_v2_{1..4}`. **Mesuré et regardé** : ce sont
quatre **variantes du même carré plein** — quatre agencements de briques —, pas
quatre orientations d'un coude. Aucune n'est le miroir d'une autre : le couple le
plus proche, v1 contre v2 retourné, diffère encore de **4,4 par canal en
moyenne**, quand deux variantes quelconques diffèrent de 18 à 24.

La v1 nommait ses pièces par leur **place** — `mur_h_a`, `mur_v_b`, `angle_no` —
parce que le dessin en dépendait : un trait éclairé à gauche ne va pas à droite.
La v2 se **numérote** : un coin du U et un flanc du U sont le même bloc.

D'où huit noms par camp et non cinq : `bord_<camp>_mur_{1..4}` (512 × 128) et
`bord_<camp>_bloc_{1..4}` (128 × 128).

---

## 4. LE U, ET LE PAVAGE

⚠⚠ **LES FLANCS DESCENDENT LE LONG DE LA DÉFENSE, ET C'EST UN ARBITRAGE RENDU
PENDANT LE LOT.** « Les murs vont du haut de la base **jusqu'à** la défense »
avait d'abord été lu *jusqu'à son bord* — le U n'entourant que la bande des
bâtiments. Ethan, mis devant le rendu : **« flanc sur la défense aussi »**.

Le U enferme donc les **deux bandes que le joueur compose** — bâtiments ET
défense — et ne s'ouvre que sur les deux rangées de **déploiement**, par
lesquelles l'assaut arrive. C'est le seul côté sans mur, et le seul que
l'assaillant franchit : la lecture du 31/08 est intacte, c'est son étendue qui
change.

**37 pièces** : deux blocs de coin, la rangée du haut, et deux flancs de seize.
**Zéro image de plus** — ce sont les mêmes six dessins.

```
rangée du haut : bloc@0  mur@1w4  mur@5w4  bloc@9  bloc@10     somme = 11
flancs         : x=0 et x=10, y=1 à 16     (8 bâtiments + 8 défense)
ouvert         : y=17 et 18                (les deux rangées de déploiement)
```

⚠ **RIEN N'EST ÉCRIT.** On pose autant de murs de quatre cases qu'il en tient
entre les coins, puis des blocs pour le reste ; sur une base de neuf colonnes ça
fait deux murs et un bloc. Le jour où la base changera de largeur, le pavage
suivra. Un test **refait la somme** et vérifie qu'il n'y a ni trou ni
recouvrement, plutôt que de croire un nombre.

⚠⚠ **ET LE FLANC SE MESURE D'UN BORD À L'AUTRE, JAMAIS EN ADDITIONNANT LES
BANDES.** Une somme sauterait une bande qui se glisserait un jour entre les
deux, et le mur aurait un trou que rien ne dirait. ⚠ **Cette falsification-là ne
mord pas, et elle se déclare** : les deux formules coïncident aujourd'hui, les
bandes étant adjacentes, donc aucun test ne peut les séparer sans inventer une
troisième bande. Le test **relève l'égalité** au lieu de faire semblant de la
garder, et c'est elle qui tombera le jour venu — avec le message qui dit
laquelle des deux écritures est la bonne.

⚠ **LA VARIANTE D'UN BLOC SE TIRE, CELLE D'UN MUR TOURNE PAR RANG.** Les blocs
sont trente-quatre et `variante` les mélange — un `i % 4` donnerait un damier
régulier sur un flanc, ce que quatre variantes existent pour éviter. Les murs
sont **deux** : un tirage y emploierait deux variantes sur quatre, prises au
hasard, et le livrable paierait les deux autres pour rien. Le rang les prend
dans l'ordre.

⚠ **ET IL NE TIRE PAS DANS `etat.rng`.** `variante` est pure et prend la
position ; le sel est une constante nommée. Le contour se construit au CÂBLAGE
de l'écran, avant qu'aucun état n'existe — lui passer la graine de la partie
obligerait à le reconstruire au premier chargement, pour que le mur d'un joueur
diffère de celui d'un autre, ce que personne n'a demandé.

⚠ **SIX DESSINS SUR SEIZE ENTRENT AU LIVRABLE**, et un test compare la table des
images à ce que l'anneau pose **dans les deux sens** : une pièce sans image est
un pan de mur absent, une image sans pièce est du poids pour rien.

---

## 5. ⚠⚠ LA COUPE D'ETHAN LAISSAIT LE FOND — MESURÉ

Le zip portait les seize sprites **déjà découpés** à côté des planches. Deux
faits, tous deux mesurés :

1. **La fenêtre fixe de l'outil les reproduit au pixel près, sur les seize**,
   canal par canal, dans l'ordre de lecture haut-gauche → bas-droite. C'est ce
   qui prouve que le cadrage est le bon, et pas seulement qu'il est plausible.
2. **Sa coupe gardait le fond.** `mur_joueur_4x1_v2_1` porte **2 029 pixels de
   magenta pur** enregistrés OPAQUES, dont **493 sur la seule ligne du haut** et
   323 sur celle du bas : le dessin ne touche pas tout à fait les bords de sa
   boîte, et un liseré `#FF00FF` aurait couru sur toute la longueur du mur.

L'outil détoure, donc. ⚠ **Par `est_fond_sujet` et non par `est_fond`** — la
seconde porte d'`est_fond` attrape des teintes claires jusqu'au milieu d'un
sujet. **Falsifié en la rendant nue : les trous enfermés dans les seize passent
de 77 à 716 px**, soit 9,3 fois. C'est le premier emploi de cet acquis du lot
PIXELS hors de `final128`.

---

## 6. NI RÉDUCTION NI QUANTIFICATION, ET C'EST LE WEBP QUI PAIE

Le dessin est **déjà à sa définition finale dans la planche** : chaque cellule de
1024 porte un mur de 512 × 128 ou un bloc de 128 × 128. Il n'y a rien à réduire —
et depuis le lot PIXELS la chaîne ne ramène plus rien sur une palette fermée.

La v1 quantifiait sur **seize teintes par camp** parce qu'un PNG au rendu libre
pesait 42 643 octets pour un seul mur. Mesuré sur `mur_1` de la v2 :

| encodage | octets | RVB exact | alpha exact |
|---|---|---|---|
| **WebP q85** | **6 344** | non | **oui** |
| WebP q92 | 9 140 | non | oui |
| WebP sans perte | 53 956 | oui | oui |
| PNG optimisé | 72 651 | oui | oui |

Les huit pièces du joueur pèseraient **467 028 octets de base64 en PNG** ; en
WebP q85 elles en pèsent 38 592, et les six retenues 22 576.

⚠ **L'ENCODAGE EST AVEC PERTE, ET CE N'EST PAS LA MÊME PHRASE QUE LA COUPE.**
WebP q85 n'est exact ni sur le rouge ni sur le vert ; il l'est sur l'**alpha**,
que WebP compresse toujours sans perte — et c'est l'alpha qui porte l'invariant
du dépôt (« aucune transparence partielle »).

⚠⚠ **ET LA GARDE DES TEINTES A ÉTÉ RETOURNÉE, PAS ASSOUPLIE.** Elle exigeait
`teintes <= 16` — la marque de la quantification. Elle exige maintenant
`teintes > 1000` : la même ligne, dans l'autre sens, et elle tombe le jour où la
chaîne se remettrait à quantifier ces fichiers.

---

## 6 bis. ⚠⚠ LA COULEUR DU BORD DOIT BAVER, ET LE CAS NORMAL EST LA RÉDUCTION

Trouvé **en regardant un rendu de contrôle**, pas à la relecture. Un mur fait
512 pixels pour quatre cases ; à la case par défaut de **46 px** il est affiché
en 184, donc RÉDUIT par le navigateur. Le plafond du zoom — 128 px par case — est
le **seul** endroit où il tombe au 1:1 : la réduction est le cas courant, pas le
cas rare.

Or toute réduction mélange les pixels voisins, **transparents compris**. Le
premier jet laissait leur RVB à zéro, et l'encodage en rajoutait : mesuré, les
transparents du bord haut de `mur_1` portaient **(65, 0, 0)** — WebP avec perte
stocke le RVB même là où l'alpha est nul, et le lisse par blocs. Rendu à 46 px
par case, le mur ressortait **ourlé d'un liseré rouge sombre sur toute sa
longueur** : exactement la faute que la v1 évitait déjà en prémultipliant, vue
par l'autre bout.

`baver` étend donc la couleur opaque dans le transparent, quatre passes. Ce qui
bave est alors la couleur du mur. ⚠ **L'ALPHA NE BOUGE PAS** — c'est ce qui
distingue ce geste d'un épaississement du sprite. Mesuré après : les transparents
portent `(255, 171, 154)`, la brique claire ; et les fichiers **maigrissent de
766 octets**, le lissage ayant moins de contraste à coder.

---

## 6 ter. ⚠ UN `image-rendering: pixelated` EST TOMBÉ — LE DEUXIÈME SITE

Le lot PIXELS avait posé la question et laissé « dix autres sites en attente
d'arbitrage », en n'en tranchant qu'un, `ui/banc.js`. Celui du mur se tranche
tout seul, **parce que ce lot vient de remplacer son asset** : la v1 était
quantifiée sur seize teintes — du pixel art, que le plus proche voisin servait
bien —, la v2 garde le rendu, et à la case par défaut ses 512 pixels s'affichent
en 184. Le plus proche voisin y jetterait deux pixels sur trois.

⚠ **IL EN RESTE SEPT DANS LA FEUILLE, ET ILS NE BOUGENT PAS** : `.case`,
`.jeton.sprite`, `.fantome`, `.posable i`, `#ecran-offense .emplacement .piece`,
`#ecran-recherche .sprite`, `#offense-palette .unite i`. Tous peignent des
cellules d'atlas, dont le cadrage par pourcentage tombe juste. Chacun demandera
sa propre mesure.

---

## 7. ⚠⚠ LE MANIFESTE REMPLACE `decoderRgba`, ET C'EST LE MOTIF DU DÉPÔT

`test/png-rgba.js` ne lit que du PNG, §3 interdit d'ajouter une dépendance de
test, et Node n'a pas de décodeur WebP. La garde du mur mesurait pourtant la
taille, les teintes et l'alpha binaire **en décodant les fichiers**.

`tools/bords.py` écrit donc `art/sprites/bord/bord-empreintes.json` : par sprite,
le **SHA-256**, la taille, les **teintes opaques**, les **transparents** et les
**trous enfermés**. Le test lit, il ne décode plus — exactement ce que
`atlas-empreintes.json` fait depuis le 02/09, et pour la même raison.

**Falsifié dans les deux sens** : un sprite remplacé par un autre fait tomber la
garde ; un manifeste qui annonce douze teintes là où le fichier en porte 20 221
la fait tomber aussi.

⚠ **CE QUE LE MANIFESTE NE REMPLACE PAS, ET IL FAUT LE DIRE** : la mesure des
trous enfermés est faite **par l'outil**, donc elle ne tourne qu'au lot d'art,
sous `python3 tools/verifier.py`. C'est le même statut que les empreintes
d'atlas. Ce que `npm run check` tient, c'est que le manifeste **correspond aux
fichiers** ; ce qu'il ne peut pas tenir, c'est de recompter lui-même.

---

## 8. ⚠ LA V1 EST RETIRÉE, ET LE RETRAIT SE VOIT

`tools/bords.py` ne produit plus les seize traits. Les laisser au dépôt les
ferait compter **MANQUANTS** par le vérificateur à chaque exécution — « le dépôt
les porte, aucun outil ne les fait », c'est-à-dire le contraire de la vérité.
L'outil vide donc les `.png` de `art/sprites/bord/` avant d'écrire, et un test
exige qu'il n'en reste aucun.

⚠ **LES QUATRE PLANCHES DE LA V1 RESTENT DANS `art/sources/`** — ce dossier ne
s'ampute jamais. Elles passent de `consommees` à `dormantes`, et **c'est le
premier usage de la garde du lot ENTRÉES sur une source RETIRÉE** : le diff de
`art/sources-declarees.json` dit exactement l'histoire du lot, quatre lignes qui
descendent et quatre qui montent.

`art/sources/` : **166 → 170** fichiers, 84 consommées, **82 → 86** dormantes.

⚠ **ET LA DETTE DE GRILLE-128 EST SOLDÉE.** `COTE_MUR = 64` et son assertion
inverse (`assert.notEqual(COTE_MUR, COTE_SPRITE)`), plus la mesure de
l'étirement à 2, ont disparu **parce qu'elles sont tombées** — c'est ce qu'on
leur demandait. La taille se lit maintenant dans `COTE_SPRITE` et
`LONGUEUR_DU_MUR`.

---

## 9. LES FALSIFICATIONS

| falsification | tests tombés |
|---|---|
| `padding` revenu à la demi-case | 2 |
| plancher du zoom à `largeur + 1` | 2 |
| anneau qui mord sur le contenu (`droite = largeur`) | 2 |
| U fermé en bas | 2 |
| une image inlinée que rien ne pose | 2 |
| pavage du haut ramené bloc par bloc | 4 |
| un sprite remplacé par un autre | 1 |
| manifeste qui ment sur les teintes | 1 |
| `est_fond` nue au lieu d'`est_fond_sujet` | 77 → 716 px enfermés |

---

## 10. BORNES

| mesure | **mesuré** |
|---|---|
| `npm test` | **941 pass / 0 fail** (941 avant) |
| `dist/index.html` | **3 228 365 o** (−28 827), 0 référence externe |
| marge T10 | 171 635 o, **5,1 %**, borne inchangée |
| `tools/verifier.py` | ****933 · 0 · 0 · 0**, vert, 301,1 s (932 avant)** |
| `data:` dans le HTML | 17 avant, **18** après |
| `art/sprites/bord/` | 16 PNG → **16 WebP** |

---

## 11. LES ÉCARTS, ET CE QUI RESTE

**Une lecture, pas un arbitrage, et elle se défait en une constante.** « Les murs
vont du haut de la base **jusqu'à** la défense » a été lu *jusqu'à son bord* — le
U entoure la bande des bâtiments et s'ouvre sur la défense, comme depuis le
31/08. L'autre lecture — les flancs longeant AUSSI la bande de défense — se
ferait en changeant `BANDE_DU_CONTOUR` pour un couple de bandes ; c'est une ligne
dans `tuilesDuContour`. À dire si c'est ce qui était voulu.

**Le rendu n'a pas été vérifié sur appareil**, et un test appareil non exécuté se
déclare non exécuté (§3).

**Ce qui reste :**

1. **TERRITOIRE** — les cinq formes (trait, angle en L, coin, U, carré) × deux
   camps, livrées en 128, pour remplacer les côtés tracés de l'écran Monde.
2. **MOULINETTE-TERRAIN** — les champs de quartz et de scorie, et le fond de
   carte, qui n'ont jamais traversé le rendu au filtre du lot PIXELS. ⚠ Les
   tuiles sources sont au dépôt (`art/sources/carte/tiles/`, 261 fichiers de
   128), mais l'atlas livré est une **source déclarée** qu'aucun outil ne
   produit : le lot devra d'abord écrire le couseur qui manque.
3. ⚠⚠ **LES MURS DE L'OUVRAGE — CE QUE COÛTE DE LES MONTRER, MESURÉ.** Ethan,
   03/09 : « c'est pour le joueur et pour l'ouvrage, normalement j'ai livré des
   murs ouvrage avec ». Les huit SONT produits par `tools/bords.py`, et
   `tuilesDuContour('o')` rend déjà leur anneau — un test le vérifie. Ce qui
   manque n'est **pas** une ligne dans `VARIABLE_DU_MUR` : c'est un endroit où
   les dessiner.
   - La base de l'Ouvrage n'apparaît que sur **l'écran de raid**, qui est un
     CANEVAS (`listeAffichage` + `executer`), pas une grille de `<div>` : les
     murs y entreraient en primitives `sprite`, donc il leur faut des balises
     `<img>` et une entrée dans `ATLAS_DE_LA_PAGE`, comme les quatre atlas
     partagés depuis SPRITES-ET-ZOOM.
   - Et surtout, `calculerProjection` **divise par `GRILLE.largeur` et
     `GRILLE.longueur`** : un anneau demande `largeur + 2` et `longueur + 1`,
     donc une **case plus petite sur tout le champ de bataille**. C'est la
     géométrie du combat qui bouge, avec les mesures en pixels que les tests de
     rendu portent.
   - Coût du livrable, mesuré sur les fichiers : **+24 010 octets de WebP**,
     soit **+32 016 en base64**.
   C'est un lot, pas une ligne — et il vaut mieux qu'il soit dit ainsi que
   commencé à moitié. **En attente d'un feu vert.**
