# RELEVÉ — coûts, réparation et courbes d'accueil dans *Tiberium Alliances*

Mesuré le **05/09/2026** sur **trente captures d'écran** fournies par Ethan : la base
*Epsilon* (niveau de base 53,68, toutes au même horodatage de jeu 05/09/2026 10:30:26)
et l'écran d'armée *Mu Off* (niveau d'attaque 13,25).

**Aucune valeur de ce document n'est recopiée d'une source secondaire.** Chaque nombre est
lu sur une infobulle ou sur un panneau, et chaque rapport est calculé.

Ce relevé **complète** `RELEVE-TA-COURBES-2.md`. Les arbitrages qu'il a déclenchés sont
écrits dans `MODELE-REPARATION-1.md`, réécrit en place le même jour : il y ferme le point 7,
les barèmes, ouvert depuis le 24/08, et laisse le point 6 entier.

---

## 1. Le fait qui organise tout le reste

⚠⚠ **LE PRIX D'ACCUEIL ET LE COEFFICIENT DE RÉGIME SONT DEUX OBJETS DIFFÉRENTS, ET LE
DÉPÔT N'EN PORTAIT QU'UN.** `RELEVE-TA-COURBES-2.md` §0 le disait déjà sans qu'on en tire
la conséquence : « passer la Caserne de 1 à 2 coûte 5 unités de tibérium là où la courbe
extrapolée en réclamerait 8 966 ; tout ce qui précède le niveau 11 relève de l'accueil du
joueur et ne se modélise pas ».

Les prix des dix premiers niveaux sont une **remise pédagogique posée à la main**. Le
régime, lui, commence au niveau 12 et monte de 1,32. Une entité a donc **deux nombres** :
son prix au niveau 2, et le coefficient qui commande sa courbe haute. Ils ne coïncident que
pour le Chantier de construction — le seul bâtiment sur lequel la rampe `ratios`
d'`economie.js` a été calée.

**Conséquence, mesurée : toutes les autres entités étaient mal prixées en fin de partie,
jusqu'à 50 %.**

---

## 2. Les coefficients de régime des bâtiments

Lus sur les panneaux d'optimisation, divisés par le profil de la courbe au niveau atteint.

| bâtiment | niveau | coût lu | coefficient | prix niv. 2 au dépôt |
|---|---|---|---|---|
| Chantier de construction | 40 | 602,4 M | **7,999** | 8 ✓ |
| Centre de commandement | 50 | 9,675 G | **7,999** | 8 ✓ |
| Silo *(clé `raffinerie`)* | 56 | 12,79 G | **1,999** | 2 ✓ |
| Accumulateur | 62 | 67,68 G | **2,000** | 2 ✓ |
| Caserne · Usine · Aérodrome | 45 | 1,81 G | **5,997** | 5 |
| Collecteur | 56 | 12,79 G | **1,999** | 3 |
| Centrale | 41 | 516,9 M | **5,200** | 3 |

⚠ **LA CASERNE EST CONFIRMÉE DEUX FOIS, PAR DEUX CHEMINS INDÉPENDANTS.**
`RELEVE-TA-COURBES-2.md` §5 donne « Caserne, tibérium, coût au palier 11 : 144 000 ».
Palier 11 = prix pour atteindre le niveau 12 = coefficient × 24 000, donc **144 000 /
24 000 = 6,000** — le même nombre que les captures, dans un document écrit avant elles.

⚠ **CE QUI N'EST PAS MESURÉ EST ARBITRÉ, ET IL FAUT QUE ÇA SE VOIE** : le **QG de
défense** prend le coefficient **8** et le **Complexe de défense** le coefficient **5**,
dictés par Ethan le 05/09. Aucune capture ne les montre.

---

## 3. Les quatorze unités d'assaut

Toutes au niveau 10, Caserne · Usine · Aérodrome au niveau 10. Seule l'Équipe de snipers
exige la Caserne 12 et y a été mesurée.

| Tiberium Alliances | clé | coût de réparation | temps | ancre d'accueil | coefficient |
|---|---|---|---|---|---|
| Escadron de tireurs | `meute` | 398 | 11:56 | 1 | 2 |
| Escadron lance-missiles | `perceurs` | 636 | 11:56 | 1,6 | 3,2 |
| Exosoldats | `carapace` | 795 | 11:56 | 2 | 4 |
| Gardien | `ratisseur` | 1 272 | 26:16 | 3,2 | 6,4 |
| Pitbull | `belier` | 1 431 | 26:16 | 3,6 | 7,2 |
| Predator | `fendeur` | 1 590 | 26:16 | 4 | 8 |
| Orca | `crecelle` | 1 749 | 28:54 | 4,4 | 8,8 |
| Paladin | `busard` | 1 908 | 28:54 | 4,8 | 9,6 |
| Équipe de snipers | `guetteur` | 1 988 | 20:06 *(Caserne 12)* | 5 | 10 |
| Firehawk | `frappeur` | 2 226 | 28:54 | 5,6 | 11,2 |
| Commando | `fouisseurs` | 3 180 | 23:52 | 8 | 16 |
| Juggernaut | `pilon` | 3 578 | 39:24 | 9 | 18 |
| Mammouth | `broyeur` | 4 770 | 39:24 | 12 | 24 |
| Kodiak | `enclume` | 4 770 | 43:20 | 12 | 24 |

**Les quatorze coûts valent exactement 397,5 × l'ancre d'accueil.** 2 × 397,5 = 795 ·
3,2 × 397,5 = 1 272 · 5,6 × 397,5 = 2 226 · 12 × 397,5 = 4 770. Aucune exception.

⚠ **C'EST CETTE EXACTITUDE QUI PROUVE QUE LES UNITÉS ÉTAIENT INTÉGRALEMENT DÉTRUITES**,
donc que ces coûts sont des réparations COMPLÈTES et non des fractions d'avarie. Une avarie
partielle aurait dispersé les rapports.

### Le coefficient d'une unité vaut exactement le double de son accueil

`RELEVE-TA-COURBES-2.md` §5 donne un seul point absolu : « Exosoldat, cristaux, coût au
palier 11 : 96 000 », soit un coefficient de **4** pour une ancre d'accueil de 2. Rapporté
à la table dictée le 28/08 :

| rapport coefficient / ancre dictée | unités |
|---|---|
| **exactement 2,000** | Exosoldat · Predator · Sniper · Commando · Juggernaut · Mammouth · Kodiak |
| 1,600 · 2,133 · 1,800 · 2,200 · 1,920 · 1,867 | les six dont l'ancre dictée était arrondie |
| **1,000** | l'Escadron de tireurs |

Les six écarts sont **précisément** les six ancres qu'on savait arrondies. Le facteur est
donc 2 partout, et le seul vrai défaut est l'Escadron de tireurs :

⚠⚠ **L'ESCADRON DE TIREURS COÛTE 1 AU NIVEAU 2, PAS 2.** La table du 28/08 portait un
plancher — vraisemblablement pour ne pas écrire un prix de 1. Ethan l'a repéré le 05/09 par
le raisonnement de jeu : « le fusilier coûte moins que l'exosoldat, quoi qu'il arrive ».

---

## 4. Les temps de réparation : le dépôt avait raison, sans réserve

`RELEVE-TA-COURBES-2.md` §6 donne les six bases lues directement à bâtiment producteur
niveau 1 — Rifleman **7:21 = 441** · Sniper **14:42 = 882** · Pitbull **16:12 = 972** ·
Mammoth **24:18 = 1 458** · Orca **17:50 = 1 070** · Kodiak **26:45 = 1 605**. Ce sont les
six valeurs de `data/combat.js`, au caractère près. **Rien à toucher.**

§6.5 donne de même les bases des bâtiments : Construction Yard · Barracks · Factory ·
Airfield · Command Center · Defense HQ · Defense Facility **1:28 = 88 s** · Power Plant ·
Harvester **1:05 = 65 s** · Silo · Accumulator **0:42 = 42 s**. Ce sont les trois valeurs de
`reparationSec` de `data/base.js`, bâtiment par bâtiment — et ça confirme au passage que la
clé `raffinerie` désigne bien le Silo.

### La falsification de la pente basse

⚠⚠ **LES EXOSOLDATS SONT MESURÉS DEUX FOIS, ET C'EST LA MEILLEURE PREUVE DU LOT.**
**11:56 à Caserne 10, 10:03 à Caserne 12.** Rapport 716 / 603 = **1,1874**, soit 1,09² à un
millième. `diviseurBatiment.penteBasse = 1.09` cesse d'être une transcription pour devenir
une mesure.

Corollaire qui ferme la cohérence : à Caserne 12, le 20:06 du sniper remonte à 1 432 s —
exactement le Commando. Les deux unités partagent leur base de 882 s.

---

## 5. Le coût d'une réparation

### Bâtiments

| bâtiment | réparation | prix du niveau atteint | rapport |
|---|---|---|---|
| Accumulateur 62 | 222,7 M | 51,27 G | **1 / 230,3** |
| Centrale 48 | 11,87 M | 2,734 G | **1 / 230,4** |
| Collecteur 56 | 63,12 M | 9,689 G | 1 / 153,6 |

Deux bâtiments, deux coefficients différents, **le même rapport à 0,1 % près**.

⚠ **L'ANOMALIE DU COLLECTEUR N'EST PAS EXPLIQUÉE, ET ELLE EST ABANDONNÉE.** Elle vaut
exactement 1,4993, soit trois demis. Deux pistes ont été essayées et **falsifiées** :
ce n'est pas les PV — le rapport réparation/PV va de 0,57 pour le Fusilier à 4,05 pour le
Firehawk —, et ce n'est pas l'électricité : indexer sur tibérium + électricité rend
1/287,8 · 1/252,5 · 1/268,8, ce qui casse l'accord parfait des deux premiers sans rattraper
le troisième. Reste une hypothèse non testable ici : les Collecteurs auraient subi une
avarie différente, auquel cas le 230 n'est qu'une borne basse. Arbitrage d'Ethan le 05/09 :
on prend l'échelle des coefficients, et seulement elle.

### La pente

Le couple Collecteur 55 / 56 est le seul écart d'un niveau disponible, et Ethan a confirmé
le 05/09 que les Collecteurs vert et bleu sont le même bâtiment :

- **coût** : 63,12 / 47,82 = **1,3199** — c'est `penteStable` au millième ;
- **temps** : 42 445 / 36 071 = **1,176707**.

⚠⚠ **LE TEMPS ET LE COÛT NE MONTENT PAS À LA MÊME VITESSE.** 1,1767 ne vaut ni 1,10 (les
PV), ni 1,15 (la réparation d'armée), ni 1,32 (les coûts). C'est une **cinquième pente**, et
rien dans le dépôt ne la portait. Elle repose sur un seul couple.

### Unités

Un seul niveau est mesuré, le 10, et il tombe dans la **zone d'accueil**. Les deux
définitions possibles y donnent exactement le même montant :

| | part du prix payé | part de la courbe de régime |
|---|---|---|
| Fusilier · Exosoldat · Kodiak | **5,1887 %** | 1,4429 % |

Aucune mesure ne les départage. **Ce qui les départage est le bas d'échelle** : un Fusilier
de niveau 2 coûte 1 à construire, et se réparerait pour **43** si on indexait sur le régime
— quarante-trois fois son prix, la remise d'accueil annulée par la première réparation.
Arbitré le 05/09 : **on indexe sur le prix payé.**

> **Réparation complète d'une unité = 5,1887 % du prix de son niveau.**
> **Réparation complète d'un bâtiment = prix de son niveau ÷ 230.**

---

## 6. L'électricité est une seconde ancre, pas une fraction

`COUT_ELECTRICITE.fraction` vaut `{ centrale: 0.1, collecteur: 0.5, autres: 0.25 }`.
Mesuré sur les sept panneaux d'optimisation : `autres` tombe à **0,2500** sur quatre
bâtiments, mais le Collecteur donne **0,7503** et la Centrale **0,0962**.

Ces deux-là ne sont pas des ratios ronds — ce sont des ancres propres divisées par l'ancre
tibérium :

| | tibérium | électricité |
|---|---|---|
| Chantier · Centre de commandement | 8 | **2** |
| Caserne · Usine · Aérodrome | 6 | **1,5** |
| Collecteur | 2 | **1,5** |
| Silo · Accumulateur | 2 | **0,5** |
| Centrale | 5,2 | **0,5** |

Sept bâtiments, sept multiples exacts de 0,5. La Centrale à 0,0962 est simplement 0,5 / 5,2.
Le quart n'était pas une règle : c'était une coïncidence sur les quatre bâtiments qui
partagent le rapport 1/4. Le QG et le Complexe de défense n'ont pas de mesure ; ils prennent
le quart par défaut, soit 2 et 1,25.

---

## 7. Divergences connues, non résolues

⚠ **LA MARCHE DE ×1,794.** `RELEVE-TA-COURBES-2.md` §5 dit que « de 10 à 11 le coût d'une
unité fait ×1,794, puis ×1,32 jusqu'au bout ». Le montage retenu — rampe du Chantier
redressée par entité — rend une marche de 2,06 à 2,30 selon l'entité, jamais 1,794. La
retrouver exigerait de refaire la forme de toute la rampe des unités sur la foi d'une seule
phrase, qui contredit par ailleurs les deux points mesurés (prix au niveau 2 et coefficient
au niveau 12). **Divergence notée, non poursuivie**, arbitrage d'Ethan du 05/09.

⚠ **LE COMMENTAIRE D'`economie.js` SUR L'ARRONDI EST FAUX.** Il affirme qu'un arrondi
unique en sortie « ferait diverger la chaîne dès le sixième palier ». Mesuré : l'erreur
flottante vaut 1e-10, `Math.round` l'absorbe, et la rampe de référence est restituée à
l'identique — 8 · 10 · 20 · 80 · 440 · 1 440 · 4 400 · 12 800 · 35 200 · 89 600 · 192 000.

⚠ **LE DIVISEUR DU CHANTIER SUR LE TEMPS DE RÉPARATION DES BÂTIMENTS N'EST PAS MESURÉ.**
Le `1,09 / 1,12` de l'armée est repris par analogie, sans preuve.

⚠ **LA FORMULE DE DÉPASSEMENT DU COMPLEXE** — de combien l'heure s'allonge quand les
défenses dépassent son niveau — n'est montrée par aucune des trente captures. Point 6 de
`MODELE-REPARATION-1.md`, toujours ouvert.
