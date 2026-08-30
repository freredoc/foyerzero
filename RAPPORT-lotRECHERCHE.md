# RAPPORT — lot RECHERCHE

Exécuté le 30/08/2026. Les huit étapes du §8 du brief sont livrées, écran compris.

---

## 0. Ce qui a été produit

| | |
|---|---|
| `package.json` `version` | `0.49.0` → **`0.50.0`** |
| `config.build` | `50` → **`51`** |
| `SAVE_VERSION` | `13` → **`14`** |
| `npm run check` | **634 pass / 0 fail → 658 pass / 0 fail** |
| `dist/index.html` | **1 242 496 → 1 259 092 octets** (+16 596, marge de T10 : 40 908 o, 3,1 %) |
| `node tools/audit-maquette.mjs` | **AUDIT ROUGE — 7 écart(s)**, avant comme après |

Le brief ne proposait aucun numéro : 0.50.0 · 51 était le couple disponible au
moment de l'exécution.

### ⚠ DEUX ÉCARTS DE LIGNE DE BASE ET UNE ERREUR DE FAIT DU BRIEF, À DIRE D'ABORD

1. **La base du brief n'était pas celle du dépôt.** Le brief annonce
   « 619 tests, 0.48.0 · 49, 1 230 416 octets ». Mesuré au démarrage :
   **634 tests, 0.49.0 · 50, 1 242 496 octets**. `SAVE_VERSION` valait bien 13
   et l'audit maquette sortait bien ses 7 écarts. L'écart s'explique : CLAUDE.md
   documente les chiffres du brief comme l'état APRÈS le lot FINITIONS, et les
   miens comme l'état après le lot SPRITES-ET-ZOOM, mergé entre la rédaction du
   brief et son exécution. Rien d'autre ne divergeait — j'ai donc bâti dessus
   plutôt que de m'arrêter, mais le §0 du brief demandait de le dire, et c'est
   dit.
2. **Le dépôt n'était pas dans la session.** `freredoc/foyerzero` a dû être
   rattaché puis cloné ; le répertoire de travail par défaut de la session était
   un autre projet. Aucune conséquence sur le résultat, mais une session future
   partira du même point.

Et l'erreur de fait, qui a changé une décision de code :
**`--atlas-unite` EXISTE**, contrairement à ce que dit le §5.3 du brief. Il a
été déclaré au lot SPRITES-ET-ZOOM (`src/index.src.html`, bloc `:root` des
quatre atlas partagés). Le contournement prescrit — lire le `src` de
`<img id="atlas-unite">` en JS — était donc inutile : l'écran passe par
`poserCouches` comme la palette de l'Offense, sans un chemin à lui.

---

## 1. Étape par étape

### Étape 1 — `data/modules.js` et `data/recherche.js`

`MODULES` a **déménagé** de `data/combat.js` vers `src/data/modules.js` ; il n'a
pas été dupliqué (CLAUDE.md §4 refuse deux tables pour une grandeur). L'ancien
glossaire y était une PARAPHRASE d'une ligne par module, sans un seul nombre ;
les quatorze descriptions sont maintenant la transcription d'Ethan, mot pour
mot, avec un drapeau `cable` par module.

`src/data/recherche.js` porte `ARBRE_RECHERCHE` (14 offense, 17 défense, prix en
POINTS, recopiés du §3 du brief), `BRANCHES`, `SPECIAL` (4 entrées) et
`gratuitesDe(branche)`.

**Gratuites mesurées** : offense `busard`, `meute`, `ratisseur` — défense
`casemate`, `merlon`, `meute`. Trois de chaque. Les trois offensives sont un
châssis chacune (escouade, blindé, aéronef), ce dont plusieurs tests dépendent.

`ARBRE-RECHERCHE.md` §4 : la question 3 (« un seul module ou fumigène +
flashbang ? ») est barrée et marquée TRANCHÉE — arbitrage 4.

### Étape 2 — les deux corrections de données du §3.3, et leur effet MESURÉ

Les colonnes « Module en défense (si différent) » de CIBLAGE-DEFENSE étaient
VIDES pour la Meute et les Perceurs. Vide veut dire « le même qu'en offense » ;
le dépôt l'avait lu comme « aucun ». Corrigé :

```
meute    defense: { present: true, cible: 'antiInfanterie', module: 'flashbang' }
perceurs defense: { present: true, cible: 'antiAerien',    module: 'tirDeBarrage' }
```

**Montage de mesure** : 5 graines (2026, 7, 42, 1234, 99) × 3 satellites =
**15 sites de référence**, montés par `montageCourant`, résolus par
`resoudre`, points lus par `pointsRecherche`. Les sites générés portent
**49 Meutes, 7 Perceurs et 2 Merlons** en défense — le montage voit donc bien
les deux pièces corrigées, il ne mesure pas du vide.

| | avant les corrections | après |
|---|---|---|
| points, `modulesDebloques.ouvrage` NU (le chemin réel aujourd'hui) | **1 044 132 milli** | **1 044 132 milli** |
| points, `ouvrage: ['flashbang', 'tirDeBarrage']` | **1 044 132 milli (+0 %)** | **1 250 428 milli (+19,75 %)** |

**Effet aujourd'hui : NUL, à l'unité près.** `sim/generateur.js` livre
`modulesDebloques.ouvrage` VIDE, et `pointsRecherche` ne majore que si le module
du défenseur y figure. La correction ne se voit donc qu'une fois ce canal armé —
et alors elle vaut +19,75 % sur ce raid de référence. Le manque à 20 % n'est pas
un arrondi : relevé sur le résultat, les défenseurs sont
`meute/flashbang` ×49, `perceurs/tirDeBarrage` ×7 et **`merlon/pvPlusVingt` ×2** —
le module du Merlon n'est pas dans la liste armée, donc sa part ne prend pas le
bonus. Contre-mesuré en armant AUSSI `pvPlusVingt` : **1 252 958 milli, soit
+19,99 %** — l'écart des 2 Merlons vaut 2 530 milli, et le barème est bien de
+20 % par défenseur.

### Étape 3 — `sim/recherche.js`

Exporte `creerAcquises`, `nomDuModule`, `coutMilli`, `estAcquise`,
`moduleEstAcquis`, `acquisesDe`, `modulesDebloquesDuJoueur`, `problemesDeLAchat`,
`acheter`, `formaterPoints`.

- **Le facteur mille est à un seul endroit** (`coutMilli`). L'arbre est en
  points, `etat.recherche.pointsMilli` en milli-points ; une comparaison qui
  l'oublie achète mille fois trop tôt, et rien à l'écran ne le dirait.
- **`problemesDeLAchat` accumule**, il ne s'arrête pas au premier refus (même
  doctrine que `problemesDeLAmelioration`). Ordre : `dejaAcquise`, `sansModule`,
  `uniteNonAcquise`, `effetNonCable`, `pointsInsuffisants`.
- **Une branche ou un `quoi` inconnu LÈVE ; une pièce inconnue REND `inconnue`.**
  Les deux premiers sont des fautes de programme, la troisième peut venir d'une
  sauvegarde trafiquée.
- `grouper` est écrit dans `sim/` et **ne peut pas** réutiliser `formaterEntier` :
  celui-ci prend un `number` et passe par `Math.trunc`, ce qui perd des chiffres
  au-delà de l'entier sûr — précisément le domaine des points — et un module de
  `sim/` n'importe pas de `ui/`.

### Étape 4 — `SAVE_VERSION` 14, migration, `state.js`

`MIGRATIONS[13]` est le seul maillon qui DONNE. Il rejoue l'ancienne règle
(`apparition <= niveauDeCommandement`) et **en fait l'UNION avec les gratuites**.

⚠ **Cette union n'était pas au brief, et elle est nécessaire.** Mesuré : au
niveau 4 d'armée, l'ancienne règle n'ouvrait que la Meute et les Perceurs, alors
que l'Éclaireur et l'Épervier sont désormais GRATUITS. Sans l'union, un joueur
qui recharge aurait eu MOINS qu'un joueur qui recommence.

### Étape 5 — les cinq câblages

`ui/arsenal.js`, `ui/defense.js`, `ui/chantier.js`, `ui/offense.js`,
`sim/missions.js`. **Zéro occurrence d'`apparition` dans ces quatre écrans**
(un test le balaie). Le message de verrou devient « se débloque par la
recherche » — sans nombre : un seuil de niveau ne veut plus rien dire.

`raisonDuVerrou(id, niveau, acquises = null)` garde son premier cas en tête —
« aucun Centre de commandement posé » prime toujours, parce que sans lui il n'y a
pas de niveau du tout.

`acquises` voyage DANS l'état d'éditeur, comme `interdites` avant lui ; `null`
veut dire « aucun filtre » (c'est ce que passe `ui/banc.js`), `[]` veut dire
« rien d'acquis ».

**Relevé d'atteignabilité des missions (§4.5)** : les trois objectifs `effectif`
de la chaîne visent `ratisseur` (offense), `merlon` et `casemate` (défense) —
**les trois coûtent 0**. Donc **3 gratuites, 0 payante** : aucune mission n'exige
aujourd'hui un achat, et la branche payante de `prerequisDe` n'est exercée par
aucune d'elles. Le test l'asserte pour que l'ajout d'une mission payante le dise.

### Étape 6 — `flashbang`

Trois occurrences de `'fumigene'` renommées dans `data/combat.js`
(`meute.module`, `belier.module`, `belier.defense.module`). Il n'y a
délibérément **pas** de `fumigene` dans `data/modules.js` : arbitrage 4.
`ANNEXE-STATS.md` suit.

### Étape 7 — l'Écraseur

Le seul module câblé. `sim/combat.js` : `profilUnite` porte désormais `module`,
et quatre helpers apparaissent — `moduleActif` (le module est-il dans la liste du
PROPRIÉTAIRE de l'entité ?), `masseEffective` (×2 contre une escouade),
`peutEcraser` (l'écrasement ordinaire, qui lit désormais la masse effective) et
`structureForcee` (l'unité bloquante force la structure devant elle).

Le forçage est posé **après** le calcul de `progresse` et **avant** le repli : une
unité qui avance ne force pas, une unité bloquée force.

#### §6.2 — les durées mesurées, et l'écart au brief

Montage : un Fendeur seul, une structure plantée en travers de sa colonne, une
souche derrière pour que le combat ne s'arrête pas. Deux combats identiques à la
graine près, l'un avec le module, l'autre sans.

| | Merlon | Casemate |
|---|---|---|
| PV max | 2 000 000 milli | 1 000 000 milli |
| pas du forçage mesuré | **20 000 milli/tick** | **10 000 milli/tick** |
| ticks pour tomber par le SEUL forçage | **100** | **100** |
| mort réelle AVEC le module | tick **91** | tick **76** |
| mort réelle SANS le module | tick **206** | tick **151** |
| début du forçage | tick 34 | tick 34 |
| fenêtre de mesure propre | 57 incréments | 1 incrément |

**Les 100 ticks annoncés sont exacts pour les DEUX structures, et c'est leur
ÉGALITÉ qui prouve la règle** : le pas vaut 1 % des PV MAXIMAUX, pas des PV
restants (sur lesquels il ne tomberait jamais) et pas une valeur absolue (auquel
cas les deux nombres différeraient).

⚠ **ÉCART AU BRIEF, ET LE TEST EST PLUS FORT QUE CELUI QU'IL PROPOSAIT.** Le
brief voulait « avec le module le Merlon tombe en 100 ticks ; sans, il tient ».
**C'est faux des deux côtés** : le Fendeur TIRE aussi sur le mur, donc il tombe
au tick 91 avec et au tick 206 sans. Aucun attaquant du roster n'a 0 dégât contre
une structure, et `reserve: 0` ne traverse pas `creerCombat` — le tir ne peut pas
être annulé par un montage. Le test isole donc la contribution du module par la
DIFFÉRENCE entre les deux combats.

⚠ **ET LA DIFFÉRENCE N'EST PURE QUE TANT QUE L'ATTAQUANT EST IDENTIQUE DES DEUX
CÔTÉS.** La rétroaction du lot 2A — « plus une unité subit de dégâts, moins elle
tape fort » — fait diverger les deux combats par un SECOND canal dès que la
structure riposte : mesuré sur la Casemate, **10 010 milli d'écart au tick 39 au
lieu de 10 000**. La fenêtre est donc bornée par les PV de l'attaquant. Le Merlon
est un mur, il ne riposte pas : 57 ticks propres. La Casemate est une tourelle :
un seul, et il suffit.

#### §6.3 — la confusion `joueur` / `ouvrage`

`pointsRecherche` n'a **pas** été touché : il lit `montage.modulesDebloques.ouvrage`
et rien d'autre. T13 le prouve sur le MÊME résultat de combat calculé deux fois :
armer `joueur: ['ecraseur', 'pvPlusVingt']` ne change pas un milli-point, pendant
qu'armer `ouvrage: ['pvPlusVingt']` donne exactement +20 %.

Déterminisme : `modulesDebloques` est dans `serialiserEtat`, et deux combats issus
du même montage sont identiques à l'octet après 120 ticks.

#### T12bis — ce qu'il dit, et pourquoi il ne prouve rien

**La masse ×2 de l'Écraseur est écrite et aujourd'hui INDISTINGUABLE.** Les
blindés valent 5, 10 ou 20 de masse ; les escouades valent **toutes 1**. Un
blindé écrase donc déjà toute escouade, doublé ou non — aucun montage ne sépare
les deux comportements. Écrire un test vert là-dessus serait faire semblant.
T12bis consigne la raison et **tombera** le jour où une escouade prendra de la
masse ou un blindé en perdra, en disant quoi écrire.

### Étape 8 — l'écran et l'onglet

`src/ui/recherche.js` (nouveau, 9ᵉ fichier de `src/ui/`). L'onglet Recherche
passe de `class="futur" disabled` à `id="onglet-recherche"` ; **plus aucun onglet
n'est mort**, et la règle CSS `button.futur` part avec le dernier d'entre eux.

Trois panneaux sur un RAIL, pas trois écrans : `overflow-x` + `scroll-snap-type:
x mandatory` sur `#recherche-panneaux`, `scroll-snap-align: start` sur chaque
panneau, `overflow-y` dans chacun. Mesuré en navigateur (360×740, dpr 2) :
`scrollWidth` 1080 pour trois panneaux de 360, **`document.body.scrollWidth ===
clientWidth === 360`** — la page n'a pas pris de barre horizontale.

L'indicateur de position commande le rail ET le suit : un clic sur « Défense »
amène `scrollLeft` à 360 ; un vrai glissement TACTILE (dispatché par CDP, la
souris ne fait pas défiler un conteneur) l'y amène aussi et déplace la pastille
active de 0 à 1.

Ordre d'affichage : celui de `ARBRE_RECHERCHE`, **jamais trié** (arbitrage 7).

`montrerEcran` repeint à l'ouverture, par le chemin de Mission et d'Offense — et
ici c'est le cœur du sujet : les points MONTENT pendant qu'on regarde ailleurs.

#### §5.5 — l'arbitrage de confirmation d'achat, tranché

**L'achat se fait en DEUX TOUCHERS sur le même bouton.** Le premier arme
(le libellé devient « Confirmer ? », le bouton passe à l'ambre du Chantier), le
second paie ; toucher un autre bouton d'achat ou l'indicateur de panneau désarme,
et une peinture désarme tout.

Raison : le prix le plus élevé de l'arbre est **2 500 000 000 points** et l'achat
est irréversible. Le vocabulaire de geste existe déjà dans le dépôt — la pose se
fait en deux touchers depuis le 28/08 — et il ne coûte aucun nœud de DOM
supplémentaire, contrairement à une boîte de confirmation.

Corollaire assumé : **un refus ne passe pas par un toast**. Un bouton refusé est
`disabled`, donc il n'émet aucun clic ; la raison est écrite SOUS la ligne, en
permanence, comme `raisonDuVerrou` le fait déjà sur la palette de l'Offense.

---

## 2. Les tests

**634 → 658.** Vingt-quatre tests ajoutés, tous dans `test/recherche.test.js`
(861 lignes), et dix fichiers de test retouchés.

### Ce que chaque test ajouté vérifie, et le montage qui le ferait tomber

| test | ce qu'il mesure | montage qui le fait tomber |
|---|---|---|
| **T1** | l'arbre offensif et `UNITES` se recouvrent dans les deux sens, 14 des deux côtés | ajouter une unité sans l'entrer dans l'arbre — ou l'inverse ; le compte de 14 interdit qu'un `deepEqual` de deux listes vides passe |
| **T2** | idem en défense, croisé contre `rosterDefensif()` (données) ET `defensesDisponibles(null)` (écran), 17 des deux côtés | déclarer une défense sans l'entrer dans l'arbre ; ou un écran qui filtrerait une pièce que les données rendent |
| **T3** | aucune entrée n'a `module: null` | mettre `module: null` sur une ligne en croyant écrire « gratuit » |
| **T3bis** | `MODULES` et les modules cités par les données se recouvrent dans les deux sens | renommer un module d'un seul côté ; le test lève des DEUX côtés |
| **Spécial** | 4 entrées, 3 sans prix, aucune n'a de mécanique | donner un `cout` à un soutien sans écrire son moteur |
| **gratuites** | `creerAcquises` pose exactement les pièces à 0, triées | traiter le prix 0 en cas particulier à la LECTURE plutôt qu'à la création |
| **T7** | 12 499 999 milli n'achètent pas 12 500 points | oublier le ×1000 dans `coutMilli` : l'achat passerait mille fois trop tôt |
| **T8** | un total de points au-delà de l'entier sûr reste exact | remplacer le BigInt par un `Number` — ce qui arrive dès le niveau 39 |
| **T9** | le Chasseur s'achète des deux côtés, 300 000 et 135 000, et l'un n'ouvre pas l'autre | partager une seule liste d'acquises entre les branches |
| **T10** | le module exige son unité, même avec les points | retirer le refus `uniteNonAcquise` |
| **T11** | les treize modules non câblés refusent, l'Écraseur passe | mettre `cable: true` partout « en attendant » |
| **refus** | branche et `quoi` inconnus LÈVENT, pièce inconnue REND `inconnue` | rendre un refus au lieu de lever : une faute de frappe s'afficherait au joueur comme une règle de jeu |
| **T6** | la migration v13 → v14 ne verrouille rien de ce qui est déjà posé | oublier l'union avec les gratuites : le rechargement donnerait moins qu'un redémarrage |
| **T12** | le pas vaut 1 % des PV MAXIMAUX — 100 ticks pour le Merlon COMME pour la Casemate | indexer le forçage sur les PV RESTANTS (il ne tomberait jamais) ou sur une valeur absolue (les deux nombres différeraient) |
| **T12 (2)** | sans le module acquis, ou sur une pièce qui ne le porte pas (Bélier), rien n'est forcé | lire `p.module` sans consulter la liste des modules débloqués |
| **T12bis** | consigne pourquoi la masse ×2 n'est pas mesurable | donner de la masse à une escouade, ou en retirer à un blindé |
| **T13** | les modules du JOUEUR ne majorent pas les points de recherche ; ceux de l'OUVRAGE valent +20 % | lire `modulesDebloques.joueur` dans `pointsRecherche` |
| **T15 panneaux** | 14 + 17 + 4 lignes, dans l'ordre de la table, une rangée de module par pièce, et repeindre ne double pas | ajouter un `.sort()` ; retirer le `textContent = ''` de `peindre` |
| **T15 sprites** | les 31 noms de sprite nommés par l'écran existent dans les atlas, et portent la lettre `_j_` | écrire `def_j_<id>_n` au lieu de `_s` ; oublier que Merlon, Herse et Ronce n'ont pas d'orientation ; employer un sprite `off_o_…` de l'Ouvrage |
| **T15 refus** | « Acquis » n'est pas un refus ; un refus est écrit dans la ligne ; le module d'une pièce non acquise cumule ses deux raisons ; l'Écraseur ne porte pas `effetNonCable` | traiter `dejaAcquise` comme un blocage ; mettre le refus dans un toast que le bouton `disabled` n'émettra jamais |
| **T15 deux touchers** | le premier toucher n'achète rien, le second paie et enregistre | appeler `acheter` dès le premier clic |
| **T15 désarmement** | toucher un autre bouton, ou l'indicateur, désarme | garder l'armement PAR bouton : le joueur laisserait une traînée de boutons armés |
| **T15 en-tête** | le compteur TRONQUE ; une peinture désarme | arrondir au point supérieur : l'écran annoncerait un point que le moteur refuse |
| **T15 Spécial** | aucune ligne n'a de bouton, même avec mille fois le prix | réutiliser `boutonDAchat` pour la deuxième base, dont le classeur donne pourtant un prix |

⚠ **Le faux document.** Le dépôt n'a pas de DOM en test — esbuild est la seule
dépendance de développement — et aucun écran n'avait jamais été rendu. L'achat en
deux touchers étant un comportement du DOM, le laisser hors test aurait rendu
livrable un bouton qui paie au premier toucher. Un faux `document` d'une
soixantaine de lignes est donc écrit à la main dans `test/recherche.test.js` :
il n'imite que ce que l'écran emploie, et **lève** sur ce qu'il ne connaît pas,
si bien qu'une méthode nouvelle fait tomber le test au lieu de passer en silence.

### Les tests existants réécrits, avec leur ligne d'origine et la raison

| fichier · ligne d'origine | ce qui change | raison |
|---|---|---|
| `donnees.test.js` (import de `MODULES`) | pointe `data/modules.js` ; `references` 42 → **44** | la table a déménagé, et deux fichiers de données entrent dans `src/data/` |
| `arsenal.test.js` T3 | le verrou devient la recherche, plus le niveau | c'est le lot |
| `arsenal.test.js` T8 | `unitesDisponibles(null)` | la fonction prend un contexte, plus un niveau |
| `arsenal.test.js` §5 | renommé « un contexte qui bouge ne retire jamais rien en silence » | le contexte n'est plus un niveau |
| `defense.test.js` T3, T5, T11 | mêmes trois raisons, plus une assertion neuve : une BAISSE de niveau ne verrouille plus rien alors que le BUDGET, lui, suit toujours | c'est la conséquence visible de l'arbitrage 2 |
| `couts-militaires.test.js` | `defensesDisponibles(null)` | même signature |
| `missions.test.js:396` | l'assertion `dits.some((d) => d.includes(`niveau ${source.apparition}`) …)` devient une mesure du PRIX ; le test asserte **3 gratuites, 0 payante** | `apparition` n'ouvre plus rien : un prérequis qui citait un niveau citait un nombre sans effet |
| `missions.test.js:723` (onglets morts) | liste attendue `['Recherche']` → **`[]`** ; ajout de `recherche` aux écrans que la table doit couvrir | le dernier onglet mort s'ouvre |
| `offense.test.js` (palette) | le bloc `avecCaserne` achète d'abord tout l'arbre offensif | isoler la porte du BÂTIMENT de celle de la recherche ; sans ça, `guetteur` n'était plus disponible pour une raison étrangère au test |
| `state.test.js` (×2) | `SAVE_VERSION` 13 → **14** ; l'assertion v6 → v14 recalcule l'ancienne règle et exige que chaque branche ait reçu au moins une pièce PAYANTE | un `deepEqual` sur une liste de gratuites passerait sans rien prouver |
| `chantier.test.js:2512` | `assert.equal(p.verrouille, p.apparition > 8)` devient un verrou lu sur les ACQUISES ; `baseAvecCommandement` (l. 2380 sur `main`) gagne un 4ᵉ paramètre `acquisesDefense`, et le test achète `merlon`, `meute`, `casemate`, `herse` | la palette ne lit plus `apparition` du tout |
| `chantier.test.js:582` | `onglet-recherche`, `ecran-recherche` et les six ancres de l'écran entrent dans l'énumération des identifiants | un identifiant renommé d'un seul côté laisserait l'écran muet |
| `chantier.test.js:624` | la garde des onglets morts passe du NÉGATIF au POSITIF : les cinq boutons de la barre portent un identifiant et aucun n'est désactivé | une liste attendue vide aurait été vraie aussi le jour où quelqu'un écrirait un onglet mort SANS la classe `futur` — qui vient justement de disparaître |
| `chantier.test.js:664` | `['Recherche']` → `[]` | garde la trace du dernier mort dans le diff du lot |
| `raid.test.js` (migration v11) | l'assertion couvre la nouvelle forme de `etat.recherche` | le champ a gagné deux blocs |
| `reparation.test.js` | `assert.equal(SAVE_VERSION, 13)` → `assert.ok(SAVE_VERSION >= 13)` | l'égalité appartient au maillon de migration LE PLUS RÉCENT, pas aux anciens |

### Ce qui a été rendu à l'écran et cliqué

Chromium 1194, 360×740, `deviceScaleFactor: 2` (`hasTouch` pour le
parcours tactile), sur
`dist/index.html` — **0 erreur console sur tous les parcours**.

1. Chargement, onglet Recherche : l'écran s'affiche, l'onglet s'allume, les trois
   panneaux portent 14 / 17 / 4 lignes.
2. Les trois panneaux capturés (`offense`, `defense`, `special`) : sprites,
   modules en retrait, descriptions, raisons de refus.
3. Indicateur de position cliqué → `scrollLeft` 0 → 360, pastille active 0 → 1.
4. Glissement TACTILE (CDP `Input.dispatchTouchEvent`) → `scrollLeft` 360,
   pastille 1 : l'accrochage fonctionne au doigt.
5. Molette verticale dans un panneau → `scrollTop` 500 sur le panneau, rail à 0,
   `body` à 0 : le défilement vertical ne déplace pas le rail.
6. Achat du Pionnier en deux touchers : 400 000 → « Confirmer ? » (rien débité)
   → 387 500 points, « Acquis », et `belier` dans la sauvegarde.
7. Parcours complet sur une partie qui a ses deux bâtiments de commandement :
   palette Offense AVANT achat — Pionnier et Albatros « se débloque par la
   recherche », Fusiliers/Éclaireur/Épervier bloqués par leur BÂTIMENT ;
   achat du Pionnier (−12 500) puis du Chasseur (−300 000) ; palette APRÈS —
   Pionnier et Chasseur passent à « sans Dépôt de véhicules », Albatros reste sur
   la recherche.
8. Module Écraseur à 300 000 000 avec 1 687 500 points : le bouton est
   `disabled` et ne répond à aucun toucher.
9. Achat de la Barrière anti-char en défense (−200 000) → sa vignette du Chantier
   passe de « se débloque par la recherche » à « 5 points d'armée, poser au
   niveau 1 est gratuit », pendant que Canon anti-char, DCA, Mirador, Artillerie
   lourde et SAM restent verrouillés.
10. Onglet Mission : les prérequis disent « est déjà débloqué : il ne reste qu'à
    le poser » — cohérent avec les 3 gratuites du §4.5.

⚠ **CE N'EST PAS UN APPAREIL, ET IL FAUT LE DIRE.** Le §10 du brief demande neuf
parcours « sur appareil » ; aucun téléphone n'était joignable depuis la session.
Les dix parcours ci-dessus tournent dans Chromium à la fenêtre d'un téléphone,
sur le `dist/index.html` livré. Ce qu'ils NE couvrent pas : la WebView Android
réelle, les marges système du lot PANNEAU-ET-MARGES telles que l'appareil les
renseigne, la latence du doigt, et le rendu du pixel art à la densité réelle.
La géométrie, elle, est mesurée et pas jugée à l'œil : `body.scrollWidth`,
`scrollLeft`, hauteurs et positions sont relevés au DOM.

---

## 3. L'audit maquette, écart par écart

`node tools/audit-maquette.mjs` sort **AUDIT ROUGE — 7 écart(s)** avant comme
après. Aucun en plus, aucun en moins. Le brief interdisait de le réparer ici ;
il est consigné à l'identique :

1. `KO terrain`
2. `KO disposition légale`
3. `KO emplacements 11/12`
4. `KO débit quartz : +0/h`
5. `KO débit scorie : +0/h`
6. `KO débit electricite : +684/h`
7. `KO raffinerie : +176 quartz +352 scorie / h`

Les contrôles de teinte (33 lues, 23 balayées, aucune hors fiche, aucun rgba, ni
hex à 3 ou 8 chiffres) et « aucune référence externe » restent verts.

---

## 4. §3.4 — le calibrage de l'arbre, remesuré

Le §3.4 du brief prévient que l'arbre a été rempli quand les points de recherche
DOUBLAIENT par niveau, et qu'ils suivent depuis la courbe économique. Récolte
remesurée — un camp rasé, moyenne de 3 graines, assaut « mixte » au quadruple du
budget pour garantir le rasage :

| niveau du site | points de recherche |
|---|---|
| 1 | 30 |
| 5 | 75 |
| 10 | 629 |
| 15 | 4 925 |
| 20 | 29 063 |
| 25 | 156 189 |
| 30 | 741 630 |
| 39 | 11 135 435 |

Le rapport par niveau vaut **×1,51 entre 10 et 15**, puis **×1,43**, **×1,40**,
**×1,37**, **×1,34 entre 30 et 39** — il DÉCROÎT, et il n'a jamais valu 2.

Ce que ça donne face aux prix de l'arbre :

- la première pièce payante, le **Pionnier à 12 500**, se paie avec ~3 camps de
  niveau 15, ou un seul de niveau 20 ;
- l'**Albatros à 120 000 000** demande ~11 camps de niveau 39 ;
- son **module à 2 500 000 000** en demande ~225 ;
- le **Percheron en défense à 550 000 000** (arbitrage 6) en demande ~50.

⚠ **L'arbre haut est donc nettement plus loin que la courbe de ×2 sur laquelle il
a été rempli**, et l'écart se creuse avec le niveau. Ce n'est pas un défaut de ce
lot — les prix sont ceux du §3, recopiés sans les toucher — mais c'est la
grandeur à rouvrir en premier si le rythme déçoit en jeu. `data/recherche.js`
porte l'avertissement : les coûts y sont écrits en clair, sans constante
multiplicative et sans dérivation, pour qu'un réétalonnage soit une ligne du
fichier et jamais une formule à retrouver.

---

## 5. Ce qui reste ouvert

- **Treize modules sur quatorze sont définis et non câblés.** Ils s'affichent
  avec leur description et leur prix, et refusent l'achat par `effetNonCable`.
  Seul l'Écraseur agit. C'est le plus gros chantier qui suit ce lot.
- **La masse ×2 de l'Écraseur est inobservable** (T12bis). Elle attend une
  escouade de masse ≥ 5 ou un blindé de masse 1.
- **L'onglet Spécial n'a aucune mécanique.** La deuxième base n'existe pas —
  l'état ne porte qu'une `disposition`, et la bascule entre bases de la page se
  déclare elle-même « coquille assumée ». Les trois soutiens n'ont même pas de
  prix retenu : le classeur leur donnait un NIVEAU d'apparition, qui ne veut plus
  rien dire depuis que la recherche seule ouvre les pièces.
- **Le pic d'aviation au niveau 25**, qu'Ethan a accepté tel quel (arbitrage 5) :
  la Batterie de défense reste hors de portée avant ce pic.
- **Le canal `modulesDebloques.ouvrage` est mort** : `sim/generateur.js` le livre
  vide, donc le bonus de +20 % sur les points de recherche n'est jamais accordé.
  C'est ce qui rend l'effet des deux corrections du §3.3 nul aujourd'hui.
- **La notification de mise à jour** n'est pas dans le périmètre de ce lot.
- **L'audit maquette reste rouge** sur ses sept écarts, tels quels.

---

## 6. Ce que le brief interdisait, et qui n'a pas été fait

- `FOYER-ZERO-RECHERCHE.xlsx` **n'a pas été rouvert** : la table du §3 fait foi.
- L'audit maquette **n'a pas été réparé**.
- `art/` et `tools/*.py` **n'ont pas été touchés** ; `tools/verifier.py` n'a pas
  été lancé.
- La mécanique « plus une unité subit de dégâts, moins elle tape fort »
  (`degatsDUnTir`, `degatsDeFranchissement`) **n'a pas été rouverte** — elle est
  seulement citée, parce que c'est elle qui borne la fenêtre de mesure de T12.
- Les étapes 1 à 4 **n'ont pas été livrées sans l'étape 5** : le commit est
  unique et porte le lot entier.
- La PR est **ouverte, pas fusionnée**.
