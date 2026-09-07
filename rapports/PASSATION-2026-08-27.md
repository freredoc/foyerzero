# PASSATION — Foyer Zéro, session du 27/08/2026 (sprites)

> À lire avant tout, avec `CLAUDE.md`. Ce document dit où en est le chantier
> sprite, ce qui a bougé aujourd'hui, ce qui reste ouvert, et les pièges qui ont
> coûté quelque chose. Il ne remplace pas `CLAUDE.md` — celui-là fait autorité.
>
> ⚠ **Session entièrement graphique.** Aucun fichier de `src/`, `test/` ou
> `tools/` n'a été touché. La suite reste à 240 tests, `dist/index.html`
> inchangé, version 0.12.0 · build 12. Rien à bumper.

---

## 1. État du chantier sprite, mesuré et non cru

| | |
|---|---|
| Dépôt | `freredoc/foyerzero`, branche `main` |
| Sprites à produire | **158** (inventaire v4) |
| Validés au 27/08 au soir | **9** — 5 références + 4 tuiles de sol |
| Sessions du plan | S0 close 7/7 · S1 **à refaire** · S2 à S11 non entamées |
| Rampes arrêtées | kaki (joueur) · **ardoise** (Ouvrage) · **sol joueur** · **sol Ouvrage** |
| Dettes DA | les cinq d'origine **closes** · une sixième découverte et close |

### Les neuf sprites acquis

| Fichier | Famille | Validé |
|---|---|---|
| `art/def_j_creneau_source.png` | tourelle joueur | 26/08 |
| `art/ouvrage/ref_pylone.png` | structure Ouvrage | 27/08 |
| `art/ouvrage/ref_marcheur.png` | blindé Ouvrage | 27/08 |
| `art/ouvrage/ref_dard.png` | aéronef Ouvrage | 27/08 |
| `art/joueur/ref_meute.png` | escouade joueur | 27/08 |
| `sprites/terrain/tile_sol_j_a…d.png` | sol du joueur, 4 variantes | 27/08 |

Les cinq premiers sont des **références** — des moules à joindre aux frères,
méthode du §3 ter du brief. Les quatre derniers sont des **livrables**.

---

## 2. Ce qui a changé aujourd'hui

### 2.1 S0 — le jet d'essai, close 7 sur 7

Trois sorties acquises. **La rampe de l'Ouvrage est l'ardoise violacée**,
tranchée sur pièce contre la fonte oxydée, trois critères sur trois : sur la
fonte le jaune et le corps sont la même famille chaude et l'accent cesse de
travailler, et elle lit « rouillé donc abandonné » quand l'Ouvrage est actif.
**La forme du Dard est arrêtée** — moyeu central, modules identiques en triangle
radial, aucune aile portante. Et **cinq sprites de référence** sont au dépôt, un
par famille.

Un cinquième `def_j_creneau` a été produit et écarté : accent 33 % / métal 0,9 %
/ châssis 59 % contre 18,9 / 24,6 / 24,8 pour celui du 26/08. Socle disparu,
tube absent. **Quatrième échec de cette famille par le même mécanisme.**

### 2.2 La documentation, remise au propre

`INVENTAIRE-SPRITES.md` v4 : les sept amendements A1 à A7 cessent d'être des
amendements en attente et deviennent les conventions du §1. `FICHE-STYLE.md`
v4 : ces conventions y sont enfin **portées**, ce que la v3 de l'inventaire
promettait depuis le 26/08 — quatre sections réécrites, dont les §1.1 et §1.2
qui sont ses deux premiers principes non négociables. `BRIEF-SPRITES-IA.md`
v5 : la clause de préséance disparaît, il n'y a plus de contradiction à
arbitrer.

### 2.3 S1 — deux fois, et la seconde est la bonne

Le premier jet, huit générations de terrain, a produit des tuiles **entièrement
faites de tons d'entités** : `#928E80`, qui est l'ombre de l'accent
anti-infanterie, couvrait 100 % d'un terrain et 79 % d'un autre. L'escouade du
joueur disparaissait sur quatre terrains sur huit.

Cause : **`FICHE-STYLE.md` n'avait aucune rampe de terrain.** Le §3 en définissait
quatre, toutes des rampes d'entité ; le §9 nommait les sept terrains sous un
titre « Nommage » sans leur donner une seule couleur. Sixième dette DA,
découverte et close le jour même.

Deux rampes de sol arrêtées, toutes deux sur pièce :

```
SOL DU JOUEUR — terre cuite
#B87E64  #C38C73  #CF9A83  #D7A995  #E0B9A8

SOL DE L'OUVRAGE — cendre violacée
#9892AE  #A6A0B9  #B3AEC4  #BDB9CB  #CAC7D4
```

⚠ **Les deux sols sont CLAIRS, et c'est contre-intuitif.** Toutes les rampes
d'entité vivent entre L\* 3 et 62 ; le kaki du joueur occupe 36–48. Un sol de
cette valeur camoufle une armée sur son propre terrain, et un sol de cendre
sombre camouflerait les défenses de l'Ouvrage sur sa propre base. **Le sol passe
au-dessus des entités en clarté, des deux côtés, sans exception.** Les deux
rampes ont la même bande de clarté et ne diffèrent que par la teinte et le
grain.

Conséquence à ne pas rouvrir : les deux lisent *sable rosé* et *cendre pâle*, pas
*terre rouge* ni *cendre noire*. Au-dessus de L\* 60 le sRGB ne permet plus la
saturation d'une référence sombre. C'est le prix de la lisibilité.

### 2.4 Le sol du joueur, produit et mesuré

La planche **56570** passe tous les contrôles, mesurés sur ses 4 194 304 pixels :
2048 × 2048 exact, **cinq couleurs et zéro hors palette**, `#CF9A83` à **96,4 %**,
**zéro pixel hors ton sur l'anneau de bord des quatre quadrants**, toutes les
transitions sur un multiple de 32, quatre variantes distinctes.

Découpée en quatre tuiles de 128 et posée sur 9 × 18 cases avec rotation
aléatoire : **aucune couture.** C'est la première fois qu'un lot de terrain passe
ce test.

Ce qui l'a permis est une seule contrainte, absente du premier jet :
**l'anneau extérieur de 2 gros pixels est entièrement du ton de sol nu**, ce qui
fait que deux tuiles quelconques se rejoignent toujours sur une bande unie.

La planche 56571, produite en parallèle, est à jeter : 1254 × 1254 au lieu de
2048 — donc une cellule de 627 px, non multiple de 32, et une grille de gros
pixels impossible — 4 545 couleurs, et l'anneau dessiné comme une **bordure
décorative visible** au lieu d'être uniforme.

---

## 3. POST SCRIPTUM — le malentendu carte / base

**Ce point mérite d'être lu en entier.** Une bonne moitié de la session a été
dépensée à produire du décor pour un écran qui n'existe pas encore, et la cause
est une seule phrase de documentation.

### 3.1 Ce qui a été construit à tort

Pendant plusieurs heures, le lot 1 a été traité comme **le terrain de la carte du
monde** : sept terrains, quatre variantes chacun, vingt-neuf fichiers, plus huit
masques de transition. Tout a été livré — les 29 tuiles, la doctrine « un seul
sol, sept matières », un rapport, et S1 cochée close dans le plan de production.

Le besoin réel était **le sol du champ de bataille**, qui est autre chose :

| | Champ de bataille | Carte du monde |
|---|---|---|
| Source | `GRILLE` de `src/data/combat.js` | `GEOGRAPHIE.carte` de `src/data/sites.js` |
| Dimensions | **9 × 18 = 162 cases** | 30 × 300 = 9 000 cases |
| Types de terrain | **deux** : sol nu, ou champ de ressource | sept |
| Zoom | **~45 px par case**, toujours | 17 à 68 px |
| Éléments posés | 12 champs + 10 obstacles | à définir |

`champs.js` réglait la question à lui seul : `ressourceDeLaCase` rend la
ressource **ou `null` si la case est nue**. Une base n'a que deux états de
terrain. La ligne était au dépôt depuis le début.

### 3.2 D'où vient l'erreur

**Une phrase de `INVENTAIRE-SPRITES.md` §2**, écrite le 26/08 et jamais
vérifiée :

> « la carte du monde et le sol du champ de bataille lisent les **mêmes
> fichiers**. Un site posé sur de la croûte se combat sur de la croûte. »

Elle est à moitié vraie, et c'est ce qui la rend dangereuse. Le lien de **type**
existe bien — un site posé sur de la croûte aura plus de champs de scorie. Le
lien de **fichier** n'existe pas : les deux vues n'ont ni la même échelle, ni le
même nombre de types, ni le même zoom, ni le même besoin de transitions.

De cette phrase découlent trois erreurs enchaînées, toutes miennes :

1. **Sept terrains ont été spécifiés pour un écran qui n'en a que deux.** La
   futaie, la friche, le suintement et la vasière n'apparaissent jamais au
   combat.
2. **Les huit masques de transition ont été traités comme un problème.** Ils
   n'existent que parce qu'il y a plusieurs terrains adjacents. Sur un sol
   unique, il n'y a rien à raccorder — le sous-problème s'évapore.
3. **Les contraintes ont été calculées sur la mauvaise surface.** J'ai écrit que
   « le sol est le sprite le plus dangereux du projet, neuf mille cases », et
   fait des tests de lisibilité à 17 px. Le champ de bataille fait 162 cases et
   ne descend jamais sous 45 px. Le budget de détail était confortable, je l'ai
   traité comme s'il était nul.

### 3.3 Ce qui a fini par le révéler

**La composition, et Ethan l'a demandée — je ne l'ai pas proposée.** Les planches
isolées, terrain par terrain, montraient sept textures qui se distinguaient bien.
La scène assemblée a montré en dix secondes ce qu'aucune planche ne montrait :
la scorie avalait entièrement les défenses de l'Ouvrage, le hors-couloir était
invisible, et les raccords entre terrains étaient des escaliers.

Il a fallu deux corrections d'Ethan après la composition pour que le malentendu
soit nommé, parce que j'ai d'abord répondu en changeant l'architecture de la
carte du monde au lieu d'entendre qu'il ne parlait pas de la carte du monde.

### 3.4 La bonne architecture, pour mémoire

Elle vient d'Ethan, et elle est reprise d'Archipel Industry — les gisements de
mine posés sur les tuiles d'île.

**Un sol quasi uni sur les 162 cases, et par-dessus des sprites plus petits qui
disent ce qu'il y a.** Deux sols, un par camp. Les éléments posés sont neutres et
communs aux deux : un quartz est un quartz.

| Bande de `GRILLE` | Rangées | Contenu |
|---|---|---|
| Déploiement | 1–2 | sol nu |
| Défense | 3–10 | sol nu + **10 obstacles** dispersés, 3 types |
| Bâtiments | 11–18 | sol nu + **12 champs** de ressource, blocs de 1 à 3 |

Ce que ça règle : la densité cesse d'être cuite dans l'image et devient un
paramètre de pose ; un élément a un contour et se détache au lieu d'être une zone
de bruit ; et il n'y a plus rien à raccorder.

### 3.5 Trois règles à en tirer

1. **Avant un lot, mesurer la surface qu'il couvre** — combien de cases, à quel
   zoom, vues comment. Deux minutes de `grep` dans `src/data/`. Elles n'ont pas
   été faites, et tout le reste en découle.
2. **Une phrase de documentation qui couple deux systèmes est une hypothèse, pas
   un fait.** « Les mêmes fichiers », « la même échelle », « le même format » :
   ces phrases se vérifient contre le code avant de servir de prémisse.
3. **La composition passe AVANT la validation d'un lot, jamais après.** Une
   planche isolée montre un sprite ; seule la scène assemblée montre le jeu.
   Elle devient un contrôle obligatoire du §6 du brief.

### 3.6 ⚠ Conséquence immédiate sur les livraisons

**Le zip `foyerzero-S0-S1.zip` contient les 29 tuiles de terrain périmées, dans
`sprites/terrain/`. NE PAS LES COMMITER.** Elles décrivent la carte du monde,
elles ne servent pas le champ de bataille, et elles seront refaites autrement le
jour où la carte sera traitée.

Tout le reste de ce zip est valable : les documents, les rapports, les cinq
références. Le seul dossier à écarter est `sprites/terrain/`, à remplacer par les
quatre `tile_sol_j_*.png` de la présente livraison.

---

## 4. Ce qui a coûté quelque chose — à ne pas réapprendre

### 4.1 J'ai affirmé trois choses fausses, toutes par la même faute

Elles sont listées parce que le mécanisme est identique dans les trois cas : une
conclusion tirée d'un échantillon trop petit ou d'un outil mal lu.

- **« Les fourchettes de matières ne transfèrent pas à l'Ouvrage. »** Déduite de
  deux sprites à 59 % et 73 % de châssis. Le troisième — le Dard — tombe au
  milieu des trois fourchettes. Ce n'étaient pas les bornes qui étaient
  mauvaises, c'étaient ces deux références-là qui en sortent. **Un seuil ne se
  déduit pas de deux mesures** — exactement le §4.4 de la passation du 26/08,
  répété à un jour d'intervalle.
- **« Le métal du pylône est à 4 %. »** C'était l'application littérale du
  tableau de familles du conditionneur, qui ne compte `#1E2124` dans aucune
  famille. En le comptant, le métal est à **16,8 %, dans la fourchette**. L'outil
  avait un trou, pas le sprite.
- **« Neuf mille cases, le sol est le sprite le plus dangereux du projet. »**
  Mauvaise surface, voir le §3.

### 4.2 La méthode qui a marché : comparer deux versions du MÊME fichier

Le brief demandait, pour arbitrer deux rampes, quatre générations séparées
« sinon le modèle les harmonise ». Ce qui a effectivement tranché : **deux
générations, et la seconde rampe obtenue par substitution ton pour ton** —
vérifié à 0 pixel d'écart hors rampe, alpha identique.

C'est meilleur que de générer les deux. Une seconde génération apporte du bruit
de silhouette qui se confond avec l'effet de la rampe, et c'est précisément ce
qu'on cherche à isoler. Le §6 du brief est corrigé en ce sens.

Corollaire : **32 tuiles de terrain ont été récupérées sans régénérer**, par la
même substitution, une fois la rampe de sol arrêtée. Le premier jet était juste
de géométrie et faux de couleur.

### 4.3 Une contrainte de bord vaut mieux qu'une consigne de raccord

Le premier jet de terrain tuilait mal. Le second est sans couture, et la
différence tient à une seule phrase : **l'anneau extérieur de 2 gros pixels est
entièrement du ton de sol nu.** Deux tuiles quelconques se rejoignent alors
toujours sur une bande unie, dans n'importe quel sens de rotation.

C'est vérifiable par machine en une seconde, là où « fais en sorte que ça tuile »
ne l'est pas. **Une contrainte qui se mesure vaut mieux qu'une intention.**

⚠ Mais elle se formule mal. Sur 56571, « l'anneau est peint en `#CF9A83` » a été
compris comme *trace un cadre* : le modèle a dessiné quatre bordures décoratives
visibles. À reformuler : **« l'anneau doit être invisible parce qu'il est de la
même couleur que le sol »**.

### 4.4 Le conditionneur employé était périmé, et il ment sur deux points

`CONTROLE.txt` du premier jet ne portait pas la ligne de répartition des
matières, ajoutée le 26/08. **Retélécharger `tools/conditionneur.html` depuis
`main` avant chaque session.**

Deux défauts de l'outil, à corriger par brief Claude Code puisqu'il touche au
DOM :

- une alerte hors fourchette (`t === "al"`) s'imprime quand même **`OK`** en tête
  de ligne, le préfixe ne testant que `"ko"` ;
- `#1E2124` et les deux tons de contour ne sont dans **aucune** famille — 14,6 %
  de la surface d'un sprite comptée nulle part ;
- et il n'a pas de palette *Sol*, ni de fourchettes de terrain.

### 4.5 Une famille de sprites ne se régénère pas, elle se décline

`def_j_creneau` en est à **cinq jets pour un succès**, et les quatre échecs sont
le même mécanisme : un prompt coté ou corrigé fait manger le socle par l'accent.
Le sprite validé du 26/08 reste la référence, et `casemate` et `batterie` se
produiront en **joignant son PNG 1024 comme moule**, méthode du §3 ter — la seule
qui n'ait pas encore été essayée sur cette famille, et celle qui a marché partout
ailleurs.

---

## 5. Ce qui reste ouvert

### 5.1 Le lot en cours — sol de base et éléments posés

Cinq planches, dix-huit fichiers. `PROMPTS-sol-de-base.md` contient les prompts
prêts à coller.

| Planche | Contenu | État |
|---|---|---|
| 1 | sol du joueur, 4 variantes | **fait** (56570) |
| 2 | sol de l'Ouvrage, 4 variantes | à générer |
| 3 | champs de quartz et de scorie, 4 fichiers | à générer |
| 4 | obstacles fourré sec et nappe de pétrole, 4 fichiers | à générer |
| 5 | obstacle chaos rocheux, 2 fichiers | à générer |

Attribution matière → type d'obstacle, tranchée faute d'instruction et défaisable
en une ligne : `infanterie` → fourré sec, `vehicule` → nappe de pétrole,
`les_deux` → chaos rocheux. Le raisonnement : ce qui empêtre un homme laisse
passer une chenille, ce qui fait patiner une chenille se contourne à pied, ce qui
est haut et dur arrête les deux.

### 5.2 Les documents à corriger une fois le lot fini

`INVENTAIRE-SPRITES.md` §2 est **faux en l'état** : il décrit 29 tuiles pour sept
terrains de carte du monde. Il faut le scinder en deux lots — sol de base, et
carte du monde — et retirer la phrase des « mêmes fichiers ». Le total de 158
sprites bougera.

`PLAN-PRODUCTION-SPRITES.md` a S1 cochée close sur le mauvais lot. À rouvrir.

### 5.3 Les autres points ouverts

1. **Les 1024 sources des trois références Ouvrage** ne sont pas au dépôt. Le
   §3 ter en a besoin comme moule ; seuls les 128 conditionnés y sont.
2. **`bat_o_foyer_zero.png`** reste reporté, sans urgence.
3. **Trois défauts du conditionneur** (§4.4), par brief Claude Code.
4. **La carte du monde** aura son propre jeu de sprites, plus complexe. Non
   urgent, hors sujet de cette session, et à ne surtout pas mélanger avec le sol
   de base.
5. **`tile_horschamp`** n'a pas de traitement : il doit dire « on ne va pas là »,
   et un aplat de ton de sol ne le dit pas.

### 5.4 Ce qui a été CLOS aujourd'hui — ne plus le lister

- Les cinq dettes DA d'origine, plus la sixième découverte aujourd'hui.
- La rampe de l'Ouvrage, la forme du Dard.
- Les deux rampes de sol.
- Le report de A1 à A7 dans `FICHE-STYLE.md`.
- La destination des sprites finis : `sprites/`, un sous-dossier par lot ;
  `art/` reste aux références.

---

## 6. Livrables de cette session

| Livrable | Statut |
|---|---|
| `foyerzero-S0-et-doc-au-propre.zip` | remplacé |
| `foyerzero-S0-S1.zip` | ⚠ **`sprites/terrain/` à écarter**, le reste valable |
| `PROMPTS-sol-de-base.md` | à jour, 5 planches |
| `sprites/terrain/tile_sol_j_a…d.png` | **validé, à commiter** |
| `RAPPORT-S0-rampe-ouvrage.md` | valable |
| `RAPPORT-S1-terrain.md` | ⚠ décrit le mauvais lot, à réécrire |

⚠ **Ethan travaille sur téléphone.** Un zip s'extrait puis se téléverse dossier
par dossier ; GitHub ne décompresse pas. Les PNG doivent partir depuis leur
dossier extrait, jamais depuis la racine.
