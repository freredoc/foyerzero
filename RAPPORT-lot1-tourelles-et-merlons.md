# RAPPORT — lot 1, tourelles de défense et merlons

**29/08/2026.** 600 fichiers écrits dans `art/sprites/defense/{128,64,32}` :
12 tourelles × 16 orientations, plus 2 merlons × 4 connexions, sur trois
grilles. Aucun fichier de `src/` ni de `test/` touché.

Verdict d'ensemble : **les 288 fichiers du joueur et les 24 merlons sont bons.
Les 288 fichiers de l'Ouvrage sont à refaire**, pour une raison de conception,
pas de conditionnement. Le détail est au §4.

---

## 1. L'identification des douze cellules, mesurée

Les planches `T01` à `T16` portent 12 cellules en grille 3 × 4 et aucun nom.
L'attribution a été déduite de trois mesures, pas d'une convention supposée :

- **L'accent donne la cible**, comme pour les unités. Sur `T01` : cellules
  0/3/6/9 à 15–25 % de blanc et 0 % de rouge ; 1/4/7/10 à 11–24 % de rouge ;
  2/5/8/11 à 10–42 % de jaune. Soit infanterie, véhicule, aviation.
- **La longueur du canon donne la portée** côté joueur : 160–165 px pour les
  cellules 0–2, 224–227 px pour les cellules 3–5. Soit portée 2,5 puis 5,5.
- **Le socle donne le camp** : disque inscrit de 105 px pour les cellules 0–5,
  de 27 à 35 px pour les cellules 6–11, qui portent aussi la rampe A.

| Cellules | Camp | Défenses |
|---|---|---|
| 0 · 1 · 2 | joueur | casemate · créneau · batterie |
| 3 · 4 · 5 | joueur | faucheuse · mortier · harpon |
| 6 · 7 · 8 | Ouvrage | casemate · créneau · batterie |
| 9 · 10 · 11 | Ouvrage | faucheuse · mortier · harpon |

⚠ Côté Ouvrage, la longueur de canon **ne sépare pas** les deux portées
(164–173 px contre 165–174 px). L'ordre 6–8 puis 9–11 y est déduit de la
régularité du reste, pas mesuré. À confirmer.

## 2. L'ancrage, qui était le vrai sujet

Chaque orientation a été générée dans une image séparée, et le socle n'y occupe
pas la même place. Conditionner chaque orientation sur sa propre boîte
englobante — ce que fait `recadrer` pour les unités — ferait glisser la tourelle
sur le sol pendant qu'elle vise.

L'ancre retenue est le **centre du plus grand disque inscrit**, obtenu par
transformée de distance. C'est le point le plus épais de la forme, donc le
socle, et elle ne demande aucun paramètre à régler. Les seize orientations
partagent ensuite une toile carrée unique, dimensionnée sur l'union des seize,
pivot au centre exact.

Mesure du noyau stable — les pixels couverts par les seize orientations à la
fois, ce qui est exactement « ce qui ne bouge pas quand la tourelle tourne » :

| Tourelle | Ancrage boîte | Ancrage pivot | Gain |
|---|---:|---:|---:|
| def_j_casemate | 3 362 | **8 102** | ×2,4 |
| def_j_creneau | 1 836 | **7 728** | ×4,2 |
| def_j_batterie | 1 709 | **7 726** | ×4,5 |
| def_j_faucheuse | 1 298 | **7 906** | ×6,1 |
| def_j_mortier | 881 | **7 706** | ×8,8 |
| def_j_harpon | 744 | **7 648** | ×10,3 |
| def_o_casemate | 962 | 722 | ×0,75 |
| def_o_creneau | 277 | 399 | ×1,4 |
| def_o_batterie | 307 | 437 | ×1,4 |
| def_o_faucheuse | 464 | 612 | ×1,3 |
| def_o_mortier | 80 | 449 | ×5,6 |
| def_o_harpon | 293 | 353 | ×1,2 |

Côté joueur c'est net : le noyau passe de 744–3 362 à **7 648–8 102**, une
plage resserrée, et le gain croît avec la longueur du canon — logique, puisque
c'est là que l'ancrage par boîte dérive le plus. Sur la bande de rotation, le
socle reste immobile et seul le canon tourne.

Côté Ouvrage le pivot n'y change presque rien, et le §4 dit pourquoi.

## 3. Les merlons

Quatre connexions, est et ouest seulement, conformément à l'arbitrage du 28/08.
Occupation de la tuile, stable aux trois grilles :

| | isolé | est | ouest | traversant |
|---|---|---|---|---|
| joueur | 22,9 % | 25,4 % | 17,4 % | 18,2 % |
| Ouvrage | 37,5 % | 17,0 % | 30,0 % | 33,7 % |

⚠ L'ordre des quatre cellules d'une planche 2 × 2 est supposé
`isolé · est · ouest · traversant` en lecture normale. Les occupations ne le
confirment pas : côté joueur `est` est plus lourd qu'`isolé`, côté Ouvrage
`est` est le plus léger des quatre. **Deux planches, deux ordres différents,
donc au moins une des deux est mal étiquetée.** À vérifier à l'œil avant usage.

## 4. ⚠ Les tourelles de l'Ouvrage ne passent pas

Occupation moyenne de la tuile, sur 100 fichiers par camp et par grille :

| Grille | Joueur | Ouvrage | Minimum Ouvrage |
|---|---|---|---|
| 128 | 10,31 % | 4,47 % | 1,06 % |
| 64 | 10,06 % | 4,02 % | 0,61 % |
| 32 | 9,52 % | **3,24 %** | **0,10 %** |

`def_o_harpon_n` en 32 fait **6 pixels opaques**. Il n'y a pas de sprite.

Trois causes cumulées, mesurées :

1. **La dispersion des portées.** La toile commune est dimensionnée sur
   l'orientation la plus étendue. Pour `def_j_casemate`, les seize rayons vont
   de 67 à 117 px, médiane 105 — rapport max/médiane de **1,11**. Pour
   `def_o_harpon`, de 90 à 209, médiane 134 — rapport **1,56**. L'orientation
   est, seule, gonfle la toile de 56 %, ce qui divise la surface de toutes les
   autres par 2,4.
2. **L'érosion.** À érosion 3, `def_o_harpon` rend 254 gros pixels ; à érosion
   0, 724. La forme est faite de traits fins que l'érosion mange.
3. **Ça ne suffit pas à expliquer l'écart.** Même à érosion 0, l'Ouvrage reste
   à 724 contre 2 448 pour le joueur à érosion 3. La forme est simplement
   grêle : corps réduit, canon long et mince.

Ce n'est donc **pas un défaut de conditionnement**. Les tourelles de l'Ouvrage
ont été dessinées grêles là où celles du joueur sont trapues, et une forme
grêle ne survit pas à une grille de 32 gros pixels.

Deux issues, au choix :

- **Redessiner** les six tourelles de l'Ouvrage avec un corps plus large et un
  canon plus court, en visant l'occupation du joueur — 10 % de la tuile.
- **Renoncer au 32** pour les tourelles de défense, et ne les rendre qu'en 64
  et 128. Le champ de bataille ne descend jamais sous 45 px par case, donc le
  32 n'y sert peut-être à rien.

La seconde ne sauve pas tout : à 64, `def_o_harpon` est encore à 0,61 %.

## 5. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **600**, comptés sur disque |
| Dimensions | 128×128, 64×64, 32×32 — une seule par dossier |
| Couleurs hors palette | **0** sur les 600 |
| Sprites vides | **0** — mais six sont sous 1 % d'occupation (§4) |
| Noyau stable, joueur | 7 648 à 8 102 px, plage resserrée |
| Bande de rotation regardée | ✔ joueur conforme, Ouvrage non conforme |

## 6. Reste ouvert

1. **Les six tourelles de l'Ouvrage** (§4) — redessiner ou renoncer au 32.
2. **L'ordre des cellules Ouvrage 6–8 / 9–11** (§1) — déduit, non mesuré.
3. **L'ordre des quatre connexions de merlon** (§3) — les deux planches se
   contredisent.
4. **Les tourelles d'unité** — les vingt planches sont prêtes et n'ont pas été
   traitées dans ce lot ; elles ont leur propre grille 4 × 2 et 2 × 4.
