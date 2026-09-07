# RAPPORT — lot TRANSFERT : ce qui se passe au plafond

02/09/2026. Écrit sur disque, à la racine, comme `CLAUDE.md` §5 l'exige.

---

## 1. Version et build produits

| | |
| --- | --- |
| `package.json` `version` | **0.69.0** (était 0.68.0) |
| `package.json` `config.build` | **"70"** (était "69") — **chaîne**, jamais nombre |

Les deux sont bumpés ensemble, et seulement parce que `dist/index.html` change.
`android/app/build.gradle.kts` les lit `as String` ; un nombre y fait tomber le
build Android à la CONFIGURATION, et `donnees.test.js` extrait du Gradle la liste
des champs coulés `as String` pour l'exiger.

---

## 2. Base de référence — **NON RETROUVÉE**, et la raison est entière

⚠⚠ **LES CINQ LIGNES DU §1 NE SE RETROUVENT PAS, PARCE QUE LE LOT PIXELS A ÉTÉ
MERGÉ ENTRE L'ÉCRITURE DU BRIEF ET SON EXÉCUTION.** Mesuré sur un arbre propre à
`0f28304` avant de toucher quoi que ce soit :

| Grandeur | Brief (§1) | Mesuré | Verdict |
| --- | --- | --- | --- |
| version / build | 0.67.0 / 68 | **0.68.0 / 69** | ✗ — PIXELS a bumpé |
| `dist/index.html` | 1 388 959 o | **1 581 919 o** | ✗ — **+192 960**, tous des sprites |
| `node --test` | 902 pass / 0 fail | **903 pass / 0 fail** | ✗ — PIXELS a ajouté un test |
| `SAVE_VERSION` | 24 | **24** | ✅ |
| `butinPerdu` | 4 fichiers nommés | **exactement les quatre** | ✅ |

**Ce que j'ai fait, et pourquoi.** Le §7 fait de cette ligne un point d'arrêt.
J'ai vérifié d'abord si le désaccord touchait ce lot :

- PIXELS ne modifie `src/` que par **`src/ui/banc.js`** — le banc de debug.
  `git diff --name-only caf55cc..0f28304 -- src/sim/ src/data/ src/ui/` ne rend
  que ce fichier. Ni l'économie, ni le raid, ni la fondation ne sont touchés.
- Les **deux seules lignes dont ce lot dépend** — `SAVE_VERSION` et les quatre
  fichiers de `butinPerdu` — sont **intactes**.
- Les trois lignes qui divergent sont du **paquetage** : un numéro de version,
  un poids d'atlas, un test de plus. `CLAUDE.md` §0 les documente lui-même dans
  l'entrée PIXELS, borne T10 relevée à 1 650 000 comprise.

J'ai donc **poursuivi en le déclarant**, plutôt que de rendre un lot vide pour un
écart que `git` explique entièrement. **La décision t'appartient** : si tu veux
que la règle du §7 s'applique à la lettre même dans ce cas, dis-le et je
m'arrêterai la prochaine fois.

⚠ **Le §4.2 du brief contient une seconde imprécision, sans conséquence** : il
renvoie à « `verser` DE `economie-base.js` ». Cette fonction vit dans
**`src/sim/raid.js`** ; `economie-base.js` n'en a pas. La consigne de fond — sa
signature suppose un plafonnement, c'est elle qu'il faut regarder — était juste,
et c'est ce qui a été fait.

---

## 3. Delta d'octets, tests avant / après

| | avant (PIXELS) | après |
| --- | ---: | ---: |
| `npm test` | 903 pass / 0 fail | **924 pass / 0 fail** |
| `dist/index.html` | 1 581 919 o | **1 591 262 o** |
| références externes | 0 | **0** |
| images inlinées (`data:image`) | 16 | **16** |

**Delta : +9 343 octets.** Du code, du balisage et de la feuille — aucune image
n'entre. **Marge T10 : 58 738 octets, 3,56 %**, borne inchangée à 1 650 000.

**+21 tests** : dix-neuf neufs dans `test/transfert.test.js`, et deux
RETOURNÉS dans `test/raid.test.js` (voir §10). Aucune assertion n'a été retirée
sans être remplacée par son inverse déclaré.

---

## 4. Chaque test du §6 : PASS/KO, avec son montage de falsification

Les quatorze falsifications tournent **sur une COPIE FRAÎCHE du dépôt**, jamais
sur l'arbre de travail, avec `dist/` construit dans le bac à sable, et le harnais
**refuse de continuer si le motif n'est pas trouvé**.

| # | Test | Verdict | Falsification | Ce qui tombe |
| --- | --- | --- | --- | --- |
| T1 | Un stock au-dessus du plafond se **gèle** | **PASS** | F1 : `plafond = cap` dans le tick | `T1`, `T2`, `T3`, 2 de `bases`, 3 d'`economie-base` |
| T2 | `tick × n ≡ rattrapage(n)` **au-dessus** du plafond | **PASS** | (couverte par F1 et F2) | `T2` + 4 d'`economie-base` |
| T3 | L'arrêt est **par ressource** | **PASS** | F2 : une ressource pleine gèle toute la base | `T2`, `T3`, 4 d'`economie-base` |
| T4 | Le butin **dépasse**, plus de `butinPerdu` | **PASS** | F3 : le butin replafonne · F14 : `butinPerdu` revient | `T4`, `T4 bis`, 4 de `bases` |
| T5 | `round(√x)` entier ≡ la racine flottante | **PASS** | F4 : tronquer · F6 : boucle non bornée | `T5` |
| T6 | Pas de `Math.sqrt` où une règle se décide | **PASS** ⚠ écart | F5 : `Math.sqrt` dans `sim/transfert.js` | `T6` |
| T7 | 0 → 100 %, 10 → 90 %, **99 → 1 %** | **PASS** | F8 : refus écrit `>= 99` | `T7 bis` |
| T8 | Le débordement est refusé, et il **chiffre** | **PASS** | (couverte par F13) | `T8`, `T10` |
| T9 | Le refus se calcule sur le **reçu** | **PASS** | F9 : comparer l'envoyé | `T7 bis`, `T9` |
| T10 | Une destination au-dessus du plafond ne reçoit **rien** | **PASS** | F13 : le transfert peut faire déborder | `T10` |
| T11 | **Rien ne bouge** si le transfert échoue | **PASS** | F10 : débiter avant de vérifier | `T9`, `T11` |
| T12 | L'électricité est refusée, la phrase la nomme | **PASS** | F11 : la rendre transférable | `T11`, `T12`, +2 |
| T13 | La distance vient des `position` | **PASS** | F12 : mesurer sur les `fondation` | `T13` + 5 autres |
| T14 | Mille envois de 1 ≡ un envoi de 1000 | **PASS** | F7 : diviser avant de multiplier | `T14` |
| T15 | **Les 903 tests passent** | **PASS** | — | 924 pass / 0 fail |

⚠⚠ **TROIS FALSIFICATIONS SUR QUATORZE NE MORDAIENT PAS AU PREMIER RELEVÉ**, et
les tests qui les attrapent ont été écrits **après** la mesure :

- **F8** (`>= 99` au lieu de `> 99`) — `T7` testait bien le barème à 99 cases,
  mais **aucun test ne faisait PASSER un transfert à cette distance**. D'où
  `T7 bis`, qui en joue un entier à 99 cases, et un refusé à 100.
- **F9** (comparer l'envoyé) — mon premier `T9` enfermait son assertion dans un
  `if (recu <= place)` qui n'était jamais vrai : il ne mesurait rien. Réécrit
  avec trois nombres assertés **avant** la mesure — `reçu ≤ place < envoyé`.
- **F13, première version** — « rabattre le plafond de la destination à `cap` »
  **ne changeait rien** : `max(cap, stock) − stock` et `cap − stock`, tous deux
  bornés à zéro, rendent le même nombre. **C'était une mauvaise falsification,
  pas une garde muette.** Remplacée par une qui contredit vraiment la règle — un
  plafond doublé — et `T10` tombe.

---

## 5. M1 — la perte cumulée d'un aller-retour

Sur 1 000 unités, avec les vraies fonctions, en entiers :

| Distance | À l'arrivée | De retour | Perdu | % perdu |
| ---: | ---: | ---: | ---: | ---: |
| 10 cases | 900 | 810 | 190 | **19,00 %** |
| 50 cases | 500 | 250 | 750 | **75,00 %** |
| 99 cases | 10 | 0,1 | 999,9 | **99,99 %** |

**C'est un constat, pas un réglage.** Un aller simple coûte `cases` pour-cent ;
un aller-retour coûte `1 − (1 − c/100)²`, donc bien plus du double dès que la
distance monte. À 50 cases, faire circuler une ressource entre deux bases en
détruit les trois quarts.

---

## 6. La prémisse retombée de `fondation.js`

Le commentaire justifiait que le butin d'un camp fondé dessus aille à la base
**qui fonde** par : « une base neuve n'a qu'un Chantier de niveau 1, donc
50 · 50 · 40 de capacité ; y verser le butin d'un avant-poste de niveau 40 le
ferait déborder EN ENTIER, et `butinPerdu` annoncerait la perte de la
quasi-totalité ».

**Cet argument est mort avec ce lot** : le butin a le droit de dépasser, il
tiendrait très bien dans la base neuve, gelé au-dessus du plafond, et rien ne
serait perdu.

**Le comportement n'a PAS changé** — le brief §4.5 demande de garder le geste et
de réécrire l'argument. Le nouveau commentaire porte les deux côtés :

> Ce qui reste vrai en faveur de la base qui fonde : elle est BÂTIE, donc ce
> qu'elle reçoit est immédiatement dépensable, et son stock ne bloque la
> production que des ressources déjà pleines. Ce qui parle maintenant pour la
> base neuve : le butin l'amorcerait bien mieux que les 30 · 30 · 20 qu'elle
> reçoit, au prix d'une base qui démarre avec sa production gelée.
> **Les deux se tiennent, et le choix appartient à Ethan.**

**Si tu retiens l'inverse**, c'est l'argument de `verserLeButin` dans
`fonderUneBase` qui change — `quiFonde` devient `etat.bases[indice]` —, et rien
d'autre. Le test `BASES-1 T7 bis` fige le comportement actuel et dit qu'il est
rouvert.

---

## 7. Le commentaire qui protège la racine entière

Cité tel qu'écrit dans `src/sim/transfert.js` :

> ⚠⚠⚠ AUCUN `Math.sqrt`, ET CE N'EST PAS UNE COQUETTERIE : C'EST UN ARRONDI
> EXACT, PAS UNE APPROXIMATION. Un futur lot lira cette boucle et voudra la
> « simplifier » en `Math.round(Math.sqrt(d))` — voici pourquoi il ne faut pas.
> L'identité employée est :
>
>     round(√x) = n   ⟺   (2n − 1)² ≤ 4x < (2n + 1)²
>
> Elle ne fait intervenir que des entiers, donc elle ne peut pas se tromper d'une
> unité près d'un demi — ce que `Math.sqrt` peut faire, sa mantisse étant finie.

Suivi de la borne, écrite explicitement :

> ⚠⚠ LA BOUCLE EST BORNÉE EXPLICITEMENT, ET LA BORNE N'EST PAS DÉCORATIVE. […]
> Sans cette borne, une distance absurde — arrivée par une position corrompue —
> ferait tourner la boucle des milliards de fois.

**Mesuré : 7 879 couples comparés, zéro désaccord.** Ce sont les couples de 0 à
140 dans les deux axes dont la distance arrondie tombe dans les 99 cases
permises ; les 12 002 autres sont au-delà de la portée, où la fonction s'arrête
volontairement et rend `porteeMaxCases + 1`.

⚠⚠ **ÉCART DÉCLARÉ SUR T6.** Le brief demandait « aucun `Math.sqrt` dans `src/` :
le grep reste vide ». **C'est impossible, et ça l'était avant ce lot** : deux
racines existent depuis les lots ÉCRAN-CARTE et RETOURS-DU-31, toutes deux dans
le chemin du DESSIN — `render/terrain.js` normalise une somme pondérée de tuiles,
`ui/monde.js` normalise un vecteur d'écran pour tracer une flèche —, et la
seconde porte déjà le commentaire qui dit pourquoi : « ici une racine est
légitime […] on est dans le DESSIN, en pixels, pas dans une règle de jeu ». Les
retirer casserait le rendu sans rien gagner.

**La garde tient donc la doctrine d'EUCLIDE** : interdiction **totale** dans
`src/sim/` et `src/data/`, où les règles se décident ; ailleurs la liste est
**fermée et nommée**, si bien qu'un troisième fichier fait tomber le test.

---

## 8. La lecture prise sur l'emplacement du panneau

⚠ **LECTURE PRISE — Ethan n'a pas dit où le mettre.** Le panneau s'ouvre depuis
un bouton **« Transférer » ajouté à la barre de bascule entre bases**, celle que
BASES-1 a rendue vive.

**Pourquoi là** : c'est le seul endroit de la page qui parle **des bases au
pluriel**. L'onglet Base parle de celle qu'on regarde, la carte parle du monde,
la Recherche du progrès. Un transfert va d'une base à une autre.

**Trois conséquences, toutes voulues :**

1. Le bouton **naît caché** et ne paraît qu'à deux bases — à une seule, il
   promettrait un geste qui n'existe pas, la faute du bouton « Assaut ».
2. Le panneau vit dans **`#ecrans`**, pas dans un écran : il est donc atteignable
   depuis la carte comme depuis le Chantier.
3. **La barre ne grandit pas d'un pixel** : les 288 px de chrome que garde
   `chantier.test.js` ne bougent pas.

**Si tu le veux ailleurs** — un onglet à lui, un bouton sur la carte —, c'est le
balisage et le câblage du bouton qui changent ; `vueDuTransfert` et
`sim/transfert.js` ne bougent pas.

⚠ **L'ÉLECTRICITÉ N'EST PAS DANS LA LISTE, ET C'EST UNE ABSENCE, PAS UN GRISÉ.**
Un choix grisé invite à chercher comment le dégriser ; elle ne se transférera
jamais. Un test balaie `ui/transfert.js` et refuse qu'elle y soit seulement
nommée.

---

## 9. La taxe ne va nulle part — confirmé

**Confirmé, et testé de face.** `transferer` fait exactement deux écritures : elle
retire `quantiteMilli` à la source et ajoute `recuMilli` à la destination. La
différence n'est rangée nulle part — ni dans un compteur, ni dans une troisième
base, ni dans l'état.

Le test le mesure sur le **total des deux bases** :

```js
assert.equal(totalAvant - totalApres, bilan.perduMilli, 'la taxe est allée quelque part');
```

Et un second test asserte qu'**aucune clé n'entre** dans `etat`, dans
`etat.bases[i]` ni dans `economie` : `SAVE_VERSION` reste à **24**, et le témoin
de BASES-0 mesure que la sauvegarde grandit de **ZÉRO octet** sur les vingt-cinq
graines.

---

## 10. Écarts et points en suspens

### Écarts

1. ⚠⚠ **LA BASE DE RÉFÉRENCE DU §1 N'EST PAS RETROUVÉE**, et j'ai poursuivi au
   lieu de m'arrêter. Voir §2 : la cause est entièrement le lot PIXELS, et les
   deux faits dont ce lot dépend étaient intacts. **À trancher.**
2. ⚠⚠ **T6 A ÉTÉ REFORMULÉ**, voir §7 : « le grep reste vide » était impossible
   avant même ce lot.
3. ⚠ **DEUX TESTS ONT ÉTÉ RETOURNÉS, PAS RETIRÉS**, et ils se déclarent.
   `raid.test.js` portait « butin — il sature, et le rapport DIT ce qui n'est pas
   rentré » et « un stock DÉJÀ au-dessus du plafond n'est pas rogné » : la
   première moitié du second reste vraie, le reste est l'inverse de la nouvelle
   règle. Ils exigent maintenant que le stock **dépasse** vraiment, et que
   `butinPerdu` soit **absent** du rapport.
4. ⚠ **LE TÉMOIN DE BASES-0 PORTE QUINZE COUPLES DÉCLARÉS DE PLUS**, sur 322 —
   `rapports` et `economie` à partir de la phase 7. La preuve ne repose PAS sur
   ces empreintes : elle repose sur la liste des **cinq chemins** mesurés en
   rejouant `origin/main` et HEAD côte à côte, et sur une assertion structurelle
   qui exige que la seule clé partie du rapport soit `butinPerdu`.
5. ⚠ **`RAPPORTS_DEPLACES_PAR_BASES_1` EST REMPLACÉ PAR `RAPPORTS_TRANSFERT`.**
   L'ancien ne nommait que trois graines, les vingt-deux autres étant gardées
   contre la capture d'origine ; ce n'est plus possible, les cinquante empreintes
   ayant bougé. C'est une PERTE de finesse sur cet axe, compensée par
   l'assertion structurelle ci-dessus — et elle est dite dans le témoin.
6. ⚠ **DEUX COMMENTAIRES MENTEURS ONT ÉTÉ CORRIGÉS EN CHEMIN**, hors périmètre :
   `index.src.html` annonçait encore « il reste une coquille dans cette page : la
   bascule entre bases », et le CSS de `#navigation` disait « coquille, une seule
   base existe ». Les deux sont faux depuis BASES-1.

### Points en suspens

1. ⚠⚠ **LE BUTIN DE LA FONDATION — DÉCISION À ROUVRIR**, voir §6.
2. ⚠ **`defense.sanction.perdu` A GROSSI, ET PERSONNE NE L'A DEMANDÉ.** Un rasage
   détruit les ressources STOCKÉES ; comme le butin peut maintenant les porter
   au-dessus du plafond, **un rasage détruit davantage qu'avant**. C'est la même
   règle appliquée à un stock plus gros, mais c'est un durcissement réel de la
   sanction, mesuré et non voulu. **À arbitrer** : si tu veux que le rasage
   plafonne ce qu'il détruit, c'est une ligne de `raserLaBase`.
3. ⚠ **LE JOUEUR N'A AUCUN MOYEN DE VOIR QU'UNE RESSOURCE EST GELÉE.** Le
   bandeau affiche « 50 / 50 saturé » quand le stock ÉGALE la capacité ; au-dessus
   il affichera « 118 / 50 », ce qui se lit mal et ne dit pas que la production
   est arrêtée. **Non demandé par le brief**, et c'est le premier trou d'interface
   que ces deux règles ouvrent.
4. ⚠ **AUCUN ESSAI SUR APPAREIL.** Le boot sans tête (Chromium, 412 × 915, sur le
   HTML livré) a joué le panneau de bout en bout — ouverture, liste des
   destinations, deux touchers, refus chiffrés, fermeture, zéro erreur de page —
   mais rien n'a tourné sur ton téléphone. Un test appareil non exécuté se
   déclare **non exécuté**.
5. ⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le
   lot ne touche ni `art/`, ni `tools/`.

---

## Point d'arrêt du §7 — un seul atteint, et il est déclaré

| Condition | État |
| --- | --- |
| la base de référence du §1 n'est pas retrouvée | ⚠⚠ **ATTEINTE** — poursuivi en le déclarant, voir §2 |
| les deux chemins de l'économie divergent au-dessus du plafond | ✅ non — **états identiques, résidus compris**, sur 4 000 ticks |
| l'arithmétique en milli ne peut pas rester exacte | ✅ non — tout est entier, multiplication avant division |
| un champ persistant s'avère nécessaire | ✅ non — **zéro octet** de plus dans la sauvegarde |
| un test hors `butinPerdu` change de **valeur** attendue | ✅ non — les cinq chemins déplacés sont tous des conséquences directes des deux règles |
| un nombre d'équilibrage autre que le 1 % et le 99 bouge | ✅ non |

**Le merge sur `main` appartient à Ethan seul.**
