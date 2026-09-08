# RAPPORT — lot NEUTRALISATION

**08/09/2026 · version 0.99.33 · build 135 · branche `claude/lot-neutralisation`**

Base de départ : `main` à **`6f7b3bb`** — le commit que le brief décrit, à la
lettre. Cinq points ouverts des modules Flashbang et EMP se ferment, un sixième
se conserve.

---

## §0 — PRÉ-VÉRIFICATIONS

| Contrôle | Attendu par le brief | Mesuré |
|---|---|---|
| PR #113 | fusionnée | **fusionnée**, `main` à `6f7b3bb` |
| `npm run check` | 1 441 pass / 0 fail | **1 441 pass / 0 fail** |
| `dist/index.html` | 8 654 436 octets | **8 654 436** |
| lignes `data:` | 297 | **297** |
| ancres B1 → B13 | présentes et uniques | **13 sur 13, une occurrence chacune** |

⚠ **LA BASE ANNONCÉE PAR LE BRIEF ÉTAIT EXACTE — deuxième fois du dépôt.** Les
treize ancres ont été comptées une par une, par balayage de la source, **avant
qu'une ligne ne soit écrite**.

---

## §1 — CE QUE LE LOT FAIT, ET CE QU'IL COÛTE

| Poste | Avant (`6f7b3bb`) | Après | Écart |
|---|---|---|---|
| `dist/index.html` | 8 654 436 | **8 654 729** | **+293** |
| JavaScript | 389 029 | 389 322 | **+293** |
| feuille | 127 211 | 127 211 | **+0** |
| balisage | 35 569 | 35 569 | **+0** |
| images | 6 909 281 | 6 909 281 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| lignes `data:` | 297 | 297 | **+0** |

**La somme des cinq postes tombe EXACTEMENT sur le total**, des deux côtés. Le
livrable de référence a été rebâti dans un `git worktree` détaché sur `6f7b3bb`,
pas estimé.

Borne T10 **inchangée à 9 300 000**, marge **645 271 octets, 6,94 %**.

`npm test` : **1 441 pass / 0 fail → 1 455 pass / 0 fail.**
`SAVE_VERSION` **ne bouge pas** : le journal est remis à zéro à l'étape 0 de
chaque tick, il ne traverse ni `serialiser` ni une migration.

Fichiers touchés : `src/sim/combat.js`, `src/sim/raid-ouvrage.js`,
`src/sim/generateur.js` (commentaire seul), `src/data/modules.js`,
`src/son/cablage.js` (commentaire seul), `src/render/scene.js`,
`test/recherche.test.js`, `test/bases.test.js`, `test/temoins-bases-0.js`,
`CLAUDE.md`, `package.json`.
⚠ **Aucun fichier d'`art/` n'apparaît au diff**, et `python3 tools/verifier.py`
n'a donc pas été lancé — conforme au §0.5 de `CLAUDE.md`.

---

## §2 — L'ARRÊT DU DÉPLACEMENT

La garde est **en tête de `deplacement`**, après `estActive` et avant `profil` :

```js
if (!estActive(e)) continue;
if (estNeutralisee(e)) continue;
```

⚠⚠ **ET SA POSITION EST CE QUI EMPÊCHE L'EMP DE SUPPRIMER UNE UNITÉ.**
`NEUTRALISATION_TICKS` vaut 50, `TICKS_AVANT_REPLI` vaut 30 : une unité qui
entre dans `avancer` sans avancer, sans tirer et sans rien forcer y voit
`ticksInutiles` monter, et **quitte le champ au trentième tick de l'effet**.

⚠⚠ **LA FALSIFICATION A DÛ ÊTRE REPRISE, ET LE BRIEF DÉCRIVAIT LA FAUTE PLUS
LARGEMENT QU'ELLE NE L'EST.** Un `return` posé **en tête d'`avancer`** sort
AVANT la comptabilité du repli : `ticksInutiles` ne monte pas, `NEUT T2` reste
**vert**, et seule `NEUT T3` tombe. Mesuré. La faute n'est atteignable que si la
garde rend `progresse` FAUX —
`const progresse = !arrete && !estNeutralisee(e) && peutAvancer(…)` — et là
**`NEUT T1`, `T2`, `T3`, `T7` et `T12` tombent ensemble**. Ce n'est donc pas
« dans `avancer` » qui tue, c'est « dans le calcul de `progresse` », et il
fallait le dire dans ce sens-là.

⚠ **`estNeutralisee` EST APPELÉE, PAS RECOPIÉE.** `expirerEffets` purge par
`finTick` à l'étape 1 ; un second test écrit à la main oublierait un jour la
purge.

---

## §3 — LA CIBLE DÉJÀ NEUTRALISÉE

`if (estNeutralisee(c)) continue;` entre dans **`cibleDeNeutralisation`**, juste
après le filtre de camp et avant celui de colonne de matrice.

⚠⚠ **DANS LA RECHERCHE, PAS DANS LE DÉCLENCHEUR.** Mis dans
`declencherNeutralisations`, un porteur dont la plus proche est déjà marquée
passerait son tour alors qu'une seconde cible l'attend deux cases plus loin. Ici,
il en trouve une autre s'il y en a une — et sinon `cible === null`, donc **il ne
consomme pas son usage** et retentera au tick suivant, exactement comme la garde
« une durée nulle ne consomme pas l'usage » quelques lignes plus bas.

⚠⚠ **CONSÉQUENCE MESURÉE : AUCUNE ENTITÉ NE PEUT PLUS PORTER DEUX EFFETS, ET
`MODULES-B T15` EST RETOURNÉ.** Ce test figeait l'empilement comme un fait
constaté — « deux porteurs empilent leurs effets, et le plus long fait foi ». La
prémisse a cessé d'être vraie : c'est très exactement le doublon qu'Ethan fait
fermer (« c'est pareil », à résoudre). **Le test est remesuré, pas rattrapé** —
il exige désormais `maxEffets === 1` sur tout le relevé, et surtout que le
porteur resté sans cible libre garde son usage.

---

## §4 — LE MODULE DU CAMP

```js
function moduleDuCamp(e, p) {
  return e.camp === 'attaque' ? p.module : moduleDeDefense(e, p);
}
```

Appelée par **`moduleActif` ET `declencherNeutralisations`**.

⚠⚠⚠ **SANS ELLE, LE §5 N'AURAIT MARCHÉ QU'À MOITIÉ, ET LA MOITIÉ QUI MARCHE
AURAIT MASQUÉ L'AUTRE.** Mesuré sur la table :

| pièce | module d'attaque | module de défense |
|---|---|---|
| Meute | `flashbang` | `flashbang` |
| Bélier | `flashbang` | `flashbang` |
| Carapace | **`booster`** | `emp` |
| Fendeur | **`ecraseur`** | `emp` |

Un déclencheur qui lirait `p.module` armerait la Meute et le Bélier — donc tout
paraîtrait fonctionner — et rendrait `NEUTRALISATION['booster'] === undefined`
pour la Carapace et le Fendeur : **deux des quatre lignes vendues seraient
restées inertes**. `NEUT T5` monte les trois pièces, et sa passe Meute est là
pour prouver que l'extraction SERT : elle passerait même sans.

---

## §5 — LA LIGNE DÉFENSE

- La boucle de `declencherNeutralisations` balaie **les deux camps** : le filtre
  `e.camp !== 'attaque'` disparaît.
- `flashbang.cable.defense` et `emp.cable.defense` passent à **`true`**, et les
  deux commentaires au-dessus sont **réécrits** — ils nomment les porteurs
  (Meute et Bélier pour le Flashbang, Carapace et Fendeur pour l'EMP) et le fait
  que la boucle balaie désormais les deux camps.
- **Aucun barème n'est touché.** `data/recherche.js` portait déjà les quatre
  lignes ; c'est `effetNonCable` qui refusait la vente, et il tombe avec le
  drapeau.

⚠ **LES LIGNES NON CÂBLÉES TOMBENT DE 6 À 2**, et les deux qui restent sont en
défense : **le Tir de barrage des Perceurs** (l'attaquant n'a ni structure ni
bâtiment à éclabousser) et **la Garnison de l'Éclaireur** (§8 la conserve).

⚠⚠ **LES DEUX CENTS TÉMOINS DE COMBAT SONT VERTS SANS AVOIR ÉTÉ RÉGÉNÉRÉS**, et
`test/temoins-combat.js` n'a pas une ligne de changée. `NEUT T13` en donne la
raison MESURÉE plutôt que de l'espérer : aucun des quatre porteurs ne porte le
Flashbang ni l'EMP **côté Ouvrage**, et aucune des neuf `DEFENSES` non plus —
ouvrir la boucle n'arme donc que la garnison du JOUEUR, qui n'apparaît que dans
`raid-ouvrage`.

⚠⚠ **ET LE BRIEF SE TROMPAIT SUR UN DES QUATRE.** Il écrit que `moduleOuvrage`
vaut « `null` sur la Meute, le Bélier, la Carapace et le Fendeur ». **Mesuré :**

| pièce | `moduleOuvrage` |
|---|---|
| Meute | `null` |
| Bélier | `null` |
| **Carapace** | **`camouflage`** |
| Fendeur | `null` |

La conclusion tient — ce qui compte n'est pas que le champ soit vide, c'est
qu'il ne vaille **ni `flashbang` ni `emp`** —, et `NEUT T13` mesure donc la
propriété plutôt que la phrase.

### Le point conservé

⚠⚠ **UN PORTEUR NEUTRALISÉ GARDE LE DROIT DE DÉCLENCHER SON MODULE.** Ethan,
08/09 : « non, on s'en fiche justement, ça c'est bien. Il faut le garder comme
ça. » La garde `estNeutralisee` est dans `tir` et **n'entre pas** dans
`declencherNeutralisations`. Le cas était inatteignable jusqu'ici ; ce lot le
rend atteignable, donc il est écrit comme une **décision** — commentaire au-dessus
de la boucle, et `NEUT T7` en assertion **positive**.

---

## §6 — L'OUVRAGE ARMÉ EN OFFENSE

`modulesOuvrageOffenseAu(niveau)` entre dans **`src/sim/raid-ouvrage.js`**, et
`montageDeLaBaseDuJoueur` pose
`ouvrage: { offense: modulesOuvrageOffenseAu(niveauAttaquant), defense: [] }`.

⚠ **`genererSite` N'A PAS UNE LIGNE DE CODE CHANGÉE** — seul son commentaire est
amendé pour dire où l'autre canal se remplit désormais. Dans un raid sur un
SITE, l'Ouvrage est le DÉFENSEUR : sa liste d'offense n'y a personne pour la
lire. `NEUT T10` est le garde-fou qui le dit **avant** les témoins.

### 6.2 — La table des paliers, REMESURÉE

Mesurée par parcours de `UNITES`, `apparitionModule` croissant :

| niveau | pièce | module | entrée |
|---|---|---|---|
| 20 | Meute | `flashbang` | **entre** |
| 22 | Perceurs | `tirDeBarrage` | **entre** |
| 28 | Carapace | `booster` | **entre** |
| 32 | Bélier | `flashbang` | déjà |
| 32 | Crécelle | `emp` | **entre** |
| 34 | Busard | `garnison` | **entre** |
| 34 | Fendeur | `ecraseur` | **entre** |
| 36 | Frappeur | `camouflage` | **entre** |
| 36 | Ratisseur | `garnison` | déjà |
| 38 | Fouisseurs | `booster` | déjà |
| 40 | Guetteur | `camouflage` | déjà |
| 42 | Broyeur | `ecraseur` | déjà |
| 44 | Pilon | `tirDeBarrage` | déjà |
| 46 | Enclume | `bouclier` | **entre** |

**La table du brief est exacte**, à ceci près qu'elle omet le Bélier au palier
32 (dont le module est déjà entré au 20). Listes rendues :

```
19 → []
20 → [flashbang]
22 → [flashbang, tirDeBarrage]
28 → [booster, flashbang, tirDeBarrage]
32 → [booster, emp, flashbang, tirDeBarrage]
34 → [booster, ecraseur, emp, flashbang, garnison, tirDeBarrage]
36 → [booster, camouflage, ecraseur, emp, flashbang, garnison, tirDeBarrage]
46 → [booster, bouclier, camouflage, ecraseur, emp, flashbang, garnison, tirDeBarrage]
```

⚠ **AUCUN MODULE N'EST ÉNUMÉRÉ À LA MAIN.** `NEUT T8` ne se contente pas de
comparer les listes : pour chaque module qui ENTRE à un palier, il exige qu'une
pièce de `UNITES` porte ce module en offense **et** que son `apparitionModule`
vaille exactement ce niveau. Une liste écrite à la main passerait les égalités et
tomberait là.

### 6.3 — Les trois passes, dans l'ordre

**Harnais** : 6 graines fixes (1, 7, 42, 101, 314, 2718) × 5 rangées
(250, 200, 150, 100, 50) × **24 h de jeu**, base du joueur montée au niveau de sa
rangée avec bâtiments et garnison pleine. Tous les rapports de raid subis sont
cueillis — la file n'en garde que dix — et chaque scénario rend une empreinte de
sa séquence complète.

| passe | quand | raids | rasés | ticks moyen | restantDefense | restantBatiments | victoires totales |
|---|---|---|---|---|---|---|---|
| **1** | **avant toute écriture** | 502 | 177 | 152,07 | 74,48 | 76,32 | 255 |
| **2** | après les §2 à §5 | **502** | **177** | **152,07** | **74,48** | **76,32** | **255** |
| **3** | après le §6 | 461 | 178 | 151,51 | **66,61** | **68,99** | **216** |

⚠⚠ **LA PASSE 2 EST IDENTIQUE À LA PASSE 1, À L'OCTET — LES TRENTE EMPREINTES
COMPRISES.** L'arrêt du déplacement et la ligne défense **ne coûtent rien à la
difficulté ressentie**, et le motif est mécanique : dans `raid-ouvrage`, aucun
module n'est encore armé d'un côté ni de l'autre, donc aucune neutralisation
n'est déclenchée. C'est le §6 qui en arme, et lui seul.

⚠⚠ **ET L'ATTRIBUTION SE LIT DANS LA RANGÉE 250.** Le premier palier est à 20 ;
à la rangée 250 le niveau vaut 10, donc `modulesOuvrageOffenseAu` rend la liste
vide et **les six empreintes ne bougent pas d'un caractère**. L'écart apparaît à
la rangée 200 et croît avec le niveau :

| rangée | niveau | raids | rasés | restantDefense | restantBatiments | graines déplacées |
|---|---|---|---|---|---|---|
| 250 | 10 | 199 → 199 | 0 → 0 | 98,51 → 98,51 | 100,00 → 100,00 | **0 / 6** |
| 200 | 20 | 91 → 89 | 22 → 22 | 78,58 → 77,03 | 64,71 → 65,19 | 3 / 6 |
| 150 | 30 | 48 → 46 | 36 → 36 | 34,15 → 31,91 | 25,25 → 32,26 | 6 / 6 |
| 100 | 40 | 91 → 59 | 53 → 54 | 63,73 → 24,93 | 69,81 → 36,08 | 6 / 6 |
| 50 | 50 | 73 → 68 | 66 → 66 | 43,79 → 19,28 | 67,94 → 36,62 | 6 / 6 |

**Lecture, sans jugement de valeur** : l'Ouvrage armé laisse **7,9 points de
pourcentage de défense en moins** et **7,3 de bâtiments en moins** sur la moyenne
des 461 raids ; les **victoires totales du joueur tombent de 255 à 216, soit
−15,3 %**, pendant que le nombre de rasages ne bouge pratiquement pas
(177 → 178). Le nombre de raids baisse de 8,2 % parce qu'un rasage déplace la
base de vingt rangées, donc change la liste des attaquantes. **Le calibrage
revient à Ethan ; rien n'a été compensé.**

### Le témoin de BASES-0

⚠⚠ **DEUX COUPLES DÉPLACÉS SUR 308, ET UNE SEULE GRAINE SUR VINGT-CINQ.**
`DEPLACES_PAR_NEUTRALISATION` est la **quinzième couche**, et la plus étroite du
dépôt : `rapports` aux phases **13** et **14**, les deux seules où l'Ouvrage
attaque. Les vingt et un autres champs — `economie`, `disposition`, `garnison`,
`armee`, `sitesEntames`, `poisAcquis`, `satellites`, `basesRasees`… — **tombent à
l'octet** sur la capture d'origine ou sur la couche qui les portait déjà.
`p11_raidOuvrageApres` **ne bouge pas non plus** : sur les vingt-cinq graines, le
raid de cette phase-là ne porte aucune Meute armée.

⚠ **L'ATTRIBUTION EST MESURÉE, PAS DÉDUITE** : en remettant `offense: []` à la
seule ligne du §6, `test/bases.test.js` repasse **31 pass / 0 fail**. Le scénario
plante sa base rangée 200, où le niveau vaut 20 — donc au tout premier palier.

---

## §7 — LE RETOUR AU JOUEUR

- **Sixième canal** : `journalVide` gagne `neutralisations: []`, et
  `declencherNeutralisations` y pousse
  `{ ...faitDeLEntite(cible), porteur: e.indice, ticks }` **après** la garde
  `ticks === 0`.
- **Son : rien, et c'est écrit.** `evenementsDuJournal` ne lit pas le sixième
  canal, et porte désormais le commentaire qui dit pourquoi : les 263 entrées de
  `data/sons.js` ne portent ni brouillage, ni arrêt d'unité, ni impulsion
  électromagnétique. En fabriquer un demande un master WAV, donc un lot d'ASSETS.
- **Cadre au rendu** : `if (estNeutralisee(e)) liste.push(cadre(x, y, t, t,
  PALETTE.metalClair, 2));` dans la boucle des barres de PV.
  **Aucun actif neuf** — `cadre` est une primitive de `canvas2d.js`,
  `metalClair` (`#68727E`) est dans la palette close, et le livrable garde ses
  **297 lignes `data:`**.
- `estNeutralisee` est **exportée** de `sim/combat.js` et importée par
  `render/scene.js` ; il n'y a pas de cycle, `combat.js` n'important rien de
  `render/`. `NEUT T12` interdit tout `effetsTemporises` dans `render/scene.js`.

---

## §8 — CE QUI N'EST PAS DANS LE LOT, VÉRIFIÉ

| Interdit | Vérification |
|---|---|
| son de neutralisation | `data/sons.js` intact, aucun événement ajouté |
| Garnison pour l'Ouvrage | `genererVague` intact ; le module entre dans la liste et reste inerte |
| Garnison côté défense | `garnison.cable.defense` toujours `false`, commentaire intact |
| les trois points ouverts du lot A | intacts |
| `SAVE_VERSION` | **inchangé** — `src/sim/state.js` n'a pas une ligne de changée |
| les onze autres modules | aucune ligne |
| `engines` de `package.json` | signalé, non corrigé |

---

## §9 — LES TESTS

**Quatorze entrent** — `NEUT T1` à `T13`, plus `T7 bis` — dans
`test/recherche.test.js`, suite MODULES-B. **1 441 → 1 455.**

| test | verdict | montage effectif |
|---|---|---|
| **NEUT T1** — une neutralisée n'avance plus | **PASS** | Meute seule colonne 5, Gangue en colonne 1 ; effet posé à la main au tick 6, `finTick = 56`. `rangeeMilli` figé à 2 360 des ticks 7 à 55, > 2 360 au 56. Le montage asserte d'abord qu'elle a avancé. |
| **NEUT T2** — et elle ne se replie pas | **PASS** | Même montage, 60 ticks. `ticksInutiles === 0` et `sorti === false` à chaque tick ; asserte d'abord `TICKS_AVANT_REPLI < 50`. **Tombe** quand la garde entre dans le calcul de `progresse`. |
| **NEUT T3** — une défenseuse ne se décale plus | **PASS** | Meute en défense (4, 2), Meute d'assaut colonne 5, Flashbang acquis. Effet posé au tick 40 ; colonne figée à 3 560 des ticks 40 à 60. **Contre-montage sans le module** : la même pièce continue de se décaler jusqu'à 4 400 au tick 60. |
| **NEUT T4** — le second porteur garde son usage | **PASS** | Deux Meutes d'assaut (colonnes 4 et 6), **une** Meute adverse en (4, 4) : le premier consomme, le second garde `modulesActifs` vide, la cible ne porte qu'UN effet. Second montage à **deux** cibles : les deux porteurs consomment, sur deux cibles distinctes. |
| **NEUT T5** — Carapace et Fendeur en défense | **PASS** | Garnison du joueur, EMP acquis en branche **défense**, Ratisseur attaquant. Carapace → neutralisation au tick 6 ; Fendeur idem. Passe Meute/Flashbang contre une infanterie attaquante : tick 10. Témoin négatif sans le module acquis : `null`. |
| **NEUT T6** — le drapeau ouvre les quatre lignes | **PASS** | `problemesDeLAchat` rend `[]` sur `defense/{meute, belier, carapace, fendeur}` et les quatre s'achètent. **Témoin négatif** : `defense/ratisseur` rend toujours `['effetNonCable']`. |
| **NEUT T7** — un porteur neutralisé déclenche | **PASS** | Meute d'assaut neutralisée **avant le premier tick**, cible en (3, 5). Au tick 1 elle pose son effet et consomme son usage, **sans avancer ni tirer**. Contre-montage : un porteur libre tire. |
| **NEUT T7 bis** — neutralisation mutuelle | **PASS** | Bélier de l'Ouvrage (Flashbang) contre Carapace du joueur (EMP) à portée : **au tick 1 les deux sont neutralisés et les deux ont consommé**. Atteignable pour la première fois grâce au §5. |
| **NEUT T8** — les paliers de l'Ouvrage | **PASS** | Dix paliers confrontés, plus la **dérivation** : chaque module qui entre doit avoir un porteur dont `apparitionModule` vaut exactement ce niveau. Asserte aussi que la Garnison est bien dans la liste au palier 34. |
| **NEUT T9** — un Bélier de l'Ouvrage neutralise | **PASS** | Raid de l'Ouvrage niveau 32, garnison Meute du joueur en (3, 5) : neutralisée au tick 1, `proprietaire === 'joueur'`. **Contre-cas de branche** : la MÊME liste versée dans `ouvrage.defense` ne fait rien en dix ticks. |
| **NEUT T10** — `genererSite` n'a pas changé | **PASS** | 7 niveaux × 3 types : `ouvrage.offense` toujours vide. Moitié qui prouve : `ouvrage.defense` d'un site de niveau 50 est garnie. |
| **NEUT T11** — le journal, une fois, et vidé | **PASS** | Entrée au tick de la pose portant `indice`, `id`, `porteur`, `ticks: 50`, `proprietaire`, `rangee`, `colonne` ; canal vide au tick suivant. **Durée nulle** (cible cinq niveaux au-dessus) : zéro entrée sur vingt ticks, et l'usage n'est pas consommé. |
| **NEUT T12** — le cadre suit le prédicat | **PASS** | `listeAffichage` sur une projection 412 × 810 : zéro cadre `metalClair` avant l'effet, **un** pendant, aux dimensions de la case et d'épaisseur 2, zéro au tick 56. Plus trois gardes de source : la ligne, l'import, et l'interdiction d'`effetsTemporises` dans le rendu. |
| **NEUT T13** — les deux cents témoins | **PASS** | Aucun des quatre porteurs ne porte Flashbang ni EMP côté Ouvrage ; aucune des neuf `DEFENSES` non plus ; `test/temoins-combat.js` ne contient pas le mot « neutralis ». |

### Les sept tests existants qui changent — aucun ne s'assouplit

| test | ce qui change |
|---|---|
| `T11` | le compte des lignes non câblées passe de **6 à 2**, et l'assertion devient la LISTE (`defense/perceurs`, `defense/ratisseur`) plutôt qu'un nombre |
| `MODULES-A T9` | `enDefense` passe de six à **huit** modules ; les deux qui entrent portent AUSSI `offense`, ce qui est asserté à part — la liste « défense seulement » n'a pas bougé |
| `MODULES-B T13` | Flashbang et EMP passent à `defense: true`, le Camouflage reste en offense seulement ; les lignes ouvertes passent de 5 à **9**, et le témoin de refus change de porteur |
| `MODULES-B T15` | **RETOURNÉ** : il figeait l'empilement, il mesure désormais qu'il est impossible et que le second porteur garde son usage |
| `MODULES-C T10` | les lignes ouvertes passent de `{offense: 14, defense: 11}` à `{offense: 14, defense: 15}` |
| `T15` | la ligne témoin du refus d'effet passe de la Meute en défense au **Tir de barrage des Perceurs**, dont la pièce doit être ACHETÉE d'abord pour que le refus ne soit pas noyé |
| `RECH-É T5` | même déplacement de témoin, même raison |

---

## §10 — LA RONDE DE FALSIFICATIONS

**Quatorze falsifications, quatorze chutes, zéro muette.** Chacune est appliquée
seule, la suite est jouée, puis le texte d'origine est réécrit et l'empreinte
SHA-256 du fichier vérifiée — jamais de `git checkout --`.

| # | falsification | chutes |
|---|---|---|
| F1 | la garde du §2 passe en **tête** d'`avancer` | 1 — `NEUT T3` seulement |
| **F1 bis** | la garde du §2 entre dans le calcul de **`progresse`** | **5 — `NEUT T1`, `T2`, `T3`, `T7`, `T12`** |
| F2 | `declencherNeutralisations` relit `p.module` | 2 — `NEUT T5`, `T7 bis` |
| F3 | la cible déjà neutralisée n'est plus sautée | 1 — `MODULES-B T15` |
| F4 | la boucle reprend sa garde de camp | 2 — `NEUT T5`, `T7 bis` |
| F5 | un porteur neutralisé cesse de déclencher | 2 — `NEUT T7`, `T7 bis` |
| F6 | le Flashbang redevient non câblé en défense | 5 — `T11`, `MODULES-A T9`, `MODULES-B T13`, `NEUT T6`, `MODULES-C T10` |
| F7 | le journal s'écrit AVANT la garde de durée nulle | 1 — `NEUT T11` |
| F8 | le cadre disparaît du rendu | 1 — `NEUT T12` |
| F9 | le §6 est appliqué à `genererSite` | 2 — `NEUT T10`, `MODULES-F T12` |
| F10 | le §6 verse sa liste dans la mauvaise branche | 2 — les deux témoins de BASES-0 |
| F11 | la Garnison est exclue par un cas particulier écrit à la main | 1 — `NEUT T8` |
| F12 | le sixième canal sort de `journalVide` | 18 — toute la suite MODULES-B |
| F13 | le rendu reteste `effetsTemporises` à la main | 1 — `NEUT T12` |

⚠ **F1 EST DÉCLARÉE FAIBLE PLUTÔT QUE COMPTÉE COMME UNE CHUTE DE `NEUT T2`.**
C'est elle qui a fait découvrir que la faute décrite par le brief n'est pas
« la garde est dans `avancer` » mais « la garde annule `progresse` ». Une
falsification qui ne mord pas se vérifie avant d'être crue.

---

## §11 — RELECTURE HOSTILE (§12 du brief)

1. **La garde est-elle en tête de `deplacement`, et `NEUT T2` tombe-t-il ?**
   Oui, et **vérifié en la déplaçant vraiment** — voir F1 et F1 bis ci-dessus.
2. **`moduleDuCamp` est-il appelé par les deux ?** Oui. F2 remet `p.module` :
   `NEUT T5` et `T7 bis` tombent.
3. **Un module énuméré à la main quelque part ?** Non. `modulesOuvrageOffenseAu`
   parcourt `UNITES` et lit `nomDuModule('offense', id)` ; F11 (un
   `nom === 'garnison'` écrit à la main) fait tomber `NEUT T8`.
4. **`genererSite` touché ?** Non — **commentaire seul**, vérifié au diff.
   `NEUT T10` le garde, et F9 le fait tomber.
5. **Le rendu appelle-t-il `estNeutralisee` ?** Oui, et F13 — la réécriture à la
   main — fait tomber `NEUT T12`.
6. **Les trois passes ont-elles été faites dans l'ordre ?** Oui. La passe 1 a été
   prise sur un arbre dont `git status` était **vide** ; la passe 2 après le §5
   et avant le §6 ; la passe 3 après. Les trois sorties sont conservées.
7. **Les deux cents témoins sont-ils verts sans avoir été régénérés ?** Oui —
   `git diff test/temoins-combat.js` est **vide**.
8. **Quelque chose du §8 touché ?** Non — table du §8 ci-dessus.

---

## §12 — POINTS OUVERTS

1. ⚠⚠ **LA GARNISON EST ARMÉE POUR L'OUVRAGE ET RESTE INERTE.** Elle entre dans
   `modulesOuvrageOffenseAu` au palier 34 (Busard), et `genererVague` compose une
   vague **plate** : elle ne sait pas embarquer, et rien du lot
   FORMATION-ET-GARNISON ne le lui a appris. L'Ouvrage débloquera donc le module
   sans qu'aucune de ses escouades ne monte jamais dans un Épervier. **Aucun cas
   particulier n'a été écrit pour l'exclure** — ce serait la première ligne
   écrite à la main dans une liste qui se lit, et `NEUT T8` fait tomber celui qui
   l'écrirait. **Ethan tranche** : soit `genererVague` apprend à embarquer, soit
   la liste gagne une exception déclarée.
2. ⚠ **LE SIXIÈME CANAL DU JOURNAL EST MUET CÔTÉ SON.** Le canal porte tout ce
   qu'il faut — l'entité, son porteur, la durée, le propriétaire — et aucune
   ligne de `evenementsDuJournal` ne le lit. Les 263 entrées du pack ne portent
   ni brouillage ni arrêt d'unité : c'est un lot d'ASSETS, pas une ligne de
   câblage.
3. ⚠ **`package.json` NE DÉCLARE TOUJOURS AUCUN `engines` — CINQUIÈME
   SIGNALEMENT.** Node 20.11.1 ne suffit pas : le glob de `node --test` demande
   Node ≥ 21 et `test/banc.test.js` emploie `Dirent.parentPath`, ajouté en 20.12.
   C'est une décision d'Ethan, reportée telle quelle.
4. ⚠ **LE CALIBRAGE DU §6.3 REVIENT À ETHAN.** Les victoires totales du joueur
   tombent de **15,3 %** sur le harnais, et rien n'a été compensé.
5. ⚠ **LE RENDU N'A PAS ÉTÉ VU, NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE
   DÉCLARE NON EXÉCUTÉ.** Le cadre de neutralisation est mesuré par la **liste
   d'affichage**, jamais à l'écran — le dépôt n'a ni jsdom ni navigateur (§3 de
   `CLAUDE.md`). Sa lisibilité au doigt, sa couleur sur le décor et son épaisseur
   à la case de 36 px restent à juger sur le téléphone.
6. ⚠ **`package-lock.json` reste celui du dépôt** : `npm ci` a été employé, et le
   fichier n'apparaît pas au diff.

---

## §13 — ÉCARTS AVEC LE BRIEF

1. **La faute du §2 est plus étroite que décrite** — voir §2 et F1/F1 bis. Le
   brief laisse entendre qu'une garde posée « dans `avancer` » suffit à déclencher
   le repli ; mesuré, il faut qu'elle annule `progresse`.
2. **`moduleOuvrage` de la Carapace vaut `camouflage`, pas `null`** — voir §5.
   La conclusion du §5.3 tient, l'un des quatre faits qui l'étayent est faux.
3. **`MODULES-B T15` est retourné, ce que le brief ne prévoyait pas.** Il ne le
   nomme pas parmi les tests à remesurer ; sa prémisse tombe pourtant avec le §3,
   et le retourner est la seule issue qui ne perde pas d'assertion.
4. **Un quatorzième test entre, `NEUT T7 bis`.** Le brief en prévoit treize ; la
   neutralisation mutuelle en combat réel n'était couverte par aucun, et c'est le
   seul endroit où le §5 se mesure de bout en bout dans un tick.
5. **La table des paliers du brief omet le Bélier au palier 32.** Sans
   conséquence : son module est déjà entré au palier 20.
