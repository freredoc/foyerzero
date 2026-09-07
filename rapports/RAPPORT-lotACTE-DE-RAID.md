# RAPPORT — lot ACTE-DE-RAID — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.38.0 · build 39 | **0.39.0 · build 40** |
| `npm run check` | 524 pass / 0 fail | **535 pass / 0 fail** |
| `dist/index.html` | 528 947 octets | **529 105 octets** (+158) |
| `SAVE_VERSION` | 11 | **12** |
| `src/sim/` | 17 fichiers | 18 |

**La boucle est refermée : un raid se joue maintenant de bout en bout en
simulation.** Payer, partir avec son armée, combattre, encaisser, revenir
abîmé.

---

## 1. Ce que le lot fait, et ce qu'il n'invente pas

Tout existait, épars : les points d'attaque savaient ce qu'un raid coûte, la
carte savait ce qu'il y a sur une case, le site entamé savait ce qui reste
debout, le moteur savait résoudre. **Aucune règle de combat n'a été ajoutée** ;
`sim/raid.js` est le seul endroit qui les appelle dans l'ordre.

Cinq écritures, et c'est ce qui justifie qu'elles vivent ensemble : les points se
débitent, le butin entre dans l'économie, la recherche se range, le site garde
ses dégâts, l'armée revient abîmée. Les éparpiller chez leurs propriétaires
respectifs aurait rendu impossible de dire ce qu'un raid fait.

**L'armée du joueur est celle qu'il a posée**, pas un profil du banc. Les quatre
vagues de `etat.armee` deviennent les quatre vagues du raid, avec leurs dégâts en
cours. C'est tout l'écart entre le banc d'essai et le jeu.

## 2. ⚠⚠ LE BUTIN SATURE, ET LE PREMIER RAID EN JETTE 97 %

C'est **le point du lot**, et il n'était pas arbitré. Mesuré sur une partie
neuve, six Meutes de niveau 1 contre le premier camp :

| | Quartz + scorie |
|---|---|
| Butin fait au combat | 1 370 |
| **Encaissé** | **40** |
| **Jeté faute de place** | **1 330** — soit **97 %** |

La capacité d'une base neuve est de **50 quartz et 50 scorie**, son stock de
départ de 30 et 30. Un camp de niveau 1 rapporte 4 050 quartz si on le rase :
**quatre-vingts fois le coffre.**

J'ai retenu la saturation, pour trois raisons, et **c'est une lecture, pas un
arbitrage** :

1. sans elle, les quatre bâtiments de stockage du jeu perdent la moitié de leur
   raison d'être — on ne monterait plus jamais une Gangue ;
2. sans elle, **le premier raid saute les huit premiers niveaux** de progression :
   4 050 quartz face à un premier palier d'amélioration qui coûte **3** ;
3. « rien ne se retire en silence » n'est pas violé — aucun stock existant n'est
   rogné, un versement qui ne rentre pas est refusé, et le rapport le **dit**
   (`butinPerdu`), pour que l'écran puisse l'écrire.

⚠ **MAIS 97 % EST UN CHIFFRE DE CALIBRAGE, PAS UN CHIFFRE DE JEU.** Les deux
courbes ne se parlent pas au démarrage : le butin est ancré à 300 par bâtiment au
niveau 1, le coût d'amélioration à 3, le stockage à 50. Plus haut, elles se
rejoignent — au niveau 20, un camp rapporte 1,3 M et une amélioration coûte
708 k, soit deux améliorations par raid, ce qui est sain. **C'est le début de
partie qui est décalé, et il faut le regarder.** Trois leviers possibles, un seul
nombre chacun : l'ancrage du butin, la capacité de départ, ou le coût des
premiers paliers.

Un mot suffit à basculer sur l'autre lecture — le butin entre en entier et le
surplus gèle, comme pour une raffinerie détruite : c'est la fonction `verser`,
six lignes.

## 3. Les points de recherche vont enfin quelque part

`etat.recherche.pointsMilli`, **en chaîne décimale**. Ce n'est pas un caprice :
le barème dépasse `Number.MAX_SAFE_INTEGER` dès le niveau 39 pour le Broyeur,
donc le compteur est un BigInt — et `JSON.stringify` **lève** sur un BigInt.
`sim/combat.js` l'écrivait déjà dans son en-tête ; ce lot ne fait que suivre.
Un test additionne au-delà de l'entier sûr et vérifie que la sauvegarde ne perd
pas un chiffre.

## 4. Les règles d'après-raid, appliquées à l'armée du joueur

- **On paie avant de partir**, jamais après : un raid raté coûte ses points.
  C'est ce qui fait du choix de cible une décision.
- **Une unité détruite plancher à 1 PV et reste dans l'armée.** Arbitré le
  28/08 : « les unités sont détruites mais pas perdues ». Elle ne repart pas —
  une unité à 1 PV n'est pas montable — mais elle n'est pas retirée : elle
  attend une réparation. Un test vérifie que `degatsMilli` ne vaut **jamais**
  `pvMax`, ce qui la rendrait à jamais inutilisable.
- **Les dégâts reviennent sur les bonnes pièces**, par l'ordre de montage —
  même contrat que le site entamé. Le test monte deux niveaux très différents
  dans la même armée : un appariement décalé donnerait à une pièce des dégâts
  supérieurs à ses propres PV.

## 5. Les onze tests, et les quatre falsifications

| Faute injectée | Ce qui est tombé |
|---|---|
| le raid ne se paie plus | test 3 |
| le butin ne sature plus | tests 4 **et 5** |
| l'ordre de montage est faux | test 2 |
| l'unité au plancher repart | test 2 |

Deux montages ont dû être corrigés avant livraison, et les deux disaient la
même chose : **une assertion qui passe pour la mauvaise raison**.

- « hors de portée » était mesuré sur une case lointaine et **vide** : le code
  répondait « sans-cible », ce qui est juste, et le test croyait mesurer la
  portée. Il va maintenant chercher une vraie base de l'Ouvrage au-delà du rayon.
- la preuve que le compteur dépasse l'entier sûr comparait deux écritures qui,
  sur la valeur choisie, tombaient identiques. Elle assertait donc « ce n'est pas
  égal » sur deux choses égales.

## 6. Fichiers livrés

| Fichier | État |
|---|---|
| `src/sim/raid.js` | **neuf**, 300 lignes |
| `test/raid.test.js` | **neuf**, 11 tests |
| `src/sim/state.js` | champ `recherche`, `SAVE_VERSION` 12, maillon v11 → v12 |
| `test/site-entame.test.js`, `test/state.test.js` | gardes de version recentrées (§7) |
| `test/chantier.test.js` | la maquette porte le nouveau champ |
| `CLAUDE.md`, `package.json` | arborescence, comptes, 0.39.0 · build 40 |

## 7. La même leçon, deux lots de suite

`test/site-entame.test.js` assertait `SAVE_VERSION === 11` et est devenu rouge
en ajoutant un maillon — exactement ce que le lot précédent avait corrigé dans
`points-attaque.test.js`, avec un commentaire qui le disait. La garde du numéro
appartient au maillon le **plus récent**, une seule fois ; ailleurs on vérifie
que la chaîne va jusqu'au bout, `SAVE_VERSION` quel qu'il soit. C'est corrigé, et
cette fois le commentaire est dans le fichier qui a fauté.

## 8. Ce qui reste

1. **Le calibrage du début de partie** (§2) — c'est le vrai sujet ouvert, et il
   demande un arbitrage, pas du code.
2. **Les écrans.** Rien de tout ça n'est visible : `ui/monde.js` dessine la carte
   mais ne connaît ni le coût d'un raid, ni le mini-onglet, ni le bouton
   d'attaque. C'est le prochain gros morceau, et c'est là que les sprites se
   branchent.
3. **La réparation du joueur** — bâtiments, unités, défenses — n'existe pas
   encore : ce lot abîme l'armée sans donner le moyen de la remettre sur pied.
   `MODELE-REPARATION-1.md` §3 et §4 en portent tout le modèle, réserve de temps
   comprise.
4. Les blocages d'1 h et 24 h, le rayon du territoire, les deux niveaux adjacents
   d'une base de l'Ouvrage, les 4 645 ticks (requalifiés : le plafond de 90 s ne
   coûte rien).
