# RAPPORT — lot RETOURS-DU-31

**Livré : `0.57.0` · build `58`.** `npm run check` → **764 pass / 0 fail**,
`dist/index.html` **1 274 380 octets** (+9 869, aucun atlas entré), marge sous la
borne T10 **25 620 octets, 1,97 %**. `SAVE_VERSION` passe à **15**.
`python3 tools/verifier.py` → **1 418 identiques · 2 différents (les deux
déclarés) · 0 nouveau · 0 MANQUANT**, verdict VERT, 118 s.

Douze retours d'Ethan, traités en un lot. **Onze sont livrés, un est arrêté à
mi-chemin et ce rapport dit exactement où.**

---

## 0. État de départ, mesuré avant de toucher à quoi que ce soit

`npm ci && npm run check` → **731 pass / 0 fail**, `dist/index.html`
**1 264 511 octets**. Conforme à la §0 de `CLAUDE.md`. La base était VERTE.

---

## 1. La carte n'affichait AUCUN emblème — le défaut le plus grave

> « Pas de base sur la carte, peut être emblème sont buggés. »

Il avait raison, et la cause est exactement celle qu'il soupçonnait.

`ui/monde.js` faisait :

```js
const cellule = celluleDuSprite(FAMILLE, spriteDuSite(…));
ctx.drawImage(emblemes, cellule.x, cellule.y, cellule.cote, cellule.cote, …);
```

`celluleDuSprite` rend `{ colonne, rangee, colonnes, rangees }` — des **indices
de cellule**, jamais des pixels. `cellule.x`, `.y` et `.cote` valaient donc
`undefined`, et `drawImage` avec un rectangle source non fini **ne dessine rien
et ne lève pas**. La carte s'ouvrait avec son fond, et sans une seule base de
l'Ouvrage, sans camp, sans même la base du joueur.

**Mesuré dans Chromium avant correction**, en instrumentant `drawImage` :
**88 appels à neuf arguments, 88 rectangles sources non finis.** Après :
88 appels, 0 non fini.

### Ce qui a été fait, et pourquoi pas une ligne corrigée sur place

La géométrie est descendue dans `render/embleme.js`
(`dessinerEmblemeDUneCase`), qui est PUR. L'en-tête de ce module promet depuis
le lot CARTE-EMBLÈMES qu'il rend « des NOMS de sprite et une géométrie », et
`dessinerGrosseBase` le fait déjà : l'emblème d'une case était le seul à faire
son calcul dans l'écran, donc **le seul qu'aucun test ne pouvait atteindre**.

Deux gardes, toutes deux falsifiées :

| Garde | Ce qu'elle tient | Falsification |
|---|---|---|
| `emblème — la primitive rend un rectangle source FINI` | six nombres finis sur les 36 couples (type × palier), rectangle dans l'atlas, destination entière | primitive remise sur `cellule.x` → tombe |
| `emblème — l'écran ne recalcule plus la cellule` | `monde.js` ne nomme plus `celluleDuSprite` ni `cellule.x/y/cote` | ancien code remis dans l'écran → tombe |

La seconde lit la source **décommentée** : le commentaire qui raconte le défaut
nomme `celluleDuSprite`, et une garde qui lit ce qu'on a écrit à son sujet ne
garde rien — c'est la leçon de `viewport-fit=cover` et de `MENTION_SATURE`.

---

## 2. Le compteur de points d'armée dans le bouton Améliorer

> « Dans le menu offense, il y a le compteur armé dans le bouton améliorer. »

`peindreContexte` écrivait `engagés/budget` dans l'`<em>` du bouton Améliorer.
**Reproduit dans Chromium** avec un Centre de commandement posé : le bouton
affichait « Améliorer 0/25 ».

C'est la grandeur du BANDEAU, affichée une seconde fois, dans un bouton dont le
libellé ne la nomme pas. La règle du Chantier existait déjà et n'avait pas été
appliquée ici : cet `<em>` dit ce que l'amélioration VISE, et **il ne s'écrit que
là où améliorer a un moteur**. `ACTIONS_ARMEE.ameliorer.agir` vaut `null` : il
reste vide.

⚠ **La grandeur n'est pas perdue** — un second test le prouve : le bandeau du
haut la porte dans les trois contextes depuis le 28/08. Sans cette moitié-là,
« ne plus l'afficher » aurait été une réponse valable, et elle aurait retiré une
information de jeu.

---

## 3. Le fantôme de pose montrait un carré

> « Lorsque le bâtiment est grisé avant de le poser, le jeu affiche encore un
> carré au lieu du sprite. »

Le fantôme était un `div` à fond plein portant trois lettres. C'était juste au
28/08, quand la grille ne dessinait AUCUN sprite ; depuis le lot
PREMIÈRE-COUCHE, la case voisine montre le vrai bâtiment, et le fantôme était
devenu **le dernier carré de l'écran**.

Il porte désormais le sprite, par `terrain.spriteDe` — le même point d'entrée
que la case et que la vignette de palette, jamais un troisième calcul. Le sigle
ne sort pas du jeu : il passe dans le `title`, comme la lettre de l'obstacle et
le cadre de famille du jeton avant lui.

⚠ **Le fond n'est pas rendu translucide, il est RETIRÉ.** La palette est fermée
à trente-trois teintes et ne tolère qu'un seul `rgba` ; un aplat semi-transparent
aurait ouvert une brèche dans la garde de palette. Le liseré tireté reste — c'est
lui qui dit « pas encore là ».

⚠ **Sa taille est celle du jeton, variables CSS comprises**, et un test compare
les deux : un fantôme à 84 % sous un jeton à 84 % × 1,2 ferait grandir le
bâtiment au moment où on le pose.

---

## 4. Le zoom de la base — deux défauts, dont un trouvé en mesurant l'autre

> « Le zoom de la base est chelou, très lent. »

Ce n'était **pas la vitesse** : le facteur est le rapport des écarts, donc la
main donne exactement sa proportion. C'était la **plage**. Mesuré sur 360 px CSS :
plancher 40 px par case, plafond 64. **1,6 fois en tout.** Depuis l'ouverture à
46, écarter les doigts de 39 % suffisait à buter en haut et les resserrer de
13 % à buter en bas ; tout le reste du geste ne faisait plus rien.

Le plafond passe à un **multiple ENTIER** de la définition des sprites
(`COTE_SPRITE × 2 = 128`), ce qui garde le pixel art net sous
`image-rendering: pixelated`. Plage mesurée après : **40 → 128, soit 3,2 fois.**

### Le second défaut, que la mesure a mis au jour

`reglerCoteCase` n'était appelée qu'AU CÂBLAGE, quand `#chantier-defile` n'a pas
encore de boîte : `clientWidth` vaut zéro, `coteQuiTient()` retombe sur son
repli, et rien ne remesure ensuite. **La grille restait à 46 px par case : 9 × 46
= 414 px dans 360, deux colonnes hors de l'écran, et un défilement horizontal AU
REPOS** — ce que la consigne « tu compresses tout dans l'ui » refuse.

Mesuré dans Chromium, avant → après : **414 px → 360 px, `scrollWidth >
clientWidth` passe de vrai à faux.**

Un `ResizeObserver` sur le champ remesure. Et un drapeau départage les deux
règles qui se contredisaient : tant que le joueur n'a pas pincé, la grille suit
la largeur ; dès qu'il a pincé, on rejoue SON côté — un zoom effacé par une
rotation d'écran serait pire que pas de zoom.

⚠ **Un test existant est tombé, et il avait raison** : le repli de
`coteCaseParDefaut` valait `COTE_CASE_MAX`, ce qui était vrai tant que le plafond
égalait la définition d'un sprite. Depuis qu'il vaut le double, retomber sur le
plafond ferait s'OUVRIR la base au zoom maximal — trois colonnes visibles sur
neuf. Le repli est redevenu `COTE_SPRITE`, explicitement.

---

## 5. On ne passe plus librement de la base à la défense

> « On ne doit plus passer librement de la base joueur a la def joueur. On
> rajoute un bouton avec une flèche en bas à droite. »

Le gestionnaire de défilement lisait la ligne en tête et changeait
`bandeCourante` : la palette se reconstruisait au milieu d'un geste, et on
arrivait en défense sans l'avoir demandé.

Le défilement RESTE — au zoom, une bande de huit rangées ne tient plus dans le
champ — mais il est **borné à la bande courante** (`bornesDeDefilement`, pure et
testée). Un bouton de 40 px en bas à droite bascule, et **son glyphe se déduit
des lignes d'écran** (`basculeDeBande`) : le graver en dur serait juste
aujourd'hui et faux le jour où la grille changerait de sens, ce qui est **déjà
arrivé une fois**, le 27/08.

⚠ **Les deux rangées de déploiement restent atteignables**, et c'est délibéré :
la borne basse d'une bande est le haut de la suivante **navigable**, pas de la
suivante tout court. Les enfermer sous la défense les aurait retirées du jeu.

⚠ **Un défaut de mise en page trouvé et corrigé en route** : l'enveloppe
`#chantier-vue` qui porte le bouton doit être une COLONNE FLEX. Sous un parent
en `block`, le `flex: 1; min-height: 0` de `#chantier-defile` ne s'applique pas
et il prend la hauteur de son CONTENU — mesuré : `clientHeight` et
`scrollHeight` valaient 720 tous les deux, la grille entière s'affichait, et les
bornes de bande n'avaient plus rien à borner.

---

## 6. Revenir sur sa base depuis la carte

> « Toujours une possibilité de revenir sur sa base quand on se balade sur la
> carte. »

La vue ne se recentre qu'à la PREMIÈRE ouverture, et **ça reste vrai** : revenir
de force à chaque visite ferait perdre l'endroit qu'on regardait. Le corollaire
était qu'un joueur parti loin n'avait aucune porte de sortie sur 300 rangées.

Un bouton « Ma base » se POSE sur la carte, dans la boîte d'outils déjà en
`absolute` : le chrome fixe reste à 288 px et sa garde ne bouge pas. Il recentre
et ferme le panneau, **il ne touche pas au cran de zoom** — ramener aussi le
zoom ferait deux gestes en un.

---

## 7. « Les pixel/case du haut »

> « Enlever les pixel/case du haut. » puis, capture à l'appui : « en haut à
> droite ».

C'était l'indicateur **`11 PX / CASE`** posé sur le coin de la carte. Retiré.

⚠ **Il ne sort pas du jeu**, il passe dans le `title` de la boîte d'outils —
comme la lettre de l'obstacle et le cadre de famille du jeton. Ethan demande un
DESSIN en moins, pas une donnée.

⚠ **La garde qui EXIGEAIT sa présence a été RETOURNÉE**, pas supprimée : c'est
son retour qu'on refuse désormais, exactement comme pour les deux boutons de
zoom retirés le 30/08. Et un second test exige que la valeur survive dans le
`title`, sans quoi « retirer » se confondrait avec « supprimer ».

---

## 8. Les deux bouts du couloir — un arbitrage qui a demandé deux tours

> « Decaler la base du joueur de 25 cases vers le base et base terminale 25
> cases vers le haut. »

**Le décalage littéral était impossible, et c'est mesuré :** la base terminale se
dessine en hexagone 3 × 3 depuis le 30/08 ; en rangée 1,
`empriseDeLaGrosseBase` LÈVE, et une levée dans la boucle de dessin viderait
tout l'écran Monde — le défaut du §1, sous une autre forme.

Premier tour de question. Réponse : « rangée 5 pour joueur, rangée 285
terminale ». **Appliqués tels quels au code, ces nombres retournent la courbe de
difficulté** : dans le dépôt la rangée 1 est le bord HAUT et le niveau monte en
s'éloignant du bord bas, si bien que la rangée 5 vaut le niveau **50** et la 285
le niveau **3**. Le joueur aurait démarré au contact de sites de niveau 50.

Second tour, avec la mesure. Réponse : **« comptés depuis mon bord : 295 et
15 ».** C'est ce qui est écrit.

| | avant | après |
|---|---|---|
| départ du joueur | rangée 275, strate 5 | **rangée 295, strate 1** |
| base terminale | rangée 26 | **rangée 15** |
| longueur du couloir | 249 cases | **280 cases** |

⚠ **La strate n'a pas été choisie, elle SUIT** — `round(5 × 0,2)` plafonné à 1.
Écrire 5 ferait mentir la table sur ce que le joueur trouve autour de lui : les
avant-postes du début sont désormais de niveau 1 (ils sont indexés sur la
RANGÉE), les camps restent indexés sur le niveau du joueur.

### Cinq tests sont tombés, et aucun ne mesurait une position

C'est le point le plus instructif du lot.

| Test | Ce qu'il écrivait en dur | Ce qu'il voulait vraiment |
|---|---|---|
| `flèches — le trait et le glyphe` ×2 | `champsDeLaBase(275, 16)` | le terrain de DÉPART, servi par `TERRAIN_INITIAL` |
| `disposition` (voisinage) | idem | idem |
| `site-entamé` (14 tests) | `siteDeLaCase(etat, 274, 11)` | l'avant-poste que la partie a fait paraître |
| `armée — une unité détruite plancher à 1 PV` | rien — la létalité tenait au dessin de la case | un camp qui TUE |

Les cinq **demandent** maintenant ce dont ils ont besoin. Le dernier a été rendu
lethal par la règle du jeu plutôt que par la chance : un camp est indexé sur le
niveau du JOUEUR, donc des bâtiments au niveau 12 contre une armée au niveau 1
font une défense qui tue, où que la case tombe.

Deux autres ont été recalés, et **l'un est devenu plus vrai qu'avant** : la part
de sol d'Ouvrage au départ vaut désormais **exactement zéro** là où l'ancienne
assertion exigeait « un peu plus que zéro ». Le titre du test — « rien au
départ » — n'a jamais été aussi littéral.

---

## 9. Les territoires sur la carte

> « Afficher les territoires sur la carte. Cf screenshots, seuls les bordures
> sont dessinés. »

**Aucun arbitrage n'a été demandé, et il n'aurait pas fallu en demander** : la
règle était dans le dépôt depuis le début. `SPEC-FOYER-ZERO.md` §10 porte « zone
d'influence joueur : rayon 2, fixe » et « ennemie : rayon 3 » ; sa §8 précise que
« le territoire allié est l'union des zones d'influence de toutes les bases du
joueur ». `GEOGRAPHIE` les transcrit et `sim/points-attaque.js` lit déjà le
premier.

`sim/territoire.js` en tire une carte d'occupation, `ui/monde.js` trace les côtés
exposés — **aucun remplissage** : mesuré, l'Ouvrage tient **100 % des rangées
au-dessus de la garde de départ**, et un aplat noierait l'écran. Ce qu'on voit
est la frontière du no man's land autour du joueur, et le carré de son propre
territoire.

### Deux gardes sont passées sur du code cassé, et ont été resserrées

C'est le passage où ce lot a failli livrer du faux.

1. **L'indépendance à la fenêtre.** Le premier montage comparait un rayon 3
   autour du joueur à un rayon 12 : le carré 5 × 5 tient entier dans le premier
   avec une case de marge, donc aucune bordure ne touchait le bord de la vue, et
   **retirer l'anneau de contexte laissait les dix assertions VERTES**. Le
   montage regarde maintenant un rayon 1, au cœur du territoire, et exige ZÉRO
   bordure.
2. **La priorité du joueur.** Elle tenait à l'ORDRE des deux boucles — l'Ouvrage
   peint d'abord, le joueur par-dessus — et **on pouvait retirer le garde-fou
   sans qu'un test tombe**. Le joueur est peint EN PREMIER désormais, et c'est le
   refus d'écraser qui décide.

Les trois falsifications (anneau retiré, garde-fou retiré, rayon euclidien) font
maintenant tomber respectivement 1, 1 et 3 tests.

⚠ **Deux LECTURES, pas des arbitrages, et le code les nomme** : le joueur
l'emporte sur le recouvrement, et seules les BASES de l'Ouvrage projettent son
influence. Chacune tient en une ligne.

⚠ **Les sprites de limite fournis n'ont PAS été employés**, et c'est mesuré :
leur module `trait` porte son trait au MILIEU de la tuile (`y = 448..575` sur
1024) tandis que `carré` porte les siens sur les BORDS. Les deux ne partagent
pas un même quadrillage, et deviner l'assemblage aurait produit une carte
visiblement fausse. Le screenshot de référence qu'Ethan a joint montre de toute
façon des **traits**, pas des tuiles décorées.

---

## 10. La vérification de mise à jour

> « Auto update pour foyer zero. Bouton vérifier maj dans option. »

**L'auto-update existait déjà** — `MiseAJour.verifierEnArrierePlan` part à chaque
lancement. Ce qui manquait, c'est qu'il était **entièrement muet** : cinq chemins
d'abandon rendaient tous `Unit` sans rien dire, si bien que « pas de réseau » et
« déjà à jour » se ressemblaient exactement, c'est-à-dire à rien.

Un bouton doit répondre : il fallait donc d'abord une réponse.

### Le pont, et la ligne qu'il retourne

`MainActivity` disait « aucune interface JS native : chaque pont serait une
surface d'attaque ». **La page ne peut pas faire cette vérification seule** :
`tools/build.js` refuse tout `https?://` dans le HTML produit, et `CLAUDE.md` §6
interdit d'assembler l'adresse à l'exécution pour passer sous la garde.

Un pont est donc ouvert, et la raison est écrite sur place. Ce qui le rend
acceptable tient en quatre lignes, **qui doivent rester vraies** :

- la WebView ne charge que le HTML autonome, fourni en mémoire ;
- toute navigation et toute sous-requête sont refusées ;
- les **deux** méthodes exposées ne prennent **aucun argument** — rien venu de la
  page ne traverse le pont ;
- elles ne rendent qu'une phrase et un entier, jamais une adresse.

⚠ **La décision et la formulation vivent dans `:maj`, pas dans `:app`.** Sans SDK
Android, `settings.gradle.kts` EXCLUT `:app` : ce qui vit là-bas n'est compilé ni
ici ni par la CI. `EtatMiseAJour` est testé en JVM — **7 tests, exécutés
réellement** (`gradle -p android :maj:test` → 29 tests, BUILD SUCCESSFUL).

⚠ **Un refus « retour en arrière » n'est pas une panne**, c'est le cas NORMAL
quand on est déjà à jour : le manifeste annonce le build qu'on a déjà et la
politique anti-retour le rejette. Le compter comme un échec ferait dire
« erreur » à une vérification réussie.

⚠ **Hors de l'enveloppe, la ligne dit pourquoi** plutôt que de laisser un bouton
mort : « dans un navigateur, rechargez la page ». Vérifié dans Chromium, avec et
sans pont simulé.

---

## 11. La relève des satellites

> « Vérifier que les camps et avant-poste change de spawn aléatoirement si
> personne ne les attaque ; un camp avant-poste attaqué lui par contre reste plus
> longtemps je dirais quelques heures de plus avant d'être respawn. »

**La vérification demandée a pour réponse NON.** Avant ce lot, un satellite posé
ne bougeait JAMAIS : `planifierSatellites` les programmait, `resoudreSatellites`
les posait, et plus rien ne les touchait. Seule une destruction en raid les
faisait reparaître ailleurs.

Écrit : six heures de vie, quatre heures de sursis quand il est attaqué, comptées
**depuis le raid**. ⚠ **Les deux durées sont un CHOIX, pas une mesure** — Ethan a
donné le sens (« quelques heures de plus ») et pas les nombres. Elles vivent dans
`SATELLITES` et se changent d'une ligne.

### Ce que ça a coûté au moteur

`resoudreSatellites` **boucle maintenant par ÉVÈNEMENT**, et c'est le jour que
son propre en-tête annonçait : « elle ne peut RIEN faire qui dépende de l'instant
précis d'une apparition — le jour où ce sera nécessaire, cette équivalence
tombe ». La relève en dépend. L'équivalence des deux chemins d'avancement n'est
donc plus gratuite, elle est **construite**, et un test la mesure sur un horizon
qui couvre trois relèves complètes.

⚠ **Elle avance par évènement, jamais par tick, et c'est ce qui la rend
payable.** Mesuré : une pose d'avant-poste coûte **13,3 µs**, donc dix ans
d'absence — 14 600 relèves de trois satellites — coûtent **581 ms**, une fois, au
chargement. Un mois en coûte 7.

⚠ **L'échéance se compte depuis le TICK DE LA POSE**, jamais depuis
`etat.horloge.nbTicks` : les deux coïncident tick par tick et divergent au
rattrapage. La falsification qui remet l'horloge courante fait tomber 3 tests.

⚠ **Une attente qu'on ne peut pas satisfaire SORT de la boucle**, elle ne se
reprogramme pas — un anneau plein est un état du monde, pas un délai. Mais elle
doit quitter `attentes` pendant la boucle, sinon la même échéance déjà passée
serait reprise indéfiniment.

`SAVE_VERSION` 14 → 15. La migration compte depuis MAINTENANT, pas depuis la
pose : la sauvegarde ne dit pas quand chaque satellite a été posé, et l'inventer
serait fabriquer un passé. Personne ne voit ses camps disparaître en ouvrant sa
partie.

---

## 12. Les murs de contour — **arrêté à mi-chemin, et voici où**

> « Les murs contour ne sont pas là. »

**Découverte en cours de route : les quatre planches étaient au dépôt depuis le
lot BORDS-DE-BASE, et aucun outil ne les lisait.** Ce qui manquait n'était pas
l'art, c'était le producteur.

### Ce qui est livré

`tools/bords.py` — le douzième producteur de la chaîne. 16 sprites par grille,
**48 fichiers**, et le vérificateur les reproduit à l'octet (`0 MANQUANT`).
L'outil est entré dans `CHAINE` de `tools/verifier.py` : sans cette ligne, les 48
fichiers seraient comptés MANQUANTS à chaque exécution, c'est-à-dire « le dépôt
les porte, aucun outil ne les produit » — le contraire de la vérité.

### Ce qui n'est PAS livré, et pourquoi

Le dessin. La raison est une géométrie que je ne peux pas trancher seul, et elle
est mesurée :

- le trait d'un mur occupe **`y = 448..575` sur 1024**, c'est-à-dire le **MILIEU**
  de sa cellule ; l'angle est au centre exact ;
- une tuile posée sur une case dessinerait donc son mur **au milieu de la case** ;
- pour que le mur tombe sur la ligne qui BORDE la base, la tuile doit être posée
  **à cheval** sur cette ligne, donc déborder d'une demi-case ;
- ce qui demande de donner à `#chantier-grille` une marge d'une demi-case, donc
  de toucher `coteQuiTient`, `hauteurRangee` et les bornes de
  `bornesDeDefilement` — **c'est-à-dire exactement le code que les §4 et §5 de ce
  rapport viennent de corriger et de vérifier au navigateur.**

Les faire dans le même lot aurait risqué le correctif qu'Ethan peut voir, pour
une décoration. **L'autre placement possible** — le mur sur l'anneau extérieur de
cases, son trait passant par le centre des rangées 11 et 18 et des colonnes 1
et 9 — ne demande aucune marge, mais fait courir le mur **au travers** des cases
constructibles du pourtour.

⚠ **Aucun atlas ne coud `bord/`, et c'est la règle** : `tools/atlas.py` dit
qu'une famille entre « quand le lot qui consomme la famille arrive, jamais
avant », chaque famille cousue étant un `data:` payé par tous les joueurs.
L'atlas mesuré pèserait **4 473 octets en base64** — c'est peu, mais la marge est
à 1,97 %.

⚠ **Le conditionnement, lui, est fait et regardable.** Les seize sprites sortent
kaki pour le joueur et ardoise pour l'Ouvrage, avec des accents rouges venus du
quantificateur générique sur les bruns de la planche. **C'est le second point à
arbitrer** : la palette du dépôt n'a pas de brun, et choisir quelle rampe porte
un mur est une décision de style, dont `FICHE-STYLE.md` fait autorité.

---

## Ce qui reste ouvert

1. **Le dessin des murs de contour** — deux placements possibles, décrits
   ci-dessus, et la palette des seize sprites à confirmer.
2. **Les sprites de limite de territoire** — leur assemblage est ambigu (`trait`
   au milieu de sa tuile, `carré` sur ses bords). Le modèle et le tracé sont
   livrés ; les tuiles décorées attendent de savoir sur quel quadrillage elles se
   posent.
3. **Les deux durées de relève** (6 h / +4 h) — un choix, pas une mesure.
4. **La Garnison**, dernier module sans effet, toujours en attente d'arbitrage.
5. **La marge sous la borne T10 est à 1,97 %.** Le prochain atlas la fera tomber :
   il faudra ROUVRIR la borne en écrivant pourquoi, jamais rogner un atlas pour
   passer dessous.

## Ce qui n'a pas été exécuté, et se déclare comme tel

**Aucun essai sur appareil.** Tout ce qui est dit « mesuré dans Chromium » l'a
été dans un navigateur headless en 360 × 740, DPR 2, avec `hasTouch`. Le zoom au
pincement de la base, le défilement borné et le pont Android **ne sont pas
vérifiés sur téléphone** — et le pont ne peut pas l'être ici : `:app` n'est même
pas compilé faute de SDK.
