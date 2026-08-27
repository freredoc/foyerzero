# BRIEF-SPRITES-IA.md — Foyer Zéro

> Comment faire produire les sprites du jeu par un modèle d'image (ChatGPT,
> modèle premium), en 128 × 128, sans générateur Python.
>
> Se lit avec `FICHE-STYLE.md` (le style fait foi) et `INVENTAIRE-SPRITES.md`
> (la liste fait foi, et ses amendements A1 à A7 priment sur la fiche là où ils
> la contredisent). Ce document-ci ne dit ni quoi dessiner ni comment dessiner :
> il dit **comment le demander** pour que ce qui sort soit utilisable dans le jeu
> sans retouche manuelle.
>
> **Le §2 est le seul bloc à copier-coller.** Tout le reste est pour Ethan.

---

## 1. Ce que le changement de pipeline coûte, en trois lignes

Un générateur Python garantissait trois choses gratuitement. Un modèle d'image
n'en garantit aucune, et il faut les récupérer autrement.

| Garantie perdue | Conséquence si on ne fait rien | Récupérée par |
|---|---|---|
| **Palette exacte** | Le modèle sort 4 000 couleurs, dont aucune n'est `#4E5742`. Le §11 de la fiche est violé au premier fichier, et deux sprites du même lot n'ont pas le même kaki. | quantification après coup, §4 |
| **Grille logique** | Le modèle dessine du détail sous le pixel et anticrénèle tout. À 40 px CSS, le sprite devient une bouillie grise. | contrainte de gros pixels dans le prompt, §2 · réduction nearest, §4 |
| **Transparence** | Le modèle dessine un fond, ou un damier « transparent » en dur, ou une ombre au sol. | fond magenta imposé, §2 · détourage, §4 |

Ce que le modèle apporte en échange — silhouettes plus riches, matière, variété
de terrain, et une vue à 75° qu'il tient bien mieux que le zénithal strict —
vaut l'échange, mais **pas sans le conditionnement du §4**. Sans lui, ce ne sont
pas des sprites, ce sont des illustrations.

---

## 2. Le contrat de style — à coller en PREMIER message de chaque conversation

Une conversation par lot. Ce bloc en tête, puis un prompt par image. Ne pas le
résumer, ne pas le raccourcir : c'est en le tronquant qu'on récupère des sprites
hors palette trois heures plus tard.

---

```
Tu produis des sprites pour un jeu vidéo 2D de stratégie. Ce ne sont pas des
illustrations : ce sont des éléments graphiques découpés qui seront affichés à
40 pixels de côté sur un écran de téléphone. Tout ce qui n'est pas lisible à
40 pixels est du travail perdu.

FORMAT DE SORTIE — obligatoire, pour chaque image
1. Image carrée 1024 × 1024.
2. Elle représente une grille de 32 × 32 gros pixels carrés. Chaque gros pixel
   fait exactement 32 × 32 pixels réels, il est d'une seule couleur pleine, et
   il est aligné sur la grille. Aucun détail ne peut être plus petit qu'un gros
   pixel. C'est du pixel art à gros pixels, pas un rendu lisse pixellisé après
   coup.
3. Aucun anticrénelage, aucun lissage, aucun dégradé, aucune transparence
   partielle. Les bords sont en escalier, francs, nets.
4. Fond : magenta pur #FF00FF, uni, sur toute la surface non occupée par le
   sujet. Rien d'autre sur le fond : pas de sol, pas de socle, pas d'ombre
   portée, pas de vignette, pas de cadre, pas de damier.
5. Aucun texte, aucun chiffre, aucune lettre, aucun logo, aucun emblème, aucune
   signature, aucune légende, aucune flèche, aucune annotation.
6. Un seul sujet par image, centré. Pas de variantes côte à côte, pas de vue
   éclatée. (Sauf si un bloc PLANCHE est fourni ci-dessous : dans ce cas suivre
   ce bloc à la lettre.)

TAILLE DANS LA CASE — obligatoire, c'est une contrainte dure
Le sujet ENTIER — y compris son canon, son antenne, sa face visible — tient
dans un carré centré de 28 × 28 gros pixels au milieu de la grille de 32 × 32.
Il reste donc au moins 2 gros pixels entièrement vides sur les quatre bords.
Rien ne touche le bord, rien ne dépasse, rien n'est coupé par le cadre. Le jeu
affiche ces sprites dans des cases jointives : un pixel qui dépasse mord sur la
case du voisin.

VUE — obligatoire
Vue de dessus légèrement inclinée : la caméra est à 75 degrés au-dessus de
l'horizontale, presque à la verticale mais pas tout à fait. On voit très
majoritairement le DESSUS des objets, plus une amorce de leur face basse, celle
qui regarde le bas de l'image.

La face visible d'un objet occupe environ un quart de sa hauteur réelle. Elle
est peinte dans un ton plus sombre que le dessus — non pas parce qu'une lumière
la frappe, mais parce que c'est une face.

Ce n'est PAS de l'isométrie. La grille reste carrée et droite : un toit carré se
dessine comme un carré droit, pas comme un losange. Aucune rotation de 45
degrés, aucune fuite vers un point, aucun horizon, aucune ligne convergente.
Un objet plat reste strictement vu de dessus, sans aucune face visible.

ÉCLAIRAGE — obligatoire
Il n'y a pas de source de lumière dans la scène. Certains sprites seront tournés
d'un quart de tour ou retournés par le jeu : un éclairage « venant d'en haut à
gauche » devient faux dès la première rotation. Aucun reflet, aucune brillance,
aucune zone claire ponctuelle, aucune lumière rasante.

Deux écarts de valeur seulement sont autorisés, et ils sont fonctionnels :
  – l'AVANT d'une entité (vers le haut de l'image) est peint dans un ton clair,
    l'ARRIÈRE dans un ton sombre, parce que c'est l'avant et l'arrière ;
  – la face basse visible est plus sombre que le dessus, parce que c'est une
    face.

PALETTE — fermée, aucune couleur en dehors
Camp du joueur, châssis kaki désaturé, 5 tons :
  contour #161914 · ombre #343A2C · corps #4E5742 · éclairé #6A7658 · lumière #8C9A72
Métal commun (canons, chenilles, socles), 3 tons :
  sombre #1E2124 · moyen #3E454C · clair #68727E
Accents fonctionnels, saturés, ils doivent trancher :
  blanc  #928E80 / #F5F3E8
  rouge  #8A1E17 / #E43E32
  jaune  #A67018 / #F5B636
Fond : #FF00FF.

RÈGLE DES ACCENTS — c'est la règle centrale du jeu
La couleur d'accent ne désigne ni un camp, ni un rang, ni un niveau. Elle
désigne UNIQUEMENT ce que l'entité peut détruire :
  blanc = efficace contre l'infanterie
  rouge = efficace contre les véhicules
  jaune = efficace contre les structures et les aéronefs
La même couleur veut dire la même chose des deux côtés du champ de bataille.
L'accent est une ZONE LARGE, jamais une pointe ni un liseré : il doit rester
lisible quand l'image est réduite à 40 pixels. Une entité qui ne tire pas ne
porte aucun accent.

LES TROIS CHÂSSIS — la forme code la classe
  Tourelle   : empreinte carrée, bord à bord. Socle plein + dôme rond, statique.
               Accent = anneau large sur le socle, visible sur tout son pourtour.
               Le dôme ne fait jamais plus de 60 % de la largeur du socle.
  Véhicule   : empreinte allongée verticalement. Caisse + deux chenilles claires
               très contrastées, avant pointu.
               Accent = bandeau transversal large sur la caisse.
  Infanterie : empreinte dispersée. Trois figures larges disposées en triangle,
               pointe vers le haut. Chaque figure est vue de dessus : on voit
               des épaules et un casque, jamais un visage.
               Accent = le casque de chaque figure, entièrement dans la couleur.
Dans les trois cas, la bouche du canon reprend le ton clair de l'accent.

ARMEMENT — la longueur et le nombre de tubes disent la cible
  contre infanterie : deux tubes fins, courts
  contre véhicules  : un tube épais, long
  contre structures / aéronefs : un tube fin, moyen
  artillerie : le même tube, rallongé de moitié
Le canon reste court : il confirme la direction, il ne la porte pas. Un canon
qui fait la moitié de l'image est un refus. Et il compte dans les 28 × 28.

ORIENTATION — trois signaux qui se cumulent, aucun ne suffit seul
  1. l'avant (haut) est dans un ton clair, l'arrière dans un ton sombre
  2. la masse dominante est décalée vers l'avant
  3. l'arrière porte une bande sombre et deux évents #1E2124

INTERDITS ABSOLUS
  – Toute reprise de Command & Conquer, de Tiberium Alliances, de Warhammer,
    de StarCraft : ni cristal vert qui pousse, ni char à double canon
    reconnaissable, ni logo de faction, ni silhouette empruntée.
  – Tout emblème : aigle, étoile, croix, cocarde, drapeau, blason, insigne,
    écusson. Aucune surface du sprite ne porte de marque.
  – Toute couleur hors de la palette ci-dessus.
  – Toute couleur d'accent employée pour autre chose que la cible.
  – Isométrie, point de fuite, horizon, inclinaison de la grille, profondeur.
  – Reflet, brillance, lueur, particules, étincelles, fumée, explosion, ombre
    portée.
  – Style « cartoon », contour noir épais uniforme, aplat brillant façon icône.
  – Rivets, boulons, échelles, tuyauterie fine, panneaux de tôle détaillés :
    tout ce détail est plus petit qu'un gros pixel et disparaît à 40 pixels.

Réponds uniquement par l'image. Pas de commentaire, pas de description, pas de
proposition de variante.
```

---

## 3. Le gabarit d'un prompt unitaire

Après le contrat, chaque image se demande sur le même patron. Six champs, dans
cet ordre, et rien de plus — l'ordre compte, le modèle pondère le début.

```
[CAMP]    joueur (kaki) | Ouvrage (rampe X)
[CHÂSSIS] tourelle | véhicule | infanterie | structure | tuile | pictogramme
[RÉGIME]  A plat (0 px de face) | B épaisseur (1–2 px) | C volume (4–7 px)
[TAILLE]  empreinte en gros pixels, sur 32, tout compris
[ACCENT]  blanc | rouge | jaune | aucun
[SUJET]   trois à cinq phrases, silhouette d'abord, détail ensuite
```

Le champ `[RÉGIME]` est celui qu'on oublie, et c'est le plus coûteux à rater —
il fixe la hauteur de face visible, donc le seul endroit où l'inclinaison à 75°
se manifeste. Le tableau complet est à l'amendement A7 de
`INVENTAIRE-SPRITES.md` ; en une ligne : **A pour le sol, B pour les quatorze
unités, C pour tout ce qui ne bouge jamais.**

Exemple complet, à recopier tel quel :

```
[CAMP] joueur, rampe kaki
[CHÂSSIS] tourelle
[RÉGIME] C — volume, face basse visible sur 5 gros pixels de haut
[TAILLE] 24 × 24 gros pixels au total, face comprise, centrée
[ACCENT] rouge (#8A1E17 / #E43E32)
[SUJET] Une tourelle défensive fixe, vue de dessus à 75 degrés. Socle carré
plein en métal moyen #3E454C, avec un anneau rouge large courant sur tout son
pourtour. Sous le socle, sa face basse en #1E2124 sur cinq gros pixels de haut,
sans aucun détail. Au centre, un dôme rond kaki #4E5742 qui ne dépasse pas 60 %
de la largeur du socle, plus clair sur sa moitié avant. Un tube unique épais en
métal clair #68727E part du dôme vers le haut et dépasse le dôme de quatre gros
pixels sans atteindre le bord de l'image ; sa bouche est #E43E32. À l'arrière du
socle, une bande sombre et deux évents #1E2124.
```

**Ce qui fait échouer un prompt**, systématiquement, dans l'ordre de fréquence :

1. Décrire une intention (« une tourelle menaçante ») au lieu d'une géométrie
   (« un socle carré et un dôme rond »). Le modèle comble par du style.
2. Oublier de nommer le fond. Il en invente un.
3. Oublier `[RÉGIME]`. Il dessine une maquette en 3/4 à 45°.
4. Demander deux choses dans une image (« la tourelle et sa version longue
   portée »). Il produit une planche.
5. Laisser un mot de vocabulaire militaire chargé (« mammouth », « artillerie
   lourde de siège »). Il rappelle une silhouette existante — et il ajoute un
   emblème.

---

## 3 bis. Les planches — plusieurs sprites par image

158 images à quatre minutes de réflexion chacune, c'est une douzaine d'heures de
génération. La planche divise ce chiffre par le nombre de cellules.

Bloc à ajouter au prompt, après le gabarit du §3, en remplaçant les nombres :

```
PLANCHE — remplace la règle « un seul sujet par image »
Image de 2048 × 2048, divisée en 2 colonnes × 2 lignes de cellules carrées de
1024 × 1024 pixels exactement. Chaque cellule est un sprite indépendant : elle
contient une grille de 32 × 32 gros pixels de 32 pixels de côté, son sujet
centré, et sa propre marge vide de 2 gros pixels sur ses quatre bords.

Aucun trait, aucun cadre, aucune ligne de séparation entre les cellules : le fond
magenta est continu d'un bord à l'autre de l'image.
Aucun sujet ne chevauche deux cellules.
Aucune cellule ne reste vide.
Les sujets ne se « regardent » pas et ne composent pas une scène : ce sont quatre
images sans rapport qui partagent un fichier.

Contenu, cellule par cellule, de gauche à droite puis de haut en bas :
  1. ...
  2. ...
  3. ...
  4. ...
```

**Ce qui va bien en planche, et ce qui n'y va pas.** La planche exige que le
modèle tienne une même échelle sur plusieurs sujets voisins — c'est ce qu'il
réussit le moins bien.

| Bon candidat | Pourquoi |
|---|---|
| Lot 1, terrain | quatre variantes du même terrain : aucune échelle à tenir, elles se ressemblent par construction |
| États de dégâts, obstacles | même famille, même taille |
| Icônes d'interface | même gabarit, même poids |

| Mauvais candidat | Pourquoi |
|---|---|
| Unités de points différents dans la même planche | il alignera les tailles au lieu de les différencier — exactement le signal qu'on cherche à produire |
| Joueur et Ouvrage mélangés | il fera converger les deux grammaires |
| Le jet d'essai du §6 | on y compare deux rampes : elles doivent être générées séparément, sinon il les harmonise |

Règle pratique : **une planche ne regroupe que des sprites qui doivent déjà se
ressembler.** Si deux sujets doivent se distinguer, ils ne partagent pas d'image.

**Côté outil**, `tools/conditionneur.html` a deux champs *Planche — colonnes* et
*lignes*. Il découpe en cellules égales, conditionne chacune séparément, les
nomme `<fichier>_1` à `<fichier>_N` de gauche à droite puis de haut en bas, et
ajoute deux contrôles propres à la planche : **cellule vide** (le modèle n'a
produit que trois sujets sur quatre) et **décentré de N gp** (le sujet ne tient
pas le centre de sa cellule, la grille a glissé). Un décentrement au-delà de
2 gros pixels signale une planche à refaire, pas à rattraper.

---

## 3 ter. Le sprite de référence — la méthode qui marche

Établi le 26/08 sur les tourelles du joueur, après trois jets et deux
allers-retours ratés. **Un prompt ne transmet pas un équilibre visuel.** Il
transmet une géométrie, et le modèle répartit les matières comme il veut par
dessus. La preuve, mesurée sur la même tourelle :

| Jet | accent | métal | châssis | Verdict |
|---|---|---|---|---|
| 1 — prompt libre | **18,9 %** | **24,7 %** | **24,8 %** | validé |
| 2 — prompt coté au gros pixel près | 26 % | **1,2 %** | 49 % | le socle a disparu |
| 3 — avec référence jointe | 15 % | 40 % | 20 % | rattrapé |
| 4 — correction « bande de 3 au lieu de 1 » | **42 %** | 14 % | 15 % | surcorrigé |

La procédure qui en sort, et qui vaut pour les 60 générations :

1. **Un sprite de référence par famille.** On en génère un seul, prompt libre,
   jusqu'à ce qu'il soit bon. C'est le seul moment où on itère.
2. **On joint le PNG source de 1024 aux frères**, et on énonce ce qui est
   INTERDIT de changer avant d'énoncer ce qui change. Le modèle accepte une
   image d'entrée : ce n'est pas une retouche, c'est un moule.
3. **On n'énumère jamais un écart chiffré.** « La même surface que sur la
   référence, ni plus large, ni plus fine », jamais « trois gros pixels au lieu
   d'un ».
4. **On décrit la référence telle qu'elle est, pas telle qu'on croit qu'elle
   est.** L'interdit « aucune pastille autour du dôme » a failli partir alors
   que la référence en portait : le modèle aurait lu le contraire de ce qu'il
   voyait. Regarder l'image avant d'écrire.

Ce que la référence transmet et qu'aucune phrase ne transmet : la répartition
des matières, la densité de détail, l'équilibre entre périphérie et centre.
`tools/conditionneur.html` la mesure désormais et l'affiche en pastille — voir
le §4.

---

## 4. Conditionnement — les trois opérations, non négociables

Ce qui sort de ChatGPT n'est pas encore un sprite. Trois opérations, dans cet
ordre, sur chaque image :

1. **Détourage.** Tout pixel proche de `#FF00FF` passe en alpha 0. Tolérance
   nécessaire (le modèle produit du magenta légèrement pollué au contact du
   sujet), et il faut ronger d'un pixel réel pour ne pas laisser un liseré rose.
2. **Quantification.** Chaque pixel restant est remplacé par la couleur la plus
   proche parmi les 14 de la palette (+ les 5 de la rampe Ouvrage). C'est
   l'opération qui fait respecter le §11 de la fiche, et c'est celle qu'on ne
   peut pas faire à l'œil.
3. **Réduction 1024 → 128**, en prenant **le centre de chaque bloc de 8 × 8**
   (nearest-neighbour, pas de moyenne). Une moyenne réintroduirait des couleurs
   hors palette et annulerait l'étape 2.

Le résultat est un PNG 128 × 128 RGBA, 19 couleurs maximum, bords francs :
exactement ce que la fiche décrit, obtenu par l'autre bout.

**Aucune de ces trois opérations ne se fait à la main sur 158 fichiers.** Elles
sont implémentées dans **`tools/conditionneur.html`** : page autonome, sans
dépendance ni réseau, sur le modèle de `archipel-map-editor.html`. On l'ouvre
dans le navigateur du téléphone, on choisit les images d'un lot, elle rend un ZIP
de PNG conditionnés et renommés.

Réglages, une fois par lot :

| Réglage | À mettre sur |
|---|---|
| **Palette** | *Joueur seul* pour les lots joueur · *+ rampe A* ou *B* pour l'Ouvrage · *les deux* uniquement pour le jet d'essai du §6 |
| **Régime** | *Entité* partout, sauf le lot 1 où c'est *Tuile* (pas de détourage, pas de contrôle de bordure) |
| **Échantillonnage** | *Majorité* par défaut. *Centre* seulement si le modèle a produit une grille de gros pixels parfaitement alignée et qu'on veut la respecter au pixel |
| **Rognage** | 3 px. À monter si un liséré rose subsiste sur les aperçus — il ne sert qu'au détourage, et son effet est faible en mode *Majorité*, qui absorbe le liséré tout seul |
| **Préfixe** | `off_o` pour un lot d'unités ennemies, `def_j` pour les défenses joueur, etc. Il s'ajoute devant le nom du fichier d'origine |

Elle produit les contrôles elle-même, en pastilles vertes ou rouges sous chaque
aperçu, et les recopie dans un `CONTROLE.txt` à l'intérieur du ZIP :

- **bordure vide** — les 2 gros pixels de marge sont-ils réellement transparents
  sur les quatre côtés (c'est le contrôle de non-dépassement d'A7, mesuré et non
  jugé à l'œil) ;
- **emprise en gros pixels** — et l'alerte si elle passe 28 × 28 ;
- **nombre de couleurs** après quantification ;
- **répartition des matières** — accent, métal, châssis, en pourcentage de la
  surface opaque, avec une alerte hors fourchette. C'est le contrôle qui attrape
  le sprite « conforme mais raté » : bordure vide, emprise juste, palette
  respectée, et pourtant un socle qui a disparu sous l'accent. Fourchettes
  tirées du sprite de référence validé (19 / 25 / 25), élargies : accent
  10–30 %, métal 10–45 %, châssis 12–45 %. Non appliqué aux tuiles, qui n'ont
  ni accent ni châssis ;
- pour une tuile, qu'elle soit pleine et sans trou.

Le dépliant « Lisibilité à 40 px et transformations » sous chaque sprite donne
les vignettes qui manquaient : à 40 px sur fond clair, à 40 px sur fond sombre,
puis tournée d'un quart de tour, d'un demi-tour et en miroir vertical. Ce sont
exactement les points 4 et 8 de la grille du §6, et ils se lisent d'un coup.

Ce qu'elle **ne** fait pas, et ne fera pas : juger. Un sprite peut sortir avec
quatre pastilles vertes et être à refaire parce qu'il ressemble à autre chose ou
que sa face fait 6 px au lieu de 2. Les points 7 et 9 du §6 restent à l'œil.

---

## 5. Les deux dettes de conception, et ce qu'on propose d'en faire

Ethan a demandé un premier jet sur chacune, puis validation sur pièce. Voici ce
que le jet doit contenir pour que la validation soit possible.

### 5.1 Dette 1 — la rampe de l'Ouvrage (5 tons) — **CLOSE le 27/08**

> **Tranché : c'est la candidate A, ardoise violacée.** Elle est écrite dans
> `FICHE-STYLE.md` §3, qui fait foi désormais. La section ci-dessous reste pour
> l'historique de l'arbitrage ; ne plus la lire comme une question ouverte.
>
> Elle gagne les trois critères, mesurés et regardés à 40 px : le rouge et le
> jaune tranchent sur l'ardoise et se noient sur la fonte, deux tons chauds
> voisins ; et la fonte réalise le risque que le §5.1 lui prêtait — elle a l'air
> rouillée donc abandonnée, quand l'Ouvrage est actif. Détail dans
> `RAPPORT-S0-rampe-ouvrage.md`.


L'Ouvrage n'est pas une nation : c'est une installation d'extraction qui s'est
répliquée sans supervision. Sa rampe doit trancher **à la fois** du kaki du
joueur et du métal commun — c'est le second point qui est difficile, parce que
le métal est déjà un gris-bleu sombre.

**Candidate A — ardoise violacée** *(recommandée)*

```
contour #0D0B12 · ombre #231D2E · corps #382E47 · éclairé #4E4160 · lumière #6B5B80
```

Tranche nettement du kaki (vert chaud) et du métal (bleu neutre). Risque : lu
comme « alien » ou « magique » plutôt que comme industriel. Conséquence à
accepter : la scorie étant le dépôt que l'Ouvrage laisse en s'étendant,
`tile_croute` devra tirer vers cette rampe, pas vers le brun.

**Candidate B — fonte oxydée**

```
contour #100C0A · ombre #241A15 · corps #3A2A22 · éclairé #523D31 · lumière #705847
```

Plus crédible en matière, très éloignée du métal bleu. Risque : proche des
terrains (croûte, vasière), et lue comme « abandonné » alors que l'Ouvrage est
actif — l'inverse exact de l'intention.

**Le jet doit produire la même entité dans les deux rampes**, côte à côte au
moment de la comparaison, sur un pylône et sur un marcheur — une structure
(régime C) et une unité (régime B), parce que les deux ne se jugent pas pareil.

⚠ **Et « la même » veut dire la même image, pas une seconde génération.** Ce qui
a servi à trancher le 27/08 : une seule génération par sujet, puis la seconde
rampe obtenue par **substitution ton pour ton** de la première — vérifié à
0 pixel d'écart hors rampe, alpha identique. Deux générations ont suffi pour
quatre fichiers. C'est meilleur que de générer les deux : une seconde génération
apporte du bruit de silhouette qui se confond avec l'effet de la rampe, et c'est
précisément ce qu'on cherche à isoler. **Comparer deux rampes, c'est comparer
deux versions du même fichier.**
Critère d'arbitrage, dans cet ordre : (1) est-ce qu'on distingue un marcheur
ennemi d'un véhicule joueur en un dixième de seconde à 40 px, (2) est-ce que
l'accent rouge et l'accent jaune restent lisibles dessus, (3) est-ce que ça a
l'air actif.

### 5.2 Dette 2 — le Dard, forme volante de l'Ouvrage — **CLOSE le 27/08**

> **La forme proposée ci-dessous a été produite et validée telle quelle.**
> Référence : `art/ouvrage/ref_dard.png`. Mesuré — accent 14 %, métal 26 %,
> châssis 43 %, les trois familles dans les bornes ; emprise 23 × 21 gp ; tient
> la rotation à 90°, le demi-tour et le miroir, ce que sa symétrie d'ordre 3 lui
> donne gratuitement.
>
> ⚠ **C'est le premier sprite du projet où la grammaire de l'Ouvrage apparaît
> réellement** — une pièce répétée au lieu d'un objet sculpté. Le piège 9 se bat
> par la forme radiale à modules, pas par un rappel dans le prompt. Les quatre
> aéronefs s'en déclinent au compteur de pièces : trois modules à 10 points,
> cinq pour `enclume` à 15.
>
> ⚠ **Conséquence à accepter : un Dard n'a pas d'avant.** Le point 6 de la
> grille du §6 — « l'avant est-il identifiable sans le canon » — **ne s'applique
> pas à cette grammaire**, et ça ne se rattrapera sur aucun des quatre. La
> symétrie radiale est ce qui fait la lecture « installation qui se réplique » ;
> elle coûte l'orientation, et le §5.2 l'assumait déjà.


Nom et intention déjà arrêtés dans la fiche : petit, rapide, isolé, l'inverse de
l'essaim au sol, **sans aile portante**, sustentation qui doit sembler procédée
et non aérodynamique. Ce qui manque, c'est la forme. Proposition à essayer :

> Un moyeu hexagonal central. Trois modules identiques disposés en triangle
> radial autour de lui, reliés par trois bras courts — les mêmes modules que
> ceux du pylône et du marcheur, c'est la grammaire de l'Ouvrage : elle répète
> une pièce au lieu de dessiner un objet. Sous chaque module, un disque sombre
> plein, le puits de sustentation. Aucune hélice, aucun rotor, aucune surface
> portante. L'accent occupe un anneau large sur le moyeu.

Le Dard est une **grammaire**, pas une unité : elle se décline sur les quatre
aéronefs (`crecelle`, `busard`, `frappeur`, `enclume`) en faisant varier le
nombre de modules — trois pour les 10 points, cinq pour `enclume` à 15. C'est
exactement le compteur de pièces d'A6, et il s'applique de la même façon aux
aéronefs du joueur.

Un aéronef reste en **régime B**, comme les autres unités : ce n'est pas parce
qu'il vole qu'il gagne du volume. Son altitude se lit au seul décalage de son
ombre au rendu (§6 de la fiche), pas dans le sprite.

Sans cette forme, la Batterie, le Harpon et tout l'anti-aérien du joueur n'ont
littéralement rien à viser : c'est la dette la plus urgente des cinq.

### 5.3 Dettes 4 et 5 — corrections de lisibilité

À imposer dans les prompts concernés, et à vérifier sur le jet d'essai :

- **Marcheur** : pattes de 2 gros pixels d'épaisseur minimum, plus courtes que
  dans l'étalon v4, trois pattes radiales, corps nettement plus massif que les
  pattes. Le défaut à corriger : à 40 px, il se confond avec le pylône.
- **Infanterie joueur** : le casque de chaque figure entièrement dans la couleur
  d'accent, pas un point au centre. C'est le seul endroit où l'escouade porte
  son code couleur.
- **Tourelle** : dôme ≤ 60 % de la largeur du socle, anneau d'accent visible sur
  tout le pourtour. Le défaut à corriger : le dôme mange le socle et l'anneau
  disparaît.

---

## 6. Le jet d'essai — sept images, et rien d'autre avant

Objectif : solder les dettes 1, 2, 4 et 5 en une seule passe, sur les entités
qui les portent, **et valider l'inclinaison à 75°** — c'est le paramètre le plus
neuf et celui sur lequel le modèle dérivera le plus.

| # | Image | Régime | Ce qu'elle tranche |
|---|---|---|---|
| 1 | Pylône de l'Ouvrage, **rampe A** | C | dette 1 sur une structure · le flanc à 4–7 px |
| 2 | Pylône de l'Ouvrage, **rampe B** | C | dette 1, comparaison |
| 3 | Marcheur (`off_o_fendeur`), **rampe A**, pattes corrigées | B | dettes 1 et 4 · le flanc à 1–2 px |
| 4 | Marcheur (`off_o_fendeur`), **rampe B**, pattes corrigées | B | dettes 1 et 4 |
| 5 | Dard générique, rampe retenue par Ethan à l'œil sur 1–4 | B | dette 2 |
| 6 | `off_j_meute` — escouade joueur, casques blancs pleins | B | dette 5 · l'infanterie supporte-t-elle 75° |
| 7 | `def_j_creneau` — tourelle joueur anti-véhicule, socle dégagé | C | dette 5 |

Les sept passent par le conditionnement du §4 **avant** d'être jugées : une image
jugée en 1024 anticrénelée ne dit rien de ce que le jeu affichera.

Grille de validation d'un jet, dans l'ordre. Un seul non = on refait, on ne
retouche pas.

1. Le fond est-il intégralement détouré, sans liseré rose ?
2. Le sprite tient-il en 19 couleurs après quantification ?
3. **La bordure de 8 px est-elle entièrement vide sur les quatre côtés ?**
4. La silhouette se lit-elle à 40 px, sur fond clair **et** sur fond sombre ?
5. L'accent se voit-il à 40 px ?
6. L'avant est-il identifiable sans le canon ?
7. Le régime est-il tenu — 0, 1–2, ou 4–7 px de face visible, pas plus ?
8. **Régime B seulement** : le sprite reste-t-il acceptable tourné d'un quart de
   tour et retourné ?
9. Est-ce qu'il ressemble à quelque chose de déjà vu ailleurs ?

Les points 3, 7 et 8 sont les nouveaux, et ce sont les trois faciles à rater. Le
7 en particulier : le modèle a une pente naturelle vers le 3/4 à 45°, il ira
vers 60° dès qu'on le laisse faire, et un lot entier peut sortir avec une face
deux fois trop haute sans que ça choque image par image. Ça ne se voit qu'en les
posant côte à côte sur la grille.

---

## 7. Ce que chaque lot demande en plus

Le contrat du §2 couvre tout le monde. Ces additions se collent **après** le
gabarit du §3, par lot.

### Lot 1 — terrain (29) · régime A

```
[CHÂSSIS] tuile
[RÉGIME] A — plat, strictement vu de dessus, aucune face visible
[TAILLE] la tuile occupe les 32 × 32 gros pixels, bord à bord, sans marge
[ACCENT] aucun
```

Additions : *la tuile doit se raccorder à elle-même par les quatre bords sans
couture visible (motif répétable) ; elle ne contient aucun objet identifiable,
aucun élément centré, aucun point d'intérêt ; les quatre variantes d'un même
terrain diffèrent par la disposition, jamais par la teinte ; contraste interne
faible — c'est un fond, il passera sous des unités et ne doit pas les
concurrencer.*

⚠ Le terrain est le **seul** lot qui échappe aux deux contraintes fortes : pas de
marge (il va bord à bord) et pas d'inclinaison (le sol est plat, une tuile
inclinée ne se raccorde plus à sa voisine). Le dire explicitement dans le
prompt, sinon le modèle ajoute un relief en 3/4 et le pavage se met à onduler.

⚠ `tile_croute` (la scorie) : dépôt vitrifié laissé par l'expansion de
l'Ouvrage. **Jamais un cristal vert qui pousse.** C'est le point exact où la
reprise de C&C se réintroduit sans qu'on la voie.

### Lots 3 et 4 — unités (28, régime B) et défenses (18, régime C)

Tableau de paramètres, à recopier champ par champ dans le gabarit. `points`
donne l'empreinte (échelle A6), `specialite` donne l'accent, `chassis` donne la
forme.

| Clé | Châssis | Accent | Points | Empreinte | Pièces |
|---|---|---|---|---|---|
| `meute` | infanterie | blanc | 5 | 18 × 18 | 3 figures |
| `guetteur` | infanterie | blanc | 10 | 24 × 24 | 5 figures |
| `perceurs` | infanterie | jaune | 5 | 18 × 18 | 3 figures |
| `fouisseurs` | infanterie | jaune | 10 | 24 × 24 | 5 figures |
| `carapace` | infanterie | rouge | 10 | 24 × 24 | 5 figures |
| `ratisseur` | véhicule | blanc | 10 | 24 × 24 | 1 tube |
| `fendeur` | véhicule | rouge | 10 | 24 × 24 | 1 tube |
| `broyeur` | véhicule | rouge | 15 | 28 × 28 | **2 tubes**, double train |
| `belier` | véhicule | jaune | 10 | 24 × 24 | 1 tube |
| `pilon` | véhicule | jaune | 15 | 28 × 28 | **2 tubes**, double train |
| `crecelle` | aéronef | blanc | 10 | 24 × 24 | 3 modules |
| `busard` | aéronef | rouge | 10 | 24 × 24 | 3 modules |
| `frappeur` | aéronef | jaune | 10 | 24 × 24 | 3 modules |
| `enclume` | aéronef | jaune | 15 | 28 × 28 | **5 modules** |

**La colonne Pièces est le vrai signal de coût, l'empreinte n'est que
l'appoint.** Un écart de 24 à 28 gros pixels fait 17 % : personne ne le verra sur
deux unités qui ne sont jamais côte à côte. Un écart de trois à cinq figures se
compte d'un coup d'œil.

La conséquence tient en une phrase, et elle va dans les prompts d'escouade :
**la figure garde une taille constante d'environ 8 gros pixels, quel que soit le
coût.** C'est le nombre qui monte, pas la taille qui descend — sinon cinq
fantassins dans 24 gros pixels redeviennent une bouillie, et on aura perdu la
lisibilité pour gagner un signal qu'on ne lit pas.

Formulation à employer, plutôt que « plus grand » ou « plus imposant » :

```
Cinq figures identiques d'environ 8 gros pixels de haut chacune, disposées en
deux rangs — trois devant, deux derrière — sans se toucher, l'ensemble tenant
dans 24 × 24 gros pixels.
```

⚠ Le nombre de pièces code le **coût**, jamais la classe : cinq figures restent
une escouade, deux tubes restent un blindé. La forme code la classe (§1.3 de la
fiche) et rien ne change de ce côté.

Les quatorze sont en **régime B — face visible de 1 à 2 gros pixels, jamais
plus**. C'est la contrepartie exacte de la rotation à 90° et du miroir : la
caméra ne tourne pas avec l'objet, donc toute face dessinée en bas se retrouve
sur le côté après un quart de tour. À 2 px sur 32, l'erreur vaut 6 % de la case
et personne ne la verra ; à 6 px, tout le monde.

Une empreinte de 28 × 28 (les trois unités à 15 points) est **au maximum
absolu** : il n'y a plus un seul gros pixel de jeu, canon compris. Le rappeler
dans ces trois prompts-là.

Deux valeurs seulement par châssis, jamais trois : les escouades opposent 5 à 10
(aucune à 15), les blindés et les aéronefs opposent 10 à 15 (aucun à 5). Il n'y
a donc que **deux sprites sur vingt-huit à 18 gros pixels** — `meute` et
`perceurs`. Le cas « trop petit pour être lisible » est marginal, et c'est
l'opposition 24 / 28 qui demande le compteur de pièces.

Côté Ouvrage, le châssis se traduit dans l'autre grammaire, et c'est cette
traduction qui porte toute l'opposition : *infanterie → essaim* (plus de
figures, plus petites, identiques, sans casque distinct — l'accent passe sur le
corps), *véhicule → marcheur* (pas de chenilles : trois pattes radiales, corps
massif au centre), *tourelle et structure → pylône* (colonne à modules empilés,
symétrie radiale, aucun angle droit), *aéronef → Dard* (§5.2).

Les défenses du lot 4 sont en **régime C** : elles sont ancrées, rien ne les
transforme, elles peuvent prendre 4 à 7 gros pixels de face. Additions : *l'entité
est fixée au sol, elle ne se déplace pas ; le merlon et les deux barrières ne
portent aucun tube ; le merlon ne porte aucun accent.*

⚠ Les trois artilleries (`faucheuse`, `mortier`, `harpon`) sont des **véhicules
de forme** mais des **défenses de fonction** : châssis véhicule, régime C. C'est
le seul endroit du projet où les deux axes divergent, et c'est volontaire —
elles ne bougent jamais.

### Lot 5 — bâtiments (16) et états (7)

Régime C, le plus généreux : ce sont les seules entités du jeu qui ont une
vraie hauteur, et l'inclinaison à 75° est là pour elles avant tout.

Additions : *un bâtiment occupe une case entière et son empreinte est carrée ;
il n'a pas d'avant ni d'arrière, donc pas de gradient avant/arrière — sa lecture
vient de sa silhouette en plan et de sa face basse ; toit vu de dessus, face
basse sur 4 à 7 gros pixels, aucune autre face ; aucune cheminée fumante, aucune
lumière allumée, aucun panneau détaillé.*

Arithmétique à respecter, et c'est elle qui cadre les prompts : emprise du toit
+ hauteur de face ≤ 28. Un bâtiment de 22 × 22 avec 6 px de face fait 22 de
large et 28 de haut : c'est la limite exacte.

Les trois surcouches de dégâts sont en **régime A** et méritent leur propre
conversation : *fond magenta, et sur ce fond uniquement les marques de
destruction — suie noire, brèches ouvertes sur du noir, tôles arrachées, gravats
— disposées de façon dispersée et asymétrique, en laissant au moins la moitié de
la surface vide. Aucun bâtiment, aucune forme reconnaissable, aucune face,
aucun volume : c'est un calque plat qui se posera par-dessus n'importe quel
bâtiment.* Progression à tenir entre elles : silhouette intacte → silhouette
entamée → moitié éventrée.

Les quatre ruines, elles, sont en régime C : un tas de décombres a du volume.

### Lots 6 et 7 — carte (13) et interface (41)

Les marqueurs de carte suivent le régime C comme les bâtiments : ils
représentent des installations vues de dessus et la carte est la même vue que le
combat.

Les icônes d'interface, en revanche, **ne sont pas en vue de dessus du tout** :
ce sont des pictogrammes. Le contrat du §2 s'applique pour le format, la palette
et les interdits, mais les clauses de vue et de régime sautent. Il faut le dire
explicitement dans le prompt, sinon le modèle produit des icônes inclinées au
milieu d'un lot cohérent :

```
Exception à la vue : cette image est un pictogramme d'interface, pas un objet
vu de dessus. Silhouette pleine, frontale, symétrique, un seul niveau de
lecture, aucune inclinaison, aucune face visible, aucune profondeur.
```

Addition pour les icônes : *forme pleine, aucun contour ajouté, aucun cercle de
fond, aucun cadre ; elle sera affichée à 24 px et doit se lire en silhouette
noire.*

---

## 8. Pièges connus du médium — la liste qui évite de refaire un lot

1. **Il glisse vers le 3/4.** C'est sa pente naturelle, et elle est forte : le
   zénithal strict est ce qu'il rate le plus, le 3/4 à 45° ce qu'il fait le
   mieux. Sans rappel, 75° devient 60° puis 45° au fil d'un lot. **Le seul
   contrôle fiable est de poser les sprites finis côte à côte** : image par
   image, la dérive ne choque pas.
2. **La dérive de lot, en général.** À la vingtième image d'une conversation, le
   modèle dérive vers son style par défaut : détails plus fins, contours plus
   mous, couleurs plus riches. **Recoller le contrat du §2 toutes les dix
   images**, et ne jamais faire un lot entier d'une traite sans regarder.
3. **La cohérence est plus fragile que la qualité.** Vingt sprites très beaux et
   inégaux valent moins que vingt sprites moyens et homogènes. Le jeu se lit par
   comparaison entre entités, pas entité par entité.
4. **Il remplit la case.** Un sujet qui touche les bords est son réflexe de
   cadrage. La contrainte des 28 × 28 doit être répétée dans chaque prompt, pas
   seulement dans le contrat, et vérifiée mécaniquement au §4.
5. **Il ajoute du sol.** Dès qu'on décrit un objet posé, il dessine ce sur quoi
   il est posé. Le rappel « fond magenta uni, rien d'autre » va dans presque
   chaque prompt.
6. **Il ajoute un emblème.** Dès qu'un objet est militaire, il y colle un aigle,
   une étoile ou un blason sur la plus grande surface plane. C'est automatique,
   et c'est un interdit dur du projet.
7. **Il n'entend pas « gros pixel ».** Si les sorties sont lisses, écrire
   explicitement « chaque carré de 32 × 32 pixels est d'une seule couleur »
   plutôt que « pixel art », qui est devenu un mot de style et non de format.
8. **Il équilibre les couleurs.** Un sprite qui ne devrait porter qu'un accent
   rouge en reçoit un second, vert ou bleu, « pour l'équilibre ». C'est le
   défaut le plus insidieux, parce que le résultat est joli et faux : il casse la
   seule règle que le joueur doit apprendre.
9. **Il ne sait pas répéter une pièce.** La grammaire de l'Ouvrage — le même
   module répété — lui demande un effort constant ; sans rappel, chaque unité
   ennemie devient un objet unique et l'Ouvrage cesse de se lire comme une
   installation qui s'auto-réplique.
10. **Ne jamais lui demander de corriger une image.** Une retouche renvoie une
    image régénérée, donc hors palette et hors cohérence. On corrige le prompt
    et on relance. Joindre une image comme RÉFÉRENCE est autre chose et reste
    autorisé (§3 ter).
11. **Il surcorrige, toujours.** « Une bande de 3 gros pixels au lieu de 1 » a
    fait passer l'accent de 15 % à 42 % de la surface — presque le triple pour
    un facteur trois demandé sur une seule dimension. Toute consigne en « plus »
    ou en « moins » produit le défaut inverse au coup suivant, et on fait
    l'aller-retour indéfiniment. On ancre sur une référence, on ne gradue pas.
12. **Plus le prompt est coté, plus l'équilibre dérape.** Donner la taille de
    chaque pièce au gros pixel près lui fait remplir les vides : le dôme a mangé
    le socle et le métal est tombé à 1,2 % de la surface. Les cotes servent à
    tenir l'empreinte totale, pas à composer l'image.

---

*v4 — 26/08/2026. Ajout du §3 ter (sprite de référence) et des pièges 11 et 12,
tirés de la première famille produite — les tourelles du joueur.
v3 — 26/08/2026. Ajout du §3 bis (planches) et du compteur de pièces d'A6.
v2 — 26/08/2026. Réécrit après l'arbitrage sur la vue : top-down haut à 75°,
non-dépassement de case absolu, trois régimes d'inclinaison, rotation limitée aux
véhicules (90°) et miroir limité à l'infanterie. Voir les amendements A4, A6 et
A7 d'`INVENTAIRE-SPRITES.md`, dont A7 modifie le §1.1 de `FICHE-STYLE.md`. Le
pipeline Python du §10 de la fiche est remplacé par ce document ; le §11 reste en
vigueur et c'est le §4 ci-dessus qui le fait respecter.*
