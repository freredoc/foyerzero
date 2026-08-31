# PASSATION — 31/08/2026, après le lot MODULES-D

**Où en est le projet.** Version **0.54.0 · build 55**, `SAVE_VERSION` **14**,
`npm run check` → **706 pass / 0 fail**, `dist/index.html` → **1 262 870
octets**, marge sous la borne T10 **37 130 o · 2,86 %**.
`node tools/audit-maquette.mjs` → **ROUGE, 7 écarts, rc=1** — et il l'était déjà,
sortie **byte-identique** avant et après.

Branche `claude/lot-modules-d`, partie de `origin/main` = `41dfdac` (le merge de
MODULES-C). Rapport complet : `RAPPORT-lotMODULES-D.md`.

---

## Ce que ce lot a fait

**Quatre modules câblés, les quatre qui n'existent qu'en défense** : PV +20 %,
Rayon +1, Rayon minimum −1, Auto-réparation. **+677 octets**, aucun champ de
sauvegarde.

Mais **le vrai travail était structurel** : le moteur ne savait pas lire un
module défensif du joueur, parce qu'un seul champ en désignait deux.

---

## Ce qui a coûté cher, et qu'il ne faut pas repayer

### 1. `moduleDefense` voulait dire deux choses — il n'existe plus

`profilUnite` y mettait le module de garnison **chez le JOUEUR**, `profilDefense`
celui **de l'OUVRAGE**. Le champ est scindé en `moduleDefenseJoueur` /
`moduleDefenseOuvrage`, et **une seule fonction**, `moduleDeDefense(e, p)`,
choisit sur `e.proprietaire`.

⚠ **L'ancien nom n'est pas resté en alias**, et `MODULES-D T1` l'interdit dans
tout `src/`. Son motif est **borné à droite** —
`/moduleDefense(?![\p{L}\p{N}_])/u` — parce que les deux noms neufs COMMENCENT
par l'ancien : un `includes('moduleDefense')` nu ne pourrait jamais tomber.

⚠ **Le démêlage seul n'a fait tomber AUCUN test**, et ce n'est pas rassurant,
c'est structurel : avant qu'un module défensif ne soit câblé, `moduleDeDefense`
n'avait qu'un lecteur observable — la ligne de résultat. Les 24 points de
référence sont identiques **au point** avant et après. La contre-épreuve montre
que l'écart existerait si `modulesDebloques.ouvrage` était armé (2 291 944 →
2 059 722 avec `['flashbang']`), mais **le générateur ne le remplit jamais**.

### 2. La portée a QUATRE lecteurs, pas trois

`ensembleCamoufles`, `ciblage`, `cibleDeNeutralisation`, `tir` — plus
`peutTirer`. Le brief en annonçait trois, et disait que `ciblage` en comptait
deux : il n'en a qu'**un** (le bloc « cible conservée » ne lit aucune portée).
Un lecteur oublié donne une entité qui **vise** au-delà de sa portée et ne
**tire** pas.

⚠ **Le calcul se fait en MILLI-CASES, PUIS au carré** : `porteeMilli + 1000`,
jamais `porteeCarree + 1`. Et **plancher à zéro AVANT l'élévation**.

### 3. PV +20 % ne majore que les pièces montées PLEINES

Majorer les PV courants d'une pièce entamée soignerait d'un coup toutes les
garnisons de la carte : acheter le module deviendrait une réparation.
`pvInitialMilli` suit `pvMilli`, jamais `pvMaxMilli`.

⚠ **Et une garde de ce lot ne mord sur AUCUNE donnée existante** : deux
`Math.floor` au lieu d'un rendent le même nombre, parce que les quatre porteuses
valent 1 000, 1 500 ou 2 000 PV et que `pv × facteurMilli` est toujours multiple
de 100. T9 porte donc une **garde de source** et le montage exact qui la ferait
diverger (550 PV au niveau 4 : 878 460 contre 878 400). C'est écrit dans le test,
pas seulement dans le rapport.

### 4. L'auto-réparation est écrite et INATTEIGNABLE en jeu

**Rien, dans tout `src/`, n'écrit `degatsMilli` sur `etat.garnison`.** Les deux
seuls écrivains — `reporterLesDegats` et `avancerLaReparation` — parcourent
`etat.armee`. La base du joueur n'étant jamais attaquée, la boucle sort au
premier `continue` et son test tourne sur un **état forgé**.

Les trois modules de combat sont dans le même cas : `proprietaireDefense:
'joueur'` n'est écrit que par `montageDefense` de `ui/banc.js`, derrière le geste
de debug. **Câblés, testés, invisibles** — c'est assumé, et le chantier suivant
(les attaques sur la base) les rendra visibles.

### 5. J'ai détruit mon propre patch avec `git checkout`, DEUX FOIS

Le banc de falsification restaurait la source sabotée par `git checkout -- <f>`.
Tant que le travail du lot n'est pas **commité**, cela revient à `origin/main` :
la première fois j'ai perdu le démêlage, la seconde tout l'étape 6 (T13, T14, la
projection étendue, quatre tests de garde mis à jour).

**La règle : instantané dans `/tmp` AVANT tout sabotage, restauration depuis ce
fichier, jamais depuis git — et le fichier saboté doit être dans l'instantané.**
La deuxième perte vient précisément de là : le script snapshotait
`modules.js` et `combat.js`, et j'ai saboté `test/recherche.test.js`.

---

## Les tests de garde qui tombent à chaque lot — c'est leur rôle

Quatre tests antérieurs sont tombés sur les comptes, et ont été **mis à jour, pas
assouplis** : `T11` (19 → **8** lignes non câblées), `MODULES-A T9` (7 → **11**
modules câblés, dont **4 en défense** — l'assertion « aucun en défense » est
remplacée par la liste exacte), `MODULES-B T13` et `MODULES-C T10` (la liste des
restants passe à `garnison`, `munitionSpeciale`, `volDeVie` ; les lignes ouvertes
à `{offense: 12, defense: 11}`).

**Le compte EST la liste** : le prochain lot qui câble un module les fera tomber,
et c'est exactement ce qu'on veut.

`combat.test.js` T13 a lui aussi dû être **réécrit** : il infligeait des dégâts
ABSOLUS à un Merlon dont le plafond monte de 2 420 000 à 2 904 000. Il inflige
maintenant la même **fraction** et fige les deux nouveaux faits. Ce n'est pas une
régression — le module fait enfin ce qu'il annonce.

---

## Ce qui reste ouvert

- **Une fuite pré-existante entre branches, trouvée en mesurant, non corrigée.**
  `modulesDebloquesDuJoueur` fait l'**union** des deux branches, et quatre noms
  existent des deux côtés : `flashbang`, `tirDeBarrage`, `emp`, `garnison`.
  Acheter le module **défense** des Perceurs débloque `tirDeBarrage` pour le
  **Pilon en offense**, sans l'avoir payé. Le commentaire de la fonction annonce
  ce jour-là depuis MODULES-A ; **il est arrivé avant ce lot, pas avec lui** —
  aucun des quatre modules de MODULES-D ne collisionne. Lot dédié.
- **`garnison`** reste en attente d'arbitrage (Ethan veut un glisser-déposer à la
  préparation de raid — un lot d'interface).
- **`munitionSpeciale` et `volDeVie`** sont les deux derniers modules sans lot.
- **Les attaques sur la base du joueur** — le chantier qui rend visibles les
  quatre modules de ce lot.
- **La marge** : 4,4 % · 3,1 % · 3,05 % · 2,94 % · 2,91 % · **2,86 %**. C'est le
  prochain atlas qui la fera tomber, pas le code.
