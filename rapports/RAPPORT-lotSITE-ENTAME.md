# RAPPORT — lot SITE-ENTAMÉ — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.34.0 · build 35 | **0.35.0 · build 36** |
| `npm run check` | 505 pass / 0 fail | **520 pass / 0 fail** |
| `dist/index.html` | 525 733 octets | **528 601 octets** (+2 868) |
| `SAVE_VERSION` | 10 | **11** |
| `src/sim/` | 16 fichiers | 17 |

Le +2 868 fait entrer **deux** modules d'un coup : SITE-D'UNE-CASE était élagué
par `esbuild` faute d'appelant, et la réparation branchée dans le tick l'a tiré
dans le paquet avec celui-ci.

---

## 1. Aucun arbitrage demandé — tout était écrit depuis le 24/08

`MODELE-REPARATION-1.md`, que tu as dicté le 24/08, porte **le lot entier**, y
compris la phrase qui annonce ce lot-ci : « rien de tout ça n'entre dans le
moteur de combat. Le moteur détruit à 0 et rapporte les PV bruts. Planchers et
réparations sont une **écriture d'après-raid** ». Les trois régimes en sortent
sans une décision de ma part :

| | Plancher | Bâtiments | Défenses |
|---|---|---|---|
| **Base** de l'Ouvrage | 1 PV, sauf la Souche | **tout revient en 1 h** | tout revient en 1 h |
| **Camp / avant-poste** | aucun | **jamais réparés** | les **survivantes** en 1 h, **si l'Étai est debout** |

Et les deux bâtiments qui commandent tout sont nommés par la table, pas par une
constante que j'aurais écrite : `BATIMENTS.souche.raseLeSite` et
`BATIMENTS.etai.reparationDefenses`. Ton arbitrage de calibrage — « abattre
l'Étai à la première passe rend la seconde peu coûteuse » — tombe alors tout
seul du code, et un test le mesure.

## 2. Comment un site entamé se range : trois valeurs, et rien d'autre

`null` = intacte, `0` = détruite, un entier = ses milli-PV restants. Un site à
peine égratigné ne range donc presque que des `null`, et **une entrée qui ne
porte plus que des `null` est retirée** — sans quoi la sauvegarde grossirait
d'un site à chaque raid, pour l'éternité.

L'ordre des listes est celui du montage, ce qui permet de ne stocker que des
nombres : le montage se régénère à l'identique depuis la case et l'instance, et
le lot précédent le mesure. Sur l'avant-poste de la graine 2026, après une vraie
passe, ça donne onze nombres et six nombres — pas quarante objets.

⚠ **Une pièce détruite est RETIRÉE du montage, pas montée à zéro.**
`creerCombat` refuse `pvMilli === 0`, et il a raison. C'est aussi ce qui fait
qu'un bâtiment tombé à la première passe ne rapporte plus rien à la seconde.

## 3. Une fuite mesurée : le rasage repaie ce qui a déjà été encaissé

⚠ **C'EST LE SEUL VRAI POINT À ARBITRER, ET IL EST CHIFFRÉ.**
`BATIMENTS.souche` dit « sa destruction rase le site et **livre tout**, quel que
soit l'état des autres bâtiments », et `butin` l'applique à la lettre. Donc un
bâtiment cassé à moitié à la première passe **a déjà payé sa moitié**, et il
repaie son **plein** à la seconde.

Mesuré, sur l'avant-poste de niveau 6 de la graine 2026, rasé en deux passes :

| | Quartz | Scorie |
|---|---|---|
| Ce que le site vaut | 18 504 | 6 168 |
| Ce que le joueur encaisse | 21 397 | 7 132 |

**+16 %.** Sur un site cassé plus profondément avant le coup de grâce, l'écart
monte mécaniquement — à 90 % de dégâts puis rasage, il approcherait +90 %.

Deux lectures, et c'est à toi :
- **« livre tout » = le butin nominal du site** — c'est la règle actuelle. Elle
  récompense le raid en deux temps, et le joueur optimal cassera toujours le
  maximum avant de faire tomber la Souche.
- **« livre tout » = tout ce qui RESTE à livrer** — il faudrait alors ranger ce
  qui a déjà été payé, bâtiment par bâtiment, dans la même table que les PV.
  C'est trois nombres de plus par site entamé, pas davantage.

Un test témoin, nommé comme tel, mesure la fuite ; il devra être **inversé** le
jour où tu trancheras la seconde lecture.

## 4. Ce qui n'est pas dans le lot, et pourquoi

- **Les blocages d'1 h et de 24 h.** Ils disent QUAND on a le droit d'attaquer,
  pas ce que le site a dans le ventre. Et la spec §10 les range dans un tableau
  de géographie **sans dire s'ils portent sur le site de l'Ouvrage ou sur la
  base du joueur qui vient d'être attaquée** — les deux lectures se défendent,
  la seconde colle à la §11 sur les raids de l'Ouvrage. À trancher avec l'acte de
  raid, qui est leur vrai propriétaire.
- **Le butin qui entre dans l'économie, les points d'attaque qui se débitent,
  l'armée qui revient abîmée.** C'est l'autre moitié de l'après-raid ; ce module
  répond à une seule question — « qu'est-ce qui reste debout ? ».
- **« Un camp attaqué reste une heure puis disparaît et respawne. »** Tu avais
  dit « ne t'emmerde pas avec ça tout de suite ». Toujours pas fait.

## 5. Une base rasée ne revient pas — et c'est un fait que la graine ne peut pas porter

Une base de l'Ouvrage se **recalcule** à chaque appel depuis la graine : sans une
liste des rasées, elle reparaîtrait à l'instant même où le joueur la prend.
`etat.basesRasees` porte donc ce seul fait, et `siteDeLaCase` cesse de la voir.
`TYPES_SITE.base.respawn` vaut `false` et la §10 le redit — c'est la ligne
explicite, je l'ai suivie ; la ligne « blocage après avoir été rasé : 24 h »,
elle, reste sans emploi (§4).

---

## 6. Fichiers livrés

| Fichier | État |
|---|---|
| `src/sim/site-entame.js` | **neuf**, 290 lignes |
| `test/site-entame.test.js` | **neuf**, 15 tests |
| `src/sim/state.js` | 7 points : import, `SAVE_VERSION`, deux champs, `verifierEtat`, les deux chemins d'avancement, maillon v10 → v11 |
| `src/sim/site-de-la-case.js` | `resumeDuSite` accepte un montage ; `siteDeLaCase` ignore les bases rasées |
| `src/data/sites.js` | table `APRES_RAID` — plancher à 1 PV, horloge de l'Étai |
| `test/chantier.test.js` | la maquette porte les deux nouveaux champs |
| `test/state.test.js` | les deux gardes de version passent à 11 |
| `test/points-attaque.test.js` | **sa garde de version est retirée** — voir §8 |
| `CLAUDE.md`, `package.json` | arborescence, comptes, 0.35.0 · build 36 |

## 7. Les quinze tests, et les quatre falsifications qui les ont éprouvés

Tous PASS. Le code a été cassé pour de bon, quatre fois, et la suite relancée :

| Faute injectée | Ce qui est tombé |
|---|---|
| plus aucun plancher | tests 1 et 2 |
| les pièces détruites reviennent au montage | tests 6, 7 **et 14** |
| l'Étai ne commande plus la réparation | test 10 |
| les défenses détruites ressuscitent | tests 9 **et 11** |

Les montages qui donnent du mordant aux autres :

- **l'entrée qui ne dit rien** : le même appel, une fois sans dégât — rien ne
  doit être rangé — et une fois avec **un** bâtiment égratigné, où quelque chose
  doit l'être ;
- **la réparation d'une base** : mesurée **au tick près**, un avant l'heure et un
  à l'heure ;
- **l'Étai** : deux montages identiques, à ceci près qu'il tombe dans le second ;
- **les deux chemins** : la boucle et le rattrapage traversent l'échéance de
  réparation, et l'état rangé doit être le même des deux côtés ;
- **le test 14 joue de VRAIS combats** — le seul du fichier. Tout le reste
  fabrique ses dégâts ; là, c'est le moteur qui les fait, sur le montage que ce
  module lui rend. C'est la seule manière de savoir qu'un montage entamé est
  **jouable**, pas seulement bien formé.

## 8. Une leçon de méthode, payée une fois

`test/points-attaque.test.js` assertait `SAVE_VERSION === 10`. Ajouter un maillon
de migration a rendu ce fichier-là rouge, **pour une raison qui ne le regardait
pas**. La garde du numéro appartient au maillon le plus récent de la chaîne, une
seule fois ; ailleurs, on vérifie que la chaîne va jusqu'au bout, `SAVE_VERSION`
quel qu'il soit. C'est corrigé, et le commentaire du test le dit à qui ajoutera
le maillon suivant.

## 9. Ce qui vient après

1. **L'acte de raid** : débiter les points d'attaque, composer l'assaut depuis
   l'armée du joueur, verser le butin dans l'économie — et voir s'il sature —,
   ramener les unités avec leurs dégâts. Les deux moitiés de l'après-raid se
   rejoignent là.
2. ⚠ **Un raid demande 4 645 ticks, soit 464 secondes**, cinq fois le plafond de
   combat. Ce lot a joué de vrais combats avec `maxTicks: 20 000` sans y
   toucher — mais l'acte de raid, lui, devra choisir. Jamais regardé.
3. La fuite du butin (§3), les blocages (§4), le rayon du territoire (lot
   POINTS-D'ATTAQUE §4).
