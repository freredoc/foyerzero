# RAPPORT — lot NOMBRES-COMPACTS

**Version 0.99.20 · build 121.** Branche `claude/lot-pictogrammes`, poussée dans
la PR **#106**. Non mergée.

Ethan, 07/09 : **« dès qu'un nombre est supérieur à dix mille, il faudrait
l'afficher avec trois chiffres et k pour mille, m pour million, g pour milliard,
et t pour mille milliards. Avec deux ou trois chiffres, c'est-à-dire soit un
chiffre, puis virgule, puis deux chiffres, soit deux chiffres puis une virgule,
soit trois chiffres. »**

---

## 1. La règle, telle qu'elle est appliquée

**Trois chiffres significatifs, toujours**, à partir de **10 000** :

| valeur | écriture | forme |
|---:|---|---|
| 9 999 | `9 999` | inchangée, groupée |
| 10 000 | **`10,0k`** | deux chiffres, virgule, un chiffre |
| 12 345 | **`12,3k`** | idem |
| 100 000 | **`100k`** | trois chiffres |
| 999 999 | **`999k`** | trois chiffres |
| 1 000 000 | **`1,00M`** | un chiffre, virgule, deux chiffres |
| 2 500 000 000 | **`2,50G`** | idem |
| 1 000 000 000 000 | **`1,00T`** | idem |

⚠ **« SUPÉRIEUR À DIX MILLE » SE LIT « À PARTIR DE DIX MILLE ».** Une borne doit
tomber d'un côté ; 10 000 rend « 10,0k », qui est très exactement la forme
décrite.

⚠⚠ **ELLE TRONQUE, ELLE N'ARRONDIT PAS.** C'est la règle du dépôt, écrite deux
fois avant ce lot : « afficher 1 quand le stock vaut 999 milli ferait croire au
joueur qu'il peut dépenser une unité qu'il n'a pas » (`formaterUnites`), et « le
compteur doit dire ce qui est DÉPENSABLE, jamais un point de plus »
(`formaterPoints`). Arrondir ferait écrire « 1,00M » à 999 999 points,
c'est-à-dire promettre un achat que le moteur refuserait. **Conséquence voulue :
999 999 rend « 999k », et reste à trois chiffres.**

---

## 2. Deux décisions que la dictée ne tranchait pas

⚠⚠ **`M`, `G` ET `T` SONT EN CAPITALES.** Tu les as nommés à l'oral — « k, m, g,
t » — où la casse ne se dit pas. En notation SI, **`m` est le préfixe de MILLI** :
« 10,0m » se lirait « dix millièmes » là où on veut dire « dix millions », soit
un facteur d'un milliard, **dans le mauvais sens**. `k` reste minuscule, comme en
SI. **C'est un seul caractère à changer** dans `PALIERS` de
`src/render/nombre.js` si tu préfères l'oral à la norme.

⚠ **AU-DELÀ DE MILLE MILLIARDS, LA MANTISSE GROSSIT** — « 1 200T » — plutôt que
de prendre un cinquième palier que tu n'as pas nommé. Mesuré : le prix le plus
cher de `ARBRE_RECHERCHE` vaut **2 500 000 000**, soit « 2,50G ». On est loin du
cas, et le jour où il arrivera la sortie restera lisible au lieu de lever.

---

## 3. Où la règle vit, et pourquoi là

⚠⚠ **UNE SEULE ÉCRITURE, DANS `src/render/nombre.js`, PARCE QUE DEUX COUCHES EN
ONT BESOIN.** `ui/chantier.js` formate les stocks, les débits, les capacités, les
coûts et les points engagés ; `sim/recherche.js` formate les points de recherche
et **ne peut pas importer d'`ui/`**. `src/data/` est réservé aux valeurs de
calibrage — « RIEN d'autre n'a le droit d'en porter » (§2). Reste `render/`, qui
rend des primitives sans toucher au DOM, et où `sim/poi.js` puise déjà.

⚠⚠ **ELLE TRAVAILLE SUR LES CHIFFRES, PAS SUR UN NOMBRE.** L'un lui passe un
`number` déjà tronqué, l'autre un `bigint` qui **dépasse l'entier sûr** — et le
dépôt portait DÉJÀ deux fonctions de groupement pour cette raison exacte, avec un
paragraphe expliquant qu'elles ne peuvent pas fusionner. `compacter` ne divise
jamais : elle **coupe une chaîne de chiffres**, donc elle ne perd rien, quelle que
soit la taille. C'est ce qui la rend partageable là où le groupement ne l'était
pas.

**Ce qui suit la règle, d'un coup :** tous les stocks et capacités du bandeau et
des fiches, les débits horaires, les coûts d'amélioration et de démolition, les
points engagés, les prix de l'arbre de recherche, le compteur de points, et les
messages de refus du moteur — « il manque 300k points ».

⚠ **`formaterDixiemes` NE L'HÉRITE PAS, ET LA GARDE EST STRUCTURELLE.** Elle
compose sa PROPRE virgule décimale : un entier compacté rendrait « 12,3k,4 »,
c'est-à-dire deux virgules dans un nombre. Elle appelle le groupement
directement. Les niveaux plafonnent à 50 et ne peuvent pas atteindre le seuil
aujourd'hui — la garde s'écrit maintenant, pas le jour où un compteur en
dixièmes le franchira.

⚠ **LE BANC D'ESSAI GARDE SES CHIFFRES EXACTS.** `formaterPv` et
`formaterPointsMilli` d'`ui/banc.js` rendent des PV au dixième et des points au
millième : c'est de la précision de **diagnostic**, derrière un geste de debug,
et la compacter reviendrait à casser l'outil qui sert à vérifier les autres.

---

## 4. Le poids

| poste | avant | après | delta |
|---|---:|---:|---:|
| **total** | 8 254 664 | **8 255 283** | **+619** |
| JavaScript | 365 542 | 366 161 | **+619** |
| feuille · balisage · images · audio | — | — | **+0** |
| lignes `data:` | 297 | 297 | +0 |
| URI `data:` | 292 | 292 | +0 |

La somme des cinq postes tombe **exactement** sur le total. Marge sur la borne
T10 : **1 044 717 octets, 11,23 %**. La borne ne bouge pas.

---

## 5. Les tests

**`NBR T1`** couvre les trois formes, les quatre paliers, le signe, la troncature
et les suffixes. Il est **falsifiable de trois façons** :

- il balaie **six valeurs sur les quatre paliers** et exige que chacune rende
  **exactement trois chiffres** — sans quoi les égalités pourraient toutes tomber
  juste sur un formateur qui en rendrait quatre ailleurs ;
- il asserte la **troncature sur une borne** — 999 999 → « 999k », 1 999 999 →
  « 1,99M » — là où arrondir changerait la sortie ;
- il asserte la **liste des suffixes**, pour que la décision de casse du §2 ne
  puisse pas se défaire en silence.

Le test de groupement d'origine reste, et ne mesure plus que **sous** le seuil —
il le dit, et il vérifie les deux côtés de la borne : 9 999 groupé, 10 000
compact.

**Cinq tests ont changé de valeur attendue, aucun ne s'est assoupli** :

| test | avant | après |
|---|---|---|
| `chantier — les milliers se groupent` | `45 738 385` | `45,7M`, plus les deux côtés de la borne |
| `T9 — deux branches, deux prix` | « il manque 300 000 points » | « il manque 300k points » |
| `T15 — ce qui est acquis se dit` | `/120 000 000/` | `/120M/` |
| `T15 — toucher un AUTRE bouton` | `200 000` | `200k` |
| `T15 — l'onglet Spécial` | `2 000 000` | `2,00M` |

⚠⚠ **ET UN SIXIÈME A DÛ ÊTRE REFAIT, PAS SEULEMENT RÉÉCRIT.** Le montage qui
prouvait la troncature du compteur de recherche — « arrondir au point supérieur
ferait annoncer 1 234 568 points dépensables » — devient **muet** en forme
compacte : à 1,23M, arrondir rend « 1,23M » aussi. Il est refait sur le passage
de **k à M**, où la différence se voit : 999 999,999 points s'écrivent « 999k »
tronqués et « 1,00M » arrondis.

**`npm run check` : 1324 pass / 0 fail.** +1 test.

---

## 6. Le rendu

⚠ **VU DANS UN NAVIGATEUR, EN 375 × 812, PAS SUR L'APPAREIL.** L'écran Recherche
lit maintenant **« 10,0M »**, **« 60,0M »**, **« 540M »**, **« 200k »** là où les
boutons portaient « 10 000 000 » et « 540 000 000 » — ils tiennent
confortablement au lieu de remplir leur cadre.

⚠ **CE QUI N'A PAS ÉTÉ VU EN GRAND** : le bandeau des ressources avec un stock
au-dessus de dix mille, faute d'une partie avancée sous la main. Les formats sont
mesurés par `NBR T1` ; leur tenue dans une tuile de 70 px reste à regarder sur
une vraie base.

---

## 7. Écarts et points en suspens

1. ⚠ **CE QU'ETHAN TRANCHE** : la casse des suffixes (§2) — norme SI `k M G T`,
   ou l'oral `k m g t`. Un caractère par palier.
2. ⚠ **LE SEUIL EST À 10 000, PAS À 100 000.** C'est ta phrase ; il se change
   dans `SEUIL_COMPACT`, et le test qui l'encadre lit la constante plutôt que de
   la recopier.
3. ⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ RELANCÉ, ET C'ÉTAIT CONFORME** :
   le lot ne touche ni `art/`, ni un outil de la chaîne graphique.
