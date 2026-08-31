# RAPPORT — lot MODULES-B

Flashbang, EMP, Camouflage. Trois modules, **deux crochets** : une entité qui ne
peut plus tirer, une entité qu'on ne peut plus viser.

Exécuté le **31/08/2026** sur `origin/main` remis à neuf (`git fetch` puis
`git reset --hard origin/main` → `3afdf68`, arbre propre), branche
`claude/lot-modules-b`.

---

## 1. Ce qui a été produit

| | avant (MODULES-A) | après (MODULES-B) | delta |
|---|---|---|---|
| `package.json` version | 0.51.0 | **0.52.0** | — |
| `config.build` | 52 | **53** | — |
| `SAVE_VERSION` | 14 | **14** | inchangé |
| `npm run check` | 667 pass / 0 fail | **682 pass / 0 fail** | **+15 tests** |
| `dist/index.html` | 1 260 325 o | **1 261 788 o** | **+1 463 o** |
| Marge sous la borne T10 (1 300 000) | 39 675 o · 3,05 % | **38 212 o · 2,94 %** | −1 463 o |
| `node tools/audit-maquette.mjs` | ROUGE, 7 écarts, rc=1 | **ROUGE, 7 écarts, rc=1** | **identique** |

**Enveloppe respectée** : +1 463 octets sur les 3 000 annoncés au §5 du brief.
Aucune image, aucun écran neuf, aucun champ de sauvegarde.

`version` et `config.build` sont des **chaînes**, et ils ont été bumpés
ensemble. Aucune branche distante ne portait un numéro plus haut au moment du
bump (`origin/main` était à 0.51.0 · 52, seule branche présente).

---

## 2. Ce qui a changé, fichier par fichier

**`src/data/modules.js`** — trois drapeaux retournés, `cable: {offense: true,
defense: false}` pour `flashbang`, `emp` et `camouflage`, chacun avec le
commentaire qui dit **pourquoi la défense reste fausse** : le moteur ne balaie
que le camp `attaque`, exactement comme le Booster. La Meute et le Bélier
portent le Flashbang en défense, la Carapace et le Fendeur l'EMP : rien ne les
lirait de ce côté-là.

Après le lot, câblés en offense : `booster`, `camouflage`, `ecraseur`, `emp`,
`flashbang`, `tirDeBarrage` — **six**. Câblés en défense : **zéro**.

**`src/sim/combat.js`** — une étape ajoutée et deux fonctions existantes
modifiées, `ciblage` et `tir`. Rien d'autre, comme le §3 du brief l'exige ; les
helpers ci-dessous ne sont appelés que par ces trois-là.

- **Étape `3 bis. declencherNeutralisations`**, entre le ciblage et le tir :
  table `NEUTRALISATION` (deux lignes), `NEUTRALISATION_TICKS = 50`,
  `NEUTRALISATION_PENALITE_PCT = 20`, plus `estNeutralisee`,
  `ticksDeNeutralisation` et `cibleDeNeutralisation`.
- **`tir`** — une garde d'une ligne (`if (estNeutralisee(e)) continue;`) posée
  **avant** l'appel à `tirDeBarrage`.
- **`ciblage`** — `ensembleCamoufles(etat)` (nouveau helper, son seul appelant)
  calculé en tête, un masque par tireur, et **deux** usages du `Set` : la boucle
  des candidats et le bloc « cible conservée ».

**`test/recherche.test.js`** — quinze tests, `MODULES-B T1` à `T15`.

**`CLAUDE.md`** — bloc de référence du §0 réécrit (682 tests, 1 261 788 octets,
marge 2,94 %, audit à 7 écarts), l'ancien passé en historique, et une entrée de
journal au §6.

---

## 3. Les quinze tests, et ce qui ferait tomber chacun

Une garde qui ne peut pas tomber ne garde rien. Pour chaque test, le montage qui
le falsifie a été **exécuté** : la source est sabotée, la suite rejouée, la
source restaurée (md5 vérifié identique après chaque passe). **Dix-neuf
sabotages** en tout.

| test | ce qu'il mesure | ce qui le fait tomber, **mesuré** |
|---|---|---|
| **T1** | le Flashbang frappe l'infanterie, pas la structure ; la cible ne tire plus dès le tick 1 | A, B, E, F, H, I |
| **T2** | l'EMP frappe le véhicule, artilleries comprises | B, E, F, I |
| **T3** | durées 50 · 50 · 40 · 30 · 20 · 10 · 0 · 0 (soustraction, pas produit) | A, B, C |
| **T4** | une durée nulle ne consomme pas l'usage, et le porteur réessaie | A, B, C, D |
| **T5** | une seule fois par combat, la marque n'est jamais retirée | B, E |
| **T6** | la neutralisée **garde** sa cible et la reprend à l'expiration | A, B, E, F |
| **T7** | une neutralisée ne fait pas non plus de Tir de barrage | G |
| **T8** | Camouflage : invisible seul, révélé par une prédilection, **relâché** au recamouflage | K, M, N |
| **T9** | le Booster ne franchit pas un mur (arbitrage 2) | **S** |
| **T10** | le ciblage ne dépend pas de l'ordre de déclaration | B, E, F, M, **O** |
| **T11** | déterminisme avec les trois modules actifs | B |
| **T12** | un seul mécanisme pour les deux neutralisations | — *garde structurelle, voir plus bas* |
| **T13** | `cable` par branche, achat ouvert/refusé | — *garde de données* |
| **T14** | le départage de la neutralisation est celui de `ciblage` | B, **P** |
| **T15** | deux porteurs **empilent** leurs effets, le plus long fait foi | **T** |

Les sabotages, tels qu'ils ont été appliqués :

```
A cible prise sur e.cibleIndice    → T1, T3, T4, T6
B lecture du chassis brut          → T1, T2, T3, T4, T5, T6, T10, T11, T14
C pénalité multiplicative          → T3, T4
D marque posée avant la durée      → T4
E garde d'usage unique retirée     → T1, T2, T5, T6, T10
F garde posée dans ciblage         → T1, T2, T6, T10
G garde après le barrage           → T7
H moduleActif retiré               → MODULES-A T4, MODULES-B T1
I étape 3 bis après le tir         → T1, T2
J camouflage évalué au fil de la boucle → AUCUN TEST NE TOMBE
K masque oublié dans la cible conservée → T8
L masque appliqué aussi à l'attaque → AUCUN TEST NE TOMBE
M camouflage jamais levé           → T8, T10
N moduleActif retiré du camouflage → MODULES-A T5, MODULES-B T8
O départage retiré dans ciblage    → T10
P départage retiré dans cibleDeNeutralisation → T14
Q peutAvancer toujours vrai        → aucun test de ce lot (12 tests ailleurs)
S blocage d'occupation contourné   → T9 (et 25 tests ailleurs)
T effet remplacé au lieu d'empilé  → T15
```

⚠ **A à P ont été mesurés sur `test/recherche.test.js` seul** — la colonne dit
donc quels tests DE CE LOT tombent, pas ce qui casse ailleurs dans le dépôt.
Q et S, ajoutés en fin de course, ont été mesurés sur `npm run check` entier ;
c'est de là que viennent les « 12 » et « 25 tests ailleurs ».

⚠ **DEUX SABOTAGES — J ET L — NE FONT TOMBER AUCUN TEST, ET CE N'EST PAS UN
TROU : CE SONT DES NO-OP SÉMANTIQUES, DÉMONTRÉS.** (Q, lui, casse bel et bien
douze tests ailleurs ; il ne change simplement rien à ce que T9 mesure —
voir §7.)

- **J** — évaluer l'ensemble des camouflés au fil de la boucle au lieu d'une
  fois en tête. `ciblage` n'écrit que `cibleIndice` ; le prédicat de camouflage
  lit le camp, l'activité, la colonne de prédilection, les positions et la
  portée — **rien de ce que `ciblage` mute**. Les deux formes rendent donc le
  même résultat, à tous les ticks. Le pré-calcul reste le bon choix (O(n) au
  lieu de O(n²), et une règle qu'on lit d'un bloc), mais **le justifier par la
  simultanéité serait faux**, et le brief le justifie ainsi.
- **L** — appliquer le masque aussi aux tireurs du camp `attaque`.
  `ensembleCamoufles` ne contient que des attaquants, et `ciblage` écarte déjà
  les candidats de même camp (`c.camp === e.camp`) : le masque ne peut jamais
  mordre pour un attaquant. Le ternaire `e.camp === 'defense' ? camoufles :
  null` est une économie de test par candidat, pas une règle — et le
  commentaire du code le dit déjà ainsi.

⚠ **UN TROU RÉEL A ÉTÉ TROUVÉ ET FERMÉ.** Avant `T14`, retirer les deux lignes
de départage de `cibleDeNeutralisation` (sabotage **P**) ne faisait tomber
**aucun test** : la cible neutralisée aurait été celle que l'ordre de
déclaration présente la première. `T14` monte deux Meutes à égale distance et
vérifie, **dans les deux ordres de déclaration**, que c'est la plus petite
colonne qui est retenue ; puis, sur une position forgée, que c'est la plus
petite rangée. Sabotage P rejoué : `T14` tombe.

⚠ **UN COMPORTEMENT NON DEMANDÉ A ÉTÉ CONSTATÉ, MESURÉ ET FIGÉ.** Deux
porteurs peuvent neutraliser la **même** cible : les effets **s'empilent** au
lieu de se remplacer. Mesuré en raid (`carapace#13` porte deux `neutralise` au
même `finTick`, `belier#18` deux à 81 et 92) puis en montage isolé : deux
Crécelles de niveaux 30 et 28 posent `finTick` 59 et 36 sur le même Bélier ;
l'échéance courte tombe seule au tick 36, la cible reste muette jusqu'au 58.
C'est sans danger — `estNeutralisee` est un `.some()`, donc **le plus long fait
foi** — mais ce n'était écrit nulle part. `T15` le fige ; une implémentation qui
remplacerait l'effet raccourcirait la neutralisation en silence (sabotage T).
**Rien n'a été changé dans le code** : si Ethan préfère un remplacement ou un
plafond, c'est un arbitrage, pas un correctif.

`T12` et `T13` sont des gardes de structure et de données : `T12` compte les
occurrences de `flashbang` et `emp` dans `src/sim/combat.js` (commentaires
retirés, fins de ligne comprises) et exige **une** de chaque, plus une seule
déclaration de chacune des trois fonctions — un second barème nommé à la main
les ferait tomber. `T13` liste les trois modules câblés, les huit qui ne le sont
d'aucun côté, et joue les neuf achats.

---

## 4. Ce qui a été mesuré et non recopié

**La ligne de base.** Le rapport de MODULES-A signale que la référence `main` de
son clone pointait sur le mauvais commit. `git fetch origin main` puis
`git reset --hard origin/main` (→ `3afdf68`), arbre propre vérifié, puis mesure :
**667 pass / 0 fail**, `dist/index.html` **1 260 325 octets**, `0.51.0` · `52`,
`SAVE_VERSION` **14**, audit **ROUGE 7 écarts rc=1**. Tous les chiffres annoncés
au §2 du brief sont confirmés, y compris la marge (39 675 o, 3,05 %).

**L'audit, écart par écart.** Les sept lignes `KO` sont **les mêmes avant et
après**, dans le même ordre, mot pour mot :

```
KO   terrain identique à champsDeLaBase(275, 16)
KO   disposition légale
KO   emplacements 11 / 12
KO   débit quartz : +732/h
KO   débit scorie : +0/h
KO   débit electricite : +684/h
KO   raffinerie : +176 quartz +352 scorie / h
```

Code de sortie **1** avant comme après. Aucun écart en plus, aucun en moins.

**`tools/verifier.py` n'a pas été lancé**, et c'était conforme : le lot ne
touche ni `art/`, ni `tools/*.py`.

---

## 5. L'écran Recherche — rendu ET cliqué

Chromium 1194, `dist/index.html` servi en local, **360 × 740, dpr 2, tactile**,
sauvegarde forgée par l'API du jeu (`creerEtat` + `acheter`, `serialiser`)
injectée sous `foyer-zero/partie/1`, puis `setItem` neutralisé pour que la
partie ne s'écrase pas au rechargement.

**Les CINQ lignes qui s'ouvrent s'achètent**, en deux touchers, au prix exact :

| ligne | avant | 1ᵉʳ toucher | 2ᵉ toucher | débit constaté |
|---|---|---|---|---|
| Flashbang #0 (offense, Meute) | `10 000 000`, actif | **`Confirmer ?`** | **`Acquis`**, désactivé | **10 000 000** |
| Flashbang #1 (offense, Bélier) | `80 000 000`, actif | `Confirmer ?` | `Acquis` | **80 000 000** |
| EMP #0 (offense, Crécelle) | `150 000 000`, actif | `Confirmer ?` | `Acquis` | **150 000 000** |
| Camouflage #0 (offense, Frappeur) | `800 000 000`, actif | `Confirmer ?` | `Acquis` | **800 000 000** |
| Camouflage #1 (offense, Guetteur) | `1 200 000 000`, actif | `Confirmer ?` | `Acquis` | **1 200 000 000** |

**Les QUATRE lignes défense refusent, chacune avec sa mention** — bouton
`disabled`, mention posée sous la ligne, accent compris :

| ligne | bouton | mention |
|---|---|---|
| Flashbang #0 (défense, Meute) | `10 000 000` **disabled** | **« Flashbang n'a pas d'effet en défense »** |
| Flashbang #1 (défense, Bélier) | `14 000 000` **disabled** | idem |
| EMP #0 (défense, Carapace) | `800 000 000` **disabled** | **« EMP n'a pas d'effet en défense »** |
| EMP #1 (défense, Fendeur) | `150 000 000` **disabled** | idem |

Deux touchers sur chacune : le libellé ne bouge pas, la mention non plus, et
**le compteur de points est inchangé** (assertion explicite du banc, quatre fois
`true`).

⚠ **LE BANC RÉUTILISÉ DE MODULES-A DIVISAIT LE DÉBIT PAR 1 000.** Vérifié à la
main sur la première ligne : `#recherche-points` passe de `9 999 972 730 000` à
`9 999 962 730 000`, soit une différence brute de **10 000 000** — exactement le
prix affiché. Le diviseur a été retiré ; les chiffres du tableau ci-dessus sont
les différences **brutes**.

⚠ **ET LE PIÈGE DE BANC DE MODULES-A TIENT TOUJOURS** : `peindre` reconstruit le
DOM, un handle capturé avant l'achat serait détaché et mentirait. Le banc relit
la ligne **vive** avant chaque geste.

Erreurs console : **une**, `404` du serveur statique du banc sur une ressource
qu'il ne sert pas. Ce n'est pas une erreur du jeu. **Aucune `pageerror`.**

Captures : `/tmp/banc/b-offense.png` et `/tmp/banc/b-defense.png`.
⚠ **AUCUN APPAREIL RÉEL N'A ÉTÉ JOINT** — c'est un Chromium headless au gabarit
du téléphone, pas la WebView Android. `node --check` et un démarrage sans erreur
ne prouvent rien sur le rendu réel.

---

## 6. Un raid avec chacun des trois modules — preuve d'EXISTENCE

⚠ **CE QUI SUIT EST UNE PREUVE D'EXISTENCE, PAS UN RENDEMENT.** Aucun butin
n'est comparé, aucun barème n'est proposé, aucune conclusion n'est tirée sur la
valeur des modules : l'équilibrage est le domaine d'Ethan et ce lot n'y touche
pas.

Sites **réels du générateur** (`montageDuSite`, graine 2026, avant-poste),
combat joué **de bout en bout** jusqu'à `termine`.

⚠ **LA DURÉE DU RAID EST RAPPORTÉE COMME UN FAIT DU MONTAGE, PAS COMME UNE
MESURE DE LA VALEUR DES MODULES.** Un raid plus long n'est ni meilleur ni pire ;
il n'en est tiré aucune conclusion.

### Avant-poste niveau 20, armée niveau 20

Défenses : 3 casemates, 2 batteries, 2 créneaux, 3 Meutes, 2 Perceurs,
2 Carapaces, 3 Fendeurs, 3 Béliers, 2 Ratisseurs, 1 herse. **172 ticks** avec
les trois modules, 168 sans.

| module | tick de déclenchement | porteur | cible (indice) | effet jusqu'au tick |
|---|---|---|---|---|
| EMP | **31** | `crecelle#52` | `belier#18` | 81 |
| EMP | **42** | `crecelle#51` | `belier#18` | 81 |
| Flashbang | **66** | `belier#49` | `carapace#13` | 116 |
| Flashbang | **66** | `belier#50` | — | — |
| Flashbang | **107** | `meute#48` | `carapace#13` | 116 |
| Flashbang | **166** | `meute#47` | `meute#8` | 216 |

Ticks **sans tir** pendant l'effet : `belier#18` **40**, `carapace#13` **10**,
`meute#8` **7**.

⚠ **LA LIGNE SANS CIBLE (`belier#50`, tick 66) EST UNE LIMITE DE LA SONDE, PAS
UN DÉCLENCHEMENT À VIDE.** Les deux Béliers marquent au même tick et
neutralisent **la même** `carapace#13` ; la sonde apparie porteurs et nouveaux
effets par rang, et n'en voit qu'un. Vérifié en relisant l'état : `carapace#13`
porte bien **deux** `neutralise` au tick 66, tous deux à `finTick` 116. Idem
pour `belier#18`, qui en porte deux (81 et 92) après les deux EMP. Voir `T15`.

Camouflage — tick auquel un défenseur commence à viser un Guetteur :
**80** avec le module (`belier#19` → `guetteur#55`), **63** sans
(`belier#19` → `guetteur#54`).

### Avant-poste niveau 40, armée niveau 40

Défenses : 1 faucheuse, 1 mortier, 1 harpon, 3 casemates, 4 batteries,
3 créneaux, 3 Meutes, 1 Perceurs, 2 Carapaces, 4 Fendeurs, 5 Béliers,
4 Ratisseurs, 1 herse, 2 ronces. **250 ticks** avec les trois modules, 89 sans.

| module | tick de déclenchement | porteur | cible (indice) | effet jusqu'au tick |
|---|---|---|---|---|
| EMP | **22** | `crecelle#75` | `belier#27` | 72 |
| EMP | **31** | `crecelle#74` | `belier#26` | 81 |
| Flashbang | **87** | `belier#73` | `meute#14` | 137 |

Ticks **sans tir** pendant l'effet : `belier#27` **50**, `belier#26` **50**,
`meute#14` **51**.

Camouflage — tick auquel un défenseur commence à viser un Guetteur :
**60** avec le module (`faucheuse#0` → `guetteur#77`), **26** sans
(`belier#24` → `guetteur#77`).

⚠ **LES CAMPS ET AVANT-POSTES DE DÉBUT DE PARTIE N'ONT NI ARTILLERIE NI
VÉHICULE.** Sur une partie neuve (`creerEtat` + `rattraperJeu(3001)`), les trois
sites atteignables sont deux camps niveau 1 (`{meute: 3}`) et un avant-poste
niveau 6 (`{meute: 4, perceurs: 1, merlon: 1}`) — les Perceurs sont une
**escouade**. L'EMP n'y a donc **rien** à neutraliser, et aucun défenseur n'y
vise jamais un Guetteur, module ou pas. C'est une propriété du générateur de
sites à bas niveau, pas du module : c'est pourquoi la preuve ci-dessus est jouée
aux niveaux 20 et 40, où le générateur pose des artilleries et des véhicules.

---

## 7. Le verdict de T9 — l'arbitrage 2 était déjà tenu

**Question d'Ethan :** le Booster franchit-il ce qui est devant lui ?
**Réponse :** non — ralenti par les obstacles, bloqué par ce qui barre sa
colonne.

**Verdict : le code faisait déjà exactement cela. Aucune ligne n'a été
modifiée.** Le test le verrouille, il ne corrige rien.

Mesuré : une Carapace boostée, colonne 5, un merlon en rangée 8. La fenêtre du
Booster s'ouvre au tick 18 (blessure par la Ronce) ; l'unité avance de
**600 milli/tick** aux ticks 20 à 25, atteint **7 820 milli** — la rangée 7 —,
et **n'avance plus** à partir du tick 26, **pendant que l'effet est encore
actif** (`effetsTemporises.length === 1` au moment du blocage). Le même montage
**sans le mur** atteint 8 420 au tick 26 et 18 680 au tick 48.

⚠ **ET CE N'EST PAS `peutAvancer` QUI REFUSE — MESURÉ.** Le §1 du brief attribue
le refus à `peutAvancer` (« refuse d'avancer sur une case occupée par une entité
non écrasable »). Vérifié en sabotant la fonction : `peutAvancer` forcée à
`true`, **la Carapace boostée reste bloquée à 7 820**, et aucun test de ce lot ne
tombe. `peutAvancer` est un **pré-calcul** : il alimente `progresse`, donc le
compteur de repli et le forçage de l'Écraseur. Le refus d'avancer, lui, est
exécuté **à la fin de `deplacement`** — la case de destination est occupée,
`peutEcraser` répond non, « blocage, aucune avance ». Contournement de ce
bloc-là : **T9 tombe** (avec 25 tests ailleurs). Les deux chemins passent par
`peutEcraser`, donc le verdict est le même ; l'attribution ne l'était pas.

Le second volet de l'arbitrage — « ralenti par les obstacles » — était déjà
mesuré par MODULES-A T5 : sous obstacle la valeur boostée vaut **240**
(= 24 × 10) et non 600, parce que le ×10 s'applique **après** la réduction. T9
en garde le rapport, mesuré sur les données : `carapace.vitesse` = 60,
(60 ÷ 2,5) × 10 = 240.

---

## 8. Écarts au brief, et leur raison

1. **T10 ne compare pas `serialiserEtat` — c'est impossible, et déjà sur `main`.**
   Le §6 propose de vérifier que le même montage rend le même `serialiserEtat`
   après permutation des défenseurs. Permuter deux défenseurs permute leurs
   `indice` ; l'état les porte (`entites` est un tableau, `cibleIndice` un rang
   dans ce tableau). Mesuré : deux résolutions strictement identiques rendent
   deux chaînes différentes, **sans aucun camouflage en jeu**. T10 compare donc
   une **projection canonique** — chaque entité désignée par son identité, cible
   réécrite en identité, tableau trié —, et garde en assertion de montage que la
   permutation a bien eu lieu.

2. **T10 n'est pas falsifié par ce que le brief annonce.** Le §6 écrit
   « falsifié par un camouflage évalué au fil de la boucle » ; ce sabotage est un
   **no-op sémantique** (§3, J). T10 est falsifié, et c'est mesuré, par le
   retrait du départage de `ciblage` (sabotage O), ainsi que par B, E, F et M.

3. **L'écran ouvre CINQ lignes, pas six.** Le §6 annonce « six lignes qui
   s'ouvrent ». Les porteurs sont la Meute et le Bélier (Flashbang), la Crécelle
   (EMP), le Frappeur et le Guetteur (Camouflage) : **cinq**. Les quatre lignes
   défense qui refusent sont, elles, exactement quatre. Le compte est mesuré en
   parcourant `ARBRE_RECHERCHE` (test T13) et retrouvé à l'écran.

4. **T14 n'est pas au brief.** Le §6 ne prévoit rien pour le départage de
   `cibleDeNeutralisation`, alors que le §3 exige qu'il soit « celui de
   `ciblage`, à la lettre ». Sans test, le retirer ne faisait tomber personne.
   T14 a été ajouté pour cela.

5. **T7 pose son effet à la main, et l'état n'est pas atteignable en jeu.**
   `declencherNeutralisations` ne balaie que le camp `attaque` : seuls des
   **défenseurs** sont neutralisés, et le barrage d'un défenseur n'a aucune
   cible (les structures adverses n'existent pas côté attaque). L'effet est donc
   forgé, sous la forme exacte que `expirerEffets` sait filtrer, et le test
   verrouille la **position** de la garde — avant `tirDeBarrage`, pas après. Un
   témoin sans neutralisation prouve que le barrage mord dans le même montage.

6. **Le banc d'écran de MODULES-A divisait le débit par 1 000.** Corrigé, et
   revérifié à la main sur une ligne. Voir §5.

7. **Le §1 du brief attribue le blocage à `peutAvancer` ; ce n'est pas lui.**
   Mesuré au sabotage : la fonction forcée à `true` ne fait pas franchir le mur.
   Le refus est exécuté en fin de `deplacement`. Voir §7. Rien n'a été corrigé
   dans le code — c'est la phrase du brief qui décrit mal un code juste.

---

## 9. Ce qui reste ouvert

- **Huit modules ne sont toujours pas câblés**, et la classification du brief
  est exacte — vérifiée en balayant les porteurs, pas recopiée :
  **offensifs** `bouclier` (Enclume) et `garnison` (Ratisseur, Busard) ;
  **purement défensifs** `autoReparation` (six ouvrages), `rayonMiniMoinsUn`
  (les trois artilleries), `pvPlusVingt` (Broyeur en défense et trois ouvrages),
  `rayonPlusUn` (Guetteur en défense) ; **portés par le seul `moduleOuvrage`**
  `munitionSpeciale` (trois tourelles) et `volDeVie` (Broyeur, Enclume). Ils
  s'affichent et refusent l'achat avec le message d'attente.
- **Aucune branche `defense` n'est câblée**, et le moteur ne lit `p.module` que
  du côté qui attaque. Câbler un module en défense demandera un second balayage,
  pas un drapeau.
- **La marge sous la borne T10 est à 2,94 %.** Elle ne descend plus que de
  quelques centièmes tant que les lots sont du code ; c'est le prochain atlas
  qui la fera tomber.
- **L'audit maquette reste rouge à 7 écarts** — il l'était avant ce lot, il le
  reste. Le refermer demande un lot dédié.
- **Rien n'a été vérifié sur un appareil réel.** Le rendu de l'écran Recherche
  est mesuré dans un Chromium headless au gabarit du téléphone.
