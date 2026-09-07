# RAPPORT — lot PRODUCTION-EN-DÉFENSE

**07/09/2026 — version `0.99.14` · build `115`.**

Retour d'Ethan du 07/09, point **11** : « Je ne peux pas construire un fusilier
alors que je n'ai pas de caserne — **c'est vrai pour l'armée, faux en défense.** »

**Il avait raison, et le défaut n'était pas où le brief le cherchait à moitié.**
`batimentDeProductionManquant` répondait juste ; ce qui manquait, c'est qu'un
`grep` sur le dépôt entier ne la trouvait que dans `ui/chantier.js` et
`ui/offense.js`, **et nulle part dans `src/sim/`**. La règle vivait dans les
écrans. Elle est descendue dans le modèle.

---

## 0. La base de départ — et deux écarts d'outillage qui ont failli la fausser

⚠⚠ **LE CLONE ÉTAIT EN CRLF, ET DIX TESTS TOMBAIENT POUR ÇA.**
`core.autocrlf` valait `true` : les tests qui balaient la SOURCE cherchent des
motifs contenant `\n` — `bloc.indexOf('\n  }\n')` dans `LIMITE T7`, par exemple —
et ne trouvaient rien, donc découpaient le fichier entier au lieu du corps d'une
fonction. Corrigé sur **ce dépôt seulement** : `git config core.autocrlf false`,
puis re-checkout. Aucune configuration globale n'a été touchée.

⚠⚠ **ET NODE 20.11.1 EN FAISAIT TOMBER QUATRE DE PLUS.** `Dirent.parentPath`
n'existe qu'à partir de **20.12** (`test/banc.test.js:72` s'en sert), et le glob
de `node --test "test/*.test.js"` demande Node ≥ 21 — si bien que `npm test` ne
trouvait **aucun fichier** et sortait en erreur. Le lot a donc tourné sous un
**Node 22.14.0 portable**, déposé dans le répertoire temporaire de la session,
hors du dépôt. **Rien n'a été installé sur la machine, et `package.json` ne
déclare aucun moteur** — c'est un constat, pas une correction.

| État du dépôt | `node --test` |
| --- | --- |
| tel que trouvé — CRLF, Node 20.11.1 | **1 250 pass / 14 fail** |
| LF, Node 20.11.1 | **1 260 pass / 4 fail** |
| **LF, Node 22.14.0 — la vraie base** | **1 264 pass / 0 fail** |

⚠ **ET C'EST EXACTEMENT LA RÉFÉRENCE DE `CLAUDE.md` §0.** `node tools/build.js`
sur un `git worktree` de `HEAD` rend **8 012 076 octets**, à l'octet.

⚠ **LE BRIEF ANNONÇAIT UNE AUTRE BASE — 1 245 tests, 8 003 811 octets, version
0.99.12 · build 113 —, ET ELLE ÉTAIT PÉRIMÉE D'UN LOT.** `HEAD` porte le lot
ÉCRAN-DÉFENSE : 0.99.13 · build 114. Aucune conséquence sur le travail, mais
c'est le genre d'écart qu'on ne découvre pas deux fois pour le même prix.

⚠ **`RAPPORT-lotGARNISON.md` N'EXISTE PAS.** Le §0 du brief le demandait « s'il
existe » ; le fichier qui porte ce contenu est
`rapports/RAPPORT-lotGARNISON-ET-ARMEE.md`, et il a été lu. La passation la plus
récente est `rapports/PASSATION-2026-09-01-raid.md`.

---

## 1. L'endroit exact où la règle a été posée, et pourquoi ce n'est pas `verifierEtat`

**Une seule écriture de la règle**, `src/sim/state.js` :

```js
function problemeDuBatimentDeProduction(etat, uniteId) {
  const manque = batimentDeProductionManquant(etat, uniteId);
  if (manque === null) return null;
  return {
    code: 'sans-batiment-de-production',
    message: messageSansBatiment(BASE_BATIMENTS[manque].nom.joueur, UNITES[uniteId].chassis),
  };
}
```

Elle rend un **problème**, elle ne lève pas : « problèmes → si vide, agir ;
sinon, toast ». Les trois appelants la poussent en fin de liste, **après** les
problèmes d'emplacement et d'occupation — le joueur lit ce qui le bloque là où il
vise, pas la liste de tout ce qui le bloquerait.

### ⚠⚠ Elle n'est PAS dans `problemesDeLEffectif`, et c'est tout le point délicat

`problemesDeLEffectif` est le voisin naturel : c'est lui qui porte
`superposition`, `hors-grille`, `obstacle`. **Mais il est partagé avec
`verifierForce`, donc avec le CHARGEMENT.** L'y écrire aurait refusé toute
sauvegarde portant une garnison de Fusiliers dont la Caserne est tombée au raid —
la partie rendue injouable pour une faute que le joueur n'a pas commise. Le
commentaire de `batimentDeProductionManquant` l'annonçait mot pour mot.

La règle est donc écrite **dans les trois validateurs de GESTE**, jamais dans le
chemin commun. Conséquence directe : **`CODES_TOLERES_AU_CHARGEMENT` reste à DEUX
codes** et le test qui le fige ne bouge pas.

⚠ **UNE RÈGLE ABSENTE DU CHEMIN DE CHARGEMENT VAUT MIEUX QU'UNE RÈGLE PRÉSENTE ET
FILTRÉE.** La seconde forme aurait marché aussi — ajouter
`sans-batiment-de-production` à l'ensemble toléré —, mais elle tient par un `Set`
qu'on peut vider par mégarde, et elle aurait fait tomber `state.test.js:1156`,
qui fige la liste à deux éléments. `PD T6` mesure les deux moitiés.

---

## 2. Les chemins de pose relevés et traités — **TROIS**, nommés un par un

Relevés par `grep` sur `problemesDe.*DEffectif` et sur les écritures directes
dans `garnison` / `armee`. **Les trois sont traités.**

| # | Fonction de `sim/state.js` | Geste | Traité |
| --- | --- | --- | --- |
| 1 | `problemesDeLaPoseDEffectif` → `poserEffectif` | poser | **oui** |
| 2 | `problemesDuDeplacementDEffectif` → `deplacerEffectif` | déplacer | **oui** |
| 3 | `problemesDeLaPermutationDEffectif` → `permuterEffectif` | permuter | **oui** |

**Et rien d'autre n'entre dans une force.** Le relevé complet, avec la raison
pour chaque écarté :

- `baseCourante(etat)[f.champ].push(…)` de `poserEffectif` — **le seul `push`
  du dépôt** dans `garnison` ou `armee`, et il est derrière le chemin 1.
- `migrer` v6 → v7 (`state.js:2415`) écrit `garnison = []` et `armee = []` :
  deux listes VIDES, rien à refuser.
- `retirerEffectif` **retire**, il n'entre pas.
- `reglerActivite` bascule un drapeau sur une pièce déjà là.
- `ameliorerEffectif` monte une pièce déjà posée — **écarté exprès**, voir §5.
- `ui/banc.js` monte des compositions **hors partie**, sans `etat` : il n'y a pas
  de base dont la Caserne pourrait manquer.

⚠ **LE DÉPLACEMENT ET LA PERMUTATION SONT UNE LECTURE LARGE, ET ELLE SE
DÉCLARE — voir §5.**

---

## 3. Le message — une seule source, et elle a dû descendre d'un cran

`messageSansBatiment` et `FAMILLE_DE_CHASSIS` vivaient dans **`src/ui/arsenal.js`**.
`src/sim/` n'importe jamais de `src/ui/` — et ne doit pas commencer.

**Les deux ont descendu dans `src/data/base.js`**, à côté de
`BATIMENT_DE_CHASSIS`, la table qu'ils servent. **`src/ui/arsenal.js` les
RÉEXPORTE** :

```js
export { FAMILLE_DE_CHASSIS, messageSansBatiment } from '../data/base.js';
```

Résultat : **aucune des deux palettes n'a changé d'import**, et il n'existe
toujours qu'**une seule écriture de la phrase**. `PD T7` le prouve par la
SOURCE — une égalité de chaînes passerait aussi si deux fichiers écrivaient le
même texte à la main.

---

## 4. ⚠⚠ La prémisse du brief sur l'écran Offense était PÉRIMÉE

Le brief §1 affirme : « En Offense la pièce **disparaît** : impossible de la
poser. » **Mesuré : c'est faux depuis le 29/08.** L'en-tête de
`unitesDeLaPalette` le dit lui-même — « **elle grise, elle ne filtre plus** » —,
Ethan ayant rapporté deux unités « indisponibles » qu'il attendait. Les deux
palettes gardent une longueur fixe ; `test/offense.test.js` l'assertait déjà.

**Le commentaire de `posablesDeLaDefense` qui opposait les deux écrans est donc
parti avec la mesure.** Il envoyait chercher une différence qui n'existe plus, ce
que CLAUDE.md §6 interdit.

**La vraie différence, celle qu'Ethan a vue, est ailleurs :** l'écran Offense
**DEMANDE** à `unitesDeLaPalette` avant de poser et refuse au toucher
(`offense.js:639` et `offense.js:823`), là où l'écran Défense grisait **sans que
rien derrière la vignette ne refuse le geste**. C'est ce trou-là que le lot
referme, et il le referme pour les deux écrans à la fois.

⚠ **LE GRISAGE N'A PAS ÉTÉ TOUCHÉ**, des deux côtés. L'arbitrage du 28/08 tient,
et son motif aussi. `PD T8` et `PD T9` comptent les deux longueurs de palette.

---

## 5. Écarts déclarés

### ⚠⚠ 5.1 — Le déplacement et la permutation FIGENT une garnison orpheline

Le brief le demande **deux fois** (§2 et `PD T5`), et c'est fait. La conséquence
n'est pas dans l'énoncé d'Ethan, qui parle de **CONSTRUIRE** :

> Une Caserne qui tombe au raid **fige sur place** les Fusiliers déjà posés. Ils
> restent, ils se chargent, ils se battent, ils se retirent — **ils ne se
> déplacent plus** tant que la Caserne n'est pas relevée.

Le trou mesuré était la **pose**. Déplacer ne fait entrer aucune pièce dans une
force. **Si la lecture est trop large, c'est UN appel qui tombe** — celui de
`problemesDuDeplacementDEffectif`, plus celui de la permutation : la règle est
écrite une seule fois, et le commentaire de la fonction dit où couper. **Ethan
tranche.**

⚠ **LES OUVRAGES FIXES, EUX, BOUGENT ENCORE** — `PD T5` le mesure. Un mur n'a
jamais eu besoin d'une caserne, et la règle ne fige pas toute la garnison.

### 5.2 — L'amélioration n'est pas concernée, et c'était déjà écrit

`problemesDeLAmeliorationDEffectif` portait l'arbitrage avant ce lot :
« l'arbitrage du 29/08 dit *infanterie inconstructible sans caserne* : il porte
sur la CONSTRUCTION, et une pièce déjà posée l'est ». Le brief ne la nomme pas
non plus. **Rien n'a changé de ce côté.**

### ⚠⚠ 5.3 — Le témoin de `bases.test.js` bouge, et il est recapturé EN L'ÉCRIVANT

`test/temoins-bases-0.js` porte le protocole : « le jour où un lot changera
légitimement un comportement, il recapturera les témoins EN L'ÉCRIVANT, et dira
lesquels bougent et pourquoi ». C'est ce jour-là.

**Ce qui bouge :** `DEPLACES_PAR_PRODUCTION_EN_DEFENSE`, **72 couples**, tous à
partir de la phase 4. Le scénario bâtit une Caserne et un Dépôt de véhicules,
**jamais un Aérodrome** : la **Crécelle**, seul aéronef qu'il arme, est désormais
refusée. Un geste, sur les vingt-cinq graines.

**Ce qui NE bouge PAS, et c'est la moitié qui prouve :** les phases **p01 à p03
sont identiques AU BIT**, et sur les vingt-cinq graines `gestes` (construction),
`nbCasesAtteignables`, `deplacement`, `nbAttaquantes`, **le nombre de cibles et
la cible retenue des DEUX raids**, la non-fuite et l'exactitude de la simulation,
et **les clés du rapport** sont inchangés. Si la règle avait fui ailleurs que
dans la pose d'unité, l'un de ces sept-là aurait bougé.

La sauvegarde perd **80 octets — le MÊME nombre sur les vingt-cinq graines** :
une unité d'armée en moins, et rien qui dépende de la partie.

⚠ **ÉCART : LE SCÉNARIO N'ARME PLUS D'AÉRONEF.** Lui poser un Aérodrome aurait
changé la phase de construction et **effacé la démonstration**. La couverture des
aéronefs au combat reste celle de `combat.test.js` et de `raid.test.js`, qui
montent leurs compositions sans passer par la base.

### 5.4 — Un fichier d'aide entre dans `test/`

`test/batiments-de-production.js` — la Caserne, le Dépôt et l'Aérodrome posés sur
une base de montage. **SIX fichiers de test en ont eu besoin le même jour** :
tout montage qui pose une UNITÉ doit désormais porter le bâtiment de son châssis,
comme il porte déjà un QG pour avoir un budget. Six recopies auraient divergé au
premier déplacement d'un bâtiment. Il est **nommé dans la liste blanche** de
`documentation.test.js`, avec sa raison, comme `png-rgba.js`.

⚠ **IL LIT `BATIMENT_DE_CHASSIS`, IL NE RECOPIE PAS LES TROIS IDENTIFIANTS.** Un
quatrième châssis ajouté un jour à la table serait servi sans qu'on y pense.

### 5.5 — Deux gardes changent de liste, aucune ne s'assouplit

- `arsenal.test.js` — les imports de `ui/arsenal.js` : `['../data/combat.js',
  '../data/niveaux.js', '../data/sites.js']` → **quatre modules, tous de
  `data/`**. La liste reste EXHAUSTIVE : un import de `render/` ou de `sim/` la
  fait tomber comme avant.
- `documentation.test.js` — la liste blanche de `test/`, ci-dessus.

### 5.6 — Ce qui n'a pas été fait

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne (CLAUDE.md §0.5).

⚠ **LE RENDU N'A PAS ÉTÉ VU, NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE
DÉCLARE NON EXÉCUTÉ.** Le lot ne change aucun pixel : il ajoute un refus dans le
modèle. Ce qui se verrait à l'écran est le **toast** que l'écran Défense produira
désormais sur une vignette grisée — et il est peint par du code déjà en place.

---

## 6. Les tests — PASS/KO de T1 à T10, avec le montage effectivement écrit

**Dix tests entrent. Aucune assertion n'a été retirée ni assouplie.**

| Code | Verdict | Fichier | Le montage écrit |
| --- | --- | --- | --- |
| **PD T1** | **PASS** | `state.test.js` | `baseSansProduction()` — Chantier n.12, Centre de commandement n.8, **QG de défense n.8**, **Complexe de défense**, **tout le roster défensif ACHETÉ**, et **aucun bâtiment de production**. Asserte `['sans-batiment-de-production']` — un seul code — et que la MÊME case accepte un Merlon, sinon le test passerait sur une case injouable. |
| **PD T2** | **PASS** | `state.test.js` | Le même montage + `poserLesBatimentsDeProduction`. Liste VIDE, et la pose écrit vraiment. **C'est le test qui distingue « la règle marche » de « rien ne passe plus ».** |
| **PD T3** | **PASS** | `state.test.js` | Une base NEUVE — un Chantier, rien d'autre, asserté. Le Merlon se pose. **Et la boucle passe sur les neuf `DEFENSES`** : aucune ne réclame de bâtiment. |
| **PD T4** | **PASS** | `state.test.js` | Même montage, côté `armee`. Les **trois familles** sont mesurées — Meute/Caserne, Ratisseur/Dépôt, Busard/Aérodrome — et le falsifiable inverse : avec les trois bâtiments, les trois passent. |
| **PD T5** | **PASS** | `state.test.js` | Deux Fusiliers **et un Merlon** posés AVEC la Caserne ; les trois gestes passent d'abord — sinon le refus ne dirait rien —, puis `demolir` la Caserne. Asserte le refus sur **poser, déplacer, permuter**, la levée sur les deux mutations, le **dédoublonnage** de la permutation (un seul refus pour deux Fusiliers), **et que le Merlon bouge encore**. ⚠ La case libre se CHERCHE : une colonne écrite à la main tombait sur un obstacle et rendait deux codes. |
| **PD T6** | **PASS** | `state.test.js` | Deux Fusiliers en garnison **et** une Meute en armée, Caserne démolie ensuite, `serialiser` → `charger`. Les deux listes ressortent **entières et identiques**. ⚠ Et le code n'est PAS dans `CODES_TOLERES_AU_CHARGEMENT`, qui reste à `['uniques-voisins', 'obstacle']`. **C'est le test du §3 du brief.** |
| **PD T7** | **PASS** | `chantier.test.js` | Palette et modèle sur le même état : `vignette.raison === refus[0].message === messageSansBatiment('Caserne', 'escouade')`. **Puis la preuve par la SOURCE** : quatre fichiers balayés (commentaires retirés) ne contiennent pas `, pas `, et `data/base.js` le contient **exactement une fois**. |
| **PD T8** | **PASS** | `chantier.test.js` | Longueur de `posablesDeLaDefense` **avec** et **sans** les bâtiments : `rosterDefensif().length` des deux côtés, mêmes ids dans le même ordre. La Meute est **présente ET verrouillée**, et vive avec la Caserne. ⚠ Et le moteur refuse derrière la vignette — **avant le 07/09 cette assertion était FAUSSE**. |
| **PD T9** | **PASS**, avec correction | `offense.test.js` | Le brief demandait « la palette d'Offense **retire** toujours ». **Elle ne retire plus depuis le 29/08** (§4). Le test asserte donc ce qui est VRAI et garde la même propriété : longueur **constante** avec et sans bâtiment, toutes éteintes sans, au moins une vive avec, et la phrase de la vignette **identique** à celle du modèle. |
| **PD T10** | **PASS** | `state.test.js` | `SAVE_VERSION === 27`, **écrit en clair** — un `>=` laisserait passer un bump involontaire. Puis : une sauvegarde v27 traverse `migrer` **sans être touchée** (`deepEqual`), et l'aller-retour `serialiser`/`charger`/`serialiser` rend **le même texte, à l'octet**. |

---

## 7. Les chiffres

| Grandeur | Avant | Après | Écart |
| --- | --- | --- | --- |
| `npm test` | **1 264 pass / 0 fail** | **1 274 pass / 0 fail** | **+10** |
| `dist/index.html` | **8 012 076** | **8 012 333** | **+257** |
| `SAVE_VERSION` | 27 | **27** | **0** |
| version · build | 0.99.13 · 114 | **0.99.14 · 115** | — |

**Coût poste par poste**, mesuré contre un livrable rebâti dans un `git worktree`
depuis `HEAD` :

| Poste | Écart |
| --- | --- |
| JavaScript | **+257** |
| feuille | +0 |
| balisage | +0 |
| images | +0 |
| audio | +0 |

**La somme des cinq postes tombe EXACTEMENT sur le total.** **296 lignes `data:`
avant, 296 après ; 291 URI de part et d'autre.** Borne T10 inchangée à
**9 300 000** ; marge **1 287 667 octets, 13,85 %**. Zéro référence externe.

---

## 8. Les fichiers touchés

**Production — quatre fichiers :**

- `src/sim/state.js` — `problemeDuBatimentDeProduction` et ses trois appels ;
  l'import de `messageSansBatiment` ; trois commentaires mis à jour.
- `src/data/base.js` — `FAMILLE_DE_CHASSIS` et `messageSansBatiment` y descendent.
- `src/ui/arsenal.js` — les deux réexportés, plus le commentaire qui dit pourquoi.
- `src/ui/chantier.js` — **le commentaire périmé sur l'écran Offense**, remplacé
  par ce qui est mesuré.

**Tests — huit fichiers, plus un neuf :**

`test/batiments-de-production.js` **(neuf)**, `state.test.js`, `chantier.test.js`,
`offense.test.js`, `bases.test.js`, `temoins-bases-0.js`, `monde.test.js`,
`raid.test.js`, `arsenal.test.js`, `documentation.test.js`.

**Documentation :** `CLAUDE.md` §0, `package.json`, ce rapport.

---

## 9. Points en suspens — pour Ethan

1. ⚠⚠ **Le déplacement et la permutation doivent-ils vraiment être gardés ?**
   Le brief le demande deux fois, c'est fait, et §5.1 dit ce que ça coûte : une
   Caserne tombée fige la composition en place. **Un appel à retirer si la
   réponse est non.**
2. ⚠ **L'écran Défense doit-il TOASTER le refus ?** Le modèle rend le problème ;
   l'écran de garnison et son glisser-déposer sont un chantier séparé (brief §5),
   donc rien n'a été touché. Le message est prêt, l'écran ne le montre pas encore
   au geste — il ne le montre qu'au toucher de la vignette.
3. ⚠ **Le scénario de `bases.test.js` doit-il regagner un aéronef ?** Il faudrait
   lui bâtir un Aérodrome, ce qui déplacerait la phase de construction. §5.3.
4. ⚠ **`package.json` ne déclare aucun `engines`.** Node 20.11.1 fait tomber
   quatre tests et rend `npm test` inutilisable. Une ligne `"engines": {"node":
   ">=22"}` le dirait au lieu de le laisser découvrir. **Hors du lot, non fait.**

---

**PR ouverte, non mergée.**
