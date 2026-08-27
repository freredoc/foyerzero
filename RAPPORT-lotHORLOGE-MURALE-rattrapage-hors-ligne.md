# RAPPORT — lot HORLOGE-MURALE : le jeu sait enfin combien de temps s'est passé

> Troisième des trois blocages relevés le 27/08 en préparant l'écran. Les deux
> autres — la palette fermée et le sort du banc d'essai — sont réglés.
>
> `rattraperJeu(etat, nbTicks)` existait depuis le lot TICK ; **personne ne
> calculait `nbTicks`**. La sauvegarde ne portait aucun horodatage mural, et
> `banc.test.js` §11 interdit `Date.now` dans tout `src/`. Un jeu idle sans ça
> n'est pas un jeu idle.

---

## 1. Version et build produits

| | Avant | Après |
|---|---|---|
| `version` · `config.build` | 0.12.0 · 12 | **0.12.0 · 12** — pas de bump |
| `dist/index.html` | 81 236 o, `f6b082b4…5ad430` | **identique** |
| `SAVE_VERSION` | 5 | **6** |
| `npm test` | 250 pass / 0 fail | **256 pass / 0 fail** |

`sim/state.js` n'est pas dans le graphe d'`index.src.html` : le HTML ne pouvait
pas bouger. Douzième reconduction, vérifiée au SHA.

---

## 2. La forme retenue

`serialiser(etat, instantMs)` écrit `instantSauvegardeMs` dans le JSON.
`charger(json, instantMs)` en déduit la durée d'absence, l'injecte dans
l'horloge par `accumuler()` et appelle `rattraperJeu()`.

### L'instant fait le chemin INVERSE du terrain

C'est la symétrie qui rend la chose lisible, et elle mérite d'être dite :

| | dans l'état | dans la sauvegarde |
|---|---|---|
| `champs` (le terrain) | **oui** | non — redéduit de `fondation` |
| `instantSauvegardeMs` | **non** | **oui** |

Une fois la partie chargée, l'instant d'écriture ne veut plus rien dire. Le
garder en mémoire inviterait quelqu'un à s'en servir comme d'une horloge.

### L'instant est un ARGUMENT, jamais une lecture

Aucun fichier de `src/` n'appelle l'horloge système, et la garde §11 de
`banc.test.js` le balaie — `src/` entier plus `index.src.html`. Le temps mural
entrera par la couche qui touche au DOM, et par elle seule. C'est exactement la
discipline d'`accumuler()` de `sim/clock.js`, qui reçoit une durée écoulée au
lieu d'aller la chercher : ce lot ne fait que l'étendre à la sauvegarde.

**La garde n'a donc PAS été touchée.** Elle le devra le jour où l'écran
existera, parce qu'il faudra bien un appel quelque part — mais retourner un
garde-fou avant d'avoir le site d'appel sous les yeux, c'est l'affaiblir à
l'aveugle. La forme visée est écrite dans `CLAUDE.md` : interdiction totale sur
`sim/`, `data/` et `render/`, **exactement une** occurrence admise dans un
fichier nommé.

### `charger` rattrape, il ne fait pas que restaurer

Un état chargé mais pas rattrapé ment sur l'heure qu'il est : il afficherait les
stocks d'hier soir. Le seul moment où l'on connaît à la fois la sauvegarde et
l'instant présent, c'est celui-là.

---

## 3. Trois cas limites, mesurés et non supposés

**Une horloge qui recule ne fait rien, et ne lève pas.** Fuseau, NTP, joueur qui
change la date de son téléphone : la durée peut être négative. Elle est ramenée
à zéro et la partie se réancre. Refuser la sauvegarde punirait le joueur pour
l'heure de son appareil ; avancer d'une durée négative n'a pas de sens.

**Dix ans d'absence saturent sans déborder.** 3,15 milliards de ticks, aucune
levée, stock **exactement** égal à la capacité. Un mois et dix ans donnent le
même stock — c'est la définition de saturé. Le rattrapage borne les heures
pleines à ce qu'il faut pour saturer, et c'est cette borne qui tient ici.

**Une sauvegarde v5 ne donne aucune absence.** Elle ne dit pas quand elle a été
écrite. Lui inventer une durée fabriquerait des ressources ; `instantSauvegardeMs`
y vaut `null` et `charger` réancre sur maintenant. Le test le prouve **par
comparaison** : la même partie sauvée en v6 rattrape bien ses cent heures.

---

## 4. Les dix-sept sites d'appel

`serialiser` et `charger` prennent désormais un argument obligatoire. Les
dix-sept appels de `test/state.test.js` ont été mis à jour un par un, pas par
une substitution globale, pour que chacun se relise.

⚠ **Les tests ne lisent PAS l'horloge de la machine non plus.** Ils passent une
constante fixe, `T0 = 1 700 000 000 000`. Prendre l'instant sur `Date.now()`
dans la suite la rendrait dépendante du moment où elle tourne — exactement ce
que le déterminisme du dépôt interdit.

---

## 5. Falsification — sept défauts injectés, sept attrapés

| # | Défaut injecté | Résultat |
|---|---|---|
| H1 | `serialiser` oublie l'instant | **rouge**, 5 tests |
| H2 | l'instant descend dans l'état | **rouge** |
| H3 | aucun rattrapage au chargement | **rouge**, 4 tests |
| H4 | une durée négative est laissée passer | **rouge** |
| H5 | la migration 5 → 6 ancre sur zéro au lieu de `null` | **rouge**, 2 tests |
| H6 | l'instant n'est plus validé | **rouge** |
| H7 | `SAVE_VERSION` laissée à 5 | **rouge** |

Chacun des six tests ajoutés asserte d'abord que **son montage produit quelque
chose** : sans producteur, « huit heures ont rapporté X » serait `0 === 0`. Le
test des huit heures vérifie en plus que le stock **ne sature pas** dans la
fenêtre, sinon la composition 5 h + 3 h = 8 h serait vraie parce que deux
plafonds sont égaux, pas parce que le rattrapage est exact.

---

## 6. Ce que ce lot débloque, et ce qui reste

L'écran de jeu n'a plus de blocage devant lui :

| Blocage du 27/08 | État |
|---|---|
| palette fermée, `rgba` interdits | **réglé** — maquette repassée en fiche seule, audit vert |
| le banc d'essai sort ou reste | **arbitré** — il reste, derrière un geste de debug |
| pas de source de temps réel | **réglé ici** |

Restent, et aucun ne bloque l'écran en lecture :

- **La couche d'action** — poser, améliorer, démonter n'existent nulle part.
  Elle bute sur un arbitrage : la répartition d'un coût de construction entre
  quartz et scorie. `COUT_NIVEAU_DEUX` donne un nombre unique, `COUT_ELECTRICITE`
  une fraction du coût **en quartz** ; la part de scorie n'est chiffrée nulle
  part depuis que le modèle du lot 1 est parti avec `params.js`.
- **`niveauDeLaDefense` et `niveauDeLArmeeOffensive`** attendent que l'état du
  joueur porte sa garnison et son armée.
- **Le geste de debug** qui rouvre le banc reste à dessiner.
