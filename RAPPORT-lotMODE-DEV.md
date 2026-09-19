# RAPPORT — lot MODE-DEV (19/09/2026)

Mode développeur commutable depuis l'écran Options, et sauvegarde exportable /
importable en texte hexadécimal.

**Version et build réellement produits : `0.99.66` · build `178`.**
`dist/index.html` change, donc le bump est dû (§5). `dist/` n'est pas commité —
la CI le rebâtit dans le job Pages.

**Base de départ :** `main` à `555ae32` (« lot moult fix »), version 0.99.65 ·
build 177, `SAVE_VERSION` 37. `npm run check` relevé AVANT de toucher quoi que
ce soit : **1 638 pass · 0 fail · 1 skipped**, conforme à ce que CLAUDE.md §0
annonçait.

**Après le lot :** `npm run check` rend **1 640 pass · 0 fail · 1 skipped**,
soit **1 641** au sens de la garde de `documentation.test.js`.

---

## 1. Les arbitrages d'Ethan, et ce qu'ils ont donné

| # | Question | Réponse | Ce qui a été fait |
|---|---|---|---|
| 1 | Périmètre des gratuités | **(d)** tout péage du dépôt | huit péages levés, inventaire au §2 |
| 2 | Lever aussi les verrous non monétaires | **non** | `plafond-commandement`, `abimee`, `sans-batiment-de-production`, budget d'armée : tous intacts |
| 3 | Déplacement | **délai** seulement | portée, voisinage et territoire tenu intacts |
| 4 | Drapeau dans `etat`, bump 37 → 38 | **ok** | maillon 37 → 38 qui pose `false` |
| 5 | Export avec le journal des raids | **avec** | la sauvegarde part entière, `serialiser` telle quelle |
| 6 | gzip avant hexadécimal | **ok** | `CompressionStream('gzip')` puis hex |

---

## 2. Les huit péages, et où la franchise est posée

| Péage | Fichier | Refus levé | Débit sauté |
|---|---|---|---|
| Amélioration d'un bâtiment | `sim/state.js` | `manque:<ressource>` | la boucle de `ameliorer` |
| Amélioration d'une pièce | `sim/state.js` | `manque:<ressource>` | la boucle de `ameliorerEffectif` |
| Achat de recherche | `sim/recherche.js` | `pointsInsuffisants` | `pointsMilli` n'est pas réécrit |
| Droit de fonder une base | `sim/recherche.js` | `pointsInsuffisants` | idem — et `problemesDeLaFondation` en hérite |
| Points d'attaque d'un raid | `sim/prix-du-raid.js` + `sim/raid.js` | `points-insuffisants` | `coutDUnRaid` rend 0, `payer` n'est pas appelé |
| Réparation d'une pièce | `sim/reparation.js` | `reserve-insuffisante`, `scorie-insuffisante` | réserve et scorie intactes, retour à 0 |
| Réparation d'un bâtiment | `sim/reparation.js` | `reserve-insuffisante`, `quartz-insuffisant` | réserve et quartz intacts, retour à 0 |
| Taxe de transfert | `sim/transfert.js` | — | `recuMilliPourLaPartie` rend l'envoyé entier |
| Délai de déplacement | `sim/deplacement.js` | `delai` | `ticksAvantProchainDeplacement` rend 0 |

Les deux « tout réparer » (`problemesDeToutReparer`,
`problemesDeToutReparerLesBatiments`) portent la même garde : sans elle, le
bouton global serait refusé pendant que chaque pièce se répare gratuitement une
par une — deux réponses pour une même question.

### Ce qui n'était pas un péage, et pourquoi la construction n'y est pas

`poserEffectif` le dit depuis le 28/08 : **« POSER NE COÛTE RIEN,
`ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2 »**, et `poser` ne touche aucune
ressource. Il n'y avait donc aucun coût de construction à supprimer. Ce qui
bloque une construction, ce sont des VERROUS — emplacements du Chantier,
voisinage unique, champs et obstacles, bâtiment de production, budget de points
d'armée (contrôlé dans `ui/offense.js`, pas dans le moteur) —, et l'arbitrage 2
les laisse tous en place.

**Conséquence à connaître avant de la découvrir en jouant :** en mode
développeur, monter une pièce exige toujours un Centre de commandement de niveau
suffisant, et une pièce abîmée doit d'abord être réparée — gratuitement, mais
dans cet ordre. Le premier jet de `MODE-DEV T1` est tombé là-dessus ; le refus a
eu raison, le test a été corrigé.

---

## 3. Décisions de structure

### Le drapeau est dans `etat`, pas dans le magasin de réglages

Le son et le volume vivent dans `CLE_REGLAGES` parce qu'ils ne sont pas des
faits de partie. **Aucun module de `src/sim/` ne lit ce magasin**, et les huit
péages y vivent : le drapeau devait donc voyager dans l'état. `SAVE_VERSION`
passe à 38 ; le maillon **n'est pas vide** — il pose `modeDeveloppeur: false`,
parce que l'écran d'options lit le champ pour peindre l'interrupteur là où
`enModeDeveloppeur` en tolère l'absence.

Coût mesuré : **+24 octets fixes** par sauvegarde (`,"modeDeveloppeur":false`),
identiques sur les vingt-cinq graines de `BASES-0 T1`.

### `src/sim/mode-developpeur.js` — un prédicat, sans aucun import

Six modules de `sim/` posent la même question et trois s'importent déjà entre
eux. Loger le prédicat dans `state.js` aurait fait remonter `deplacement.js` et
`transfert.js` vers le moteur d'état, c'est-à-dire ouvert un cycle. Même motif
que `base-courante.js`, `saveur.js` et `batiment-de-production.js`.

### Trois franchises sont posées chez l'autorité du nombre, pas au refus

- `ticksAvantProchainDeplacement` rend zéro. Elle a deux lecteurs — le refus
  `delai` et `ui/monde.js` qui **peint** l'attente. Poser la franchise dans le
  refus aurait laissé la carte annoncer « il reste 3 h 20 » au-dessus d'un
  bouton qui marche.
- `recuMilliPourLaPartie` (nouvelle, privée à `transfert.js`) est lue par le
  contrôle de débordement **et** par l'aperçu. Une seule des deux aurait suffi à
  faire refuser pour débordement un transfert que l'écran annonce comme passant.
  `recuMilli` reste pure et exportée : c'est le barème, et son test l'éprouve
  sur des nombres seuls.
- **`coutDUnRaid` rend 0**, et c'est la correction que la relecture adverse a
  imposée. Le premier jet posait la franchise dans `executerRaid` seule : la
  facture tombait bien à zéro, mais `coutDUnRaid` est la **seule autorité du
  prix** — `ui/monde.js` et `ui/raid.js` l'appellent une fois chacun, et deux
  tests gardent ce compte —, si bien que la carte et l'écran de raid auraient
  continué d'annoncer « ce raid coûte 11 points » au-dessus d'un raid gratuit.
  Déplacée dans le barème, la franchise fait du prix annoncé, du prix facturé et
  du prix journalisé un seul et même fait.
  ⚠ Le garde de `problemesDuRaid` **reste** en plus, et il n'est pas redondant :
  le barème rend zéro, et `manquePourPayer` exige un entier ≥ 1 — elle lèverait.
- **Zéro, pas `null`.** `null` veut dire « ce raid n'a pas de prix » et fait se
  CACHER le panneau ; zéro se lit « gratuit ». C'est la convention que le
  commentaire de `ciblageDuSite` énonce déjà dans `ui/monde.js`.

### La franchise LÈVE, elle ne CRÉDITE pas

C'est le cœur du lot et la réponse à « vérifier que le désactiver remet bien
tout proprement » : **rien n'est écrit dans l'état**. Éteindre le drapeau
refacture tout au geste suivant, il n'y a rien à défaire. Un mode qui
remplirait les stocks aurait été irréversible.

---

## 4. L'écran Options

### Le bloc amovible

`<div id="options-bloc-dev">…</div>` se retire seul. **Tout le câblage de
`session.js` teste `!== null` avant de poser le moindre écouteur** — sans ça,
`$('options-mode-dev').addEventListener` lèverait sur `null` au câblage,
c'est-à-dire que le jeu entier ne démarrerait plus.

Vérifié au navigateur, bloc retiré puis rebâti : le jeu démarre, le Chantier se
peint, l'interrupteur a disparu, l'export survit, `#options-zero` est toujours
là, zéro erreur console.

⚠ **Éteindre le mode AVANT de retirer le bloc.** Une partie sauvegardée allumée
le reste, et il n'y aurait plus d'interrupteur pour l'éteindre.

### Export / import

Bloc **séparé** du mode développeur, et volontairement : l'import est ce qui
répare une partie perdue ; le mettre derrière un interrupteur qu'on retire un
jour ferait disparaître le remède avec l'outil de debug.

L'import demande confirmation en deux temps, comme « Effacer et recommencer »,
et **passe par `charger` puis `installer`** — les mêmes fonctions que `demarrer`
et `partieNeuve`. `sim/state.js` nommait déjà ce danger ligne 560 : « un second
point d'entrée — import, éditeur, outil de debug — qui fabriquerait un état sans
passer par `charger` ». Il ne le fabrique pas.

Aucune adresse, aucun réseau, aucun sélecteur de fichiers : le texte passe par un
`textarea` et le presse-papier. La garde offline de `tools/build.js` reste verte.

---

## 5. Le codec — les mesures

Sauvegarde d'une partie jouée à trois rapports au journal :

| Forme | Caractères |
|---|---|
| JSON brut | 12 932 |
| hexadécimal du JSON brut | **25 864** (× 2) |
| gzip → base64 | 2 744 |
| **gzip → hexadécimal** | **4 134** (32 % du JSON) |

**L'hexadécimal seul double la taille.** C'est la compression qui raccourcit,
et `MODE-DEV T2` refuse un texte plus long que `2 × JSON` : un codec qui
sauterait gzip passerait l'aller-retour sans que rien ne le dise.

Le base64 a été écarté en le sachant — 33 % plus court, mais il porte `+`, `/`,
`=` et la casse. Le texte est fait pour être collé à la main depuis un
téléphone.

⚠ Sur une sauvegarde **neuve** (1 237 caractères de JSON), le gain est nul :
1 212 caractères. gzip n'a rien à mordre sur si peu. C'est normal et sans
conséquence — le cas qui compte est la partie avancée.

Format : deux octets de marque (`f0 01`) puis la charge gzip, le tout en
hexadécimal minuscule. La marque est **dans les octets**, pas devant le texte,
pour que la sortie reste purement hexadécimale.

Cinq refus nommés en français, tous mesurés :

| Entrée | Message |
|---|---|
| texte vide | « Le texte collé est vide. » |
| non-hexadécimal | « Ce texte n'est pas de l'hexadécimal : … » |
| longueur impaire | « Ce texte est incomplet : … nombre impair de caractères. » |
| marque étrangère | « Ce n'est pas une sauvegarde de Foyer Zéro. » |
| tronqué | « Cette sauvegarde est abîmée ou incomplète : … » |

⚠ Un piège payé pendant l'écriture : sur un texte tronqué, le flux casse des
**deux** côtés. La lecture lève — c'est la levée qu'on veut —, et l'écriture
rejette de son côté sans personne pour l'attendre. Le rejet partait en
`unhandledRejection`, hors de tout `try`, et **tuait le processus après** que le
refus ait été correctement affiché : `Z_BUF_ERROR`, pile illisible. La promesse
d'écriture est donc neutralisée dès sa création dans `parLeFlux`.

---

## 6. Tests

Deux tests, sur les deux verrous du lot.

**`MODE-DEV T1`** — la franchise lève les huit péages, n'écrit rien, et ne lève
rien d'autre. Le montage est une partie **fauchée** : cinq monnaies à zéro, une
pièce abîmée, un déplacement tout juste contracté, une seconde base à vingt
cases. Chaque péage est d'abord mesuré **actif**, mode éteint — sans cette
moitié, le test pourrait mesurer une partie riche au lieu d'une franchise.
Porte aussi les contre-assertions : `dejaAcquise`, `sur-place` et `abimee`
doivent **tenir**.

**`MODE-DEV T2`** — le texte portable revient à l'octet (SHA-256), tolère les
retours à la ligne et les majuscules, est plus court que `2 × JSON`, et refuse
les cinq entrées ci-dessus.

### Falsification, jouée dans trois directions

| Falsification | Résultat |
|---|---|
| prédicat forcé à `false` | `T1` rouge — « péage 1 : le bâtiment se paie encore » |
| prédicat forcé à `true` | `T1` rouge sur les contre-assertions |
| compression retirée du codec | `T2` rouge — « 7 498 caractères pour un JSON de 3 747 » |
| franchise retirée de `coutDUnRaid` | `T1` rouge — « payer : 11 points demandés, 0 disponibles » |

### Vérification au navigateur (hors `npm run check`)

`dist/index.html` servi en HTTP, Chromium à la géométrie du S25 FE
(1080 × 2340, DPR 3). Seize vérifications, toutes vertes : démarrage sans
erreur console, ouverture des Options, bascule de l'interrupteur, écriture du
drapeau dans `localStorage`, export hexadécimal, extinction, import du texte
exporté (le drapeau revient avec), retour au Chantier, refus d'un texte invalide
avec la partie en cours **intacte**. Seul 404 observé : `/favicon.ico`, demandé
par Chromium et non par la page.

---

## 7. Réancrages — sept, aucun assouplissement

| Test | Avant | Après | Raison |
|---|---|---|---|
| `B4 T7` | `SAVE_VERSION, 37` | `38` | épingle du maillon le plus récent |
| `FR T3` | `SAVE_VERSION, 37` | `38` | idem |
| `JRN T10` | `SAVE_VERSION, 37` | `38` | idem |
| `RCU T12` | `SAVE_VERSION, 37` | `38` | idem |
| `PD T10` | `SAVE_VERSION, 37` | `38` | idem |
| `MODULES-PIÈCE T1` | `SAVE_VERSION, 37` | `38` | idem |
| `BASES-0 T1` | 7 termes d'octets | 8 | `OCTETS_AJOUTES_PAR_MODE_DEV = 24` |

Aucune borne n'a été baissée, aucune assertion supprimée. Le compte d'assertions
ne fait qu'augmenter : 1 639 → 1 641 tests déclarés.

---

## 8. Ce qui n'est PAS dans ce lot

- **Aucun crédit de ressources, aucun « donner 1 M de quartz ».** Le mode lève
  des péages ; il ne remplit rien. C'est ce qui rend son extinction propre.
- **Aucun verrou non monétaire levé** — arbitrage 2, « non ».
- **La portée du déplacement, le voisinage et le territoire tenu ne bougent
  pas** — arbitrage 3, « délai » seulement.
- **`stock-insuffisant` et `debordement` du transfert restent.** Envoyer plus
  qu'on n'a, ou déborder la capacité de la destination, n'est pas un péage :
  c'est une impossibilité et une règle de capacité.
- **Aucun export vers un fichier**, aucun partage, aucune adresse. Presse-papier
  seulement.
- **Rien côté Android.** L'enveloppe ne change pas, `MiseAJour.kt` non plus.
- **Le banc d'essai n'est pas touché.** L'appui long de 1,5 s sur le numéro de
  version reste sa seule porte.

---

## 9. Points laissés en suspens

1. **Le budget de points d'armée est contrôlé dans `ui/offense.js` et
   `ui/defense.js`, pas dans le moteur.** L'arbitrage 2 dit de ne pas le lever,
   donc ce lot n'y touche pas. Si tu changes d'avis un jour, c'est là que ça se
   passe, et ce sera un lot d'écran, pas de moteur.
2. **L'interrupteur n'a pas d'avertissement au premier allumage.** Il dit ce que
   le mode fait, en prose, au-dessus du bouton. Si tu veux une confirmation en
   deux temps comme « Effacer et recommencer », c'est trois lignes de plus — mais
   le mode est réversible, là où l'effacement ne l'est pas.
3. **L'export ne date pas la sauvegarde dans son texte.** `instantSauvegardeMs`
   est dedans, mais il faut décoder pour le lire. Un préfixe lisible aurait cassé
   la promesse « purement hexadécimal ».
