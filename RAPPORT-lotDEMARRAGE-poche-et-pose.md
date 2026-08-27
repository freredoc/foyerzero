# RAPPORT — lot DÉMARRAGE : la partie devient jouable

> Trouvé en essayant d'écrire la pose, le 27/08 : **une base neuve ne pouvait
> rien produire, jamais.** Ce lot lève le blocage, ajoute la pose, et corrige
> les deux points relevés par Ethan à l'essai sur GitHub Pages.

---

## 1. Version et build produits

| | Avant (main) | Après |
|---|---|---|
| `version` · `config.build` | 0.14.0 · 14 | **0.15.0 · 15** |
| `dist/index.html` | 130 479 o, `60603a87…40f91` | **131 302 o**, `7deac539…ae6ed` |
| `npm test` | 282 pass / 0 fail | **286 pass / 0 fail** |
| `SAVE_VERSION` | 6 | **6** — inchangée |

**Bump requis** : le HTML change. Sous la borne de 200 000 octets de T10.

⚠ **`SAVE_VERSION` ne bouge pas, et c'est délibéré.** Rien n'est ajouté à
l'état : la poche du Chantier est une propriété de la TABLE, pas de la partie,
et une sauvegarde v6 la gagne au chargement sans conversion. Bumper aurait
imposé une migration qui n'aurait rien à migrer.

---

## 2. Le blocage — mesuré sur les quatre choix possibles

Un Chantier niveau 1 ouvre **2** emplacements et en occupe **1** : il en reste
**UN**. Or produire en demande **deux** — un producteur et un stockage. Simulé
24 h sur chacun des quatre bâtiments posables :

| Le seul bâtiment posable | Produit | Capacité | Après 24 h |
|---|---|---|---|
| Collecteur | 240/h de quartz | **0** | **0** |
| Raffinerie | — | 2 880 | **0** |
| Centrale | 120/h d'électricité | **0** | **0** |
| Accumulateur | — | 1 440 | **0** |

`capacitesMilli` ne comptait que la raffinerie et l'accumulateur ; sans eux le
plafond valait zéro, et `min(cap, stock + gain)` restait à zéro pour toujours.
Ouvrir un troisième emplacement demandait le Chantier niveau 2, qui coûte 8, que
le joueur ne pouvait pas obtenir. **La partie était instartable.**

⚠ **Ce n'était pas un défaut d'écran.** Les vérifications appareil 7, 9, 11 et
12 — celles qui prouvent le moteur — étaient inatteignables, et l'écran avait
raison de ne rien montrer qui monte.

### La réponse était déjà arbitrée, dans le classeur

Ethan a pointé `FOYER-ZERO-BATIMENTS-JOUEUR.xlsx`, feuille **EFFETS ligne 14** :

> Chantier de construction · **Stockage propre** · statut **MANQUANT** ·
> valeur TA relevée : **50 tib. + 50 cristal + 40 énergie**

Statut MANQUANT : la valeur existait, elle n'était jamais descendue dans
`src/data/`. Transcrite telle quelle en **50 quartz · 50 scorie · 40
électricité**.

⚠ **`CLAUDE.md` §1 interdit de lire un classeur pour coder**, et la règle tient :
la valeur n'a pas été *cherchée* dans le classeur, elle y a été *désignée* par
Ethan. C'est d'ailleurs la même feuille dont `data/economie.js` est déjà la
transcription.

### Mesuré : le verrou saute

Un collecteur seul remplit la poche en **12,5 minutes** et donne **50 quartz**.
Le Chantier niveau 2 en coûte **8**. Quatre emplacements, puis collecteur +
raffinerie, et la boucle s'amorce.

### Un arbitrage laissé ouvert

**La poche est PLATE** : elle ne suit pas le niveau du Chantier. Le classeur ne
donne aucune courbe, et c'est cohérent — 50 devient négligeable dès la première
raffinerie (2 880 au niveau 1). C'est une poche de démarrage, pas un canal de
stockage. Un test l'asserte de face ; si elle doit monter, c'est un arbitrage à
part.

⚠ **Le champ `stockagePropre` est générique**, pas un cas particulier du
Chantier : n'importe quel bâtiment pourra en porter un. Il est lu **avant** le
filtre de rôle, parce que le Chantier reste `role: 'central'` — `capaciteDuNiveau`
calcule douze heures de production du producteur APPARIÉ, et le Chantier n'en a
pas.

---

## 3. La pose

`poser(etat, id, rangee, colonne)` et `problemesDeLaPose` vivent dans
`sim/state.js`.

⚠ **POSER NE COÛTE RIEN, et c'est pourquoi la pose n'attendait aucun
arbitrage.** `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2 : le niveau 1 est
gratuit pour les onze. Le premier coût est celui de l'AMÉLIORATION, et c'est
elle — pas la pose — qui bute sur la répartition quartz/scorie. J'avais annoncé
le contraire ; c'était faux.

⚠ **Aucune règle de pose n'est réécrite.** La légalité d'une pose est celle de
la disposition qui en résulterait : on construit la candidate et on la soumet à
`problemesDeDisposition`, qui sait déjà tout dire — case occupée, hors base,
collecteur hors champ, champ gâché, exemplaire en trop d'un `unique`,
emplacements dépassés. Une seconde liste de règles finirait par diverger.

⚠ **Les défauts PRÉEXISTANTS sont filtrés.** Une base amputée par un raid doit
rester constructible : faire remonter ses propres défauts sur chaque pose
enfermerait le joueur pour des fautes qui ne sont pas les siennes.

⚠ **Deux fonctions, et la différence est celle du dépôt.** `problemesDeLaPose`
rend une LISTE — une pose refusée est un fait de JEU, le joueur a visé une case
prise. `poser` LÈVE — appelée sans avoir regardé, c'est un fait de PROGRAMME.

⚠ **Le résidu suit le bâtiment.** Poser sans allonger `economie.residus` fait
lever le TICK suivant, pas la pose, donc loin de la faute. Le test le mesure par
un tick complet, pas par une longueur.

---

## 4. Les deux corrections d'Ethan

**La pastille de pose disparaît.** Elle a porté `COUT_NIVEAU_DEUX` en chiffre nu
— « 3 » sur un Collecteur, qui se lit « poser coûte 3 » — puis le mot
« gratuit ». Douze vignettes qui disent toutes la même chose ne disent plus
rien, et la place manque à 82 px. Le fait reste **dit**, dans le titre de la
vignette, là où on le cherche. Le coût de la première amélioration reste rendu
par `posablesDeLaBase` : l'écran des améliorations l'aura sous la main.

**Le bouton retour passe en bas à droite**, à la place exacte de l'aller.
`#offense-barre` reprend la hauteur et le filet de `#chantier-bandes`. Un aller
en bas et un retour en tête obligeaient le pouce à traverser l'écran pour faire
deux fois le même geste.

---

## 5. Six tests ont dû être repris, et pas en changeant leurs nombres

La poche change toute capacité d'une base qui porte un Chantier, c'est-à-dire
toutes. Six montages gardaient des valeurs calculées sans elle.

**Aucun nombre n'a été recopié à la main.** Les montages **lisent** désormais
`BASE_BATIMENTS.chantierDeConstruction.stockagePropre` et ajoutent sa
contribution : le jour où la valeur bouge, ils suivront seuls. C'est exactement
ce qui a manqué ce jour-là.

Un cas méritait mieux qu'un recalcul : une assertion disait « une base sans
stockage a une capacité de zéro » **en le montrant sur un Chantier seul**. Le
Chantier n'illustre plus le propos. L'intention est gardée — pas d'infini
implicite — et montrée sur une caserne ; deux assertions neuves disent que le
Chantier seul vaut **exactement** sa poche, et qu'elle est plate.

⚠ `foyer-zero-ui.html` a suivi : ses capacités passent à 7 082 / 7 082 / 2 296.
Les débits ne bougent pas d'une unité — une poche stocke, elle ne produit pas.
`tools/audit-maquette.mjs` est vert.

---

## 6. Falsification — huit défauts injectés, huit attrapés

| # | Défaut injecté | Résultat |
|---|---|---|
| S1 | la poche disparaît de la table | **rouge**, 5 tests |
| S2 | la poche n'est plus comptée par `capacitesMilli` | **rouge**, 5 tests |
| S3 | la poche suit le niveau du Chantier | **rouge**, 5 tests |
| S4 | la poche vaut 5 au lieu de 50 | **rouge** |
| P1 | une pose illégale n'est plus refusée | **rouge** |
| P2 | le résidu n'est pas ajouté à la pose | **rouge** |
| P3 | la pose prélève des ressources | **rouge** |
| P4 | les défauts préexistants ne sont plus filtrés | **rouge** |

---

## 7. Les vérifications appareil

Ethan a exécuté les douze de la PR 13 le 27/08 : **1, 2, 3, 4, 5, 6, 8, 10
passées**. Le 7 a révélé le blocage de ce lot. Les **9, 11 et 12** étaient
inatteignables — sans production, rien à observer.

**Les quatre restent dues, et elles sont maintenant atteignables** :

| # | Vérification | État |
|---|---|---|
| 7 | les stocks montent en regardant l'écran | **NON EXÉCUTÉE** |
| 9 | l'économie a tourné pendant le passage à l'Offense | **NON EXÉCUTÉE** |
| 11 | fermer l'app, attendre, rouvrir → les stocks ont avancé | **NON EXÉCUTÉE** |
| 12 | replier seulement, sans fermer → même résultat | **NON EXÉCUTÉE** |

⚠ **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais passé.** Aucun
appareil dans cette session.

⚠ **Et il faut poser un collecteur pour que 7, 11 et 12 mesurent quelque
chose** — or la pose n'est pas encore branchée à l'écran. Voir §8.

Deux de plus, propres à ce lot :

13. aucune vignette de pose ne porte de pastille ;
14. le bouton « ← Base » tombe sous le pouce à la place exacte de « Offense → ».

---

## 8. Ce que ce lot ne fait pas

- **Brancher la pose à l'écran.** `poser` existe et est testée ; la palette
  reste désactivée. C'est un lot DOM, et il rendra les vérifications 7, 11 et 12
  réellement exécutables.
- **Améliorer et démonter.** L'amélioration attend la répartition quartz/scorie
  d'un coût ; le démontage attend de savoir s'il rend quelque chose.
- **La progression de la poche avec le niveau** (§2), arbitrage ouvert.
- **Les couleurs de terrain de la fiche v4**, toujours non arbitrées.
