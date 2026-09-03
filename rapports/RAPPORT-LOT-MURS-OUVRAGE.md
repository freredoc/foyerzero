# RAPPORT — lot MURS-OUVRAGE (03/09/2026)

**Version produite : 0.74.0 · build 76.**
`npm run check` → **950 pass / 0 fail**, `dist/index.html` **3 250 476 octets**,
0 référence externe.
`python3 tools/verifier.py` → **933 identiques · 0 différent · 0 nouveau ·
0 MANQUANT**, verdict VERT.

---

## 0. La demande

Ethan, 03/09, après le lot MURS :

> C'est pour les murs, c'est pour le joueur et pour l'ouvrage. Normalement,
> j'ai livré des murs ouvrage avec.

puis, devant le chiffrage et le constat qu'il s'agissait d'un lot :

> continue mur ouvrages

Le lot MURS avait laissé les huit pièces de l'Ouvrage **produites et jamais
dessinées**, et il avait dit pourquoi, mot pour mot : « ce qui manque n'est pas
une ligne dans `VARIABLE_DU_MUR` : c'est un ENDROIT où les dessiner ». Cet
endroit est le canevas de l'écran de raid, seul écran où une base de l'Ouvrage
apparaisse.

---

## 1. Ce que ça coûte, et ce que ça déplace

### Le livrable

| Poste | Octets |
|---|---|
| six `.webp` de `bord/`, camp `o` (15 436 o sur le disque) | **+20 592** en base64 |
| `render/contour.js`, le balisage, le câblage, la projection | **+1 519** |
| **Total** | **+22 111** |

`dist/index.html` : **3 228 365 → 3 250 476**. Borne T10 **inchangée à
3 400 000**, marge **149 524 octets, soit 4,4 %**. **18 `data:` avant,
24 après.**

⚠⚠ **SIX IMAGES, PAS HUIT — ET LE RAPPORT DE MURS ANNONÇAIT HUIT.** Il chiffrait
« +24 010 octets de WebP, soit +32 016 en base64 », qui est le poids des quatre
murs ET des quatre blocs produits pour ce camp. L'anneau n'en pose que **six** :
le U d'une base de neuf colonnes n'a que DEUX créneaux de mur, exactement comme
côté joueur ; `bord_o_mur_3` et `bord_o_mur_4` restent au dépôt sans entrer.
**L'estimation était haute d'un tiers**, et c'est la mesure qui fait foi.
`CONTOUR T9` refuse désormais, dans les deux sens, qu'une image soit inlinée sans
que l'anneau la pose.

### La case du champ de bataille

Une base ceinte occupe `GRILLE.largeur + 2` colonnes et `GRILLE.longueur + 1`
lignes — jamais `+ 2` en hauteur, le U s'ouvrant sur le déploiement. La case
rétrécit donc, **sur tout le champ de bataille** :

| Viewport | sans anneau | avec | écart |
|---|---|---|---|
| 360 × 560 | 31 px | 29 | −6,5 % |
| 412 × 700 | 38 | 36 | −5,3 % |
| 412 × 820 | 45 | 37 | **−17,8 %** |
| 1080 × 2100 | 116 | 98 | −15,5 % |

C'est le prix du mur, et il est plus lourd sur un écran haut, où la largeur
commandait déjà de peu. Il ne se paie **qu'où le mur se dessine**.

---

## 2. Le déménagement de la géométrie — la vraie raison du lot

`tuilesDuContour` vivait dans `ui/chantier.js` : légitime tant qu'un seul écran
s'en servait. L'écran de raid est un **canevas**, donc il passe par
`render/scene.js`, et **`render/` n'a pas le droit d'importer `ui/`**. Retourner
la flèche « juste pour un mur » aurait fait du moteur de rendu une dépendance de
l'écran de la base.

`src/render/contour.js` porte donc `BANDE_DU_CONTOUR`,
`BANDE_DE_FIN_DU_CONTOUR`, `LONGUEUR_DU_MUR`, `NB_VARIANTES_DU_MUR`,
`CAMP_DU_PROPRIETAIRE`, `SEL_DU_MUR`, `tuilesDuContour` et `nomsDuContour`.
**Pas une ligne de la géométrie n'a changé en route** — seule la lecture des
bandes passe de `BANDES.find(…)` (une table de l'écran) à `GRILLE.bandes[…]` (la
donnée), ce qui est la même chose et retire une dépendance de plus.

`ui/chantier.js` **RÉ-EXPORTE** ce qu'il exposait : un ré-export n'est pas une
copie, c'est la même liaison, et tous ses appelants marchent sans être touchés.
Même motif que `baseCourante`, ré-exporté par `sim/state.js` depuis le lot
BASES-0.

⚠ **ET UN RÉ-EXPORT NE CRÉE AUCUNE LIAISON LOCALE — payé en une exécution.**
`bornesDeDefilement`, dans le même fichier, LIT `BANDE_DU_CONTOUR` : sous le seul
`export … from`, le nom n'existe pas dans le module et la fonction lève
« BANDE_DU_CONTOUR is not defined » au premier défilement. Ce qui SORT et ce qui
SERT se déclarent séparément, et `chantier.test.js` l'a dit tout de suite.

⚠ **`VARIABLE_DU_MUR` NE S'ÉCRIT PLUS À LA MAIN.** Six lignes recopiées tenaient
à un camp ; à deux, la même liste doit servir deux fois et une seconde copie
aurait été la première à oublier une pièce. Elle se dérive de
`nomsDuContour('j')` par `nomCssDuMur`. **Vérifié : la table dérivée est
identique, clé pour clé, à la table recopiée.**

---

## 3. La projection

`calculerProjection(largeurPx, hauteurPx, contour = 0)`.

⚠⚠ **LA MARGE POINTE SUR LE CONTENU, PAS SUR L'ANNEAU, et c'est tout ce qui rend
ce paramètre payable.** L'anneau est replié DANS `margeX`/`margeY`, si bien que
`xDeColonne`, `yDeRangee`, `yDeRangeeMilli` et `caseDepuisPixels` **n'ont pas
changé d'un caractère** : la colonne 1 tombe toujours en `margeX`. Et
`xDeColonne` sert les coordonnées 0 et `largeur + 1` sans le savoir, étant
affine — l'écrire à part dans la scène en aurait fait une copie, donc la première
à diverger.

**Conséquence mesurée : aucune assertion de pixel du dépôt ne bouge.** Le banc
d'essai projette sans anneau, ses douze mesures tiennent, et `CONTOUR T2` refait
l'ancienne formule sur cinq viewports plutôt que de la recopier.

⚠ **UN PARAMÈTRE, PAS UNE SECONDE FONCTION.** `calculerProjectionAvecContour`
aurait mis DEUX formules de letterboxing au dépôt, dont une seule serait
corrigée le jour d'une correction.

⚠ **UN `contour` AUTRE QUE 0 OU 1 LÈVE.** Un `true` passé par mégarde vaudrait 1
après coercition, et une projection à demi ceinte ne se verrait nulle part.

⚠⚠ **`yDeLigneEcran` ENTRE, PARCE QUE L'ANNEAU A UNE LIGNE ZÉRO QU'AUCUNE RANGÉE
N'OCCUPE.** Le mur du fond court AU-DESSUS de la rangée `GRILLE.longueur` ;
`yDeRangee` la refuserait, aucune rangée 19 n'existant. C'est la distinction que
`render/orientation.js` pose depuis le 27/08 : une rangée est du MODÈLE, une
ligne d'écran est du DESSIN, et l'anneau n'a que du dessin. `CONTOUR T4` accorde
les deux repères sur les dix-huit rangées au lieu de croire qu'ils coïncident.

---

## 4. Le dessin

⚠⚠ **LA PRIMITIVE `sprite` SERT TELLE QUELLE, ET SEULE LA FABRIQUE DIFFÈRE.**
Elle porte son rectangle source depuis le lot UNITÉS-AU-COMBAT : une cellule
d'atlas le calcule d'un rang, **une image seule le prend tout entier**. Ouvrir
une seconde forme aurait donné à `canvas2d.js` une branche de plus appelant
exactement le même `drawImage` — ce que cette primitive existe pour éviter.
`canvas2d.js` n'a pas été touché.

⚠⚠ **LA `famille` EST LE NOM DE L'IMAGE.** Un mur fait 512 × 128 : il n'est dans
aucun atlas et **ne peut pas y être**, `tools/atlas.py` n'acceptant que des
cellules carrées d'un même côté. Chaque image est donc une famille d'une seule,
ce qui est exactement ce que « hors atlas » veut dire.

⚠ **LA TAILLE SOURCE SE CALCULE SUR `COTE_SPRITE`, ELLE NE SE LIT PAS SUR
L'IMAGE.** `naturalWidth` n'existe qu'une fois l'image décodée, et `render/` est
pur. `CONTOUR T9` la confronte à `bord-empreintes.json` : il tombe au dépôt, pas
chez le joueur.

⚠⚠ **LE CAMP EST CELUI DU `proprietaireDefense`, JAMAIS `'o'` EN DUR.**
`sim/raid-ouvrage.js` monte des combats où la défense appartient au JOUEUR :
écrire le camp en dur aurait passé le test de l'Ouvrage et donné un mur violet à
la base du joueur le jour où cet écran-là s'ouvrira. `CONTOUR T7` mesure les deux
côtés, et **c'est la moitié joueur qui compte**. Même leçon que `pointsRecherche`
au lot MODULES-E.

⚠ **LE MUR EST LE DEUXIÈME ÉTAGE ICI AUSSI — fond, mur, pièces.** L'anneau ne
recouvre aucune case de contenu, donc l'ordre ne se VOIT pas ; le garder
identique à celui de l'écran de la base évite qu'on ait à le redécouvrir par la
mesure une seconde fois, comme le 31/08.

---

## 5. Le chemin des images

| Camp | Chemin | Pourquoi |
|---|---|---|
| `j` | variables CSS `--mur-j-*` | l'écran de la base est du DOM, il peint en `background-image` |
| `o` | balises `<img id="bord-o-*" src="%MUR_O_*%">` | l'écran de raid est un canevas, `drawImage` veut un élément |

⚠ **AUCUN DESSIN N'EST PARTAGÉ, DONC RIEN N'EST INLINÉ DEUX FOIS.** Le couplage
du lot SPRITES-ET-ZOOM — la déclaration dans la feuille, l'adresse recopiée par
`garnirLesAtlas` — ne concerne que ce qui sert des DEUX côtés. Ici les deux
ensembles sont disjoints : les six de l'Ouvrage portent leur marqueur EN `src`,
comme les deux grosses bases de la carte du monde, et `garnirLesAtlas` n'a rien
à leur donner.

⚠ **`atlasDeLaScene` DÉRIVE SES CLÉS DE `nomsDuContour('o')`**, il ne les
recopie pas. Un combat où le joueur défend demanderait `bord_j_*`, qui n'ont pas
de balise : `getElementById` rend `null` et **`executer` LÈVE** plutôt que de
dessiner un mur absent — « une unité invisible est un défaut qu'on doit voir ».

---

## 6. Les tests — `test/contour.test.js`, neuf tests

Le compte passe de **941 à 950**. Aucune assertion existante n'a été retirée ni
assouplie ; `test/chantier.test.js` garde toujours l'anneau du DOM, ce fichier-ci
garde ce qui est COMMUN aux deux écrans.

| Test | Ce qu'il mesure | Falsification |
|---|---|---|
| T1 | aucun module de `render/` n'importe `ui/` ; la géométrie n'est pas recopiée dans l'écran | appât : le motif reconnaît `from '../ui/…'` |
| T2 | `contour = 0` rend l'ANCIENNE projection, formule refaite sur cinq viewports ; 2 et `true` lèvent | changer une borne fait tomber les cinq |
| T3 | l'anneau tient dans le canevas des quatre côtés ; la colonne 1 et la rangée 18 gardent leurs repères ; le mur n'est pas cliquable | témoin : la même fonction désigne bien une case du contenu |
| T4 | `yDeLigneEcran` = `yDeRangee` sur les 18 rangées ; la ligne 0 est une case plus haut | — |
| T5 | le U ceint les deux bandes, pave exactement `largeur + 2`, ne recouvre rien, reste ouvert en bas ; coins en blocs ; au moins un vrai mur | camp inconnu lève |
| T6 | l'anneau est stable ; les quatre variantes servent ; pas d'`etat.rng` | appât sur le motif décommenté |
| T7 | la scène dessine le mur du `proprietaireDefense`, entier, sous les pièces ; **rien** sans anneau réservé | les deux camps mesurés ; propriétaire inconnu lève |
| T8 | le banc projette sans anneau, l'écran de raid avec | tombe si l'un des deux change |
| T9 | six dessins par camp, tous produits, marqueur au build ET au balisage ; **et aucun de plus n'est inliné** ; tailles source confrontées au manifeste | les deux sens |

### Les falsifications, mesurées

Huit falsifications, huit chutes, **une par test et une seule** — le message
attendu à chaque fois, jamais un plantage de chargement :

| # | Ce qu'on casse | Ce qui tombe |
|---|---|---|
| F1 | le camp écrit `'ouvrage'` en dur dans la scène | T7 — « le mur porte les couleurs de l'autre camp » |
| F2 | la marge ne replie plus l'anneau | T3 — « bord_j_bloc_4 sort par la gauche (−35) » |
| F3 | `%MUR_O_BLOC_3%` retiré de `tools/build.js` | T9 — « manque à tools/build.js » |
| F4 | `mur_3` inliné sans que l'anneau le pose | T9 — « est inliné pour rien » |
| F5 | `render/scene.js` importe `ui/chantier.js` | T1 — la direction des dépendances |
| F6 | la scène ignore `projection.contour` | T7 — l'anneau n'est pas entier |
| F7 | la taille source figée à une case | T9 — « largeur source fausse » |
| F8 | le banc prend un anneau | T8 — « ses mesures de pixels sont à refaire » |

⚠ **UNE GARDE A LU CE QU'ON AVAIT ÉCRIT À SON SUJET, POUR LA QUATRIÈME FOIS.**
T6 refuse `etat.rng` dans `render/contour.js` et tombait sur le COMMENTAIRE qui
nomme `etat.rng` pour dire qu'il n'y touche pas — après `viewport-fit=cover`,
`MENTION_SATURE` et `variante.js`. Elle lit la source décommentée, avec un appât
qui prouve qu'elle reconnaît encore la vraie faute.

---

## 7. Écarts et points laissés en suspens

- **Le banc d'essai n'a pas d'anneau, et c'est déclaré.** Il est derrière un
  geste de debug, monte ses combats à la main, et une douzaine de ses assertions
  portent des positions en pixels : lui réserver l'anneau les aurait toutes
  déplacées pour un mur que personne ne lui a demandé. `CONTOUR T8` nomme les
  deux appels et tombera le jour où on l'y met.
- **Aucun écran ne montre encore un combat où le joueur DÉFEND.**
  `sim/raid-ouvrage.js` résout ces raids sans les dessiner. Le mur du joueur est
  donc câblé côté scène, mesuré par T7, et **inatteignable en jeu** — comme
  l'auto-réparation depuis MODULES-D. Le jour où cet écran s'ouvrira, il faudra
  donner une balise aux six `bord_j_*`, et `executer` le dira en levant.
- **La perte de 17,8 % de taille de case sur un écran haut n'a pas été soumise à
  Ethan.** C'est la conséquence arithmétique de l'anneau qu'il a demandé, elle
  n'est pas réglable sans retirer le mur, et elle se lit dans le tableau du §1.
  Si le champ lui paraît trop petit, le curseur est la LARGEUR de la base, pas
  le mur.
- **`bord_o_mur_3` et `bord_o_mur_4` restent produits et non employés**, comme
  leurs jumeaux du joueur. Ils entreront d'eux-mêmes le jour où la base
  s'élargira : le pavage les prend par rang.
- **`python3 tools/verifier.py` n'était pas dû** — le lot ne touche ni `art/`,
  ni un outil de la chaîne graphique ; `tools/build.js` n'est pas dans `CHAINE`.
  Il a été lancé quand même, le lot faisant entrer de l'art au livrable, et son
  verdict dit ce qu'on attendait : **zéro octet d'`art/` n'a bougé**.
