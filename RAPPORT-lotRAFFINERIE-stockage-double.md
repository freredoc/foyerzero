# RAPPORT — lot RAFFINERIE : l'asymétrie du stockage, et un garde-fou documentaire

> Lot vérifiable par exécution, livré en direct. Pas de brief Claude Code.
> Le merge sur `main` appartient à Ethan.

---

## 1. Résultat, mesuré

| | avant (lot CHAMPS) | après |
|---|---|---|
| `npm test` | 193 pass / 0 fail | **198 pass / 0 fail** |
| Fichiers `*.test.js` | 18 | **19** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **81 236 o · `f6b082b4…5ad430`** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

**Pas de bump** : `src/index.src.html` n'importe toujours que `ui/banc.js`.
HTML identique à l'octet, SHA-256 vérifié. `main` reste **vert**.

---

## 2. Le classeur ne contient pas le débit cherché

Tu m'as dit que les débits du collecteur étaient dans
`FOYER-ZERO-BATIMENTS-JOUEUR.xlsx`. **Je l'ai ouvert en lecture seule pour
regarder** — `CLAUDE.md` §1 interdit d'en tirer du code, pas d'y jeter un œil
pour te répondre précisément.

La feuille **EFFETS** porte **deux lignes Collecteur, et deux seulement** :

| Grandeur | Statut | Valeur | Déjà dans `base.js` ? |
|---|---|---|---|
| Production continue | ARBITRÉ | 240/h niv. 1, ×1,25 | ✅ `DEBITS.collecteur.propre` |
| Flux continu selon les voisins | ARBITRÉ | 72/h par **raffinerie** voisine | ✅ `DEBITS.collecteur.parVoisin.raffinerie` |

**Aucune ligne ne parle d'un champ voisin du collecteur.** La seule ligne
« champ » du classeur est celle de la Centrale — 60/h par champ de scorie à
proximité, elle aussi déjà transcrite.

**Conclusion : `DEBITS` correspond au classeur.** Les **sept** valeurs y
figurent toutes, à l'identique — 120 · 60 · 72 · 48 · 240 · 72 · 72.

⚠ **J'avais annoncé SIX, et c'était faux** ; le compte a été refait par
exécution. C'est le cinquième chiffre raté de la journée (§4) et le premier à
avoir survécu à ma relecture — il a fallu qu'Ethan me le renvoie. Un compte se
mesure, il ne se fait pas de tête, même quand il tient sur les doigts d'une main.

**ET LA QUESTION EST TRANCHÉE — asymétrie voulue.** Arbitré par Ethan le même
jour : le Collecteur ne touche **aucun** bonus par champ de ressource voisin. Le
champ sous lui décide de ce qu'il produit, et c'est tout ce que le terrain lui
donne. La raison est mécanique et elle est écrite dans `base.js` : la production
suit ×1,25 par niveau quand les coûts suivent ×1,32, et c'est ce décrochage qui
pousse le joueur vers le raid ; un multiplicateur de terrain sur le Collecteur
amplifierait précisément le canal qu'on a délibérément laissé décrocher.

**`DEBITS` est donc COMPLÈTE.** Plus aucune valeur manquante dans cette table.

**Un verrou, parce que les tests laissaient passer un ajout.** Les assertions de
valeur (`debitVoisinParHeure(...) === 72`) passent toutes si quelqu'un AJOUTE
une clé : c'était le trou par lequel un bonus de terrain serait entré sans qu'on
revoie la décision. Trois assertions neuves ferment ça — la forme EXACTE de
chaque `parVoisin`, le fait que `centrale.champDeScorie` soit le SEUL bonus de
terrain de toute la table, et le compte de sept. Falsifié : glisser un
`champDeQuartz: 40` sur le collecteur fait tomber la suite.

**Deux lignes périmées du classeur, au passage** — sans effet, mais à savoir :
« Raffinerie · Capacité de stockage · base niv 1 : 20 » et « Accumulateur ·
Stockage · base niv 1 : 15 » avec la courbe ×2 puis ×1,333. C'est l'ancrage
**abandonné le 25/08** au profit de l'autonomie de 12 h. `base.js` fait foi.

---

## 3. La raffinerie — trois changements de données

### 3.1 Elle stocke les DEUX, chacun à pleine capacité

Ton arbitrage : « s'il affiche 100 de stock, on peut stocker 100 quartz **et**
100 scories ».

`ressource` passe donc de `quartzOuScorie` à **`quartzEtScorie`**, et un champ
`capaciteParRessource: true` le dit explicitement.

**Les deux chaînes devaient différer**, et c'est le cœur du changement :

| Bâtiment | Valeur | Sens |
|---|---|---|
| collecteur | `quartzOuScorie` | **exclusif** — le champ sous lui tranche, il ne fera jamais les deux |
| raffinerie | `quartzEtScorie` | **inclusif** — les deux à la fois, plafond par ressource |

Les écrire pareil, c'était se préparer à lire `capaciteDuNiveau` comme un total
et à diviser le stockage par deux. Une raffinerie de niveau 1 tient **2 880 de
quartz et 2 880 de scorie**, soit 5 760 en tout.

### 3.2 Elle n'a pas de pendant Ouvrage

`nom.ouvrage: 'Gangue'` est **retiré**. Ton mot : « ce n'est pas vraiment du
parallèle, ce n'est pas le miroir ». Côté Ouvrage le stockage est **deux**
bâtiments — Gangue (quartz) et Terril (scorie) — parce que c'est du butin, et
qu'un butin de quartz n'est pas un butin de scorie. Côté joueur c'est **un**
bâtiment qui tient les deux. Un vers deux : aucun nom ne convient, et en choisir
un serait faux la moitié du temps.

Les appariements repassent donc à **trois** : Souche, Étai, Nœud.

### 3.3 Et le nombre « trois » a fait un aller-retour qui n'en est pas un

| Date | La ligne dit | La table porte | Ce qui a été corrigé |
|---|---|---|---|
| 25/08 | trois | **quatre** | rien, personne n'avait compté |
| 26/08 (BASE-0) | **quatre** | quatre | la **ligne**, par décompte |
| 26/08 (ce lot) | **trois** | **trois** | la **table**, par arbitrage |

Les deux corrections étaient justes à leur date. La première réparait un
décompte, la seconde une donnée. C'est écrit dans `base.js` pour que personne ne
le relise comme une hésitation.

### 3.4 `sites.js` le disait déjà — et un test le vérifie maintenant

`BATIMENTS[x].ta` de `sites.js` nomme le bâtiment **joueur** correspondant, en
français. Les renvois bouclent :

- `souche.ta` = « Chantier de construction » ✅
- `etai.ta` = « Complexe de défense » ✅
- `noeud.ta` = « Collecteur » ✅
- `gangue.ta` = « Silo de tiberium », `terril.ta` = « Silo de cristal » — **ni
  l'un ni l'autre ne renvoie vers la Raffinerie**

**C'est la seule non-boucle des quatre, et c'était la donnée fausse.** Un test
croise désormais les deux tables **dans les deux sens** : tout `nom.ouvrage`
déclaré doit désigner un bâtiment de site existant, et ce bâtiment doit renvoyer
vers le bon nom joueur.

⚠ **Piège trouvé en chemin** : le champ `ta` n'a pas le même sens dans les deux
fichiers. Dans `base.js` c'est le nom TA **anglais** (« Harvester ») ; dans
`sites.js` c'est le nom **français** du pendant joueur (« Collecteur »), le nom
TA anglais étant en commentaire de fin de ligne. Consigné dans les deux fichiers
et dans `CLAUDE.md`.

---

## 4. J'ai écrit cinq chiffres faux dans la journée — les compteurs ne passeront plus

C'est le vrai sujet de ce lot. Sur la seule journée du 26/08, j'ai écrit **cinq
nombres avant de les mesurer**, tous faux. Quatre rattrapés par moi, **le
cinquième par Ethan** — celui-là avait passé ma relecture :

| Où | J'avais écrit | Mesuré |
|---|---|---|
| `base.js`, tentatives du tirage | « pire cas 4, facteur 16 » | **1, partout** |
| `champs.js`, ordre de placement | « échoue bien plus souvent » | vrai, mais **invisible à 12 cases** |
| `CLAUDE.md`, occurrences d'« atelier » | « plus aucune » | **cinq**, toutes légitimes |
| `CLAUDE.md`, compte de tests | 196 | **198** |
| ce rapport, valeurs de `DEBITS` | « six » | **sept** — rattrapé par Ethan, pas par moi |

Le remède n'est pas de promettre d'être plus attentif — c'est ce qui a été
promis trois fois. **`test/documentation.test.js` asserte les compteurs de
`CLAUDE.md` contre le disque** :

- le « N pass / 0 fail » de §0 contre le nombre de déclarations `test(` ;
- les comptes de fichiers de §2 (`src/data`, `src/sim`, `src/render`, `src/ui`,
  `test`) contre `readdirSync` ;
- la **liste nominative** des fichiers de test contre le dossier, par égalité
  d'ensemble.

Un lot qui ajoute un test ou un fichier sans mettre `CLAUDE.md` à jour passe
désormais au **rouge**. `CLAUDE.md` §2 avoue avoir menti deux fois ; §0 quatre.
Le premier geste de chaque session est de lire ce fichier : il n'a pas le droit
de mentir.

### Il est tombé sur moi à sa première exécution

Trois fois de suite, et chacune vaut d'être lue :

1. **Le compte.** J'avais mis 196 dans `CLAUDE.md` en supposant que j'ajoutais
   un test. J'en ajoutais trois. Le garde-fou a dit 198.
2. **Sa propre méthode.** Le test vérifie d'abord que le comptage est valide
   (pas de sous-tests imbriqués). Il a signalé `t.test(` dans `defense.test.js`
   — c'était `interdit.test(source)`, un appel de `RegExp.test`. **La faute
   exacte que `CLAUDE.md` §6 documente déjà pour la garde du lot 1** : un motif
   de mot non borné. Corrigé en bornant en Unicode, comme la garde du lot 1.
3. **Lui-même.** Un fichier qui traque des motifs textuels et les explique en
   prose devient sa propre violation : il s'est dénoncé par sa liste de motifs,
   puis par son appât, puis par un commentaire. La prose a été réécrite et le
   fichier exclu de son propre balayage — angle mort d'un fichier, assumé et
   écrit.

---

## 5. Falsification — treize défauts, treize tombés

Chacun sur une copie fraîche, ancre vérifiée à une occurrence.

**Appariements et double stockage** (7/7)

| Défaut | Résultat |
|---|---|
| l'appariement Gangue remis sur la raffinerie | tombe (2 tests) |
| un nom d'Ouvrage inventé (Nœud → Rongeur) | tombe (2) |
| `sites.js` cesse de renvoyer vers le Collecteur | tombe (1) |
| raffinerie remise en `quartzOuScorie` | tombe (1) |
| `capaciteParRessource` retirée | tombe (1) |
| `capaciteParRessource` ajoutée à l'accumulateur | tombe (1) |
| `terril.ta` renvoie vers la Raffinerie | tombe (1) |

**Garde-fou documentaire** (6/6)

| Défaut | Résultat |
|---|---|
| `champs` retiré de la liste | tombe |
| un nom inventé ajouté à la liste | tombe |
| deux noms échangés, compte inchangé | tombe |
| un test de trop annoncé | tombe |
| `src/data` annoncé à 5 | tombe |
| `src/ui` annoncé à 4 | tombe |
| un test ajouté sans documenter | tombe |

⚠ **Un défaut passait dans la première version** : retirer `champs` de la liste.
Le test cherchait chaque nom « quelque part dans le bloc », et le mot « champs »
apparaît aussi dans une annotation en prose deux lignes plus bas. Un test qui
accepte de trouver sa réponse dans le commentaire d'à côté ne mesure rien.
Remplacé par une **égalité d'ensemble sur les seules lignes de liste**.

---

## 6. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/data/base.js` | raffinerie : `nom.ouvrage` retiré, `quartzEtScorie`, `capaciteParRessource` ; en-tête et `capaciteDuNiveau` documentés ; dépouillement du classeur consigné |
| `test/base.test.js` | T2 quatre → trois ; **deux tests neufs** (renvoi croisé, double stockage) ; importe `BATIMENTS` |
| `test/documentation.test.js` | **nouveau** — 3 tests, le garde-fou des compteurs |
| `CLAUDE.md` | §0 compteur, §2 comptes en chiffres + `documentation`, §6 trois pièges neufs |
| `RAPPORT-lotRAFFINERIE-stockage-double.md` | ce fichier |

**Ordre de commit** : `src/data/base.js` **avant** `test/base.test.js` (le test
asserte les nouvelles valeurs). `CLAUDE.md` **avec** `test/documentation.test.js`
— ils s'assertent mutuellement, l'un sans l'autre laisse `main` rouge. **C'est
le premier lot de la journée qui n'est pas librement découpable**, et c'est
exactement le cas que `CLAUDE.md` §5 prévoit. Tout commiter d'un bloc.

---

## 7. Ce qui reste ouvert

1. ~~Le débit d'un collecteur par champ adjacent.~~ **CLOS** — asymétrie
   voulue, arbitré le 26/08 (§2). `DEBITS` est complète, sept valeurs, et un
   test verrouille sa forme.
2. **Le redéploiement change les champs** — découle du code livré au lot
   CHAMPS, jamais dit. À confirmer avant que quoi que ce soit en dépende.
   **C'est le dernier point ouvert des données de base.**
3. **Le reliquat des colis** : `params.colis` + les deux blocs de `economy.js` +
   les tests qui les gardent. Morts depuis le 25/08, ils tournent encore.
4. **Les valeurs manquantes AILLEURS que dans `DEBITS`** — à ne pas confondre
   avec le point 1, qui est clos : coûts de réparation des bâtiments et des
   unités, plafonds de stockage d'électricité, taux d'accumulation et plafond de
   la réserve de temps de réparation, formule du dépassement de l'heure quand
   les défenses passent le niveau du Complexe. Onglet TROUS du classeur.
5. **Le chantier de fond, inchangé** : brancher la base, c'est **remplacer**
   `sim/economy.js`. Il tourne sur le modèle du lot 1 — deux types de bâtiments,
   courbe hyperbolique, adjacence anonyme à deux voisins, une capacité globale,
   deux ressources. `data/base.js` demande onze bâtiments, pente ×1,25,
   voisinage typé sur huit cases, capacité **par bâtiment et par ressource**, et
   une troisième ressource. **Le terrain existe et `DEBITS` est complète.**
