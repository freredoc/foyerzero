# Rapport — lot 3A : banc d'essai de combat

## Version livrée

| | |
|---|---|
| `version` | **0.5.0** (était 0.4.0) |
| `config.build` | **5** (était 4) |
| Build produit | `dist/index.html` — version 0.5.0 build 5 — **50 025 octets (48,9 Kio)** |
| `npm run check` | **PASS** — build **et** 88 tests, 0 échec |

Le livrable était de 2,9 Kio avant ce lot : les 46 Kio ajoutés sont le moteur entier, le
générateur, le rendu et le banc, dans un seul fichier hors ligne.

---

## Ce qu'il faut regarder en premier sur l'appareil

Trois raids à graine fixe, tous en `riche en quartz`, à saisir dans le banc. **B et C jouent
exactement le même site** — camp, niveau 15, graine 1 — avec deux assauts : c'est la
comparaison pour laquelle le banc existe.

| | Paramètres | Résultat |
|---|---|---|
| **A — l'assaut d'infanterie qui échoue** | avant-poste · niveau 15 · graine 1 · Infanterie | cause `attaquants` au tick 315 — 16 unités engagées, **0 survivant, 0 butin**. Les quatre vagues meurent dans la bande de défense. |
| **B — l'assaut lourd qui perce** | camp · niveau 15 · graine 1 · Blindé lourd | cause `souche` au tick 329 — 7 unités, 4 survivants, **butin intégral 215 130 quartz + 71 710 scorie**. Les Percherons écrasent la garnison et abattent la Souche. |
| **C — l'expiration au tick 900** | camp · niveau 15 · graine 1 · Infanterie | cause `duree` — 6 survivants grignotent 65 190 quartz + 21 730 scorie en 90 s, sans conclure. Le même site que B : l'infanterie n'y meurt pas, elle n'y **finit** pas. |

Premier constat que le banc rend visible (et qui rejoint le suspens du lot 2B sur l'échelle de
la recherche) : dès le niveau 15, le panneau de fin affiche des **millions** de points de
recherche (A : 1 042 647 ; B : 2 212 026). Le ×2 par niveau se voit maintenant à l'écran.

Au pas à pas, regarder aussi : les traits de tir jaunes des Obusiers sur l'Étai et la Souche
(anti-structure), les rouges des Percherons (anti-véhicule), et la réserve qui s'immobilise à
son plancher face aux murs puis se vide sur les bâtiments.

---

## Fichiers

| Fichier | Lignes | Nature |
|---|---|---|
| `src/render/projection.js` | 86 (neuf) | grille ↔ pixels, letterboxing, taille de case — PUR |
| `src/render/interpolation.js` | 115 (neuf) | accumulateur à pas fixe, position interpolée — PUR |
| `src/render/scene.js` | 311 (neuf) | état + alpha → liste d'affichage, palette — PUR |
| `src/render/canvas2d.js` | 48 (neuf) | exécute une liste d'affichage — mince, aucune décision |
| `src/ui/banc.js` | 388 (neuf) | préréglages et exécution headless (purs) + tout le DOM |
| `src/index.src.html` | 142 (réécrit) | la page du banc : contrôles, canvas, panneaux |
| `test/rendu.test.js` | 449 (neuf) | T1 à T7 |
| `test/banc.test.js` | 202 (neuf) | T8, T10, balayages du §11 |
| `FICHE-STYLE.md` | §2 corrigé | 9 × 18, deux rangées de déploiement (voir plus bas) |
| `package.json` | version + build | rien d'autre |

Aucun fichier de `src/sim/` ni de `src/data/` n'est touché. Aucun `.xlsx` ouvert.

---

## Résultat de chaque test

`node --test` — **88 tests, 88 PASS.** Les 13 nouveaux :

| Test | Résultat | Montage effectivement joué |
|---|---|---|
| **T1** projection | **PASS** | 412 × 900 → case 45, marges 3/45 ; 412 × 800 (HUD > 90 px) → 44, la hauteur commande ; 360 × 640 → 35 ; 800 × 800 → 44. Marges ≥ 0, symétriques au pixel près, grille jamais hors canvas, rangée 18 en haut, position 18 950 bornée à la grille. |
| **T2** accumulateur | **PASS** | 900 images de 100 ms à ×1 → 900 ticks, résidu 0 ; 250 ms → 2 ticks + 50 ms (alpha 500) ; 100 ms à ×4 → 4 ticks ; 600 000 ms coupés à 250 ; résidu gonflé à 10 000 ms → 10 ticks et résidu **abandonné**. |
| **T3** interpolation | **PASS** | alpha 0 → précédent, 1000 → courant, 500 → milieu entier (2000/2075 → 2037). Une entité absente de l'instantané se dessine à sa position courante (scène comparée : figure à margeY+722 interpolée contre +721 sans instantané). Largeur de barre de PV identique aux alphas 0 et 999. |
| **T4** le rendu ne mute rien | **PASS** | Raid complet du montage de scène, liste d'affichage construite trois fois par tick (alphas 0, 500, 999), état sérialisé identique octet pour octet à chaque tick. Et les deux faits du §5 asseyés en continu : indices stables, colonnes immuables. |
| **T5** liste d'affichage | **PASS** | Montage à une entité par classe : 53 primitives au tick 0, comptées classe par classe (le calcul est dans le test). Fond premier et pleine surface, obstacles avant les entités, bâtiments avant unités, unités avant barres, traits en queue. Scène pure (deux appels → listes égales) ; un Merlon tué retire exactement mur 2 + barre 2. |
| **T6** couleur = colonne de matrice | **PASS** | 14 unités + 9 défenses : accent = colonne dominante recalculée indépendamment, unicité de la dominante assérée, teintes dans les trois paires de la fiche. Perceurs et Bélier → jaune, Guetteur → blanc (accent indépendant du camp), Batterie → jaune, Merlon et bâtiments → aucun accent. Puis 40 ticks de scène : toute couleur émise ∈ palette. |
| **T7** canvas sans canvas | **PASS** | Contexte enregistreur : les 4 formes → séquence exacte de 15 appels, assérée entrée par entrée ; forme inconnue → levée ; scène réelle : fillRect = nb de rect, strokeRect = nb de cadre, arc = nb de disque, stroke = nb de ligne. |
| **T8** rejouabilité | **PASS** | avant-poste 15, graine 42, Mixte : deux exécutions complètes au travers de l'accumulateur → mêmes ticks, cause, butin, points, et état final entier (`deepEqual` du résultat). **La vitesse ×4 rend le même état final que ×1.** Cinq graines → au moins deux butins distincts. |
| **T9** non-régression | **PASS** | Les 75 tests des lots 1, 1C, 2A, 2B, sans modification. |
| **T10** build hors ligne | **PASS** | `tools/build.js` relancé par le test, HTML rebalayé indépendamment de la garde : aucune URL, aucun `src`/`href` non-`data:`, contrôles du banc embarqués. Taille consignée : 50 025 octets. |
| préréglages | **PASS** | Les 3 assauts × {camp 5, avant-poste 30, base 50} passent `creerCombat`. |
| registres de noms | **PASS** | `meute` → « Fusiliers » côté assaut, « Meute » côté Ouvrage ; toutes les causes libellées ; formats PV et points (BigInt jusqu'à 2^60 sans passage par Number). |
| balayages §11 | **PASS** | Aucun `Math.random` ni horloge murale dans tout `src/` (commentaires exclus du balayage) ; `src/render/` sans un mot de DOM ; **toute teinte de `src/render/`, `src/ui/` et de la page ∈ palette de la fiche** (transcrite indépendamment dans le test), seule `rgba(0,0,0,0.31)` admise en non-hex ; DPR plafonné à 2. |

### Vérification sur navigateur réel

Hors du protocole de test (le brief ne l'exigeait pas), la page produite a été conduite dans
Chromium en 412 × 900, **réseau coupé** (toute requête = échec) : chargement, raid B lancé à
×4, pas à pas (un tick exact, panneau de 31 lignes), fin au tick 329 avec exactement les
chiffres du headless, **Rejouer → panneau de fin identique au caractère près**, zéro erreur de
console, zéro requête réseau. Deux captures d'écran jointes à la PR n'étant pas possibles dans
le dépôt, les valeurs sont consignées ici.

---

## Écarts par rapport au brief, et leurs raisons

1. **La fiche ne contient pas les jeux `ennemi_pale` / `ennemi_sombre`.** Le §7 du brief les
   annonce ; la fiche réelle dit « l'ennemi reçoit sa propre rampe 5 tons, **à définir** » et la
   liste en dette DA. Inventer une rampe est interdit (« aucune teinte hors palette »). Retenu :
   l'Ouvrage entier — structures, bâtiments, unités mobiles de garnison — se dessine dans la
   **rampe MÉTAL** de la fiche (`#1E2124`/`#3E454C`/`#68727E`), le joueur dans la rampe kaki.
   C'est dans la palette, et cohérent avec la description du Dard (« anodisé sombre »).
   **Provisoire**, à remplacer quand la rampe ennemie sera arbitrée.
2. **Le blindé est allongé verticalement, pas « plus large que haut ».** Le tableau du §7 du
   brief contredit la fiche §4 (« empreinte allongée verticalement, caisse + deux chenilles
   claires »). La fiche fait autorité sur la règle de lisibilité (§1 du brief) : caisse
   verticale entre deux chenilles métal clair, bandeau d'accent transversal.
3. **« Une primitive par entité vivante » (T5) est lu comme « un dessin par entité ».** Une
   escouade d'une seule primitive ne peut pas être « plusieurs petits éléments groupés » — les
   deux phrases du même brief se contredisent. Chaque entité émet le nombre de primitives de sa
   classe, figé dans `NB_PRIMITIVES` (escouade 6, blindé 4, aéronef 3, mur 2, barrière 3,
   tourelle 4, artillerie 5, bâtiment 2), et T5 assied les comptes exacts.
4. **Le plafond de ticks par image est hors d'atteinte par le chemin public.** Avec le plafond
   de rattrapage à 250 ms, la demande vaut au plus 10 ticks à ×4 — exactement la limite. C'est
   une défense en profondeur (elle tient si le plafond de rattrapage bouge un jour) ; T2
   l'éprouve en gonflant le résidu à la main, et le commentaire du module le dit.
5. **L'ombre portée de l'aéronef est un disque, pas une ellipse.** Approximation vectorielle du
   banc ; l'ellipse appartient aux sprites (lot 3B). Le décalage — seul signal d'altitude selon
   la fiche §6 — est là.
6. **`visibilitychange` met en pause et ne reprend pas tout seul.** Reprendre à l'insu de
   l'observateur recréerait ce que la pause supprime ; le bouton Reprendre est à un doigt.
7. **Une position au-delà de la rangée 18** (stoppeur arrêté à 18 950) est **bornée** au bord
   haut de la grille au dessin : la géométrie linéaire la mettrait au-dessus du champ.

### Choix faits là où le brief ne tranche pas

- **Fond de champ `#161914`** — prescrit par le brief comme provisoire, et signalé tel :
  aucune teinte de terrain n'existe dans la fiche, elles appartiennent au lot des sprites.
- **Obstacles en `#343A2C`** (ombre de corps kaki) : le seul « aplat sombre » de la palette qui
  reste lisible sur le fond `#161914`.
- **Barres : PV en `#8C9A72`, réserve en `#68727E`**, fond `#161914`. Jamais un accent — la
  fiche interdit d'employer une couleur d'accent pour autre chose que la cible.
- **Traits de tir dans la couleur claire de l'accent du tireur** : c'est la règle de la fiche
  §4 (« la bouche du canon reprend la couleur claire de l'accent »), et le trait dit ainsi ce
  que le tireur chasse.
- **L'interface s'habille en kaki et métal uniquement** : les trois accents restent réservés
  aux entités.
- Le panneau de pas à pas affiche **les deux registres de noms** selon le camp — « Fusiliers »
  à l'assaut, « Meute » à l'Ouvrage — sans jamais les mélanger dans une chaîne.

---

## `FICHE-STYLE.md` — correction faite

Le §2 annonçait un champ de **9 × 20** avec quatre lignes de déploiement. Corrigé en
**9 × 18** — bâtiments 11–18, défense 3–10, déploiement 1–2, rangée 1 en bas — avec une note
datée renvoyant à `GRILLE.bandes` de `src/data/combat.js`, qui fait foi. Rien d'autre n'a été
touché : palette, grille de sprite 32 × 32 et règle forme/couleur intactes.

---

## Points laissés en suspens

1. **La rampe ennemie 5 tons** reste à définir (dette DA de la fiche). Le banc l'attend : le
   jour où elle existe, c'est une entrée de `PALETTE` et la fonction `corpsDe` à ajuster.
2. **Les teintes des 7 terrains** — lot des sprites ; le fond uni est provisoire.
3. **L'échelle des points de recherche est maintenant visible** : des millions dès le niveau 15
   sur le panneau de fin. L'arbitrage ×2 contre ×1,32 (suspens du lot 2B) a désormais son
   instrument d'observation.
4. **Le banc ne borne pas la composition d'assaut** : pas de budget de points d'armée, pas de
   niveaux de déblocage côté joueur — c'est un instrument, la contrainte appartient à la
   campagne. Les trois préréglages suffisent aux arbitrages listés.
5. **Sons, animations de tir, sprites** : hors périmètre, lots suivants.

---

## Les sept contrôles du §11

| Contrôle | État |
|---|---|
| Aucune décision de rendu dans `canvas2d.js` | **OK** — 48 lignes, un `switch` d'exécution ; T7 assied la séquence d'appels exacte. |
| Aucun `Math.random` nulle part dans `src/` | **OK** — balayage de tous les `.js` de `src/` et de la page, commentaires exclus ; la graine est saisie, jamais tirée. |
| Aucune teinte hors de la palette de la fiche | **OK** — balayage hex + rgba de `src/render/`, `src/ui/` et de la page contre la palette transcrite indépendamment dans le test. |
| `TICK_MS` lu depuis `clock.js` | **OK** — importé par `interpolation.js` ; T2 assied `intervalleMs(1) === TICK_MS`. |
| Le rendu ne modifie jamais la simulation | **OK** — T4, par sérialisation avant/après sur un raid entier, à trois alphas par tick. |
| `npm run check` passe | **OK** — build 0.5.0 b5 (50 025 octets) et 88 tests. |
| Aucun `.xlsx` ouvert | **OK.** |
