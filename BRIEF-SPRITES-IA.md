# BRIEF-SPRITES-IA.md — Foyer Zéro

> Comment faire produire les sprites du jeu par un modèle d'image (ChatGPT,
> modèle premium), en 128 × 128, sans générateur Python.
>
> Se lit avec `FICHE-STYLE.md` (le style fait foi) et `INVENTAIRE-SPRITES.md`
> (la liste fait foi). Ce document-ci ne dit ni quoi dessiner ni comment
> dessiner : il dit **comment le demander** pour que ce qui sort soit
> utilisable dans le jeu sans retouche manuelle.
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
de terrain — vaut l'échange, mais **pas sans le conditionnement du §4**. Sans
lui, ce ne sont pas des sprites, ce sont des illustrations.

---

## 2. Le contrat de style — à coller en PREMIER message de chaque conversation

Une conversation par lot. Ce bloc en tête, puis un prompt par image. Ne pas le
résumer, ne pas le raccourcir : c'est en le tronquant qu'on récupère des
sprites hors palette trois heures plus tard.

---

```
Tu produis des sprites pour un jeu vidéo 2D en vue de dessus. Ce ne sont pas
des illustrations : ce sont des éléments graphiques découpés qui seront
affichés à 40 pixels de côté sur un écran de téléphone. Tout ce qui n'est pas
lisible à 40 pixels est du travail perdu.

FORMAT DE SORTIE — obligatoire, pour chaque image
1. Image carrée 1024 × 1024.
2. Elle représente une grille de 32 × 32 gros pixels carrés. Chaque gros pixel
   fait exactement 32 × 32 pixels réels, il est d'une seule couleur pleine, et
   il est aligné sur la grille. Aucun détail ne peut être plus petit qu'un gros
   pixel.
3. Aucun anticrénelage, aucun lissage, aucun dégradé, aucune transparence
   partielle. Les bords sont en escalier, francs, nets.
4. Fond : magenta pur #FF00FF, uni, sur toute la surface non occupée par le
   sujet. Rien d'autre sur le fond : pas de sol, pas de socle, pas d'ombre
   portée, pas de vignette, pas de cadre, pas de damier.
5. Aucun texte, aucun chiffre, aucune lettre, aucun logo, aucune signature,
   aucune légende, aucune flèche, aucune annotation.
6. Un seul sujet par image, centré. Pas de planche, pas de variantes côte à
   côte, pas de vue éclatée.
7. Marge vide d'au moins 2 gros pixels sur les quatre bords.

VUE — obligatoire
Vue strictement zénithale, caméra à la verticale exacte au-dessus du sujet.
On ne voit aucun côté, aucune façade, aucun horizon. Une caisse de véhicule est
un rectangle vu du dessus, pas une caisse en perspective. Aucune inclinaison,
aucun point de fuite, aucun effet d'isométrie.

ÉCLAIRAGE — obligatoire
Il n'y a pas de source de lumière dans la scène. Les sprites seront tournés
dans tous les sens par le jeu : un éclairage « venant d'en haut à gauche »
devient faux dès la première rotation. Le seul écart de valeur autorisé est
fonctionnel : l'AVANT d'une entité (vers le haut de l'image) est peint dans un
ton clair, l'ARRIÈRE dans un ton sombre, parce que c'est l'avant et l'arrière —
pas parce qu'un soleil les frappe.

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
qui fait la moitié de l'image est un refus.

ORIENTATION — trois signaux qui se cumulent, aucun ne suffit seul
  1. l'avant (haut) est dans un ton clair, l'arrière dans un ton sombre
  2. la masse dominante est décalée vers l'avant
  3. l'arrière porte une bande sombre et deux évents #1E2124

INTERDITS ABSOLUS
  – Toute reprise de Command & Conquer, de Tiberium Alliances, de Warhammer,
    de StarCraft : ni cristal vert qui pousse, ni char à double canon
    reconnaissable, ni logo de faction, ni silhouette empruntée.
  – Tout emblème militaire réel : étoile, croix, cocarde, drapeau, insigne.
  – Toute couleur hors de la palette ci-dessus.
  – Toute couleur d'accent employée pour autre chose que la cible.
  – Perspective, inclinaison, profondeur, reflet, brillance spéculaire.
  – Ombre portée, effet de lueur, particules, étincelles, fumée, explosion.
  – Style « cartoon », contour noir épais uniforme, aplat brillant façon icône.

Réponds uniquement par l'image. Pas de commentaire, pas de description, pas de
proposition de variante.
```

---

## 3. Le gabarit d'un prompt unitaire

Après le contrat, chaque image se demande sur le même patron. Cinq champs, dans
cet ordre, et rien de plus — l'ordre compte, le modèle pondère le début.

```
[CAMP]    joueur (kaki) | Ouvrage (rampe X)
[CHÂSSIS] tourelle | véhicule | infanterie | structure | tuile
[TAILLE]  empreinte en gros pixels, sur 32
[ACCENT]  blanc | rouge | jaune | aucun
[SUJET]   trois à cinq phrases, silhouette d'abord, détail ensuite
```

Exemple complet, à recopier tel quel :

```
[CAMP] joueur, rampe kaki
[CHÂSSIS] tourelle
[TAILLE] empreinte 24 × 24 gros pixels, centrée
[ACCENT] rouge (#8A1E17 / #E43E32)
[SUJET] Une tourelle défensive fixe, vue du dessus. Socle carré plein en métal
moyen #3E454C occupant toute l'empreinte, avec un anneau rouge large courant
sur tout son pourtour. Au centre, un dôme rond kaki #4E5742 qui ne dépasse pas
60 % de la largeur du socle, plus clair sur sa moitié avant. Un tube unique
épais en métal clair #68727E part du dôme vers le haut et dépasse le socle de
quatre gros pixels ; sa bouche est #E43E32. À l'arrière du socle, une bande
sombre et deux évents #1E2124.
```

**Ce qui fait échouer un prompt**, systématiquement, dans l'ordre de fréquence :

1. Décrire une intention (« une tourelle menaçante ») au lieu d'une géométrie
   (« un socle carré et un dôme rond »). Le modèle comble par du style.
2. Oublier de nommer le fond. Il en invente un.
3. Demander deux choses dans une image (« la tourelle et sa version longue
   portée »). Il produit une planche.
4. Laisser un mot de vocabulaire militaire chargé (« mammouth », « artillerie
   lourde de siège »). Il rappelle une silhouette existante.

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
tiennent dans une page HTML autonome, sans dépendance, sur le modèle de
`archipel-map-editor.html` : glisser-déposer les images d'un lot, elle renvoie
les PNG conditionnés et renommés. C'est le seul outil que ce pipeline demande,
et il n'y a pas de version « on fera sans ».

Contrôle après conditionnement, deux vérifications qui prennent dix secondes :

- compter les couleurs du PNG final — si le compte dépasse 19, la
  quantification a été sautée ;
- afficher le PNG à 40 px et à 128 px côte à côte — si la silhouette ne se lit
  plus à 40 px, le sprite est à refaire, quelle que soit sa beauté à 128.

---

## 5. Les deux dettes de conception, et ce qu'on propose d'en faire

Ethan a demandé un premier jet sur chacune, puis validation sur pièce. Voici ce
que le jet doit contenir pour que la validation soit possible.

### 5.1 Dette 1 — la rampe de l'Ouvrage (5 tons)

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
moment de la comparaison, sur un pylône et sur un marcheur — une structure et
une unité, parce que les deux ne se jugent pas pareil. Critère d'arbitrage,
dans cet ordre : (1) est-ce qu'on distingue un marcheur ennemi d'un véhicule
joueur en un dixième de seconde à 40 px, (2) est-ce que l'accent rouge et
l'accent jaune restent lisibles dessus, (3) est-ce que ça a l'air actif.

### 5.2 Dette 2 — le Dard, forme volante de l'Ouvrage

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
aéronefs (`crecelle`, `busard`, `frappeur`, `enclume`) en faisant varier la
taille du moyeu et le nombre de modules — trois pour les 10 points, cinq pour
`enclume` à 15 points.

Sans elle, la Batterie, le Harpon et tout l'anti-aérien du joueur n'ont
littéralement rien à viser : c'est la dette la plus urgente des cinq.

### 5.3 Dettes 4 et 5 — corrections de lisibilité

À imposer dans les prompts concernés, et à vérifier sur le jet d'essai :

- **Marcheur** : pattes de 2 gros pixels d'épaisseur minimum, plus courtes que
  dans l'étalon v4, trois pattes radiales, corps nettement plus massif que les
  pattes. Le défaut à corriger : à 40 px, il se confond avec le pylône.
- **Infanterie joueur** : le casque de chaque figure entièrement dans la
  couleur d'accent, pas un point au centre. C'est le seul endroit où l'escouade
  porte son code couleur.
- **Tourelle** : dôme ≤ 60 % de la largeur du socle, anneau d'accent visible sur
  tout le pourtour. Le défaut à corriger : le dôme mange le socle et l'anneau
  disparaît.

---

## 6. Le jet d'essai — sept images, et rien d'autre avant

Objectif : solder les dettes 1, 2, 4 et 5 en une seule passe, sur les entités
qui les portent. Aucun lot ne démarre avant validation de ce jet.

| # | Image | Ce qu'elle tranche |
|---|---|---|
| 1 | Pylône de l'Ouvrage, **rampe A** | dette 1, sur une structure |
| 2 | Pylône de l'Ouvrage, **rampe B** | dette 1, comparaison |
| 3 | Marcheur (`off_o_fendeur`), **rampe A**, pattes corrigées | dettes 1 et 4 |
| 4 | Marcheur (`off_o_fendeur`), **rampe B**, pattes corrigées | dettes 1 et 4 |
| 5 | Dard générique, rampe retenue par Ethan à l'œil sur 1–4 | dette 2 |
| 6 | `off_j_meute` — escouade joueur, casques blancs pleins | dette 5 |
| 7 | `def_j_creneau` — tourelle joueur anti-véhicule, socle dégagé | dette 5 |

Les sept passent par le conditionnement du §4 **avant** d'être jugées : une
image jugée en 1024 anticrénelée ne dit rien de ce que le jeu affichera.

Grille de validation d'un jet, dans l'ordre. Un seul non = on refait, on ne
retouche pas.

1. Le fond est-il intégralement détouré, sans liseré rose ?
2. Le sprite tient-il en 19 couleurs après quantification ?
3. La silhouette se lit-elle à 40 px, sur fond clair **et** sur fond sombre ?
4. L'accent se voit-il à 40 px ?
5. L'avant est-il identifiable sans le canon ?
6. Le sprite reste-t-il juste tourné de 90° et de 180° ?
7. Est-ce qu'il ressemble à quelque chose de déjà vu ailleurs ?

Le point 6 est nouveau et c'est le plus facile à rater : il suffit d'un reflet
en haut à gauche pour que tout le lot soit à refaire.

---

## 7. Ce que chaque lot demande en plus

Le contrat du §2 couvre tout le monde. Ces additions se collent **après** le
gabarit du §3, par lot.

### Lot 1 — terrain (29)

```
[CHÂSSIS] tuile
[TAILLE] la tuile occupe les 32 × 32 gros pixels, bord à bord, sans marge
[ACCENT] aucun
```

Additions : *la tuile doit se raccorder à elle-même par les quatre bords sans
couture visible (motif répétable) ; elle ne contient aucun objet identifiable,
aucun élément centré, aucun point d'intérêt ; les quatre variantes d'un même
terrain diffèrent par la disposition, jamais par la teinte ; contraste interne
faible — c'est un fond, il passera sous des unités et ne doit pas les
concurrencer.*

⚠ La marge de 2 gros pixels **ne s'applique pas** aux tuiles : c'est le seul cas
du projet où le sujet touche les bords, et c'est obligatoire.

⚠ `tile_croute` (la scorie) : dépôt vitrifié laissé par l'expansion de
l'Ouvrage. **Jamais un cristal vert qui pousse.** C'est le point exact où la
reprise de C&C se réintroduit sans qu'on la voie.

### Lots 3 et 4 — unités et défenses (46)

Tableau de paramètres, à recopier champ par champ dans le gabarit. `points`
donne l'empreinte, `specialite` donne l'accent, `chassis` donne la forme.

| Clé | Châssis | Accent | Points | Empreinte |
|---|---|---|---|---|
| `meute` | infanterie | blanc | 5 | 18 × 18 |
| `guetteur` | infanterie | blanc | 10 | 24 × 24 |
| `perceurs` | infanterie | jaune | 5 | 18 × 18 |
| `fouisseurs` | infanterie | jaune | 10 | 24 × 24 |
| `carapace` | infanterie | rouge | 10 | 24 × 24 |
| `ratisseur` | véhicule | blanc | 10 | 24 × 24 |
| `fendeur` | véhicule | rouge | 10 | 24 × 24 |
| `broyeur` | véhicule | rouge | 15 | 28 × 28 |
| `belier` | véhicule | jaune | 10 | 24 × 24 |
| `pilon` | véhicule | jaune | 15 | 28 × 28 |
| `crecelle` | aéronef | blanc | 10 | 24 × 24 |
| `busard` | aéronef | rouge | 10 | 24 × 24 |
| `frappeur` | aéronef | jaune | 10 | 24 × 24 |
| `enclume` | aéronef | jaune | 15 | 28 × 28 |

**Amendement A6 à `FICHE-STYLE.md` §7.** La fiche annonce 20 / 26 / 30 pour
5 / 10 / 15 points. Avec la marge de 2 gros pixels sur les quatre bords
(amendement A4), le maximum absolu est 28 : une empreinte de 30 déborde dès la
première rotation. L'échelle devient **18 / 24 / 28**, ce qui creuse en plus
l'écart entre 5 et 10 points — la fiche le demandait et 20 vs 26 ne le donnait
pas.

Côté Ouvrage, le châssis se traduit dans l'autre grammaire, et c'est cette
traduction qui porte toute l'opposition : *infanterie → essaim* (plus de
figures, plus petites, identiques, sans casque distinct — l'accent passe sur le
corps), *véhicule → marcheur* (pas de chenilles : trois pattes radiales,
corps massif au centre), *tourelle et structure → pylône* (colonne à modules
empilés, symétrie radiale, aucun angle droit), *aéronef → Dard* (§5.2).

Les défenses monolithiques du lot 4 ajoutent : *l'entité est ancrée au sol,
elle ne se déplace pas ; le merlon et les deux barrières ne portent aucun tube ;
le merlon ne porte aucun accent.*

### Lot 5 — bâtiments (16) et états (7)

Additions : *un bâtiment occupe une case entière et son empreinte est carrée ;
il n'a pas d'avant ni d'arrière, donc pas de gradient fonctionnel — sa lecture
vient de sa silhouette en plan ; toit vu du dessus, jamais de façade ; aucune
cheminée fumante, aucune lumière allumée.*

Les trois surcouches de dégâts se demandent différemment et méritent leur
propre conversation : *fond magenta, et sur ce fond uniquement les marques de
destruction — suie noire, brèches ouvertes sur du noir, tôles arrachées, gravats
— disposées de façon dispersée et asymétrique, en laissant au moins la moitié de
la surface vide. Aucun bâtiment, aucune forme reconnaissable : c'est un calque
qui se posera par-dessus n'importe quel bâtiment.* Progression à tenir entre
elles : silhouette intacte → silhouette entamée → moitié éventrée.

### Lots 6 et 7 — carte et interface (54)

Les marqueurs de carte et les icônes d'interface **ne sont pas en vue de
dessus** : ce sont des pictogrammes. Le contrat du §2 s'applique pour le format,
la palette et les interdits, mais la clause de vue zénithale saute. Il faut le
dire explicitement dans le prompt, sinon le modèle produit des icônes en
perspective au milieu d'un lot top-down :

```
Exception à la vue : cette image est un pictogramme d'interface, pas un objet
vu du dessus. Silhouette pleine, frontale, symétrique, un seul niveau de
lecture, aucune profondeur.
```

Addition pour les icônes : *forme pleine, aucun contour ajouté, aucun cercle de
fond, aucun cadre ; elle sera affichée à 24 px et doit se lire en silhouette
noire.*

---

## 8. Pièges connus du médium — la liste qui évite de refaire un lot

1. **La dérive de lot.** À la vingtième image d'une conversation, le modèle
   dérive vers son style par défaut : détails plus fins, contours plus mous,
   couleurs plus riches. **Recoller le contrat du §2 toutes les dix images**, et
   ne jamais faire un lot entier d'une traite sans regarder.
2. **La cohérence est plus fragile que la qualité.** Vingt sprites très beaux et
   inégaux valent moins que vingt sprites moyens et homogènes. Le jeu se lit par
   comparaison entre entités, pas entité par entité.
3. **Il ajoute du sol.** Dès qu'on décrit un objet posé, il dessine ce sur quoi
   il est posé. Le rappel « fond magenta uni, rien d'autre » va dans presque
   chaque prompt.
4. **Il n'entend pas « gros pixel ».** Si les sorties sont lisses, écrire
   explicitement « chaque carré de 32 × 32 pixels est d'une seule couleur »
   plutôt que « pixel art », qui est devenu un mot de style et non de format.
5. **Il équilibre les couleurs.** Un sprite qui ne devrait porter qu'un accent
   rouge en reçoit un second, vert ou bleu, « pour l'équilibre ». C'est le
   défaut le plus insidieux, parce que le résultat est joli et faux : il casse la
   seule règle que le joueur doit apprendre.
6. **Il ne sait pas répéter une pièce.** La grammaire de l'Ouvrage — le même
   module répété — lui demande un effort constant ; sans rappel, chaque unité
   ennemie devient un objet unique et l'Ouvrage cesse de se lire comme une
   installation qui s'auto-réplique.
7. **Ne jamais lui demander de corriger une image.** Une retouche renvoie une
   image régénérée, donc hors palette et hors cohérence. On corrige le prompt et
   on relance.

---

*v1 — 26/08/2026. Écrit après les arbitrages d'Ethan sur `INVENTAIRE-SPRITES.md`
§2.4, §3.4, §5.3, §5.4 et §6.2. Le pipeline Python de `FICHE-STYLE.md` §10 est
remplacé par ce document ; le §11 de la fiche reste en vigueur et c'est le §4
ci-dessus qui le fait respecter.*
