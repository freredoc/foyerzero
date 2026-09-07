# RAPPORT — lot POINTS-D'ATTAQUE — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.32.0 · build 33 | **0.33.0 · build 34** |
| `npm run check` | 476 pass / 0 fail | **491 pass / 0 fail** |
| `dist/index.html` | 523 905 octets | **525 733 octets** (+1 828) |
| `SAVE_VERSION` | 9 | **10** |
| `src/sim/` | 14 fichiers | 15 |
| `test/` | 30 fichiers | 31 |

⚠ **`npm test` SEUL ÉCHOUE ONZE FOIS SUR UN CLONE NEUF**, et ce n'était pas une
régression : onze tests lisent `dist/index.html`, que le dépôt ne suit pas.
C'est `npm run check` — build puis tests — qui fait foi, et lui seul. Mesuré
avant de toucher à quoi que ce soit : 476 / 476 par `check`, 465 / 476 par
`test`.

---

## 1. Ce que le dépôt disait DÉJÀ, et qu'Ethan a redit sans le savoir

`POINTS_ATTAQUE` existait dans `src/data/sites.js` depuis le relevé de Tiberium
Alliances, et `SPEC-FOYER-ZERO.md` §3 le décrivait. **Les quatre lignes étaient
déjà exactement ce qu'Ethan a dicté le 29/08** :

- plafond `100 + 10 × niveau`, donc 600 au niveau 50 ;
- régénération `20 + 2 × niveau`, soit 20 % du plafond par heure ;
- coût d'un raid : 10 fixes, +1 par case en territoire allié, +3 par case en
  territoire ennemi **ou neutre** ;
- rayon maximal 10, donc 40 points au plus loin.

La lecture proposée la veille dans la passation — « +1 par case chez soi, +3 par
case ailleurs, ce qui donne la plage 11–40 » — était donc juste, et elle était
écrite dans le dépôt depuis le début.

## 2. Le seul endroit où sa dictée change le dépôt

**Le niveau retenu.** La table disait « celui de la base la plus élevée du
joueur » ; Ethan a tranché **le niveau d'ARMÉE le plus élevé**, et l'a chiffré
lui-même : 158 points pour une armée moyenne au niveau 5,8. Comme
`sim/niveau-de-base.js` rend des dixièmes, « 10 points par niveau » se lit
**1 point par dixième**, et 158 tombe juste. La spec est corrigée.

**Et un aller-retour, qui est la vraie leçon du lot.** Ethan a dicté « 10 % du
plafond par heure, quoi qu'il arrive », ne sachant pas que la table portait déjà
une régénération. Le lot a d'abord été livré à 10 % ; en lisant le rapport, il a
rétabli **20 %** — parce que `20 + 2 × niveau` VAUT 20 % du plafond à tous les
niveaux, si bien que sa règle et la table d'origine disaient la même chose à un
facteur près, et que la table avait raison sur le facteur. Le débit final est
donc **exactement celui d'avant le lot** : 20/h au départ, 120/h au niveau 50,
plein en cinq heures, un raid par heure. Ce qui reste de son arbitrage, c'est la
FORME — une part du plafond plutôt qu'une droite en niveau —, qui tient en un
nombre et qui énonce la propriété utile.

## 3. Le cliquet, et le problème qu'il fait disparaître

« Une fois qu'un plafond est passé, on ne touche plus au plafond ; si tu
supprimes complètement ton armée pour en refaire une autre, ça ne va pas toucher
au plafond. » Le plafond est donc **stocké**, pas dérivé — c'est ce qui coûte le
champ dans la sauvegarde et la migration.

Et ça règle en passant la question posée hier : un plafond qui pourrait baisser
laisserait des points AU-DESSUS de lui, et il aurait fallu choisir entre les
rogner (ce que « rien ne se retire en silence » interdit) et les garder sans
régénérer. **Avec le cliquet, ce cas n'existe pas.**

## 4. Le territoire, et l'exemple d'Ethan qui ne tient pas

« On garde deux. » Le territoire est donc la zone d'influence déjà écrite dans
`GEOGRAPHIE` — rayon 2, « fixe, ne croît jamais » —, et c'est **l'union des zones
de toutes les bases du joueur**, conformément à « sauf si tu as plein de bases
les unes à côté des autres ». La distance, elle, se mesure **depuis la base qui
attaque**, en Tchebychev.

⚠ **CONSÉQUENCE MESURÉE, ET ELLE CONTREDIT L'EXEMPLE ORAL.** « Un camp à trois
cases, ça fait dix plus trois » suppose un territoire de rayon ≥ 3. À rayon 2, le
tarif à +1 ne couvre que les cases à 1 et 2 : **un camp à trois cases coûte 19,
pas 13**, et le raid bon marché ne dépasse jamais 12. Rien entre 13 et 18
n'existe. Un test le dit noir sur blanc plutôt que de le laisser se découvrir en
jouant. Si ce n'est pas l'intention, un seul nombre bouge —
`GEOGRAPHIE.rayonInfluenceJoueur` — et porter le territoire à 5 couvrirait
exactement l'anneau où les avant-postes du joueur apparaissent.

## 5. Ce qui a été retiré

`POINTS_ATTAQUE.rayonMaximal: 10` doublait `GEOGRAPHIE.rayonAttaque: 10` — deux
tables pour une grandeur, ce que CLAUDE.md §4 interdit. Retiré ; le barème lit le
rayon dans `GEOGRAPHIE`. Aucun code ne lisait ni l'un ni l'autre avant ce lot.

---

## 6. Fichiers livrés

| Fichier | État | SHA-256 (16 premiers) |
|---|---|---|
| `src/sim/points-attaque.js` | **neuf** | `bad9547aaf1bb959` |
| `test/points-attaque.test.js` | **neuf** | `67a8a92a0bff3b9e` |
| `src/sim/state.js` | modifié | `2c72959988da684c` |
| `src/data/sites.js` | modifié | `9748654fca19a3a1` |
| `test/chantier.test.js` | modifié | `c6c17aeb034f06de` |
| `test/state.test.js` | modifié | `71db7680b5931366` |
| `CLAUDE.md` | modifié | `12dc8834b7150420` |
| `SPEC-FOYER-ZERO.md` | modifié | `5125d21cd6146489` |
| `package.json` | modifié | `06451c629ec657a9` |

Sept points d'insertion dans `state.js` : l'import, `SAVE_VERSION`, le champ dans
`creerEtat`, le champ exigé par `verifierEtat`, `tickJeu`, `rattraperJeu`, et le
maillon de migration v9 → v10.

**Trois modifications de tests EXISTANTS**, toutes rendues nécessaires par le
champ neuf, et toutes conformes à un précédent que leur propre commentaire porte
déjà :

- `test/chantier.test.js` — `baseDeLaMaquette()` porte désormais `attaque`,
  exactement comme elle a dû porter `satellites` le matin même et les deux forces
  la veille : `tickJeu` le lit, un montage qui l'omet n'est plus un état de jeu.
- `test/state.test.js` — les deux gardes de version passent de 9 à 10. Ce sont
  des gardes anti-oubli ; les mettre à jour EST leur mode d'emploi. La seconde
  gagne au passage une assertion sur le nouveau maillon.

---

## 7. Les quinze tests, et le montage qui les rend falsifiables

Tous PASS. Ce qui suit dit ce qui les ferait tomber.

| # | Test | Le montage, et pourquoi il mord |
|---|---|---|
| 1 | plafond 100 / 158 / 600 | trois niveaux qui donnent trois plafonds différents ; 5,8 se MESURE sur `[5,6,6,6]`, il n'est pas posé à la main |
| 2 | maximum, pas moyenne | deux bases très inégales : la moyenne rendrait 130, le minimum 110, seul le maximum rend 158 |
| 3 | **le cliquet** | le plafond doit d'abord AVOIR monté par le chemin réel (un tick), sinon « il n'a pas baissé » ne dit rien. Un plafond dérivé rend 100 après démantèlement |
| 4 | 20 % par heure | **il faut dépenser d'abord** : un état plein reste plein sur du code qui ne régénère rien. Les deux bornes mesurées, 20/h et 120/h, SONT les deux colonnes de la table d'origine |
| 5 | plein en cinq heures | mesuré au tick près, aux trois plafonds : à un tick de la fin il manque encore un point |
| 6 | **les deux chemins** | plafond 158, qui ne divise pas le diviseur — et le test le VÉRIFIE au lieu de le supposer, si bien que le passage de 10 % à 20 % a changé le diviseur sans rien lui ôter. Une implémentation naïve — `floor(158 / 180 000)` par tick — gagnerait ZÉRO pour toujours |
| 7 | jamais au-dessus, résidu borné | cent heures sur un plafond de 100 ; le résidu est vérifié borné sur quatre longueurs |
| 8 | barème | les deux tarifs sont assertés DIFFÉRENTS avant tout le reste ; 25 pour l'exemple d'Ethan à cinq cases ; refus à 0 case et à 11 |
| 9 | rayon du territoire | à 3 cases on n'est plus chez soi : **19, pas 13** |
| 10 | **union des zones** | la cible est à 6 cases de la base qui part et à 2 d'une seconde base ; sans l'union le coût serait 28 au lieu de 16. C'est le test qui tient le pluriel |
| 11 | le singulier tient en une fonction | `basesDuJoueur` rend bien LA base, et c'est la seule à changer au pluriel |
| 12 | payer | un paiement refusé ne débite pas |
| 13 | partie neuve pleine | mille ticks sur un état plein ne débordent pas ; puis boucle contre rattrapage sur 4 321 ticks, avec assertion que quelque chose a bien été régénéré |
| 14 | **le cliquet traverse la sauvegarde** | on recharge une partie dont l'armée est VIDE : un plafond dérivé au chargement rendrait 100, seul un plafond rangé rend 600 |
| 15 | migration v9 → v10 | une v9 avec armée reçoit 155 (5,5), une v9 sans armée reçoit 100, les deux au plein |

---

## 8. Une règle de méthode ajoutée à CLAUDE.md §0

Quatre questions ont été posées à Ethan sur ce lot ; **trois avaient déjà leur
réponse dans le dépôt** — le plafond, le barème du raid et le nom de la grandeur
—, et la quatrième a fait remplacer une valeur juste par une autre, retirée le
soir même. Le dépôt est devenu assez gros pour que le savoir y soit déjà, et
assez gros pour qu'on ne tombe plus dessus par hasard. `CLAUDE.md` §0 porte
désormais un cinquième geste : **chercher dans `src/data/`, la spec et les
relevés TA avant de demander un arbitrage.**

## 9. Ce qui reste ouvert

1. **Le nom joueur.** Le dépôt tranche : `SPEC-FOYER-ZERO.md` §3 et
   `data/sites.js` disent **points d'attaque** depuis le relevé TA, et le nom ne
   heurte ni le *Centre de commandement* — qui fixe le budget d'armée — ni les
   *points d'armée*, ni les *points de recherche*. C'est ce nom qui a été retenu,
   dans le code comme dans la spec. Aucun écran ne l'affiche encore : le jour où
   un écran le fera, changer d'avis coûtera un libellé.
2. **Rien ne DÉPENSE encore ces points.** Le barème et le paiement sont écrits et
   testés ; l'acte « lancer un raid » n'existe pas — il attend le site d'une case
   et l'état d'un site entamé. `coutDUnRaid` est déjà à la forme que le
   mini-onglet de la spec d'écran demandera.
3. **Le rayon du territoire**, si l'exemple des trois cases était l'intention
   (§4). C'est le SEUL arbitrage encore ouvert du lot, et le dépôt n'a pas la
   réponse : il dit rayon 2 « fixe », mais l'exemple d'Ethan suppose 3 ou plus.
4. **`GEOGRAPHIE.rayonInfluenceEnnemie: 3` ne sert toujours à rien.** Le barème
   ne le lit pas, et il n'en a pas besoin : « chez moi » contre « tout le reste »
   suffit à rendre les deux tarifs. Il servira le jour où un troisième tarif, ou
   un affichage de zones ennemies sur la carte, en aura l'usage.
