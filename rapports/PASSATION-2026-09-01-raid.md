# PASSATION — 01/09/2026 — ouverture du chantier RAID

Session d'analyse, **aucun code écrit**. Objet : mesurer l'état réel du raid dans
le dépôt, recueillir la maquette d'Ethan, et fixer les arbitrages avant brief.

---

## 1. Base de référence — mesurée sur clone neuf

| Grandeur | Valeur |
| --- | --- |
| `package.json` version / build | **0.59.0 / 60** |
| `dist/index.html` après `node tools/build.js` | **1 339 823 octets** (1308,4 Kio) |
| `node --test "test/*.test.js"` | **792 tests, 792 pass, 0 fail** |
| `SAVE_VERSION` (`src/sim/state.js:41`) | **16** |

Commande de reproduction :

```
git clone --depth 1 https://github.com/freredoc/chantier.git
cd chantier && npm install && node tools/build.js && node --test "test/*.test.js"
```

---

## 2. Ce qui existe déjà — vérifié ligne à ligne

### 2.1 Le moteur de raid est complet

`src/sim/raid.js` (392 lignes) exporte :

- `problemesDuRaid(etat, baseAttaquante, cible)` — rend une **liste**, ne lève
  pas. Codes couverts : `sans-cible`, `hors-portee`, `points-insuffisants`,
  `sans-armee`.
- `executerRaid(etat, baseAttaquante, cible, options)` — paiement avant départ,
  `annulerLaReparation`, montage, `resoudre`, butin plafonné avec `butinPerdu`,
  points de recherche, `enregistrerLeRaid`, report des dégâts sur `etat.armee`,
  `reparerLaGarnison`. Rend un rapport complet.
- `composerLesVagues`, `pvMaxDeLUnite`, `rechercheMilli`, `creerRecherche`,
  `VAGUES_DU_RAID`, `TYPES_ATTAQUABLES`.

### 2.2 Rien dans l'interface ne l'appelle

Grep `from '.*raid` sur `src/`, `test/`, `tools/` :

- `src/sim/state.js:24` → `creerRecherche` seulement ;
- `test/raid.test.js`, `test/recherche.test.js`, `test/poi.test.js`,
  `test/reparation.test.js`.

**Aucun fichier de `src/ui/`.** L'en-tête de `src/ui/monde.js` interdit
explicitement tout bouton d'action dans le panneau de site, et un test balaie le
panneau pour l'empêcher. C'est la trace du bouton « Assaut » retiré le 27/08.

### 2.3 Le combat est intégralement déterministe

**Zéro occurrence de `Math.random` dans `src/sim/combat.js`.** Conséquence
retenue et acceptée par Ethan : le simulateur ne donne pas une estimation, il
donne le résultat exact. Simuler puis attaquer sans rien changer entre les deux
rend un combat identique au tick près.

Corollaire utile : le simulateur et le vrai raid partagent le même chemin de
code, et un test peut asserter l'égalité bit à bit des deux rapports.

### 2.4 Durée d'un combat — bornée

`src/data/combat.js` : `dureeMaxCombatSec: 90`, `tickSec: 0.1`, donc
`TICKS_MAX_COMBAT = 900`. **Un combat ne peut pas dépasser 90 secondes.** Le
temps réel en ×1 pour la vraie attaque ne pose donc aucun problème de durée.

### 2.5 L'affichage d'une base cible ne demande aucun calcul neuf

`montageCourant(etat, identite)` — `src/sim/site-entame.js:211` — rend les
bâtiments et les défenseurs de la cible **avec leurs PV courants**, dégâts d'un
raid précédent appliqués. L'écran de raid lit, il ne calcule pas.

⚠ Il n'y a **aucune information cachée** dans ce jeu — arbitrage rappelé par
Ethan le 01/09. Le joueur voit toujours la position exacte des bâtiments et la
garnison réelle de la cible. Ne plus poser la question.

### 2.6 Les raids de l'Ouvrage — données complètes, câblage nul

`src/data/sites.js:164`, `RAID_OUVRAGE` :

```js
niveauMinimal: 10,
chanceParMinute: 1 / 1440,   // par minute, par base ennemie à portée
budgetParNiveau: { 10: 30, 15: 70, 20: 105, 25: 140, 30: 170,
                   35: 200, 40: 225, 45: 250, 50: 250 },
ordreCibles: ['centreDeCommandement', 'complexeDeDefense', 'chantierDeConstruction'],
ordreVagues: ['antiInfanterie', 'antiVehicule', 'antiStructure'],
sanctionRasage: { redeploiementCases: 20, perteRessourcesStockees: true },
```

`RAID_OUVRAGE` n'est lu que par `src/ui/banc.js` et `src/sim/generateur.js`.
**Aucun tirage nulle part, aucun code n'écrit de dégâts sur la base du joueur.**
`sim/raid.js` le dit lui-même : l'auto-réparation de garnison est « écrite et
inatteignable en jeu tant que les attaques sur la base n'existent pas ».

### 2.7 Le levier de rendu existe déjà

`src/ui/banc.js` porte toute la boucle de lecture visuelle — `creerAccumulateur`,
`ticksDus`, `alphaMilli`, `prendrePositions` de `render/interpolation.js`,
`calculerProjection` de `render/projection.js`, `listeAffichage` de
`render/scene.js`, `executer` de `render/canvas2d.js`. Elle est soudée au DOM
`#banc-*` et à ses propres montages : c'est ce couplage qu'il faudra défaire, pas
la boucle elle-même.

### 2.8 Écrans déclarés

`src/ui/session.js:546` :
`['chantier', 'mission', 'offense', 'recherche', 'monde', 'options']`.

---

## 3. La maquette dictée par Ethan — 01/09

Écran de raid plein cadre, atteint depuis la carte du monde.

**Haut de l'écran.** Ni le bandeau de stocks, ni la rangée d'onglets. Ils
disparaissent tous les deux.

**Zone haute — la cible.** On voit la **base attaquée**, bande de défense par
défaut. La limite haute est décalée : on ne voit pas du tout ses bâtiments au
départ. La flèche en bas à droite — celle qui sert déjà à passer de la base à la
défense — permet de remonter sur ses bâtiments.

**Zone basse.** Elle est large, ce que le retrait du haut a libéré :

1. une rangée de boutons, **en haut de la zone basse** ;
2. les quatre rangées de neuf de l'armée du joueur, unités déplacées en
   **glisser-déposer**.

**Les six boutons.**

| Bouton | Comportement |
| --- | --- |
| Réparer | **En deux temps.** Premier clic : le mode s'arme. Second geste : on désigne l'unité à réparer. Quand le mode est armé, un bouton **« tout réparer »** apparaît **au-dessus**. |
| Simulateur | Ouvre la fenêtre de résultat (voir §4). |
| Lancer l'attaque | Le vrai raid, en temps réel, sans contrôles de vitesse. |
| Retour carte | Revient sur l'onglet Monde. |
| Retour offense | Revient sur l'onglet Offense de la base attaquante. |
| Activer / désactiver | Bascule une unité entre « part » et « reste ». |

---

## 4. Le simulateur

Un clic ouvre **une petite fenêtre de résultat grossier**, contenant :

- le butin ;
- l'état général ;
- la **proportion** de bâtiments détruits ;
- la **proportion** de la défense détruite ;
- la **proportion** de l'armée du joueur détruite, ventilée en trois :
  **infanterie, véhicules, aviation** ;
- le temps de réparation induit ;
- le coût de réparation — **pas encore branché, à faire plus tard**.

⚠ « **Proportion**, pas moyenne » — dit explicitement par Ethan le 01/09. Le
combat n'ayant aucun hasard, il n'y a rien à moyenner : un seul calcul donne le
chiffre exact.

Depuis cette fenêtre, le joueur peut regarder le déroulé en **×1, ×2 ou ×4**, et
au pas à pas. Un bandeau d'en-tête « **SIMULATEUR** » couvre la vue pendant tout
le déroulé simulé, pour qu'on ne le confonde jamais avec la vraie attaque.

---

## 5. Arbitrages fixés le 01/09 — ne pas réouvrir

1. **Ordre exécution / animation : A.** `executerRaid` commet l'état, puis
   l'écran rejoue le combat pour l'affichage. Le combat étant déterministe, le
   rejeu est exact. L'état reste sûr si l'application est tuée en cours
   d'animation, et « passer » devient gratuit.
2. **Aucune information cachée.** La garnison et la disposition de la cible sont
   toujours visibles.
3. **Le simulateur est exact, et c'est voulu.** Un raid ne comporte donc jamais
   de risque : le joueur itère sa composition jusqu'à ce que ça passe, et le seul
   coût réel reste les points d'attaque. C'est la boucle de Tiberium Alliances,
   assumée.
4. **Réparation unité par unité, et instantanée** — elle débite une réserve de
   temps accumulée. Le modèle actuel du code doit être remplacé (voir §6).
5. ~~Le raid annule la réparation en cours.~~ **CADUC.** Cet arbitrage du 29/08
   portait sur un modèle où la réparation durait. Dans le modèle à réserve il n'y
   a rien en vol à annuler : `annulerLaReparation` perd son objet, la ligne sort
   d'`executerRaid`, et l'avertissement à l'écran n'a plus lieu d'être.
6. **Proportions**, jamais des moyennes.
7. **Pas de migration de sauvegarde.** Le jeu n'est pas encore jouable et Ethan
   est seul : casser les sauvegardes existantes est sans conséquence. Bumper
   `SAVE_VERSION` reste bienvenu comme marqueur, écrire la migration ne l'est
   pas.
8. **Périmètre élargi aux raids ennemis**, mais en lot séparé (voir §7).

---

## 6. La réserve de temps de réparation — CLOS le 01/09

### 6.1 Le modèle était déjà arbitré, c'est le code qui a divergé

`MODELE-REPARATION-1.md` §4, dicté par Ethan le **24/08/2026** :

> Le temps de réparation est une **grandeur qui s'accumule**, à la manière d'un
> idle, et que toute réparation consomme. Les bâtiments de la base et les unités
> offensives **puisent dans la même réserve** : on ne peut pas mener 24 h de
> réparation de base et 24 h de réparation d'offense. […] La défense est hors
> réserve — gratuite, sur son horloge propre.

`src/sim/reparation.js` a implémenté **autre chose** : une réparation qui *dure*.
`etat.reparation = { debutTick, ticks, scorie, pieces }`, PV rendus au fil des
ticks par `avancerLaReparation`, un seul chantier à la fois, annulation par
`annulerLaReparation`.

**Mesuré :** `grep` sur `reserveReparation`, `tempsReparation`,
`creditReparation`, `reserveTemps` dans tout `src/` → **aucune occurrence**. La
réserve n'existe nulle part dans l'état. `src/sim/state.js:197` porte
`reparation: null`, et rien d'autre.

Ce n'est pas un oubli d'Ethan : c'est une divergence entre un document arbitré et
son implémentation, restée invisible parce qu'aucun écran n'a jamais appelé la
réparation.

### 6.2 Le modèle retenu, redit par Ethan le 01/09

- Le temps qui passe **crédite** la réserve, au taux **1 pour 1** : une heure
  écoulée, une heure créditée.
- Réparer une unité **débite immédiatement** son coût en temps, et l'unité est
  **réparée sur-le-champ**. Aucune attente, aucun chrono.
- Le coût en temps d'une unité dépend de **son niveau** et du **niveau de son
  bâtiment réparateur** (Caserne, Dépôt de véhicules, Aérodrome).
- **Plafond de la réserve : 12 h en début de partie, +1 h par niveau d'armée.**
  Donc `plafond = 12 h + 1 h × niveauDeLArmee(etat.armee)`.
- **Compteur interne**, pas une quatrième ressource : il ne s'affiche **que dans
  l'onglet armée**, jamais dans le bandeau de stocks.
- **La réserve est PAR BASE, pas globale.** C'est neuf, ce n'est dans aucun
  document. C'est aussi l'intérêt principal d'avoir plusieurs bases, chantier
  remis à plus tard.

### 6.3 Pourquoi ce modèle — la raison de conception, dite par Ethan

Avec une réparation qui dure, enchaîner les raids est impossible : on perd une
armée, on attend une demi-heure, et pendant ce temps la défense de la cible s'est
réparée toute seule en une heure. Le joueur travaille pour rien.

Avec une réserve, on accumule 24 h ou 36 h de temps pendant qu'on ne joue pas,
puis on lance **plusieurs raids d'affilée** en réparant tout entre chaque. La
réserve se vide, et ce n'est pas grave : on attend, ou on joue une autre base.

### 6.4 Ce qui survit du code actuel

- `secondesPleines(id, niveauUnite, niveauBatiment)` — `reparation.js:79` —
  calcule déjà le prix en temps d'une réparation **pleine**. C'est exactement le
  montant à débiter.
- Le calcul **au prorata des dégâts** de `reservoirsDeLArmee` survit aussi : une
  unité à moitié abîmée coûte la moitié.
- `batimentDuChassis` et sa convention `null ≠ zéro` — sans le bâtiment, pas de
  réparation du tout — survivent telles quelles.
- `diviseurDuBatiment` survit : le niveau du bâtiment rend les réparations moins
  chères, et c'est le seul effet du niveau. Le taux de crédit reste 1 pour 1.

### 6.5 Ce qui disparaît

- `etat.reparation` et toute sa forme.
- `lancerLaReparation`, `avancerLaReparation`, `annulerLaReparation`,
  `problemesDeLaReparationEnCours`.
- L'appel à `annulerLaReparation` dans `executerRaid`.
- L'appel à `avancerLaReparation` dans `src/sim/state.js:25`.
- `test/reparation.test.js` est à refaire en entier.

### 6.6 Reste ouvert sur ce point

- Les **bâtiments de la base** puisent dans la même réserve (§4 du 24/08) — mais
  aucun écran ne les répare aujourd'hui. À traiter quand l'écran Base le
  demandera, pas avant.
- La **défense** est hors réserve, gratuite, sur son horloge propre d'une heure.
  Non implémentée non plus.
- Le barème de coût en temps par niveau — `MODELE-REPARATION-1.md` §6 point 7,
  toujours ouvert. `secondesPleines` en porte déjà la forme ; les nombres
  viennent d'Ethan.

---

## 7. La spec de l'interface Carte — dictée avant, jamais exécutée

Ethan l'a redonnée le 01/09 en précisant : « certains points sont faits, beaucoup
d'autres non ». Voici la mesure, point par point.

> **1.** Lors de l'ouverture, on est centré sur la dernière base joueur ouverte
> (important + halo autour de cette base).

| Élément | État mesuré |
| --- | --- |
| Centrage à l'ouverture | **fait** — `src/ui/monde.js:1080`, `if (premiere) centrerSur(etat.position)`. Ne se recentre qu'à la première ouverture, délibérément (arbitrage du 31/08), avec le bouton `monde-recentrer` pour y revenir. |
| « dernière base **ouverte** » | **impossible aujourd'hui** — `basesDuJoueur(etat)` rend `[etat]`, une seule base en dur. |
| **Halo** autour de la base | **absent** — `grep halo\|surbrillance\|selectionn` sur `monde.js` et `render/embleme.js` ne rend rien. |

> **2.** Un clic sur une cible Ouvrage : mini-onglet avec données, ressources
> disponibles en cas de destruction totale, force de la défense, etc. Une flèche
> apparaît depuis la base halotée, permettant de visualiser les coûts d'attaque.
> Deuxième clic : on entre dans la cible, on visualise la défense et les quatre
> rangées de l'armée en dessous (armée de la base halotée). On peut défiler comme
> sur notre base, voir les bâtiments du haut.

| Élément | État mesuré |
| --- | --- |
| Mini-panneau au premier clic | **fait** — `ouvrirPanneau`, `monde.js:1010`. |
| Contenu du panneau | **partiel** — `lignesDuSite` rend Type, Niveau, Distance, Position, plus Bonus et Propriété pour un POI. **Rien d'autre.** |
| Ressources si tout tombe | **absent de l'écran, mais la brique existe** : `butinSiToutTombe(montage)`, `site-de-la-case.js:259`. **Appelée nulle part.** |
| Force de la défense | **absent de l'écran, brique existante** : `forceDeLaDefense(defenseurs)`, `site-de-la-case.js:229`. **Appelée nulle part.** |
| Flèche depuis la base halotée | **absente**. |
| Coût d'attaque affiché | **absent** — `coutDUnRaid` n'est appelé que par `sim/raid.js`, jamais par l'interface. |
| Deuxième clic → entrer dans la cible | **absent**. C'est l'écran de RAID-A. |
| Défense + bâtiments de la cible, avec défilement | **absent** à l'écran ; `montageCourant` fournit déjà la donnée exacte. |
| Quatre rangées de l'armée sous la cible | **absent**. |

> **3.** Si on clique sur une autre base joueur, celle-ci devient halotée à la
> place de l'autre. C'est elle qui attaque.

**Impossible aujourd'hui.** `basesDuJoueur(etat)` rend `[etat]` : il n'y a qu'une
base. Point à reprendre avec le chantier multi-bases, pas avant. À noter que
`ciblesAPortee(etat, baseAttaquante)` prend déjà une base attaquante en
paramètre : la signature est prête, c'est la donnée qui manque.

**Lecture d'ensemble :** le premier clic existe et le panneau existe ; ce sont son
**contenu** et le **second clic** qui manquent. Les trois briques de simulation
nécessaires — `butinSiToutTombe`, `forceDeLaDefense`, `coutDUnRaid` — sont écrites
et testées, et aucune n'est branchée. Le halo et la sélection de base attaquante
attendent le multi-bases.

---

## 8. Découpage proposé — quatre lots

### RÉSERVE — le temps de réparation

Le contenu du §6. Touche `sim/reparation.js` en profondeur, `sim/state.js`,
`sim/raid.js` (retrait de l'appel), et refait `test/reparation.test.js`. Referme
enfin le point 4 du §6 de `MODELE-REPARATION-1.md`, ouvert depuis le 24/08.
Indépendant de toute interface.

### RAID-0 — moteur

- Extraire `simulerRaid(etat, base, cible)` : monte et résout **sans rien
  commettre**. `executerRaid` l'appelle puis commet.
- Test d'égalité bit à bit entre le rapport simulé et le rapport réel.
- Champ d'activation sur les pièces d'armée ; `composerLesVagues` le respecte.

### RAID-A — l'écran de raid du joueur

Le contenu des §3, §4 et §7. Point d'entrée depuis le panneau de `ui/monde.js`,
grisé par `problemesDuRaid`, ce qui lève l'interdit de son en-tête — **et le test
qui balaie le panneau devra être amendé, pas supprimé**. Branche au passage
`butinSiToutTombe`, `forceDeLaDefense` et `coutDUnRaid` dans le mini-panneau.
Septième écran ou plein cadre par-dessus : à trancher (le banc fait le second).

### RAID-B — les raids de l'Ouvrage

Tirage dans la boucle de tick **et** dans le rattrapage hors ligne, montage de la
base réelle du joueur en défense — aujourd'hui `montageDefense` du banc monte des
défenseurs saisis à la main, pas la vraie base —, report des dégâts, sanction de
rasage, compte rendu au retour du joueur.

---

## 9. Ce qui reste en suspens

- **Écran dédié ou plein cadre**, pour RAID-A.
- Ce que montre exactement le **panneau de fin de la vraie attaque**, et où l'on
  retombe après : carte ou base.
- Le **coût de réparation** dans la fenêtre du simulateur : reporté par Ethan.
- Le **barème** de coût en temps de réparation par niveau
  (`MODELE-REPARATION-1.md` §6.7).
- **Multi-bases** : halo, base attaquante sélectionnable, réserve par base. Rien
  n'est possible tant que `basesDuJoueur` rend `[etat]`.
- Ethan a évoqué de **renommer l'onglet OFFENSE en ARMÉE** — « ce sera plus
  clair ». Non tranché.
- `MODELE-REPARATION-1.md` devra être **amendé**, pas seulement le code : son §4
  est juste, mais le §6 point 4 doit être marqué clos avec les valeurs du 01/09.
