# RAPPORT — lot OBSTACLES : le terrain entre dans l'état

Exécuté le 29/08/2026, à la suite du lot CARTE.

Tous les nombres de ce rapport ont été obtenus **par exécution**, jamais estimés.

---

## 1. Départ et arrivée, mesurés

| | Avant | Après |
|---|---|---|
| Version | 0.27.0 · build 28 | **0.28.0 · build 29** |
| `npm test` | 411 pass / 0 fail | **415 pass / 0 fail** (+4) |
| `dist/index.html` | 181 014 octets | **183 645 octets** (+2 631) |
| Marge sous la borne T10 | 9,5 % | **8,2 %** |
| `SAVE_VERSION` | 7 | **7 — inchangée** |

⚠ **AUCUNE MIGRATION, ET LA SAUVEGARDE N'A PAS CHANGÉ D'UN OCTET.** `obstacles`
est dérivé de la fondation comme `champs`, et `serialiser` retire les deux. C'est
ce qui permet d'ajouter du terrain sans toucher au format.

---

## 2. Ce que le lot livre

`etat.obstacles`, dérivé et strippé. La pose d'une pièce de garnison sur une case
obstruée est refusée, avec son propre code et son propre message. L'écran dessine
les obstacles, avec la lettre qui dit **qui** ils ralentissent — I, V ou X.

Et la bande de défense passe de **72 à 62 cases posables**.

---

## 3. Les quatre décisions du lot

**Seule la garnison est sur le terrain.** `FORCES[x].surLeTerrain` le dit, et la
règle se lit dans ce champ plutôt que sur le nom de la force. Les cases de la
garnison SONT celles du champ de bataille ; les quatre vagues de l'armée sont une
grille de composition, dont les rangées ne sont pas des rangées de la grille. Un
test pose une unité sur **chaque numéro de vague qui coïncide avec une rangée
obstruée** et exige qu'elle passe.

**`obstacle` et `superposition` sont deux codes.** Le joueur déplace ce qui
occupe ; il ne déplacera jamais un rocher. « Cette case est déjà occupée » devant
un obstacle l'enverrait chercher une pièce à retirer.

**`obstacle` est toléré au chargement.** Le cas ne peut plus se créer par le jeu
— `poserEffectif` le refuse — mais il apparaîtra **tout seul** le jour où le
tirage des obstacles changera, puisque le terrain se redéduit à chaque
chargement : un obstacle peut se poser sous une pièce posée légalement la veille.
C'est exactement le raisonnement de `uniques-voisins`. Toléré ne veut pas dire
effacé : le défaut reste signalé et toute nouvelle pose au même endroit est
refusée.

**Les obstacles ne comptent pas dans les six occupants par rangée.** C'est ce qui
justifie `OBSTACLES_DE_BASE.maxParRangee = 2` : neuf colonnes moins deux en
laissent sept, donc les six restent atteignables partout. Les faire compter était
l'autre solution ; ce n'est pas celle qui a été retenue, et c'est écrit.

---

## 4. Ce que 62 cases changent

Le budget maximal de défense vaut 290 points et le défenseur le moins cher en
coûte 5 : **58 pièces au plus** pour 62 emplacements. Le budget continue donc de
mordre avant la place — mais la marge est passée de **14 cases à 4**.

Le test le **calcule** au lieu de réécrire 62 : le jour où `OBSTACLES.nombre`
bougera, il suivra au lieu de tomber. Et il ne se contente pas du compte — il
vérifie qu'aucune case rendue posable ne porte d'obstacle, parce qu'une
soustraction peut tomber juste en retirant les mauvaises cases.

---

## 5. Falsification — cinq défauts, cinq fois rouge

| Défaut injecté | Rouge |
|---|---|
| la garnison ignore les obstacles | 3 tests |
| `serialiser` laisse les obstacles dans la sauvegarde | 1 test |
| les obstacles se redéduisent de la POSITION, pas de la fondation | 1 test |
| `obstacle` sort des codes tolérés au chargement | 2 tests |
| `surLeTerrain` passe à `true` pour l'armée | 2 tests |

La dernière ligne est celle qui compte le plus : elle prouve que la règle est
bien lue dans la table et pas devinée du nom de la force.

---

## 6. Ce qui reste ouvert

1. **Le combat ne lit pas encore `etat.obstacles`.** Quand la base du joueur sera
   attaquée, son montage devra les passer à `creerCombat`. Rien ne le fait, parce
   que rien n'attaque encore le joueur.
2. **Les deux tirages d'obstacles coexistent toujours** — celui du générateur de
   sites part de la graine du SITE, celui de `obstaclesDeLaBase` part de la CASE.
   C'est ce rapprochement qui rendra le code `obstacle` toléré vraiment utile.
3. **Le journal des écarts** — camps, avant-postes, respawn — reste à faire, et
   c'est lui qui touchera `SAVE_VERSION`.
4. **Le raid à 4 645 ticks** signalé au lot précédent n'a pas été regardé.

---

## 7. Vérification appareil — NON EXÉCUTÉE

Trois choses à voir sur le S25 FE, et elles sont neuves à l'écran :

1. **Les dix obstacles paraissent dans la bande de défense**, fond terre et
   liseré plein, distincts des champs qui sont kaki et tiretés.
2. **La lettre se lit** — I, V ou X en bas à droite de la case, en 8 px.
3. **Toucher une case obstruée** en mode pose affiche « cette case porte un
   obstacle », et pas « cette case est déjà occupée ».
