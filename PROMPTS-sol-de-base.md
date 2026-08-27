# Sol de base et éléments posés — prompts prêts à coller

27/08/2026. Cinq planches, dix-huit fichiers. Une conversation, ce fichier
collé dans l'ordre.

**Ce que ce lot couvre** : le champ de bataille 9 × 18 de `GRILLE`. Un sol quasi
uni sur les 162 cases, et par-dessus des sprites plus petits qui disent ce qu'il
y a dessus.

**Deux sols, un par camp** — le joueur en terre cuite, l'Ouvrage en cendre
violacée. La grille et les éléments posés, eux, sont les mêmes partout : un
gisement de quartz est du quartz, une nappe de pétrole est du pétrole, ils
n'appartiennent à personne (règle A1).

**Ce que ce lot ne couvre pas** : la carte du monde 30 × 300, qui aura son propre
jeu de sprites, plus complexe. Rien de ce fichier ne la concerne.

---

## 0. Correctif de contrat — à coller AVANT les prompts

Le contrat du §2 de `BRIEF-SPRITES-IA.md` s'applique **sauf sur les trois points
ci-dessous**, qui le remplacent pour ce lot.

```
Ce lot est du DÉCOR DE SOL, pas des entités. Trois règles du contrat changent.

PALETTE — remplace entièrement le bloc palette du contrat
Sol du JOUEUR, terre cuite, 5 tons :
  creux #B87E64 · ombre #C38C73 · sol nu #CF9A83 · clair #D7A995 · poussière #E0B9A8
Sol de l'OUVRAGE, cendre violacée, 5 tons :
  creux #9892AE · ombre #A6A0B9 · sol nu #B3AEC4 · clair #BDB9CB · poussière #CAC7D4
Matières, à n'employer que là où le prompt le demande :
  quartz  #9FB3C5 / #C1CEDA
  scorie  #382E47 / #4E4160
  pétrole #1E2124
  bois    #5B4133
  eau     #1F5160
Fond : #FF00FF.

Aucune autre couleur. En particulier AUCUN VERT, jamais, nulle part : le vert
est la couleur des unités du joueur, et une broussaille verte rendrait une
escouade invisible. La végétation de ce décor est sèche et morte.

VUE — remplace la clause de vue du contrat
Tout ce lot est STRICTEMENT PLAT, vu à la verticale exacte. Aucune inclinaison,
aucune face visible, aucune épaisseur, aucune hauteur. C'est du sol : il n'a pas
de flanc. Les seules exceptions sont signalées prompt par prompt et ne dépassent
jamais 2 gros pixels.

ORIENTATION — remplace la clause avant/arrière du contrat
Ces sprites n'ont ni avant ni arrière. Le jeu les fera pivoter d'un quart de
tour dans n'importe quel sens. Aucun gradient directionnel, aucun élément qui
suggère un sens de lecture, aucune symétrie qui se casserait en tournant.
```

---

## 1. Planche 1 — le sol du JOUEUR (4 fichiers)

Le fichier le plus répété du jeu : environ 150 cases sur 162 sont du sol nu, et
elles sont **toutes visibles en même temps**. Quatre variantes plus la rotation
font seize apparences ; chacune sera donc à l'écran une dizaine de fois d'un
coup. C'est la seule image du lot qui mérite d'être relancée jusqu'à ce qu'elle
soit calme.

```
PLANCHE : une seule image de 2048 × 2048, divisée en quatre quadrants de
1024 × 1024. Chaque quadrant est un sprite indépendant et complet. Aucune
bordure, aucune séparation, aucun cadre entre les quadrants.

SUJET : quatre variantes du même sol de terre cuite sèche, vu à la verticale.

CES QUATRE TUILES SONT JOINTIVES. Elles couvrent un terrain entier, posées bord
à bord, dans n'importe quel ordre et tournées d'un quart de tour au hasard.
Trois conséquences, obligatoires :

1. PAS DE MARGE. Chaque quadrant est rempli bord à bord, 32 × 32 gros pixels,
   sans le carré vide de 28 × 28 du contrat. Aucun fond magenta dans ce lot.
2. LES BORDS SONT UNIFORMES. Sur chaque quadrant, l'anneau extérieur de 2 gros
   pixels — les deux rangées du haut, du bas, de gauche et de droite — est
   ENTIÈREMENT peint en #CF9A83, sans aucune exception. C'est ce qui permet à
   deux tuiles quelconques de se rejoindre sans couture visible.
3. AUCUN MOTIF RECONNAISSABLE. Ni cercle, ni spirale, ni croix, ni ligne
   traversante, ni forme qui attire l'œil. Une tuile qu'on remarque devient un
   défaut répété dix fois à l'écran.

CE QUE LE SOL DOIT ÊTRE : presque uni. #CF9A83 occupe au moins 80 % de chaque
quadrant. Le reste est un semis discret et irrégulier, jamais régulier :
quelques plaques de #D7A995 et #E0B9A8 comme de la poussière plus claire,
quelques creux de #C38C73, et de très rares éclats isolés de #B87E64 — des
cailloux, pas des taches. Une variante peut porter une fine craquelure sèche de
#C38C73, de deux ou trois gros pixels de long, jamais plus, jamais traversante.

Les quatre variantes se ressemblent beaucoup. Elles ne diffèrent que par la
position du semis. Aucune ne doit être plus sombre ou plus claire que les
autres : posées côte à côte, on ne doit pas voir où passe la limite.

INTERDIT : herbe, mousse, feuillage, verdure, sable de plage, dunes, ondulation,
motif de camouflage, texture de bruit dense, vignettage, ombre au centre ou aux
bords.
```

---

## 2. Planche 2 — le sol de l'OUVRAGE (4 fichiers)

Le même exercice, l'autre camp. Un joueur qui ouvre un raid doit savoir à qui
appartient le terrain avant d'avoir lu une ligne d'interface.

⚠ **Il est clair, et c'est contre-intuitif.** L'instinct dit « cendre sombre »
pour un sol contaminé. C'est exactement l'erreur qui a fait rater le premier jet
du terrain : toutes les rampes d'entité vivent entre L\* 3 et 62, donc **un sol
sombre camoufle les défenses de l'Ouvrage sur sa propre base**, et le joueur ne
voit plus ce qu'il attaque. Le sol passe au-dessus des entités en clarté, des
deux côtés, sans exception.

La teinte, elle, est bien celle de l'Ouvrage : c'est la version pâle de sa rampe
d'ardoise. Ses machines sont le bas de cette gamme, son sol en est le haut.

```
PLANCHE : une seule image de 2048 × 2048, divisée en quatre quadrants de
1024 × 1024. Chaque quadrant est un sprite indépendant et complet. Aucune
bordure, aucune séparation, aucun cadre entre les quadrants.

SUJET : quatre variantes du même sol de cendre sèche, gris violacé pâle, vu à la
verticale. Une terre lessivée, calcinée depuis longtemps et refroidie — pas une
cendre fraîche, pas un sol qui fume.

CES QUATRE TUILES SONT JOINTIVES. Mêmes trois règles que la planche précédente :

1. PAS DE MARGE. Chaque quadrant est rempli bord à bord, 32 × 32 gros pixels.
   Aucun fond magenta dans ce lot.
2. LES BORDS SONT UNIFORMES. L'anneau extérieur de 2 gros pixels de chaque
   quadrant est ENTIÈREMENT peint en #B3AEC4, sans exception.
3. AUCUN MOTIF RECONNAISSABLE. Ni cercle, ni spirale, ni croix, ni ligne
   traversante.

CE QUE LE SOL DOIT ÊTRE : presque uni. #B3AEC4 occupe au moins 80 % de chaque
quadrant. Le reste est un semis discret et irrégulier : quelques plaques de
#BDB9CB et #CAC7D4 comme de la poussière plus claire, quelques creux de
#A6A0B9, de très rares éclats isolés de #9892AE. Une variante peut porter une
craquelure sèche de #A6A0B9, de deux ou trois gros pixels, jamais traversante.

Le grain est PLUS FIN et PLUS UNIFORME que sur la terre cuite : là où le sol du
joueur a des cailloux et des creux, celui-ci est une poudre tassée. La
différence entre les deux sols doit tenir à la teinte et au grain, jamais à la
clarté d'ensemble.

Les quatre variantes ne diffèrent que par la position du semis. Posées côte à
côte, on ne doit pas voir où passe la limite.

INTERDIT : herbe, mousse, verdure, braise, lueur, point chaud, fumée, cendre en
train de brûler, sable de plage, dunes, motif de camouflage, texture de bruit
dense, vignettage.
```

---

## 3. Planche 3 — les champs de ressource (4 fichiers)

Douze cases par base, en blocs de une à trois cases contiguës — un bloc doit se
lire comme **un seul gisement**, pas comme trois carreaux collés.

```
PLANCHE : une image de 2048 × 2048, quatre quadrants de 1024 × 1024, chacun un
sprite indépendant.

Quadrant 1 et 2 — GISEMENT DE QUARTZ, deux variantes.
Quadrant 3 et 4 — DÉPÔT DE SCORIE, deux variantes.

Ces sprites se posent PAR-DESSUS la tuile de sol. Le fond de chaque quadrant est
magenta #FF00FF et représente le sol qui reste visible autour du gisement.

RACCORD ENTRE CASES VOISINES — obligatoire. Deux gisements peuvent occuper deux
cases côte à côte et doivent alors se lire comme un seul. Donc : la matière
touche le milieu des quatre bords sur environ la moitié de leur longueur, et les
quatre ANGLES du quadrant restent en magenta. Jamais un bord entièrement plein,
jamais un bord entièrement vide.

QUARTZ : des éclats cristallins anguleux, à facettes droites, en #9FB3C5 avec
des arêtes en #C1CEDA. Froid, minéral, dur. Les éclats sont de tailles
inégales, les plus gros au centre, s'éparpillant vers les bords. Le quartz est
plat : il affleure, il ne se dresse pas.

SCORIE : une croûte vitrifiée sombre en #382E47, veinée de #4E4160. Ce n'est pas
un cristal et ça ne pousse pas : c'est un dépôt industriel refroidi, une coulée
figée, crevassée, avec des bords épais et arrondis là où la matière s'est
arrêtée en durcissant. Aucune pointe, aucune facette, aucune symétrie.

C'est la seule chose de ce lot qui a le droit à 2 gros pixels d'épaisseur : la
scorie s'est déposée, elle est en relief au-dessus du sol. Le quartz, lui, est
strictement plat.

INTERDIT : cristal vert, cristal qui pousse, gemme taillée, éclat lumineux,
brillance, halo, symétrie radiale, contour dessiné autour du gisement.
```

---

## 4. Planche 4 — obstacles infanterie et véhicule (4 fichiers)

Dix cases dispersées par base. Elles **ralentissent** — elles ne bloquent
personne, et l'aviation les ignore. Chacune est isolée sur sa case : elles ne se
raccordent pas entre elles, donc elles gardent la marge normale du contrat.

```
PLANCHE : une image de 2048 × 2048, quatre quadrants de 1024 × 1024, chacun un
sprite indépendant, fond magenta #FF00FF.

MARGE NORMALE : chaque sujet tient dans un carré centré de 28 × 28 gros pixels,
2 gros pixels vides sur les quatre bords. Ces obstacles sont isolés, ils ne se
raccordent à rien.

Quadrant 1 et 2 — FOURRÉ SEC, deux variantes. Il gêne l'homme à pied et pas le
véhicule : un fantassin s'y empêtre, une chenille passe dessus.
  Un enchevêtrement bas de branchages morts et de tiges sèches, en #5B4133,
  avec quelques brindilles plus claires en #C38C73. Emmêlé, irrégulier, sans
  tronc central, sans forme d'arbre, sans feuillage. Vu de dessus on voit un
  fouillis de lignes courtes croisées, pas une couronne. 2 gros pixels
  d'épaisseur au maximum.

Quadrant 3 et 4 — NAPPE DE PÉTROLE, deux variantes. Elle gêne le véhicule et pas
l'homme à pied : ça patine sous une chenille, un fantassin la contourne.
  Une flaque noire en #1E2124, aux bords lobés et irréguliers, comme une chose
  qui s'est étalée. Strictement plate, aucune épaisseur, aucun reflet, aucune
  brillance, aucune irisation. Quelques éclaboussures détachées autour de la
  flaque principale, de un ou deux gros pixels. Le pourtour immédiat de la
  flaque peut porter une frange de sol imbibé en #B87E64.

Les deux variantes de chaque type diffèrent par la forme, pas par la taille : les
quatre sujets occupent à peu près la même surface.

INTERDIT : arbre debout, tronc vertical, feuillage, verdure, reflet sur le
liquide, brillance, bulle, éclat, symétrie, contour dessiné.
```

---

## 5. Planche 5 — obstacle mixte (2 fichiers)

```
PLANCHE : une image de 2048 × 1024, DEUX quadrants de 1024 × 1024 côte à côte.
Chacun un sprite indépendant, fond magenta #FF00FF, marge normale de 2 gros
pixels sur les quatre bords.

Quadrant 1 et 2 — CHAOS ROCHEUX, deux variantes. Il gêne tout ce qui touche le
sol, l'homme comme le véhicule.
  Des blocs de pierre anguleux et des gravats de tailles inégales, en #B87E64
  pour les faces exposées et #C38C73 pour les éclats plus clairs, avec des
  creux d'ombre en #5B4133 entre les blocs. Trois à cinq gros blocs, entourés de
  débris plus petits. Ce sont des cassures franches, à arêtes droites, pas des
  galets ronds.

  C'est le seul sujet du lot qui a du volume, et il est plafonné : 2 gros pixels
  d'amorce de face sombre sous les blocs les plus hauts, du côté du bas de
  l'image, et rien de plus.

INTERDIT : muret, empilement construit, alignement, symétrie, galets ronds,
mousse, verdure, contour dessiné.
```

---

## 6. Conditionneur

| Réglage | Valeur |
|---|---|
| Régime | **Tuile** pour les planches 1 et 2, **Entité** pour les planches 3, 4 et 5 |
| Palette | **Sol** (les deux rampes de 5 tons + les matières) |
| Échantillonnage | majorité |
| Découpe | **2 × 2** pour les planches 1 à 4, **2 × 1** pour la planche 5 |
| Rognage | 3 px · seuil magenta 140 |

⚠ Le conditionneur n'a pas encore de palette *Sol*. En attendant, tourner en
palette *aucune* et me renvoyer l'archive : je vérifie les tons à la main comme
pour le premier jet du terrain.

---

## 7. Contrôles à faire avant de valider

1. **Les planches 1 et 2 se payent un test à part** : poser les quatre tuiles en
   damier aléatoire avec rotation, sur au moins 9 × 18 cases, et chercher la
   couture. S'il y en a une, c'est l'anneau de bord qui n'a pas été respecté.
2. **Poser les DEUX camps sur les DEUX sols.** L'escouade du joueur et le
   marcheur de l'Ouvrage, sur la terre cuite et sur la cendre. Quatre
   combinaisons, aucune ne doit se fondre. C'est le contrôle qui a fait tomber le
   premier jet du terrain, et il compte double maintenant qu'il y a deux sols.
3. **Les deux sols ont-ils la même clarté d'ensemble ?** S'ils ne diffèrent pas
   qu'en teinte, l'un des deux camouflera mieux que l'autre.
4. **Deux cases de gisement côte à côte** : est-ce que ça fait un gisement, ou
   deux carreaux ?
5. **Les trois obstacles se distinguent-ils les uns des autres** à 45 px, sans
   légende ? Si le fourré et le chaos rocheux se confondent, le joueur ne saura
   pas ce qui ralentit quoi.

---

## 8. Un point que j'ai tranché faute d'instruction

Il se défait en une ligne.

- **La matière de chaque type d'obstacle.** `infanterie` → fourré sec,
  `vehicule` → nappe de pétrole, `les_deux` → chaos rocheux. Le raisonnement est
  dans chaque prompt : ce qui empêtre un homme laisse passer une chenille, ce
  qui fait patiner une chenille se contourne à pied, ce qui est haut et dur
  arrête les deux.
