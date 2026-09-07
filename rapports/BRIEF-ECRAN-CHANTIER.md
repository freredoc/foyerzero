# BRIEF — lot ÉCRAN-CHANTIER : le moteur devient regardable

## MODÈLE ET EFFORT

**Opus 5, effort élevé.** Lot DOM, non vérifiable hors appareil : la seule
preuve qui compte est un test sur le Galaxy S25 FE.

**Fichiers joints : aucun — brief autosuffisant.** Tout ce qui est cité se lit
dans le dépôt.

---

## 0. Premier geste, sans exception

1. Lire `CLAUDE.md` à la racine. Il fait autorité.
2. Lire `PASSATION-2026-08-27.md`. ⚠ **Son « la suite reste à 240 tests » est
   périmé** — il a été écrit pendant une session graphique et n'a pas été
   remesuré. Confronter, ne pas croire.
3. Lister la racine, `src/`, `src/data/`, `src/sim/`, `src/render/`, `src/ui/`
   et `test/`. Le dépôt bouge entre les sessions.
4. `npm ci && npm run check`, et **consigner le compte obtenu**.

**Référence à confronter au 27/08 (après le lot PALETTE-V4) :** 257 pass /
0 fail · `dist/index.html` 81 236 octets, SHA-256 `f6b082b4…5ad430` ·
version 0.12.0 · build 12 · `SAVE_VERSION` 6.

⚠ **Ce lot fera bouger `dist/index.html` pour la première fois depuis douze
lots.** C'est donc le premier qui doit bumper. Voir §7.

---

## 1. Ce qu'il faut obtenir

Aujourd'hui `src/index.src.html` est la page du **banc d'essai** : neuf lots de
moteur ont été écrits et rien n'est visible sur le téléphone. Ce lot branche
l'écran **Chantier** sur le vrai moteur.

**En LECTURE.** Le joueur voit sa base, son terrain, ses stocks qui montent,
ses niveaux. Il ne pose rien, n'améliore rien, ne démonte rien. Ce n'est pas
une étape timide : la couche d'action n'existe pas dans `sim/` et elle attend
un arbitrage d'Ethan (la part de scorie dans un coût de construction). Écrire
des boutons qui ne peuvent rien faire serait pire que de les montrer inertes.

**Le modèle visuel est `foyer-zero-ui.html`**, à la racine. Il est à jour, ses
chiffres sortent tous du moteur, et `node tools/audit-maquette.mjs` le vérifie.
Le reprendre comme référence de mise en page et de palette, **pas** comme code à
copier : il grave des données en dur, l'écran doit les lire.

---

## 2. Structure de la page

Sept bandeaux, de haut en bas, hauteurs fixes sauf le champ :

| # | Bandeau | Hauteur | Contenu |
|---|---|---|---|
| 1 | Onglets | 40 | Chantier (actif) · Recherche · Monde · Options — les trois derniers **inertes et grisés** |
| 2 | Ressources | 44 | quartz · scorie · électricité, chacune stock / capacité / débit horaire |
| 3 | Emplacements | 26 | posés / ouverts, avec la barre |
| 4 | Champ | le reste | grille 9 × 18, défilante |
| 5 | Contexte | 46 | le bâtiment sélectionné ; boutons **présents et désactivés** |
| 6 | Bandes | 46 | Chantier · Défense · Assaut, chacune avec SON niveau |
| 7 | Palette | 86 | les bâtiments posables, **désactivés** |

### La grille

**9 colonnes × 18 rangées.** `GRILLE` de `data/combat.js` fait foi — ne jamais
écrire 9 ni 18 en dur, les lire.

Bandes : rangées **1–2** déploiement · **3–10** défense · **11–18** bâtiments.

⚠ **La rangée 18 est LE FOND.** L'assaillant part de la rangée 1 et monte en
numéro. Ne jamais dire « en haut » : le mot a coûté un lot le 26/08 et la
fonction s'appelle `caseDuChantier`.

Le champ s'ouvre sur la bande des bâtiments. Les boutons de bande **font
défiler**, ils ne changent pas d'écran.

### Le terrain

Les douze champs de ressource se dessinent **sous** les bâtiments, jamais
au-dessus. Ils viennent d'`etat.champs`, pas d'un tirage local.

---

## 3. Le branchement au moteur

### Ce qui existe et qu'il faut appeler

| Besoin | Fonction | Module |
|---|---|---|
| partie neuve | `creerEtat(graine)` | `sim/state.js` |
| charger + rattraper | `charger(json, instantMs)` | `sim/state.js` |
| sauver | `serialiser(etat, instantMs)` | `sim/state.js` |
| un tick | `tickJeu(etat)` | `sim/state.js` |
| ticks dus | `accumuler(horloge, ecouleMs)` | `sim/clock.js` |
| débits par bâtiment | `debitsMilliParHeure(disposition, champs)` | `sim/economie-base.js` |
| capacités | `capacitesMilli(disposition)` | `sim/economie-base.js` |
| niveau des bâtiments | `niveauDesBatiments(disposition)` | `sim/niveau-de-base.js` |
| emplacements ouverts | `emplacementsDuNiveau(niveau)` | `data/base.js` |
| noms, classes | `BASE_BATIMENTS` | `data/base.js` |

⚠ **Les ressources sont en MILLI-unités.** Diviser par 1000 pour l'affichage, et
seulement là. Ne jamais ranger une unité entière dans l'état.

⚠ **Les niveaux sont en DIXIÈMES.** `niveauDesBatiments` rend `46` pour 4,6.
L'affichage divise par dix, virgule française, **décimale toujours montrée** —
« 6,0 » et jamais « 6 ».

⚠ **Deux des trois niveaux n'existent pas.** Défense et Assaut affichent `—`.
Ne pas inventer de moyenne sur des unités que l'état ne porte pas.

### Le temps

`accumuler(etat.horloge, ecouleMs)` rend le nombre de ticks dus ; l'appelant les
exécute. C'est déjà ce que fait `ui/banc.js` avec les horodatages de
`requestAnimationFrame` — reprendre le même schéma pour la boucle en session.

Le **rattrapage hors ligne** est déjà dans `charger` : il n'y a rien à écrire.

### La sauvegarde

**`localStorage`, et c'est déjà décidé** — `android/app/.../MainActivity.kt`
active `domStorageEnabled` « sa sauvegarde locale » et fixe une **origine
stable** (`ORIGINE_LOCALE`) avec le commentaire « en changer perdrait les
sauvegardes ». L'enveloppe attendait ce lot.

- une clé unique, nommée explicitement, versionnée dans son nom ;
- écrire à chaque `visibilitychange` vers `hidden` **et** périodiquement ;
- au démarrage : clé absente → `creerEtat` ; clé présente → `charger` ;
- **`charger` qui lève ne doit pas laisser un écran blanc.** Une sauvegarde
  illisible se signale au joueur, elle ne se supprime pas en silence — c'est
  « rien ne se retire jamais en silence » appliqué à ce qu'il a de plus
  précieux. Proposer, ne pas décider à sa place.

---

## 4. LA GARDE §11 EST À RETOURNER, ET C'EST LE CŒUR DU LOT

`test/banc.test.js`, test « §11 — aucun `Math.random` nulle part dans `src/`,
DOM confiné à `ui/` », interdit **aujourd'hui** `Date.now` dans tout `src/`,
`index.src.html` compris. Ce lot a besoin de l'horloge murale : sans elle,
`charger(json, instantMs)` et `serialiser(etat, instantMs)` n'ont personne pour
leur passer leur argument, et le rattrapage hors ligne — écrit, testé, livré —
ne sert à rien.

**Forme exigée de la garde retournée**, telle que `CLAUDE.md` §6 la décrit :

- **interdiction totale** sur `src/sim/`, `src/data/` et `src/render/` ;
- **exactement une** occurrence admise, dans **un fichier nommé dans le test** ;
- le test asserte le **compte** — pas « au plus une », **une**, pour qu'une
  seconde soit refusée aussi bien qu'une zéro ;
- le commentaire dit pourquoi elle est là et ce qu'elle protège.

⚠ **Ne pas contourner.** `performance.timeOrigin + performance.now()` donne
l'heure murale sans écrire `Date.now` : c'est passer sous la garde en silence,
et le dépôt le refuse — voir `CLAUDE.md` §6, où deux échappatoires de la garde
de palette sont documentées comme interdites d'usage pour la même raison.

⚠ **Ne pas affaiblir au-delà du besoin.** La garde interdit aussi `Math.random`,
et ça ne bouge pas.

---

## 5. Le banc d'essai reste, derrière un geste de debug

**Arbitré par Ethan le 27/08.** Le banc ne sort pas du HTML livré.

C'est aussi ce que **T10 exige déjà** : il asserte la présence de
`banc-canvas`, `banc-graine`, `banc-lancer` et `banc-pas` dans
`dist/index.html`. Le sortir aurait mis ce test au rouge.

- le balisage du banc reste dans la page, **caché** ;
- `initialiserBanc(document)` n'est appelé **qu'à l'ouverture**, pas au
  chargement : il démarre des boucles et n'a rien à faire tourner derrière
  l'écran de jeu ;
- **geste proposé** : appui long de 1,5 s sur le numéro de version du bandeau
  d'onglets. Discret, impossible à déclencher par accident, et le numéro est
  déjà à l'écran. Si un autre geste te paraît meilleur, le dire dans le rapport
  et l'implémenter — ce point n'est pas arbitré.
- un moyen de **revenir** au jeu depuis le banc.

⚠ `[hidden]` ne cache rien contre un sélecteur d'id : `#banc-arsenal` fixe
`display: flex` et l'emporte. D'où le `!important` en tête de feuille. Le même
piège vaut pour tout nouveau bloc masqué.

---

## 6. La palette, fermée

**Vingt-huit teintes, celles de `FICHE-STYLE.md`**, plus un seul `rgba` —
`rgba(0,0,0,0.31)`. La garde balaie `src/render/`, `src/ui/` et
`index.src.html`.

⚠ **Deux échappatoires existent et sont interdites d'usage** : le motif de la
garde est `` #[0-9A-Fa-f]{6}(?![0-9A-Za-z]) ``, si bien qu'un hex à **trois**
chiffres (`#000`) et un hex à **huit** (`#F5F3E80D`) passent au travers. Ne pas
s'en servir. `foyer-zero-ui.html` s'en est privé, l'écran aussi.

Conséquence acquise, reprise de la maquette : **les bandes n'ont pas de fond
propre** — le rail dit où l'on est, et une nuance de noir ne se distingue pas
sur un téléphone au soleil.

⚠ La fiche porte depuis le 27/08 des couleurs de terrain — `#9FB3C5` · `#C1CEDA`
quartz, `#382E47` scorie. **Leur emploi n'est pas arbitré** : la maquette a été
dessinée avant. Ne pas trancher seul ; reprendre le rendu de la maquette et
signaler la question dans le rapport.

---

## 7. Version et build

⚠ **`dist/index.html` VA changer** — c'est le premier lot dans ce cas depuis le
lot RÉSIDU. **Bumper `version` ET `config.build` de `package.json` ensemble**,
en choisissant le numéro disponible au moment de l'exécution. **Le brief ne
propose aucun numéro.**

Vérifier la taille après build : T10 borne à 200 000 octets et le HTML en fait
81 236 aujourd'hui.

---

## 8. Ce qui doit être vrai à l'arrivée

- `npm run check` **vert**, compte mesuré et consigné ;
- `node tools/audit-maquette.mjs` toujours **vert** ;
- `dist/index.html` sans référence externe — la garde du build y veille ;
- `CLAUDE.md` §0 (compte de tests) et §2 (arborescence, **noms compris**) à
  jour. ⚠ `test/documentation.test.js` les asserte contre le disque : ajouter un
  fichier sans les mettre à jour rend la suite ROUGE, et c'est voulu.

### Les tests qu'on attend

`node --check` ne prouve que la syntaxe, et **le dépôt n'a ni jsdom ni
navigateur**. Ce qui touche le DOM ne s'automatise pas ici.

Ce qui **peut** être testé sans DOM, et doit l'être :
- le formatage — milli → unités, dixièmes → « 4,6 », séparateurs de milliers
  ⚠ `toLocaleString('fr-FR')` produit une espace fine insécable (U+202F) :
  normaliser dans le test, ou comparer autrement ;
- la garde §11 retournée, **falsifiée dans les deux sens** : zéro occurrence
  doit tomber, deux occurrences doivent tomber ;
- la présence du balisage du banc dans le HTML produit (T10, déjà là).

**Le test appareil est la preuve, et rien d'autre.** Galaxy S25 FE, navigation
à 3 boutons, barre d'état visible. À vérifier de la main :
1. la grille tient dans la largeur, cellules carrées, 9 colonnes visibles sans
   défilement horizontal ;
2. les trois boutons de bande amènent bien où ils disent ;
3. les stocks montent en regardant l'écran ;
4. fermer l'application, attendre, rouvrir → **les stocks ont avancé de la durée
   d'absence** ;
5. le geste de debug ouvre le banc, et on peut en revenir ;
6. les boutons inertes se **voient** inertes.

⚠ **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais passé.**

---

## 9. Livraison

- **PR**, jamais de merge : le merge sur `main` appartient à Ethan seul.
- ⚠ **`src/` et `test/` ne voyagent jamais dans la même archive** si la
  livraison passe par des archives. Dans une PR la question ne se pose pas.
- **`RAPPORT-ECRAN-CHANTIER.md` écrit sur disque**, à la racine, contenant :
  version et build **réellement** produits · fichiers touchés · taille et
  SHA-256 du `dist/index.html` produit · résultat de chaque test avec son
  montage effectif · **les six vérifications appareil, une par une, exécutées ou
  déclarées non exécutées** · la forme retenue pour la garde §11 et sa
  falsification · écarts par rapport à ce brief et leurs raisons · points laissés
  en suspens.

⚠ **Ne jamais livrer en signalant un défaut connu.** Le corriger avant.

---

## 10. Ce que ce lot ne fait pas

À dire dans le rapport, pour que personne ne les cherche :

- **poser, améliorer, démonter** — la couche d'action n'existe pas dans `sim/`,
  et elle attend un arbitrage sur la part de scorie d'un coût de construction ;
- **les onglets Recherche, Monde, Options** — rien derrière ;
- **le niveau de défense et le niveau d'armée** — l'état du joueur ne porte ni
  garnison ni armée ;
- **le redéploiement** — rien ne déplace encore une base.
