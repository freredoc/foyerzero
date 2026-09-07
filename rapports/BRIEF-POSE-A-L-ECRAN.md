# BRIEF — lot POSE-À-L'ÉCRAN : le joueur peut enfin construire

## MODÈLE ET EFFORT

**Opus 5, effort élevé.** Lot DOM et petit : **tout le moteur est déjà écrit et
testé**. C'est du branchement, et la preuve est sur appareil.

**Fichiers joints : aucun — brief autosuffisant.**

---

## 0. Premier geste

1. `CLAUDE.md` à la racine — il fait autorité.
2. **`PASSATION-2026-08-27-nuit.md`**, la plus récente. Elle clôt le lot 1 des
   sprites, retourne deux règles de dessin, et porte la palette à **33
   teintes**. Elle est mesurée et juste — mais confronter quand même : une
   passation écrite pendant une session graphique a déjà annoncé 240 tests
   quand le dépôt en portait 257.
3. Lister racine, `src/`, `src/data/`, `src/sim/`, `src/render/`, `src/ui/`,
   `test/`.
4. `npm ci && npm run check`, consigner le compte.

**Référence relevée sur `main` le 27/08 à la nuit, après les lots DÉMARRAGE,
SOL et AUDIT-LIT-LA-FICHE :** **286 pass / 0 fail** · `dist/index.html`
**131 302 octets**, SHA-256 `7deac539…ae6ed` · **0.15.0 · build 15** ·
`SAVE_VERSION` **6** · palette fermée à **33 teintes**.

⚠ **Le dépôt a bougé depuis la première rédaction de ce brief, mais PAS sur ces
chiffres-là** : version, build, taille, SHA et compte de tests sont identiques,
re-mesurés sur un clone neuf. Ce qui a bougé est graphique — 18 sprites de
terrain, deux règles de dessin retournées, et la palette passée de 28 à 33.

---

## 1. Le problème, dit par Ethan

L'écran tourne sur son téléphone. La poche du Chantier se voit. Mais **la
palette des bâtiments posables est désactivée**, donc rien ne peut être
construit, donc rien ne produit, donc **quatre vérifications appareil sur douze
restent hors d'atteinte** — dont celles qui prouvent le rattrapage hors ligne.

Ce lot les rend exécutables. Il ne fait que ça.

---

## 2. Ce qui existe déjà — ne rien réécrire

`sim/state.js` porte, depuis le lot DÉMARRAGE :

| Fonction | Ce qu'elle fait |
|---|---|
| `problemesDeLaPose(etat, id, rangee, colonne)` | rend une **LISTE** de ce qui empêcherait la pose — vide si elle est légale |
| `poser(etat, id, rangee, colonne)` | pose au niveau 1, allonge les résidus, **LÈVE** si c'est illégal |

⚠ **La différence entre les deux est la règle du dépôt, et l'écran doit la
respecter.** Une pose refusée est un fait de JEU : on la montre au joueur.
`poser` qui lève est un fait de PROGRAMME : l'écran n'aurait pas dû appeler sans
regarder. **Ne jamais entourer `poser` d'un `try` pour rattraper un refus** —
c'est `problemesDeLaPose` qu'on interroge avant.

⚠ **Poser ne coûte RIEN.** `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2 : le
niveau 1 est gratuit pour les onze. Aucune ressource à prélever, aucune à
vérifier. Le coût de la première amélioration est rendu par `posablesDeLaBase`,
et il ne concerne pas ce lot.

---

## 3. Le geste, de bout en bout

1. le joueur touche un bâtiment de la palette → il devient **actif** ;
2. les cases où ce bâtiment **peut** se poser se distinguent ;
3. il touche une case légale → `poser`, puis on repeint et on **sauvegarde** ;
4. il touche une case illégale → on **dit pourquoi**, et la sélection reste ;
5. il retouche le bâtiment actif → la sélection se défait.

### Les cases légales se calculent, elles ne se devinent pas

Balayer les 72 cases de la bande des bâtiments en appelant
`problemesDeLaPose` sur chacune. **Mesuré** sur cette machine :

| Base | Coût d'un balayage complet |
|---|---|
| neuve, 1 bâtiment | **0,82 ms** |
| pleine, 31 bâtiments | **1,74 ms** |

C'est un geste, pas une boucle de rendu : le coût est négligeable et il n'y a
**aucune raison de réimplémenter les règles** dans l'écran pour aller plus vite.
Sur une base neuve, un Collecteur a exactement **12 cases légales** — les douze
champs — et c'est un bon contrôle à l'œil.

⚠ **Ne balayer QUE la bande des bâtiments** (`GRILLE.bandes.batiments`). Les
rangées 1 à 10 ne reçoivent pas de bâtiment, et `problemesDeLaPose` y répondrait
`hors-base` 90 fois pour rien.

### Le refus se montre, il ne se tait pas

`problemesDeLaPose` rend des objets `{ code, message }`, et les messages sont
déjà écrits en français lisible : « Collecteur doit être posé sur un champ »,
« deux bâtiments sur la case (14,3) », « 3 bâtiments pour 2 emplacements
(Chantier niveau 1) ». **Les afficher tels quels.** Ne pas les reformuler : ils
viennent de `sim/disposition.js`, qui est la seule table de règles, et une
seconde formulation finirait par diverger de la première.

Le bandeau `#chantier-avis` existe déjà et sert à ça.

### Après une pose, quatre choses changent

Toutes se relisent dans le moteur, aucune ne se calcule à la main :

- **les débits** — `debitsMilliParHeure` ;
- **les capacités** — `capacitesMilli` ;
- **le compte d'emplacements** — `emplacementsDuNiveau` ;
- **le niveau des bâtiments** — `niveauDesBatiments`, qui bouge à chaque pose
  puisque c'est une moyenne.

⚠ **Sauvegarder tout de suite après une pose.** C'est la première action
irréversible du jeu ; la perdre parce que l'application a été tuée avant le
prochain enregistrement périodique serait la pire des façons de perdre la
confiance du joueur.

### Quand il n'y a plus d'emplacement

Le joueur doit le comprendre **avant** de toucher une case. Si aucun emplacement
n'est libre, toutes les cases sont illégales et la palette n'a plus de sens : le
dire dans le bandeau, et laisser le compteur d'emplacements parler.

---

## 3 bis. La palette est passée à 33 teintes

`FICHE-STYLE.md` porte **33** couleurs depuis la nuit du 27/08 : le sol du
joueur a été recolorisé. La garde de `test/banc.test.js` a suivi — elle est dans
`npm run check`, elle ne pouvait pas ne pas suivre.

⚠ **Toujours interdit : tout `rgba` autre que `rgba(0,0,0,0.31)`, et les deux
échappatoires** — hex à trois chiffres (`#000`) et à huit (`#F5F3E80D`), qui
passent sous le motif de la garde. Si la palette d'un état posable a besoin d'un
état « case légale » distinct, le composer avec les teintes de la fiche.

⚠ **Les couleurs de terrain restent NON ARBITRÉES** — `#9FB3C5` · `#C1CEDA`
quartz, `#382E47` scorie. Ne pas trancher seul ; ce lot n'a pas à y toucher.

---

## 4. Ce que ce lot ne branche PAS

- **Améliorer** — attend la répartition d'un coût entre quartz et scorie, qui
  n'est arbitrée nulle part depuis que `data/params.js` est parti.
- **Démonter** — attend de savoir si ça rend quelque chose.

Les deux boutons **restent présents et désactivés**. La place qu'ils prendront
est tenue, et rien ne ment sur ce qu'on peut faire.

---

## 5. Version et build

⚠ **`dist/index.html` change.** **Bumper `version` ET `config.build` de
`package.json` ensemble**, au numéro disponible au moment de l'exécution. **Le
brief ne propose aucun numéro.** Vérifier la taille : T10 borne à 200 000
octets, le HTML en fait 131 302 aujourd'hui.

⚠ **`CLAUDE.md` annonçait 130 488 octets, faux de 814** — relevé et corrigé la
nuit du 27/08. `dist/` n'est pas suivi par git, donc **aucun test ne confronte
ce nombre** : c'est le seul chiffre du fichier qu'aucune garde ne protège. Le
re-mesurer et le corriger fait partie de ce lot.

⚠ **`SAVE_VERSION` ne bouge PAS.** Rien n'est ajouté à l'état : une pose
allonge `disposition` et `economie.residus`, deux listes qui existent depuis la
v4. Bumper imposerait une migration qui n'aurait rien à migrer.

---

## 6. Tests

**Sans DOM** — le dépôt n'a ni jsdom ni navigateur :

- **le balayage des cases légales** : sur une base neuve, un Collecteur en a
  exactement douze, et ce sont les douze champs. Falsifiable : asserter d'abord
  que le terrain porte bien douze champs, sinon `12 === 12` ne prouverait rien.
- **une pose change les quatre grandeurs** : débit, capacité, emplacements
  occupés, niveau moyen. Mesurer avant et après, et asserter que **chacune** a
  bougé — un test qui n'en regarde qu'une passerait sur un repeint partiel.
- **le niveau moyen après pose** : poser un bâtiment de niveau 1 sur une base de
  niveau moyen supérieur **fait baisser** la moyenne. C'est contre-intuitif et
  ça se verra à l'écran ; l'asserter maintenant évite qu'on le prenne pour un
  défaut plus tard.
- **aucun `try` autour de `poser`** dans `src/ui/` : un balayage de source, avec
  un appât pour prouver qu'il attraperait la faute.

**Sur appareil — la preuve.** Galaxy S25 FE. ⚠ **Un test appareil non exécuté se
déclare NON EXÉCUTÉ, jamais passé.**

**Les quatre qui restent dues depuis la PR 13, et qui deviennent enfin
atteignables :**

| # | Vérification |
|---|---|
| 7 | poser un collecteur sur un champ, puis voir les stocks monter |
| 9 | l'économie a tourné pendant un passage à l'Offense |
| 11 | fermer l'app, attendre, rouvrir → les stocks ont avancé de la durée d'absence |
| 12 | replier seulement, sans fermer → même résultat |

**Six propres à ce lot :**

15. toucher un bâtiment de la palette distingue ses cases légales, et un
    Collecteur en montre douze sur une base neuve ;
16. poser sur une case légale place le bâtiment, et le compteur d'emplacements
    avance ;
17. toucher une case illégale dit **pourquoi**, en français, et ne pose rien ;
18. le niveau du Chantier, en bas d'écran, bouge après la pose ;
19. poser puis tuer l'application aussitôt : le bâtiment est toujours là au
    rouvrant ;
20. une fois les emplacements pleins, l'écran le dit avant qu'on essaie.

---

## 7. Livraison

- **PR.** Le merge sur `main` appartient à Ethan seul.
- **`RAPPORT-POSE-A-L-ECRAN.md` sur disque**, à la racine : version et build
  réellement produits · taille et SHA-256 du HTML produit · chaque test avec son
  montage effectif · **les dix vérifications appareil, une par une, exécutées ou
  déclarées non exécutées** · écarts par rapport à ce brief et leurs raisons ·
  points en suspens.
- **Ne jamais livrer en signalant un défaut connu.** Le corriger avant.
