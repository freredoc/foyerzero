# RAPPORT — lot BASES-2 · « fonder au doigt »

11/09/2026 · branche `claude/new-session-b0zn1e` · version **0.99.51 · build 153**

Le moteur de fondation est écrit et testé depuis le lot BASES-1 (02/09) et
**aucun écran ne l'appelait** — c'est le premier trou que le rapport de ce
lot-là nommait. Le droit de fonder ne s'achetait pas non plus : `T15` de
`test/recherche.test.js` s'appelait « l'onglet Spécial s'affiche et **ne
s'achète pas** », et son propre montage de falsification était, en toutes
lettres, « réutiliser `boutonDAchat` pour la deuxième base ». C'est ce lot.

---

## 1. La base, retrouvée à l'octet

Le brief annonce `main` à **1579 tests déclarés · 1578 pass · 0 fail ·
1 skipped**, `npm run check` en 0, `dist/index.html` à **9 372 186 octets**.
**Mesuré au départ : les quatre nombres, à l'identique.**

- `main` = `5d654d8` (« lot bandeau »), vérifié au `git fetch` — **il n'a pas
  bougé sous le lot**, revérifié à la fin.
- `npm test` → `# tests 1579`, `# pass 1578`, `# fail 0`, `# skipped 1`
  (`LIMITE T8`, suspendu par Ethan le 08/09).
- `npm run check` → sortie **0**.
- `npm run build` → `dist/index.html`, **9 372 186 octets**, **307 lignes
  `data:` / 306 URI**, et pour seule adresse extérieure l'espace de noms SVG
  `http://www.w3.org/2000/svg`, qui est un IDENTIFIANT et non une référence.

---

## 2. Ce que le lot touche

| Fichier | Nature |
|---|---|
| `src/ui/recherche.js` | volet A — le nœud répétable s'achète |
| `src/index.src.html` | volet B — un bouton, une règle, un commentaire |
| `src/ui/monde.js` | volet B — le mode de fondation |
| `src/sim/fondation.js` | volet B — `casesFondables`, et rien d'autre |
| `src/ui/session.js` | volet C — le crochet `apresFondation` |
| `package.json` | version et build |
| `test/recherche.test.js` | `T15` retourné, `BASES-2 T1` |
| `test/monde.test.js` | `BASES-2 T2`, deux gardes resserrées |
| `test/pictogramme.test.js` | `PIC T7` réancré |
| `rapports/RAPPORT-lotBASES-2.md` | ce fichier |

**Pas une ligne de `src/data/`, `src/render/`, `src/son/`, `src/sim/` hors
`fondation.js`, `tools/` ni `art/`** — vérifié au diff.

`SAVE_VERSION` **ne bouge pas et reste à 32** : `bases`, `baseCourante` et
`recherche.basesAutorisees` sont dans la sauvegarde depuis la v24. Un écran qui
ouvre un moteur n'ajoute aucun champ.

---

## 3. Les tests

Deux tests entrent, le compte passe de **1 579 à 1 581**. Chacun porte, en
regard, le montage de falsification qui le fait tomber — **joué, pas supposé**.

| Test | Ce qu'il mesure | Falsification jouée | Verdict |
|---|---|---|---|
| `BASES-2 T1` (recherche) | (a) une ligne du Spécial porte un bouton, les trois soutiens non ; (b) un seul toucher n'achète rien ; (c) le second ouvre le rang et débite EXACTEMENT le prix d'avant ; (d) le libellé annonce le rang 3 et le prix vaut ×5 ÷2 ; (e) le bouton s'éteint et aucune raison ne répète le manque | **F1** le prix relu dans `SPECIAL[id].cout` | tombe (T1 seul) |
| | | **F2** le premier toucher achète | tombe (T1 + 3 gardes antérieures) |
| | | **F3** `pointsInsuffisants` n'est plus filtré | tombe (T1 seul) |
| | | **F4** le rang recompté sur `etat.bases.length + 1` | tombe (T1 seul) |
| `BASES-2 T2` (monde) | (0) sans le rang, armer dit quoi acheter et ce qui manque ; (a) une case refusée affiche le refus du moteur et ne fonde rien ; (b) une case légale ouvre la confirmation sans fonder, bouton « Fonder ici » ; (c) l'accord fonde, `baseCourante` suit, le mode se désarme ; (d) renoncer ne fonde rien, désarme, et le liseré s'en va | **F5** la branche `modeFondation` retirée de `relacher` | tombe (T2 seul) |
| | | **F6** le chemin de fondation n'écrit pas le libellé de l'accord | tombe (T2 seul) |
| | | **F7** le refus ne passe plus avant la demande d'accord | tombe (T2 seul) |
| | | **F8** l'accord ne désarme pas le mode | tombe (T2 seul) |
| | | **F9** le bouton de fondation reste caché | tombe (`CARTE-C T11`) |
| | | **F11** la sonde du message de vide revient à UNE case | tombe (T2 seul) |
| | | **F12** le désarmement ne vide plus `casesDuGeste` | tombe (T2 seul) |
| | | **F13** le peintre des cases du geste rendu inerte | tombe (T2 seul) |

**Treize falsifications jouées, onze chutes.**

### Les deux muettes, déclarées

**F10** — retirer `panneauFonder.hidden = true` d'`ouvrirRuine` **ne fait tomber
aucun test**. Contre-épreuve jouée : retirer la ligne **JUMELLE**,
`panneauDeplacer.hidden = true`, écrite au lot CONQUÊTE-24H, **ne fait tomber
aucun test non plus**. Le panneau est déjà fermé quand `ouvrirRuine` s'exécute,
et l'inertie est donc **antérieure au lot**. L'assertion ajoutée à la garde de
la ruine est exactement aussi forte que sa jumelle, ni plus ni moins — et elle
mesure la propriété OBSERVABLE (le bouton est caché quand le panneau d'une ruine
est ouvert), ce qui reste vrai quel que soit le chemin qui l'a cachée.

### Trois falsifications qui ont fait corriger le montage avant d'être crues

1. `BASES-2 T2` (c) mesurait le désarmement par « un toucher de plus ne fonde
   rien » avec **un seul rang ouvert** : après la fondation, `casesFondables`
   rend **0 case** — le MOTEUR refuse à la place de l'écran, et l'assertion
   serait passée quel que soit l'état du mode. Le montage ouvre **deux** rangs.
2. Le repère du toucher était pris sur le premier halo : après l'accord, la
   carte s'est **recentrée**, donc ce halo ne désigne plus rien. `dernierHalo`
   lit le dernier peint.
3. Le bloc (d) réutilisait la partie déjà fondée : la comparaison de
   sérialisation n'aurait rien dit. Il part d'une partie neuve.

### Ce qui change ailleurs, et qui ne s'assouplit pas

- **`T15` est RETOURNÉ** — § 4 ci-dessous.
- **`CARTE-C T11`** gagne une assertion : le bouton « Fonder une base » est
  **VISIBLE** sur le panneau de sa propre base, comme son jumeau.
- **La garde de la ruine** gagne la sienne : il est **CACHÉ** là.
- **`PIC T7` est réancré** — § 6.

**Aucune assertion n'a été retirée ni assouplie.**

---

## 4. § Garde retournée — `T15`

`T15 — l'onglet Spécial s'affiche et ne s'achète pas` affirmait le contraire de
ce lot, et nommait sa propre condition de mort :

> ⚠ AUCUN BOUTON, MÊME AVEC DE QUOI PAYER MILLE FOIS. […] **MONTAGE QUI LE FAIT
> TOMBER : réutiliser `boutonDAchat` pour la deuxième base, dont le classeur
> donne pourtant un prix.**

Il est **retourné, pas retiré**, et il porte désormais le nom de ce qu'il
mesure : `T15 — l'onglet Spécial : une ligne s'achète, trois annoncent sans
moteur`.

**Ce qu'il exigeait et qui devient son inverse** : zéro bouton sur les quatre
lignes → **exactement un**, et il **nomme la ligne qui doit le porter**, sans
quoi un lot futur qui retirerait le bouton de la base repasserait au vert sans
que rien ne le dise.

**Ce qu'il gardait de vrai, et qui reste mot pour mot** :

- les trois soutiens n'ont **ni bouton ni prix retenu** — un tiret, jamais un
  zéro qui se lirait « gratuit » ;
- leur raison dit **« pas encore de moteur »** ;
- **une seule** des quatre lignes porte un prix et un bouton ;
- et **le bouton porte le prix**, jamais un second `span.prix` à côté, qui
  divergerait au premier changement de rang.

Le partage se **compte** (`filter` sur les cadres), il ne s'énumère pas par trois
identifiants recopiés qui vieilliraient au cinquième nœud.

---

## 5. Le livrable

`npm run check` → sortie **0**.

```
# tests 1581
# pass 1580
# fail 0
# skipped 1
```

`npm run build` → `dist/index.html`, **9 377 421 octets**, **307 lignes `data:`
/ 306 URI**, et **0 référence externe** — pour seule adresse,
`http://www.w3.org/2000/svg`, qui est l'argument obligatoire de
`createElementNS` et n'est téléchargé par personne.

### Coût, poste par poste

Mesuré contre le livrable **rebâti dans un `git worktree`** sur l'arbre pristine
de `main` = `5d654d8`, par un script qui partitionne le fichier en cinq postes,
chacun NET de ses `data:` :

| Poste | Avant | Après | Écart |
|---|---:|---:|---:|
| JavaScript | 413 056 | 418 161 | **+5 105** |
| balisage | 36 498 | 36 602 | **+104** |
| feuille | 45 683 | 45 709 | **+26** |
| images | 7 683 603 | 7 683 603 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| **total** | **9 372 186** | **9 377 421** | **+5 235** |
| URI `data:` | 306 | 306 | +0 |

**La somme des cinq postes tombe EXACTEMENT sur la taille du fichier des DEUX
côtés.** Le lot ne fait entrer **ni une image ni un son**.

Borne T10 **inchangée à 9 600 000** — aucune ressource n'entre. Marge
**222 579 octets, 2,32 %**.

---

## 6. `PIC T7` réancré — une édition, pas un test

Son ancre écrivait **9 367 456**, mesurée au lot TERRITOIRE-ET-ÉCHELLE ; le
disque en rend **9 377 421**, soit **9 965 octets de dérive** — sous la
tolérance de 50 000, donc **VERT, et faux**. Quatre lots sont passés dessus sans
la toucher (APPROCHE qui REND 761, PENDULE-ET-TOUCHER +2 634, JOURNAL-ÉCRAN qui
rend 113, puis RAPPORTS-ET-PLEIN), et celui-ci coûte +5 235.

C'est exactement ce que la dernière assertion de ce test existe pour empêcher :
« la tolérance garde contre la dérive LENTE, pas contre un lot qui sait ce qu'il
déplace » (`CLAUDE.md`). Le lot sait ce qu'il déplace — § 5 le ventile poste par
poste —, donc il réancre, **en écrivant le nombre d'avant à côté de celui
d'après**. Marge 232 544 → **222 579**, 2,42 % → **2,32 %**.

⚠ **C'est un écart au brief**, qui ne le demandait pas. Ce n'est ni un test de
plus ni une assertion retirée : c'est une mesure figée qu'on remet au niveau du
disque, et la laisser fausse de dix mille octets est ce que `CLAUDE.md` punit
ailleurs.

---

## 7. § Écarts au brief

1. **`desarmerLaFondation` n'existe pas.** Remplacée par **`desarmerLesModes()`**,
   le SEUL endroit qui remette les deux drapeaux à faux — vérifié au grep, deux
   écritures chacun. Une jumelle aurait été la copie littérale de sa sœur
   (`CLAUDE.md` §4), et le brief demande lui-même `desarmerLesModes` au §3.2 : il
   nomme les deux, et les deux ne peuvent pas coexister sans se doubler.
2. **`renoncerALaFondation` n'existe pas.** Remplacée par **`renoncerAuGeste()`**
   : elle ne fait RIEN qui dépende du geste — vider l'accord, fermer la
   confirmation, désarmer, fermer le panneau.
3. **`refuserLaFondation` n'existe pas.** Remplacée par
   **`refuserLeGeste(quoi, problemes)`**, qui lit le titre dans `TITRE_DU_GESTE`.
   « Déplacer la base » apparaissait déjà à TROIS endroits du fichier ; y ajouter
   « Fonder une base » aux trois mêmes en aurait fait six.
4. **Un seul peintre, une seule liste, une seule teinte.**
   `dessinerCasesDuGeste` et `casesDuGeste` remplacent les jumeaux annoncés : les
   modes s'excluent, donc il n'y a jamais deux liserés à l'écran et rien à
   distinguer. Une seconde teinte demanderait d'élargir une palette CLOSE pour un
   cas qui ne peut pas se produire.
5. **`deplacementEnAttente` devient `gesteEnAttente`, porteur de `{ quoi, cible }`.**
   Le bloc de confirmation est PARTAGÉ : `quoi` est le seul discriminant qui
   empêche l'accord d'un geste de servir l'autre. **Router sur le MODE armé
   serait faux au bord** — un refus désarme avant que l'accord ne soit donné.
6. **`modeDeplacement` est délibérément gardé comme booléen nommé**, plutôt que
   fondu dans un `gesteArme` unique. `CARTE-C T14` porte une garde de SOURCE qui
   cherche `if (modeDeplacement) { … return;` dans `relacher` : la fondre aurait
   fait tomber un test de `monde.test.js`, ce que le §7 du brief interdit.
7. **La sonde du message de vide est à DEUX cases, pas une.** Le jumeau du
   déplacement interroge la case d'à côté ; ici elle tombe dans le 3 × 3 que
   `problemesDeLaFondation` refuse. **Mesuré sur 200 graines : à une case, les
   200 traînent une troisième phrase sur le voisinage qui ne parle que de la
   sonde ; à deux cases, les 200 rendent exactement les deux clauses utiles** —
   le rang manquant et son prix. La sonde change de côté près du bord est.
8. **`PIC T7` est réancré** — § 6.
9. **`desarmerLesModes()` appelle `dessiner()`**, hérité de
   `desarmerLeDeplacement` : armer coûte donc un dessin de plus, au toucher.
   Négligeable, et dit.

---

## 8. Ce qui a été mesuré plutôt que supposé

- **Point d'arrêt §9.6 — le coût de `casesFondables` — NON ATTEINT.** Une base :
  **253 cases en 2,97 ms**, contre `casesAtteignables` à **261 cases en
  2,76 ms**, qui est le modèle déjà accepté. Deux bases : **296 cases,
  10,98 ms**. Elle n'est appelée **qu'à l'armement**, jamais dans `dessiner`.
- **La déduplication n'est pas décorative** : deux bases à cinq rangées et cinq
  colonnes l'une de l'autre rendent **296 cases distinctes** là où le balayage
  naïf en compte **522** — 226 doublons.
- **Sans rang acheté, `casesFondables` rend 0 case sur toute la carte.** C'est
  l'état que le joueur rencontre en PREMIER, et le bouton s'arme quand même :
  « un indice n'est pas une interdiction ».
- **`problemesDuVoisinageDesBases` couvre le 3 × 3 CENTRE COMPRIS**, ce qui donne
  à `BASES-2 T2` (a) son montage : une case à distance Tchebychev 1 est à portée
  euclidienne 10 — donc pas `trop-loin` — et refusée par `voisinage` seul. Le
  montage l'asserte AVANT de toucher.
- **Le point d'arrêt §9.1 est tenu** : ni `acheter` ni `problemesDeLAchat` n'ont
  changé de signature. Le nœud répétable passe par `problemesDeLAchatDUneBase` et
  `acheterUneBaseDePlus`, qui existaient.
- **`casesFondables` ne réécrit AUCUNE règle** : elle INTERROGE
  `problemesDeLaFondation`, comme `casesAtteignables` interroge
  `problemesDuDeplacement` et `casesPosables` `problemesDeLaPose`.

---

## 9. § Points en suspens

1. **AUCUN SON — manque déclaré, pas choix.** `order_player_move` appartient au
   DÉPLACEMENT, et détourner un son de sa famille est ce que `ui/session.js`
   s'interdit en toutes lettres. Le pack n'a pas de son de fondation ; en faire
   un demande un master WAV, donc un lot d'assets. **Ethan tranche.**
2. **AUCUN BILAN DE TERRITOIRE avant de fonder.** `bilanDuTerritoire` chiffre ce
   que gagne une base qui **SE DÉPLACE** — une influence qui quitte un endroit
   pour un autre ; une base **NEUVE** qui **S'AJOUTE** est une autre grandeur, et
   la réutiliser afficherait un nombre plausible et faux. Ce qui entre à la place
   est le **BUTIN**, par `butinDeLaFondation`. **Ethan tranche** s'il veut un
   bilan propre à la fondation — c'est une fonction à écrire, pas une ligne.
3. **LE BUTIN D'UNE FONDATION VA À LA BASE QUI FONDE — décision à ROUVRIR.**
   `fonderUneBase` le verse à `etat.bases[etat.baseCourante]`, c'est-à-dire à
   l'**ANCIENNE** base ; le panneau annonce donc un butin que le joueur ne verra
   pas dans sa base neuve. Le motif écrit au lot BASES-1 — « une base neuve
   déborderait en entier » — **a cessé d'être valide au lot TRANSFERT**, qui
   autorise le butin à dépasser le plafond. **Ce lot ne fait que le câbler tel
   quel**, comme le brief le demande.
4. **AUCUN DÉLAI DE FONDATION.** `fonderUneBase` n'écrit ni
   `dernierDeplacementTick` ni son jumeau : en annoncer un promettrait une
   attente que rien n'applique. Hors lot par le §5 du brief.
5. **LE POINT 4 DE BASES-1 RESTE OUVERT** — `basesRasees` ne nettoie pas le
   territoire peint. Hors lot par le §5, et rien ici ne l'aggrave.
6. ⚠⚠ **LE RENDU N'A PAS ÉTÉ VU, NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE
   DÉCLARE NON EXÉCUTÉ.** Le bouton, le liseré des cases fondables et le panneau
   de confirmation sont mesurés par le **FAUX DOCUMENT** de `monde.test.js` et
   par les appels de canevas enregistrés, **jamais à l'écran**. Le dépôt n'a ni
   jsdom ni navigateur (`CLAUDE.md` §3). **À regarder au premier essai** : que
   « Fonder une base » tienne sous « Déplacer la base » sans pousser le panneau
   hors du cadre — les deux boutons partagent une règle de 10 px en majuscules —,
   et que les **253** cases cerclées ne noient pas la carte au cran le plus
   large, où elles tiennent toutes à l'écran.
7. **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le
   lot ne touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff. Le
   §5 du brief le dit de face : le lancer quand même serait « une consigne
   appliquée de travers, et elle en affaiblirait d'autres ».

---

## 10. Relecture hostile, avant livraison

Faite, et elle a produit **quatre corrections** :

1. **La sonde du message de vide** traînait une phrase sur le voisinage qui ne
   parlait que d'elle-même. Mesurée sur 200 graines, corrigée, et **gardée** par
   une assertion de `BASES-2 T2` (bloc 0) — `F11` le prouve.
2. **`dessinerCasesDuGeste` ne se garde plus sur un drapeau de mode** mais sur
   `casesDuGeste.length` : la liste est donc le seul rempart. **Rien ne le
   mesurait** — `F12` passait au vert. `BASES-2 T2` compte désormais les `rect`
   peints avant et après le renoncement, et `F12` comme `F13` tombent.
3. **La visibilité du bouton n'était mesurée par rien** — `F9` passait au vert.
   Deux gardes existantes gagnent une assertion chacune, l'une pour le OUI
   (`CARTE-C T11`), l'autre pour le NON (la ruine).
4. **`T2 bis` a été fondu dans `T2`.** Le brief pose **deux tests au maximum** ;
   trois avaient été écrits, et le quatrième bloc du `T2` du brief est justement
   « après Renoncer ». Il y est.

Vérifié en outre :

- **les modes ont deux écritures chacun**, les deux armements plus
  `desarmerLesModes` — grep à l'appui ;
- **la liste close des boutons du panneau** (`monde.test.js:357`) reste verte :
  elle tranche le balisage de `id="monde-panneau"` au premier `</div>` après
  `id="monde-panneau-corps"`, et `#monde-panneau-fonder` est **hors** de cette
  tranche ;
- **aucun `try` autour de `fonderUneBase`** — on demande, puis on agit ;
- **l'écran n'écrit jamais `etat.baseCourante`** : `fonderUneBase` fait la
  bascule, l'écran recentre sur ce que le moteur vient de rendre courant ;
- **`apresFondation` appelle `rafraichirTousLesEcrans()`**, et non
  `rafraichirLaBase()` : la base courante a CHANGÉ.

---

## 11. Ce qui reste à Ethan

Le **merge sur `main` lui appartient seul**. Les quatre arbitrages par défaut du
brief sont appliqués tels quels et se défont chacun d'un mot : un lot et non
deux, le butin à la base qui fonde, pas de son, pas de bilan de territoire.
