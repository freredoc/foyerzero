# RAPPORT — lot POI

31/08/2026. Les soixante-dix points d'intérêt de la carte : la table, le tirage,
l'acquisition, les deux effets, l'écran, la sauvegarde.

---

## 0. Ce qui a été produit

| | |
|---|---|
| `version` | **0.59.0** |
| `config.build` | **"60"** (chaîne, comme l'exige `android/app/build.gradle.kts`) |
| `dist/index.html` | **1 339 823 octets** |
| SHA-256 | `80e61cb73a950db4c7443ab33716531a0e89d802b9207d7dab40a3c4f5972000` |
| Delta | **+6 132 octets** |
| Borne T10 | **1 400 000, inchangée** — marge 60 177, soit **4,30 %** |
| `npm test` | **792 pass / 0 fail** (768 avant) |
| `SAVE_VERSION` | **15 → 16** |

⚠ **CE LOT N'A FAIT ENTRER AUCUNE IMAGE.** Les sept sprites de POI étaient dans
l'atlas `carte` depuis le lot CARTE-EMBLÈMES, payés et invisibles. Les 6 132
octets sont du code, du commentaire et une table.

---

## 1. ⚠⚠ LA BASE DE DÉPART N'ÉTAIT PAS CELLE DU BRIEF, ET C'EST DIT AVANT TOUT

Le brief annonce, sur clone frais au commit `bf62433` : 764 pass / 1 274 380
octets / 0.57.0 · build 58, et demande de s'arrêter si la base diffère.

**Elle diffère.** `main` a bougé : le lot MUR-DE-CONTOUR (`6e49550`, PR #51) a été
fusionné depuis. Mesuré sur clone frais avant toute modification :

```
npm ci && npm run check
→ 768 pass / 0 fail
→ dist/index.html — 1 333 691 octets
→ version 0.58.0 · build 59
→ SHA-256 989b9318019cd3f515864d215bdf435e6f0eeb5dcdd7618a2a174b7817ca152b
```

Le lot a été bâti sur cette base-là, sur consigne explicite d'Ethan (« main a
bougé »). Conséquence directe : la borne T10 est **déjà** à 1 400 000 — relevée
par MUR-DE-CONTOUR pour ses cinq images de mur —, donc ce lot n'a rien à relever.

---

## 2. Fichiers touchés

**Neufs (2)**

| Fichier | Rôle |
|---|---|
| `src/sim/poi.js` | le tirage, l'acquisition, les deux tables de majoration |
| `test/poi.test.js` | 24 tests |

**Modifiés (10)**

| Fichier | Ce qui change |
|---|---|
| `src/data/sites.js` | table `POI` (7 entrées), `NIVEAUX_PAR_BANDE`, 7 entrées dans `EMBLEMES_CARTE` |
| `src/sim/economie-base.js` | `debitsMilliParHeure` prend les majorations ; le tick et le rattrapage les transmettent |
| `src/sim/state.js` | `poisAcquis`, relevé dans `tickJeu` et `rattraperJeu`, `verifierEtat`, `SAVE_VERSION` 16, migration 15 |
| `src/sim/combat.js` | `majorationsPoi` dans l'état, `tableMajoree`, `majorationPoi`, propriétaire remonté |
| `src/sim/raid.js` | `executerRaid` remplit `majorationsPoi.joueur` depuis l'état |
| `src/sim/satellites.js` | `poserUnSatellite` refuse une case portant un POI |
| `src/render/embleme.js` | `spriteDuSite` résout les POI ; **en-tête réécrit** |
| `src/ui/monde.js` | les POI dans `sitesDeLaFenetre`, deux lignes de plus au panneau |
| `src/ui/chantier.js` | les deux appels à `debitsMilliParHeure` passent les majorations |
| `package.json` | version et build |

**Tests existants recalculés (4 fichiers, 5 assertions)** — voir §7.

**Documentation** : `CLAUDE.md` §0 (bloc de référence), §2 (arborescence), §6
(section POI).

---

## 3. Le tirage — ce qui a été mesuré

| Grandeur | Mesuré | Brief |
|---|---|---|
| POI par carte | 70 (7 × 10 bandes) | 70 |
| Pire nombre d'essais, graines 1–300 | **30** | 25 |
| Moyenne du pire par graine | **8,0** | 7,8 |
| `ESSAIS_MAX` | 1 000, soit **33 fois** la marge observée | 1 000 |
| Coût d'une carte complète, à chaud | **0,050 ms** | 0,053 ms |

Le pire cas mesuré est 30 et non 25 ; l'écart vient probablement du fait que ma
mesure inclut le refus « un POI déjà tiré occupe la case », que le brief ne
détaille pas. La marge reste de trente-trois fois.

**La forme de la garde, mesurée sur 300 graines** : 292 POI tombent sur les
rangées 281–300 ; **292 en colonne 1 ou 31, zéro en colonnes 2 à 30**. C'est
exactement le « à droite et à gauche, comme les bases Ouvrage » d'Ethan, et
`POI T6` le fige.

---

## 4. ⚠⚠ CE QUE LE BRIEF ANNONÇAIT ET QUI EST FAUX : AUCUN POI N'EST ACQUÉRABLE

Le brief §11 écrit : « en partie normale, seuls les POI qui tombent dans les
vingt-cinq cases autour de la rangée 295 / colonne 16 pourront être acquis ».

**Mesuré sur 200 graines : il n'y en a AUCUN. Et il ne peut pas y en avoir.**

Les deux règles sont disjointes par construction :

- un POI est **hors de la garde**, donc à **quinze cases au moins** (Tchebychev)
  de la position de DÉPART ;
- le territoire du joueur est le **disque de rayon 2** autour de sa base, qui
  **est** le départ tant que le redéploiement n'existe pas.

Quinze et deux ne se rencontrent jamais. `POI T24` le mesure case par case — les
25 cases du territoire sont toutes DANS la garde — puis vérifie la conséquence
sur cinquante parties neuves, et prouve dans la foulée que le relevé sait
acquérir (base posée de force sur un POI : un acquis).

**Ce test est fait pour tomber le jour de la mobilité**, et c'est ce qu'on lui
demande : il dira que le système est devenu jouable.

Ce n'est pas un défaut du lot — la garde est l'arbitrage explicite d'Ethan
(« comme les bases Ouvrage ») et la mobilité est hors périmètre (« on verra ça
après »). C'est un fait à connaître avant de croire le système jouable, et il
fallait le dire plus fort que le brief ne le dit.

---

## 5. Les écarts au brief, et leur raison

1. **`EMBLEMES_CARTE` ne récrit pas le `nom` d'un POI, il le LIT dans `POI`.**
   Le brief demande §2 que la table `POI` fasse foi sur « les noms affichés » et
   §7 qu'`EMBLEMES_CARTE` gagne sept entrées avec un champ `nom`. Les deux
   ensemble feraient deux vérités sur le même libellé, ce que CLAUDE.md §4
   interdit. Retenu : `nom: POI.poiQuartz.nom`, et ainsi de suite. Idem pour le
   sprite, que `render/embleme.js` lit dans `POI` au lieu d'en tenir une seconde
   table.

2. **Le pire nombre d'essais mesuré est 30, pas 25** (§3). Rien à changer, mais
   le commentaire de `ESSAIS_MAX` porte le chiffre mesuré ici, pas celui du brief.

3. **Le taux du test d'équivalence est +30 %, pas +20 %.** À +20 % le débit du
   collecteur vaut 144 000 milli/h, soit exactement quatre fois `TICKS_PAR_HEURE` :
   le résidu — le SEUL endroit où le tick et le rattrapage peuvent diverger —
   retombe à zéro à chaque tick, et le test passait sans rien mesurer. **Un
   montage qui tombe rond ne mesure pas un arrondi**, pour la deuxième fois dans
   ce dépôt. Le test asserte désormais que les résidus sont non nuls avant de
   comparer.

4. **`sim/poi.js` importe `render/embleme.js`**, comme le brief l'exige
   (« jamais par un ±1 réécrit à la main »). C'est le **premier module de `sim/` à
   importer `render/`** — la direction habituelle est l'inverse. Il n'y a pas de
   cycle aujourd'hui (`render/embleme.js` ne lit rien de `sim/`), mais c'est une
   inversion de couche, et l'en-tête du module dit comment la défaire le jour où
   elle mordra : monter la géométrie dans `sim/`, jamais recopier le décalage.

5. **`franchissementColonne` non majoré** — le brief le demande et le qualifie de
   choix réversible d'une ligne. Confirmé comme tel. `POI T16` le fige, et il a
   fallu **deux entités** pour l'écrire honnêtement : mesuré, aucune défense ne
   porte à la fois du franchissement et des dégâts (`ronce` et `herse`
   franchissent sans frapper, les sept autres l'inverse). Une seule entité aurait
   comparé deux tables nulles.

---

## 6. Les quatre injections de faute — résultat mesuré

Chacune injectée seule, suite complète relancée, code remis en état ensuite.

| # | Faute injectée | Résultat | Test tombé |
|---|---|---|---|
| 1 | Retirer le filtre `estBaseOuvrage` du tirage | 790 / 1 fail | **POI T2** — aucun POI sur une base de l'Ouvrage, dans la garde, ni sous la terminale |
| 2 | Majorer le *gain* d'un tick au lieu du débit | 789 / 2 fail | **POI T11** (+30 % exact) et **POI T12** (équivalence tick / rattrapage) |
| 3 | Retirer la condition `camp === 'attaque'` | 790 / 1 fail | **POI T15** — la garnison du joueur ne touche pas le bonus d'assaut |
| 4 | Remplacer le tri de `poisAcquis` par l'ordre d'insertion | 790 / 1 fail | **POI T10** — les acquis sont triés |

Aucune injection n'est passée. Suite remise à **792 / 0** après restauration.

---

## 7. Tests existants qui ont eu raison de tomber

Aucune assertion n'a été retirée ni assouplie. Cinq ont été **recalculées**, et
une garde a été **renforcée**.

| Fichier | Assertion | Avant → après | Pourquoi |
|---|---|---|---|
| `test/state.test.js` | `SAVE_VERSION` | 15 → 16 | l'état porte `poisAcquis` |
| `test/state.test.js` | fin de chaîne de migration | 15 → 16 | idem |
| `test/recherche.test.js` | fin de chaîne de migration | 15 → 16 | idem |
| `test/monde.test.js` | noms de sprite distincts composés | **36 → 43** | `EMBLEMES_CARTE` porte sept types de plus ; un test resté à 36 aurait exigé que les POI ne résolvent aucun sprite |
| `test/chantier.test.js` | montage `baseDeLaMaquette` | + `graine`, `position`, `poisAcquis` | `tickJeu` les relève ; c'est la même raison qui a fait entrer `satellites`, `attaque` et `sitesEntames` avant eux |

**Renforcement** : le test des 43 noms exige en plus que les sept sprites de POI
soient tous demandés, et que le compte soit **36 + 7** et non 36 + 7 × 2 × 9 —
c'est ce qui mesure de face qu'un POI ne se multiplie ni par saveur ni par palier.
Si l'un des deux axes reparaissait, ce nombre monterait à 162 et le dirait.

---

## 8. Ce que le lot change pour une partie EN COURS

⚠ **Les satellites déjà posés ne bougent pas** — ils sont dans la sauvegarde.

⚠ **Les FUTURES apparitions, si.** `poserUnSatellite` filtre désormais les cases
portant un POI, donc `libres` rétrécit, donc l'indice tiré change : un camp qui
serait apparu en (x, y) apparaîtra ailleurs. C'est le prix de la règle « jamais
deux sites sur une case », et il est acceptable ; ce qui ne le serait pas, c'est
de ne pas le dire.

⚠ **Aucune base de l'Ouvrage ne bouge, sur aucune carte.** `sim/peuplement.js`
n'a pas changé d'une ligne, et `POI T5` le prouve par deux portes : six comptes
de bases relevés sur le fichier d'AVANT le lot (extrait par `git show HEAD:…`), et
un balayage de sa source qui refuse le mot « poi ».

---

## 9. Les mesures de jeu — sans jugement de valeur

Ethan tient le calibrage. Aucun rendement comparé n'est proposé, aucun ajustement
du +10 %. Deux mesures figurent ici parce que les tests s'y appuient :

- **Économie.** Trois veines de quartz portent le débit d'un collecteur de niveau
  1 de 120 000 à 156 000 milli/h — exactement +30 %, en entiers, et les deux
  chemins d'avancement rendent le même état au bit près sur 1 000 ticks.
- **Combat.** Raid de référence (graine 2026, six Meutes de niveau 1 sur le
  premier camp) : **378 ticks sans POI, 376 avec `poiCantonnement`**, même cause
  (`attaquants`), **butin identique** (20 quartz / 20 scorie) et **points de
  recherche identiques**. Ce qui diffère, c'est l'état dans lequel le site est
  laissé. Six Meutes ne renversent pas un camp, et +10 % ne change pas ce qu'elles
  en rapportent : asserter sur le seul butin aurait rendu `POI T18` vert sur un
  `executerRaid` qui n'emporte rien.

---

## 10. Les sept lettres retenues pour `EMBLEMES_CARTE`

| POI | Lettre | Pourquoi |
|---|---|---|
| `poiQuartz` | **Q** | Quartz |
| `poiScorie` | **S** | Scorie |
| `poiEnergie` | **E** | Énergie |
| `poiCantonnement` | **N** | Cantonnement — `C` est pris par le Camp |
| `poiParcRoulant` | **R** | parc Roulant |
| `poiPlotAerien` | **P** | Plot aérien |
| `poiRedoute` | **D** | reDoute — `R` est pris juste au-dessus |

Les sept sont distinctes des cinq déjà prises (B, C, A, J, T) ; un test l'exige.

**Fond et bord** : un seul couple pour les sept — `#3E454C` sur `#68727E`, le
métal, qui n'est ni le sol du joueur ni celui de l'Ouvrage : un POI n'appartient à
personne tant qu'il n'est pas entré dans un territoire. **Aucun bord rouge** :
`#E43E32` est réservé à ce qui attaque le joueur, et un test croise les deux
tables. L'accent de branche — blanc = infanterie, rouge = véhicule, jaune =
aérien — vit dans le SPRITE, pas dans le gabarit de repli, qui ne se dessine que
tant que l'atlas n'est pas décodé.

---

## 11. Points laissés ouverts

1. **⚠⚠ AUCUN POI N'EST ACQUÉRABLE tant que la base ne peut pas se déplacer** —
   voir §4. C'est le point ouvert principal, et il est plus large que ce que le
   brief annonçait.
2. **Le franchissement n'est pas majoré** — choix réversible d'une ligne, §5.5.
3. **Aucun halo de propriété sur la carte.** `INVENTAIRE-SPRITES.md` §6.2 en
   décrit un ; Ethan ne l'a pas demandé pour ce lot. Le panneau dit « acquis » ou
   « à prendre ». Suite possible, pas trou.
4. **`sim/poi.js` importe `render/`** — inversion de couche assumée, §5.4.
5. **Les six heures de vie et les quatre heures de sursis des satellites** ne sont
   pas touchées, mais le filtre POI déplace leurs FUTURES apparitions, §8.
6. **`node tools/audit-maquette.mjs` reste ROUGE sur 1 écart**, « emplacements
   11 / 12 » — **exactement le même qu'avant le lot**. La maquette n'a pas été
   touchée.
7. **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : le lot
   ne touche ni `art/` ni `tools/`. Son dernier verdict connu reste celui de
   MUR-DE-CONTOUR (1 386 identiques · 2 différents · 0 nouveau · 0 manquant, VERT).
8. **Aucun test appareil n'a été exécuté** — le dépôt n'a ni jsdom ni navigateur
   (CLAUDE.md §3). Le panneau du POI sur l'écran Monde n'a donc été vérifié que
   par ses fonctions pures (`sitesDeLaFenetre`, `lignesDuSite`) ; **son rendu au
   doigt reste non vérifié**, et se déclare non exécuté, jamais passé.
