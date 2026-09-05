# Foyer Zéro — plancher de PV et modèle de réparation

Dicté par Ethan le 24/08/2026. Ce document **remplace** le plancher de 1 % et la réparation
gratuite de 70 % de `SPEC-FOYER-ZERO.md` §1, §2 et §10. À replier dans la spec.

⚠ **MIS À JOUR LE 05/09/2026, ET C'EST UNE RÉÉCRITURE DE FOND.** Les §1 et §2 n'ont pas
bougé d'un caractère — vingt-trois commentaires de `src/` et de `test/` les citent par
numéro, et le numérotage est donc une interface. Les §3, §4, §5 et §6 sont réécrits ; les
§7, §8 et §9 sont neufs. La source est `RELEVE-TA-REPARATION.md`, trente captures d'écran
dépouillées le 05/09.

Ce qui a changé, en trois lignes :

1. **Le point 7 est clos** — les barèmes, ouverts depuis le 24/08, sont mesurés.
2. **Une entité a deux prix, pas un** : son prix d'accueil au niveau 2, et le coefficient
   qui commande sa courbe au-dessus du niveau 11. Le dépôt n'en portait qu'un, et
   sous-prixait tout sauf le Chantier, jusqu'à 50 % en fin de partie.
3. **Il y a quatre réserves de temps, pas une.** Le §4 disait que les bâtiments puisaient
   dans celle de l'armée ; c'est faux, et ça ne l'était déjà plus depuis le lot RÉSERVE.

Le **point 6 reste ouvert** : la formule de dépassement du Complexe n'est montrée par
aucune des trente captures, et Ethan ne peut pas la provoquer en jeu.

---

## 1. Le plancher est à 1 PV, pas à 1 %

Le plat est meilleur que le pourcentage, et pour une raison mécanique : les dégâts sont
proportionnels aux PV restants. Une Casemate à 1 PV sur 350 tire à
`floor(15 × 1000 × 1000 / 350000) = 42` milli-PV par tir, soit 0,42 PV par seconde. À 1 % elle
en ferait cinq fois plus. À 1 PV, c'est un sac à points de vie, littéralement.

---

## 2. Qui plancher, qui meurt

Le plancher sépare **le renouvelable du définitif**. C'est lui qui décide de la géographie
économique du jeu.

| Objet | Plancher | Meurt vraiment |
|---|---|---|
| Bâtiments de la base du joueur, **sauf le central** | 1 PV | non |
| **Chantier de construction** — central du joueur | aucun | **oui** |
| Défenses du joueur | 1 PV | non |
| **Unités offensives du joueur** | 1 PV | non |
| Bâtiments d'une **base** de l'Ouvrage, **sauf la Souche** | 1 PV | non |
| **Souche** — central ennemi | aucun | **oui** |
| Défenses d'une **base** de l'Ouvrage | 1 PV | non |
| **Tout**, dans un camp ou un avant-poste | **aucun** | **oui, définitif** |

**Le central est la seule exception, et il faut qu'il le soit** : si tout planchait, le Chantier
ne tomberait jamais, la sanction la plus lourde du jeu ne se déclencherait pas ; et la Souche ne
tomberait jamais non plus, donc aucune base ne se raserait, donc la carte ne s'ouvrirait plus.

Chantier détruit → la base du joueur est rasée : tout est détruit définitivement, les ressources
stockées sont pillées, redéploiement 20 cases vers le bas.

**Camps et avant-postes ne planchent rien.** Ce qui y tombe est perdu pour toujours. Et si l'Étai
tombe pendant l'attaque, même les défenses survivantes et abîmées ne seront plus jamais réparées.
D'où l'arbitrage : abattre l'Étai à la première passe rend la seconde peu coûteuse.
**Objectif de calibrage : un camp ou un avant-poste se rase en deux passes.**

---

## 3. Réparation — trois régimes disjoints

| Ce qu'on répare | Ce qui commande le **temps** | Ce qui commande le **coût** | Ressource |
|---|---|---|---|
| Bâtiments de la base | niveau du **Chantier de construction** — plus haut, plus court | **niveau du bâtiment réparé**, et rien d'autre | quartz |
| Unités offensives | niveau de la **Caserne**, du **Dépôt de véhicules** ou de l'**Aérodrome**, selon le châssis | **niveau de l'unité**, et rien d'autre | scorie |
| Défenses | niveau du **Complexe de défense** | **gratuit** | — |

Le découpage des ressources tombe juste avec la spec §1 : le quartz répare les bâtiments, la
scorie répare les unités offensives, la défense n'est financée par rien.

Correspondance châssis → bâtiment de réparation : Escouade → Caserne · Blindé → **Dépôt de
véhicules** · Aéronef → Aérodrome. (Les clés sont `caserne`, `depotDeVehicules` et `aerodrome`
dans `src/data/base.js`.)

### Le barème du coût — mesuré le 05/09, point 7 clos

> **Réparation complète d'une unité = 5,1887 % du prix de son niveau.**
> **Réparation complète d'un bâtiment = prix de son niveau ÷ 230.**

⚠⚠ **LES DEUX SONT INDEXÉS SUR LE PRIX PAYÉ, PAS SUR LA COURBE DE RÉGIME**, et c'est le §7
ci-dessous qui rend la distinction possible. Les deux définitions donnent le même montant au
niveau 10 et au-delà ; elles divergent dans la zone d'accueil, et violemment. Un Fusilier de
niveau 2 coûte 1 à construire ; indexée sur le régime, sa réparation coûterait **43** —
quarante-trois fois son prix, la remise d'accueil annulée par la première réparation.

⚠ **`partDuCoutDeMontee` VALAIT 1, SOIT VINGT FOIS TROP.** Le champ vit dans
`data/sites.js` avec la mention « à arbitrer » depuis le 28/08. La mention doit partir en
même temps que la valeur change, sinon elle ment.

⚠ **LA RÉPARATION EST GRATUITE DANS LE BAS D'ÉCHELLE** — jusqu'au niveau 5, 6 pour la
classe la plus légère : le prix d'un palier y pèse moins d'une demi-unité de ressource. Ce
n'est pas un trou de génération et ça ne se corrige pas dans la table. Si un zéro affiché
gêne, c'est un choix d'écran. Le niveau 1 est gratuit à construire, donc gratuit à réparer.

⚠ **LE RAPPORT EST DE 10,4 ENTRE LES DEUX** — 5,19 % contre 0,43 %. C'est voulu : une unité
se répare à chaque raid, un bâtiment presque jamais.

### Le barème du temps

Les unités ne changent pas. La formule et les six bases de `data/combat.js` — 441 · 882 ·
972 · 1 458 · 1 070 · 1 605 — sont confirmées à la source, au caractère près :

```
T(L, C) = base_unité × 1,15^(L−1) / D(C)
D(C)    = 1,09^(min(C,12)−1) × 1,12^max(C−12, 0)
```

⚠ **`penteBasse = 1,09` EST DÉSORMAIS UNE MESURE, PLUS UNE TRANSCRIPTION.** Les Exosoldats
relevés à Caserne 10 puis à Caserne 12 donnent 11:56 → 10:03, rapport 1,1874, soit 1,09² à
un millième.

Les bâtiments prennent la même forme, avec **une pente propre** :

```
T(n, Chantier) = reparationSec × 1,1767^(n−1) / D(Chantier)
```

⚠ **1,1767 EST UNE CINQUIÈME PENTE.** Elle ne vaut ni 1,10 (les PV), ni 1,15 (la réparation
d'armée), ni 1,32 (les coûts), et elle ne repose que sur un couple — Collecteur 55 et 56. Le
diviseur `D` est celui de l'armée, repris **par analogie et sans preuve** : aucune capture ne
montre l'effet du Chantier sur le temps de réparation d'un bâtiment.

`reparationSec` ne bouge pas — 88 · 65 · 42, confirmés bâtiment par bâtiment par le §6.5 de
`RELEVE-TA-COURBES-2.md`, qui confirme au passage que la clé `raffinerie` désigne le Silo.

### Les bâtiments de l'Ouvrage se réparent seuls, en une heure

Sur une **base** ennemie, quoi qu'il arrive, tout est revenu au bout d'une heure. C'est pénalisant
pour le joueur : il a dépensé des raids, et s'il ne fait pas tomber la Souche dans la fenêtre,
**tout ce qu'il a cassé est perdu**. Une base se prend d'un coup ou pas du tout.

Le joueur, lui, n'a droit à aucun remboursement automatique : il paie ses réparations.
L'asymétrie est voulue.

### La défense, cas à part

Le Complexe de défense répare **tout**, **gratuitement**, **en une heure** — joueur comme Ouvrage.
Ce n'est plus 70 % des PV perdus : c'est la totalité.

Le temps ne descend **jamais sous une heure**, mais il peut être **supérieur** si le niveau des
unités en défense dépasse celui du Complexe.

C'est ce qui rend le Complexe intéressant. Le **QG de défense** fixe le plafond de niveau des
défenses ; rien n'empêche donc de monter des défenses au-delà du niveau du Complexe. On y gagne
en puissance, on y perd en disponibilité. Deux bâtiments, deux leviers, un vrai arbitrage.

⚠ **GARNISON ET ARMÉE SONT DEUX EFFECTIFS DISTINCTS**, et la même clé d'unité n'y désigne
pas la même pièce. Une pièce de garnison ne se répare jamais contre de la scorie, une unité
d'armée ne se répare jamais gratuitement. Il n'y a pas de cas mixte, donc pas de conflit
entre le barème ci-dessus et la gratuité de la défense — et `COUT_NIVEAU_DEUX_DEFENSE` n'est
touchée par rien de ce document.

---

## 4. Les réserves de temps de réparation — il y en a quatre

Le temps de réparation est une **grandeur qui s'accumule**, à la manière d'un idle, et que toute
réparation consomme.

| réservoir | ce qu'il paie | ce qui le produit |
|---|---|---|
| escouade | les unités d'assaut à châssis escouade | le temps qui passe |
| blindé | idem, châssis blindé | le temps qui passe |
| aéronef | idem, châssis aéronef | le temps qui passe |
| **base** | **les bâtiments** | **le Chantier de construction** |

⚠⚠ **LA VERSION DU 24/08 DISAIT QUE LES BÂTIMENTS ET LES UNITÉS PUISAIENT DANS LA MÊME
RÉSERVE. C'EST FAUX**, et `MODELE-ECONOMIQUE.md` §7 disait déjà « quatre réservoirs —
infanterie, véhicules, aviation, base » sans que personne ne rapproche les deux documents.

La quatrième réserve vient d'une observation directe : dans Tiberium Alliances, le mode
réparation **remplace les compteurs de ressources de la barre du haut** par une réserve de
temps — relevée à `3j 22:01:08` sur une capture et `2j 10:31:41` sur une autre —, et la
description du Chantier de construction dit « Régénération du temps de réparation de votre
base ». Le bouton « Réparer tout » demande alors deux choses, une ressource **et** du temps,
et c'est le temps qui manque, affiché en rouge.

⚠ **LE COÛT EN RESSOURCE EST NÉGLIGEABLE, ET C'EST LE FAIT DE CONCEPTION LE PLUS UTILE DU
RELEVÉ.** 0,43 % d'un palier pour un bâtiment. La monnaie de la réparation n'est pas la
ressource, c'est le temps.

Les trois réserves d'armée gardent leurs règles du 01/09, arbitrées et implémentées le même
jour au lot RÉSERVE :

- **Compteur interne**, pas une quatrième ressource. Il ne s'affiche que dans l'onglet armée,
  jamais dans le bandeau de stocks.
- **Taux : 1 pour 1.** Une seconde écoulée crédite une seconde. Le niveau du bâtiment
  réparateur **ne crédite rien** — il décote le coût, par `diviseurDuBatiment`, et c'est son
  seul effet.
- **Plafond : 12 h, plus 1 h par niveau d'armée.** Les deux nombres vivent dans `REPARATION`
  de `src/data/sites.js`. ⚠ `niveauDeLArmee` rend des **dixièmes** : la division par dix se
  fait chez l'appelant.
- ⚠ **LA RÉSERVE EST PAR BASE, pas par joueur.** Elle vit sur `etat` tant que
  `basesDuJoueur` rend `[etat]`.
- ⚠ **RÉPARER EST INSTANTANÉ** : débit du temps, débit de la ressource et retour des PV dans
  le même appel.

⚠ **LE PLAFOND ET LE TAUX DE LA QUATRIÈME RÉSERVE NE SONT PAS ARBITRÉS.** TA en montre une à
~94 h pour un niveau de base de 53,68 ; la règle des trois autres en donnerait 65. Les deux
systèmes ne se recouvrent pas et rien n'oblige à transposer.

**La défense reste hors réserve** — gratuite, sur l'horloge du Complexe.

---

## 5. Ce que ça remplace

| Endroit | Ancien | Nouveau |
|---|---|---|
| SPEC §1 | « seule joue la réparation gratuite de 70 % assurée par le complexe » | 100 %, en une heure |
| SPEC §2 | constante « Réparation gratuite après raid : 70 % des PV perdus, au prorata des PV du complexe » | supprimée |
| SPEC §2 | constante « Plancher de PV des défenseurs : 1 % » | plancher à **1 PV**, et seulement sur base et joueur |
| SPEC §10 | « Bâtiment détruit : réparé en 1 h » (base) | inchangé, mais gratuit **pour l'Ouvrage seulement** |
| §4 de ce document, version du 24/08 | « les bâtiments et les unités puisent dans la même réserve » | **quatre réserves**, la quatrième produite par le Chantier |
| `data/sites.js` | `partDuCoutDeMontee: 1` | **5,1887 %** |
| `data/base.js` | `REPARATION_BASE_JOUEUR.courbe: null` | la courbe du §3 |
| `data/base.js` | `COUT_ELECTRICITE.fraction`, une fraction | **une seconde ancre**, §8 |
| `data/couts-militaires.js` | `COUT_NIVEAU_DEUX_OFFENSE.meute: 2` | **1** |

Rappel : rien de tout ça n'entre dans le moteur de combat. Le lot 2A détruit à 0 et rapporte les
PV bruts. Planchers et réparations sont une **écriture d'après-raid**.

---

## 6. Ce qui reste ouvert

1. ~~Les PV ne montent pas avec le niveau.~~ **Clos le 24/08.**
2. ~~**La base du joueur** : sept bâtiments nommés, onze attendus.~~ **Clos le 25/08** :
   `src/data/base.js` porte les onze. ⚠ `BASE-DU-JOUEUR-1.md` est resté à l'état du 24/08 et
   annonce encore sept sur onze : c'est `base.js` qui fait foi.
3. ~~**Deux bâtiments sans nom Foyer Zéro**.~~ **Clos le 26/08** : le central est le **Chantier
   de construction** (Souche côté Ouvrage) et le bâtiment des blindés le **Dépôt de véhicules**.
4. ~~**La réserve de temps** : quatrième grandeur ou compteur interne ?~~ **Clos le 01/09**,
   complété le 05/09 par la quatrième réserve. Voir §4.
5. ~~Un Complexe endommagé répare-t-il moins ?~~ **Clos le 24/08** : oui, au prorata de ses PV —
   mais **il se répare lui-même**, donc son débit s'accélère au fil de l'heure et le site revient
   entier malgré tout.
6. **Formule du dépassement** : de combien le temps de réparation dépasse-t-il l'heure quand les
   défenses sont au-dessus du Complexe ? ⚠ **TOUJOURS OUVERT AU 05/09.** Aucune des trente
   captures ne le montre, et Ethan ne peut pas le provoquer en jeu. C'est tout l'arbitrage
   « puissance contre disponibilité » entre le QG de défense et le Complexe.
7. ~~**Barèmes** : coût et temps de réparation par niveau.~~ **Clos le 05/09**, voir §3.
8. **Le plafond de la quatrième réserve**, celle des bâtiments. Voir §4.
9. **L'anomalie du Collecteur** : il se répare pour 1/153,6 d'un palier là où l'Accumulateur
   et la Centrale donnent 1/230,3 — un rapport de 1,4993, soit trois demis. Deux pistes
   falsifiées : ce ne sont pas les PV, ce n'est pas l'électricité. Abandonnée sur arbitrage
   d'Ethan du 05/09 — on prend l'échelle des coefficients, et seulement elle.

---

## 7. Deux tables, et une seule forme de rampe

⚠⚠ **LE PRIX D'ACCUEIL ET LE COEFFICIENT DE RÉGIME SONT DEUX OBJETS DIFFÉRENTS.**
`RELEVE-TA-COURBES-2.md` §0 le disait sans qu'on en tire la conséquence : « passer la Caserne
de 1 à 2 coûte 5 unités de tibérium là où la courbe extrapolée en réclamerait 8 966 ; tout ce
qui précède le niveau 11 relève de l'accueil du joueur et ne se modélise pas ».

Les dix premiers niveaux sont une **remise pédagogique posée à la main**. Le régime commence
au niveau 12 et monte de 1,32. Une entité a donc deux nombres, et ils ne coïncident que pour
le Chantier de construction — le seul bâtiment sur lequel la rampe `ratios` d'`economie.js` a
été calée.

```
facteur  = (coefficient / ancre d'accueil)^(1/10)
prix(n)  = ancre d'accueil × PROFIL(n) × facteur^(n−2)   pour 2 ≤ n ≤ 11
prix(n)  = coefficient × 24 000 × 1,32^(n−12)            pour n ≥ 12
```

⚠ **LA ZONE D'ACCUEIL VA JUSQU'AU NIVEAU 11, PAS 10.** Le régime commence au 12 parce que
c'est là que le relevé pose ses deux mesures : 144 000 pour la Caserne et 96 000 pour
l'Exosoldat, tous deux égaux à coefficient × 24 000.

⚠ **LE CHANTIER A UN FACTEUR DE 1**, donc sa rampe est restituée à l'identique et la table de
référence 8 · 10 · 20 · 80 · 440 · 1 440 · 4 400 · 12 800 · 35 200 · 89 600 · 192 000 survit
intacte. C'est la vérification qui doit passer avant toute autre.

### Bâtiments

| bâtiment | accueil | coefficient | facteur | source |
|---|---|---|---|---|
| `chantierDeConstruction` | 8 | 8 | 1,00000 | mesuré |
| `centreDeCommandement` | 8 | 8 | 1,00000 | mesuré |
| `qgDeDefense` | 8 | 8 | 1,00000 | **arbitré 05/09** |
| `complexeDeDefense` | 5 | 5 | 1,00000 | **arbitré 05/09** |
| `caserne` | 5 | 6 | 1,01840 | mesuré deux fois |
| `depotDeVehicules` | 5 | 6 | 1,01840 | mesuré |
| `aerodrome` | 5 | 6 | 1,01840 | mesuré |
| `centrale` | 3 | 5,2 | 1,05655 | mesuré |
| `collecteur` | 3 | 2 | 0,96026 | mesuré |
| `raffinerie` | 2 | 2 | 1,00000 | mesuré |
| `accumulateur` | 2 | 2 | 1,00000 | mesuré |

⚠ **LA CASERNE EST CONFIRMÉE DEUX FOIS, PAR DEUX CHEMINS INDÉPENDANTS.** Le panneau
d'optimisation au niveau 45 rend 5,997 ; `RELEVE-TA-COURBES-2.md` §5, écrit avant les
captures, donne 144 000 au palier 11, soit exactement 6.

⚠ **`classeDeCout` NE SUFFIT PLUS.** Les quatre classes 8 · 5 · 3 · 2 restent l'ancre
d'accueil, mais le coefficient ne s'en déduit pas : la Centrale et le Collecteur sont tous
deux `modeste`, et leurs coefficients diffèrent d'un facteur 2,6.

### Unités d'assaut

Le coefficient vaut **exactement le double** de l'ancre d'accueil, pour les quatorze. Le
facteur de redressement est donc le même partout : **2^(1/10) = 1,071773**.

| clé | accueil | coefficient | | clé | accueil | coefficient |
|---|---|---|---|---|---|---|
| `meute` | **1** | 2 | | `busard` | 4,8 | 9,6 |
| `perceurs` | 1,6 | 3,2 | | `guetteur` | 5 | 10 |
| `carapace` | 2 | 4 | | `frappeur` | 5,6 | 11,2 |
| `ratisseur` | 3,2 | 6,4 | | `fouisseurs` | 8 | 16 |
| `belier` | 3,6 | 7,2 | | `pilon` | 9 | 18 |
| `fendeur` | 4 | 8 | | `broyeur` | 12 | 24 |
| `crecelle` | 4,4 | 8,8 | | `enclume` | 12 | 24 |

⚠⚠ **`meute` PASSE DE 2 À 1.** La table du 28/08 portait un plancher, vraisemblablement pour
ne pas écrire un prix de 1. Le rapport coefficient/ancre vaut **exactement 2,000** pour les
sept unités dont l'ancre dictée était déjà juste ; les six autres écarts sont précisément les
six ancres qu'on savait arrondies ; l'Escadron de tireurs est le seul à rendre 1,000. Ethan
l'a repéré par le raisonnement de jeu : « le fusilier coûte moins que l'exosoldat, quoi
qu'il arrive ».

⚠ **DIVERGENCE NOTÉE, NON POURSUIVIE.** `RELEVE-TA-COURBES-2.md` §5 annonce une marche de
×1,794 entre les niveaux 10 et 11 pour les unités ; le montage ci-dessus rend 2,06 à 2,30
selon l'entité, et sous aucun alignement d'index la rampe partagée ne rend 1,794. Soit les
unités ont leur propre forme de bas d'échelle, soit la phrase est approximative. Ça ne touche
rien au-dessus du niveau 11.

⚠ **`MODELE-ECONOMIQUE.md` §2 PORTE UNE TROISIÈME COURBE DE COÛT** — `R1c = 2,40`,
`R∞c = 1,70` —, qui n'est ni la rampe d'accueil ni le régime. Elle date d'avant le relevé de
TA. Ce document ne la touche pas ; elle reste à réconcilier ou à retirer.

---

## 8. L'électricité a sa propre ancre

Ce n'est pas une fraction du prix principal. Les sept mesures rendent des multiples exacts de
0,5 ; les fractions, elles, ne sont pas rondes.

| | tibérium | électricité |
|---|---|---|
| `chantierDeConstruction` · `centreDeCommandement` | 8 | 2 |
| `qgDeDefense` | 8 | 2 *(défaut, non mesuré)* |
| `complexeDeDefense` | 5 | 1,25 *(défaut, non mesuré)* |
| `caserne` · `depotDeVehicules` · `aerodrome` | 6 | 1,5 |
| `collecteur` | 2 | 1,5 |
| `raffinerie` · `accumulateur` | 2 | 0,5 |
| `centrale` | 5,2 | 0,5 |

`COUT_ELECTRICITE.fraction` vaut `{ centrale: 0.1, collecteur: 0.5, autres: 0.25 }`. Mesuré :
`autres` tombe à **0,2500** sur quatre bâtiments, mais le Collecteur donne **0,7503** et la
Centrale **0,0962** — qui n'est autre que 0,5 / 5,2. Le quart n'était pas une règle : c'était
le rapport commun aux quatre bâtiments les plus visibles.

---

## 9. Comment le jeu lit tout ça

⚠⚠ **SUBSTITUER LES ANCRES SANS TOUCHER À LA RAMPE DONNERAIT UNE TABLE JUSTE ET UN JEU
FAUX.** `montantDuPalier` arrondit à chaque palier et les arrondis se composent. Mesuré : les
ancres 3,2 · 3,6 · 4,8 rendent des rampes **identiques à aujourd'hui dès le niveau 3** —
l'arrondi avale la fraction —, et l'ancre 1 rend au niveau 10 le **tiers** de l'ancre 2 là où
le relevé dit la **moitié**.

**Arbitré le 05/09 : on pré-calcule tout en exact et le jeu lit des entiers.** Un seul
arrondi, appliqué au produit exact, niveau par niveau, du 2 au 50.

Deux vérifications ferment le point :

1. **La rampe de référence est restituée à l'identique** — 8 · 10 · 20 · 80 · 440 · 1 440 ·
   4 400 · 12 800 · 35 200 · 89 600 · 192 000.
2. **Les proportions sont exactes du niveau 5 au niveau 50.** Aux niveaux 2, 3 et 4 elles
   restent fausses jusqu'à 25 %, et c'est irréductible : on ne sait pas facturer 1,25 scorie.

⚠ **LE COMMENTAIRE D'`economie.js` SUR L'ARRONDI EST FAUX** : il affirme qu'un arrondi unique
« ferait diverger la chaîne dès le sixième palier ». L'erreur flottante vaut 1e-10 et
`Math.round` l'absorbe. À réécrire.

⚠ **LE CHANGEMENT NE TOUCHE PAS QUE L'OFFENSE.** Sur les ancres entières, la rampe tabulée
diffère de la rampe actuelle sur **474 paliers sur 539**. Défense et bâtiments sont donc
retabulés eux aussi, pour qu'il n'y ait qu'une règle d'arrondi dans le jeu. Un seul test fige
une rampe, celle de l'ancre 8, et elle survit intacte.
