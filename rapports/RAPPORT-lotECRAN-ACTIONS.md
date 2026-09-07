# RAPPORT — lot ÉCRAN-ACTIONS

> Lot DOM. Le moteur était écrit et testé ; ce lot le câble et retourne le
> modèle d'interaction.

---

## 1. Ce qui a réellement été produit

| | avant | après |
|---|---|---|
| Version · build | 0.18.1 · 19 | **0.19.0 · 20** |
| `npm run check` | 306 pass / 0 fail | **311 pass / 0 fail** |
| `dist/index.html` | 134 118 o | **137 225 o** — borne T10 : 200 000 |
| SHA-256 | `560fdc03…06b69` | `a46b9a6a021eeffb0d43b9049990b6a1c878379bfe0d1a68f75d1d097b1545f6` |
| `audit-maquette.mjs` | vert | **vert** |
| `SAVE_VERSION` | 6 | 6, inchangée |

**Confrontation d'entrée.** La base attendue par le brief — 306 pass, 134 118
octets, 0.18.1 · build 19 — s'est vérifiée **au test et à l'octet près** avant
que je touche à quoi que ce soit.

**Fichiers touchés** : `src/ui/chantier.js`, `src/index.src.html`,
`test/chantier.test.js`, `CLAUDE.md`, `package.json`. Aucun fichier de
`src/sim/` ni de `src/data/`, aucun fichier ajouté ni retiré — `CLAUDE.md` §2
n'avait rien à corriger.

---

## 2. Les arbitrages du §2, tranchés

| Question | Tranché |
|---|---|
| deuxième appui sur le bouton armé | **désarme** |
| armer une action quand l'autre est armée | **désarme l'autre** — un seul mode |
| armer une action quand la palette est choisie | **désarme la palette** — même raison |
| choisir un posable quand une action est armée | **désarme l'action** — symétrique |
| toucher une case vide en mode armé | **désarme sans toast** |
| le mode armé se voit | classe `arme` sur le bouton, kaki éclairé plein |
| après l'action (réussie ou refusée) | **désarme** |

Les deux lignes que le brief ne demandait pas de trancher — palette ↔ action
dans les deux sens — le sont parce que « un seul mode à la fois » n'a de sens
que si la palette compte comme un mode. Deux toucheurs armés en même temps
rendraient le prochain toucher ambigu.

**Ce qui rend le mode armé visible** : le bouton armé prend le fond kaki
éclairé et le texte sombre — l'inverse d'un bouton désactivé, qui perd son
opacité. Les deux états ne peuvent pas se confondre.

---

## 3. Réparer — l'issue retenue

**La première des deux issues proposées** : le bouton est câblé sur le même
modèle, il s'arme, il se désarme, et son toast dit ce qui est vrai —
*« aucun bâtiment n'est endommagé : les dégâts n'existent pas encore »*.

⚠ **C'est la SEULE phrase de refus écrite dans l'interface.** Toutes les autres
viennent de `sim/disposition.js` ou de `sim/state.js` et sont reprises mot pour
mot. Celle-ci n'a pas de moteur derrière elle, et c'est précisément pourquoi un
test l'encadre : il asserte que `sim/state.js` n'exporte toujours ni `reparer`
ni `problemesDeLaReparation`. **Ce test est fait pour tomber** le jour où le
moteur en gagne un, et dire quoi brancher — plutôt que de laisser l'écran
répéter « rien n'est endommagé » devant des bâtiments abîmés.

Aucun moteur de réparation n'a été inventé dans l'UI.

---

## 4. Les tests ajoutés — et ce qui les ferait tomber

Cinq tests, **311 au total contre 306**. Le brief prévient qu'un test qui
asserte le champ que le patch vient d'écrire ne peut pas échouer ; chacun a donc
été **falsifié par injection**, une mutation à la fois, fichiers restaurés et
comparés entre deux.

| Test | Résultat | Montage qui le fait tomber — **vérifié** |
|---|---|---|
| les trois boutons branchés sur le moteur | PASS | remplacer `agir: ameliorer` par `agir: (e,i) => ameliorer(e,i)` → ROUGE |
| Réparer n'a pas de moteur | PASS | ajouter un export `reparer` à `sim/state.js` (le test le dit explicitement) |
| jamais de `try` autour d'`ameliorer`/`demolir` | PASS | `try` autour de `action.agir(...)` → ROUGE ; autour de `action.problemes(...)` → ROUGE ; agir avant de demander → ROUGE |
| les cases distinguées suivent la table | PASS | remplacer `CHAMPS.posableDessus.includes(...)` par `!== 'collecteur'` → ROUGE |
| le compteur a quitté l'écran, pas le calcul | PASS | supprimer la comparaison `poses >= ouverts` → ROUGE |
| *(test existant, réécrit)* balisage | PASS | remettre `disabled` sur un bouton d'action → ROUGE ; réintroduire `chantier-emplacements` → ROUGE |

Le premier test compare par **égalité de référence**, pas par comportement :
c'est ce qui distingue « la table appelle la fonction du moteur » de « la table
appelle quelque chose qui lui ressemble ».

### ⚠ Une garde ne mordait pas, et la falsification l'a montrée

Écrite pour chercher `ameliorer(` et `demolir(` dans les blocs `try`, elle est
sortie **verte** sur la mutation qui compte : l'écran n'appelle pas
`ameliorer(...)`, il appelle **`action.agir(...)`** par la table `ACTIONS`. La
seule forme sous laquelle la faute se commettrait réellement ici passait au
travers.

Élargie aux deux points d'appel indirects — `.agir(` et `.problemes(` — avec un
appât pour chacun, puis re-falsifiée : les quatre mutations rougissent. C'est le
même mécanisme que l'homonymie `poser` du lot précédent : **une garde qui vise
un nom rate un appel par table.**

---

## 5. Les six actions, exercées de bout en bout

Le brief exige que chaque composant modifié soit rendu et cliqué. Un DOM factice
(≈ 70 lignes, **non commité**) a exercé le chemin réel — les écouteurs posés par
`initialiserEcranChantier`, pas des appels directs :

```
armer Améliorer        → [ameliorer]        re-presser → []          (bascule)
armer Démolir ensuite  → [demolir]          (un seul mode)
case vide              → désarmé, avis ""   (silencieux)
palette ↔ action       → exclusion vérifiée dans les deux sens
Collecteur             → 12 cases cerclées  Centrale → 0
pose                   → 2 bâtiments, 1 sauvegarde, vignette désélectionnée
palette pleine         → « 2 bâtiments pour 2 emplacements : améliorer… »
améliorer sans         → niveau reste 1, « il manque 3 de quartz »
améliorer avec         → niveau 2, quartz 103 → 100, contexte « Niv. 2 · +300 s /h »
démolir le Chantier    → refusé, « le Chantier de construction ne se démolit pas »
démolir un collecteur  → 1 bâtiment, quartz 100 → 102, sélection lâchée
Réparer                → « aucun bâtiment n'est endommagé… »
toast à échéance       → effacé
```

⚠ **Un faux départ, corrigé après vérification.** Le scénario « améliorer sans
les ressources » a d'abord **réussi** l'amélioration. Vérification faite dans le
moteur plutôt que supposée : `creerEtat` accorde depuis le lot AMORCE une
**amorce de 30 quartz / 30 scorie / 20 électricité**, et l'amélioration coûtait
3. Ce n'était pas un défaut de l'écran mais un montage mal fait — corrigé en
vidant la caisse, et le refus chiffré du moteur s'affiche alors mot pour mot.

⚠ **Ce DOM factice ne va pas au dépôt.** Il ne connaît ni mise en page, ni
cascade, ni défilement — exactement ce qui peut casser à l'écran. Il attrape un
identifiant fautif ou un enchaînement fautif, rien de plus.

---

## 6. Les vérifications appareil 18 et 20, réécrites

L'élément qu'elles lisaient — le compteur `poses / ouverts` — **n'existe plus**.
Telles qu'elles étaient, elles ne peuvent plus être exécutées.

| # | Ancienne rédaction | **Nouvelle rédaction** |
|---|---|---|
| 18 | « le niveau du Chantier, en bas d'écran, bouge après la pose » ⇒ lisait aussi le compteur pour constater la pose | **« après une pose, le jeton du bâtiment apparaît sur la case touchée, le niveau moyen du bouton Chantier bouge, et il reste une pastille de case libre en moins sur la grille. »** |
| 20 | « une fois les emplacements pleins, l'écran le dit avant qu'on essaie » ⇒ lisait le compteur | **« une fois les emplacements pleins, toucher une vignette de la palette fait apparaître un toast qui dit combien de bâtiments pour combien d'emplacements — avant d'avoir cherché une case — et le toast s'efface seul. »** |

Six vérifications appareil **s'ajoutent** pour ce lot, toutes **NON EXÉCUTÉES** :

| # | Vérification | État |
|---|---|---|
| 21 | armer Améliorer se voit, et un second appui désarme | **NON EXÉCUTÉE** |
| 22 | armer Démolir quand Améliorer est armé ne laisse qu'un bouton armé | **NON EXÉCUTÉE** |
| 23 | armé + case vide : le mode retombe, sans message | **NON EXÉCUTÉE** |
| 24 | améliorer sans les ressources affiche le manque chiffré | **NON EXÉCUTÉE** |
| 25 | démolir le Chantier est refusé et dit pourquoi | **NON EXÉCUTÉE** |
| 26 | la grille est centrée, marges égales, et le doigt tombe sur la bonne case | **NON EXÉCUTÉE** |

⚠ **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais passé.** Cette
session n'a ni appareil, ni émulateur, ni navigateur.

---

## 7. Écarts au brief, et leurs raisons

1. **`Démonter` devient `Démolir`**, libellé et identifiant
   (`chantier-demonter` → `chantier-demolir`). Le moteur dit `demolir`, le brief
   dit DÉMOLIR, le bouton disait « Démonter » : trois mots pour un acte. Le
   dépôt s'est déjà fait mordre par des noms qui divergent.
2. **Le désarmement de la palette après la pose vit dans `chantier.js`, pas dans
   `apresPose`.** Le brief suggérait `session.js` ; mais la session ne connaît
   pas le mode de l'écran, et lui donner accès pour ça serait une indirection
   sans gain. **L'ordre demandé est respecté et resserré** : la sauvegarde est
   désormais la **première** chose faite après `poser`, avant même le repeint —
   elle était en dernier.
3. **Le numéro de version a déménagé dans la barre du bas.** Il vivait dans le
   bandeau d'emplacements, que le §5 supprime, et il **porte le geste de debug
   qui ouvre le banc d'essai** : sans ce déménagement, le banc devenait
   inatteignable et la vérification appareil 5 impossible. Le brief ne le
   mentionnait pas.
4. **Les numéros de rangée disparaissent aussi.** Ils formaient la gouttière
   gauche avec le rail ; les garder seuls aurait laissé un décalage d'un côté
   après le centrage.
5. **Le toast est le bandeau `#chantier-avis`, avec une échéance.** Aucun
   élément nouveau : les messages d'action s'effacent seuls au bout de 4 s, ceux
   de la SESSION — sauvegarde impossible — restent. `avis()` l'emporte sur
   `toast()`, et un toast n'efface que son propre message.

---

## 8. Ce qui reste ouvert

1. **Les vérifications appareil**, toutes non exécutées — les dix qui restaient
   et les six de ce lot. Seul point qui empêche de dire que ce lot est prouvé.
2. **Réparer n'a pas de moteur** (§3). Le chemin est prêt ; il manque les dégâts
   et une fonction.
3. **La répartition d'un coût entre quartz et scorie N'EST TOUJOURS PAS
   arbitrée**, et il faut le dire précisément parce que la forme de
   `coutDeMontee` peut le faire croire. Elle rend bien `{ quartz, scorie,
   electricite }` — mais **mesuré sur cinq bâtiments et les quarante-neuf
   paliers, `scorie` vaut zéro partout**. La clé existe, la valeur n'a jamais
   été décidée : un coût d'amélioration se paie aujourd'hui en quartz et en
   électricité, et en rien d'autre. C'est un trou de calibrage, pas un choix
   écrit quelque part.
4. **Le remboursement d'une démolition** — 90 %, arbitré dans le moteur —
   n'est jamais montré au joueur avant qu'il démolisse. Un écran qui annoncerait
   le rendu avant l'acte serait un lot à part.
5. **Les couleurs de terrain de la fiche** — toujours pas arbitrées, toujours
   pas employées.
6. **Les obstacles de la bande de défense** — signalés depuis deux lots, la
   passation du 27/08 soir dit qu'ils y sont, aucun code ne les pose.
7. **La grille n'a plus de rail de bande.** Les deux boutons du bas disent où
   l'on est ; si le repère manque à l'usage, il faudra autre chose qu'une barre
   de gauche.
