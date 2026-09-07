# RAPPORT — lot QUEUE-DE-COURBE

Correction du seul point que le lot STOCKAGE-ET-VOISINAGE laissait ouvert, après
arbitrage d'Ethan le 28/08 :

> « fait au mieux pour les courbes stockage mais j'aime bien le x2 des dix
> premiers. sinon ecrase les derniers niveau pour que ca rentre »

**Version produite : 0.22.0 · build 23.** `dist/index.html` : 153 506 →
**153 505 octets**, 0 référence externe. `SAVE_VERSION` inchangée à **6**.
**Suite : 326 pass / 0 fail** — aucun test ajouté, deux réécrits, aucun retiré.
`audit-maquette.mjs` : vert.

---

## 1. Ce qui change : une constante

`STOCKAGE.multiplicateurAuPlafond` passe de **1,333 à 1,05**. Rien d'autre.

- **Le × 2 des dix premiers niveaux est intact**, c'est ta contrainte.
- **La queue est écrasée**, c'est ta solution.

| niv | avant | **après** |
|---|---|---|
| 1 | 20 | **20** |
| 10 | 10 240 | **10 240** |
| 20 | 6 536 863 | 5 301 139 |
| 30 | 1 671 299 065 | 703 781 154 |
| 40 | 156 049 900 214 | 19 320 801 805 |
| 50 | **4 752 154 949 956** | **81 529 693 877** |

## 2. Pourquoi 1,05, et pas un autre nombre

**La cible est la base LÉGALE la plus grosse, pas une base plausible.** Au
niveau 50 le Chantier ouvre 40 emplacements et en occupe un : **39 bâtiments de
stockage** au maximum. C'est dégénéré — une base sans production — mais
parfaitement légal, et l'exactitude arithmétique ne se règle pas sur ce qui est
vraisemblable.

| fin de rampe | raffinerie niv 50 | 39 × en milli | marge sous l'entier sûr |
|---|---|---|---|
| 1,333 (première écriture) | 4,75 × 10¹² | 1,85 × 10¹⁷ | **dépasse** |
| 1,20 | 7,58 × 10¹¹ | 2,96 × 10¹⁶ | **dépasse** |
| 1,15 | 3,68 × 10¹¹ | 1,43 × 10¹⁶ | **dépasse** |
| 1,10 | 1,75 × 10¹¹ | 6,82 × 10¹⁵ | 1,3 |
| **1,05** | **8,15 × 10¹⁰** | **3,18 × 10¹⁵** | **2,8** |
| 1,00 | 3,72 × 10¹⁰ | 1,45 × 10¹⁵ | 6,2 |

1,05 est le point qui tient les deux bouts : il rentre avec de la marge, **et
aucun palier n'est mort**. Écraser n'est pas aplatir — le multiplicateur descend
de 1,976 au palier 11 à 1,05 au palier 50, donc le dernier niveau apporte encore
+ 5 %. À 1,00 la marge serait plus confortable, mais on vendrait au joueur des
améliorations qui ne font rien.

Ce que chaque palier apporte encore, en fin de courbe :

```
palier 11 : × 1,976  (+98 %)      palier 45 : × 1,169  (+17 %)
palier 20 : × 1,762  (+76 %)      palier 48 : × 1,098  (+10 %)
palier 30 : × 1,525  (+52 %)      palier 50 : × 1,050   (+5 %)
palier 40 : × 1,288  (+29 %)
```

## 3. L'écrêtage devient une garde MORTE, et c'est le vrai gain

`CAPACITE_MILLI_MAX` avait été posé la veille parce que la courbe débordait —
autrement dit il **mordait en jeu réel**, ce qui en faisait un mur et non une
garde. Il ne mord plus sur **aucune base légale**, et un test l'asserte de face :

- la base légale maximale n'est **pas** écrêtée, et laisse 2,8 fois de marge ;
- une disposition de 500 raffineries — qu'aucune base ne peut atteindre — l'est,
  et le résultat reste un entier sûr.

C'est ce qu'on attend d'une garde : qu'elle soit morte tant que les données sont
saines, et qu'elle parle le jour où elles dérivent.

## 4. Tests

**Deux tests réécrits, aucun ajouté, aucun retiré ni assoupli.**

| Test | Résultat |
|---|---|
| `base — capaciteDuNiveau suit la courbe arbitrée le 28/08, palier par palier` | PASS (bornes d'autonomie recalculées) |
| `base — la base LÉGALE la plus grosse tient dans l'entier sûr, écrêtage compris` | PASS (réécrit) |

Le second a changé de verdict **deux fois en un jour, et les deux fois il avait
raison** : « la marge est réelle » sous l'ancienne courbe (2 815 fois), « elle a
disparu » sous la première écriture de la nouvelle, « elle est revenue »
maintenant. C'est exactement ce qu'un test de données doit faire.

### Falsification — quatre mutations

| Mutation | Verdict |
|---|---|
| queue de courbe remise à 1,333 | ROUGE ✔ |
| queue aplatie à 1,00 (dernier palier mort) | ROUGE ✔ |
| le × 2 des dix premiers rogné à 1,8 | ROUGE ✔ |
| écrêtage retiré | ROUGE ✔ |

Sources byte-identiques à leurs sauvegardes en fin de campagne.

## 5. Ce que je n'ai PAS fait, et pourquoi

> « rien à foutre de ma sauvegarde de toute façon je dois désinstaller le jeu et
> réinstaller »

**`CODES_TOLERES_AU_CHARGEMENT` reste en place.** Il ne coûte rien, il est
correct indépendamment de ta partie du jour, et il servira à la prochaine règle
ajoutée après coup — ce qui arrivera. Le retirer parce que tu n'en as pas besoin
aujourd'hui serait une régression pour tout ce qui vient après.

> « c'est voulu » (la fenêtre serrée du démarrage)

Noté dans `CLAUDE.md` comme **arbitré**, pour que personne ne le prenne pour un
défaut d'équilibrage à corriger.

## ⚠ Et un point que tu as signalé en passant

> « de toute façon je dois désinstaller le jeu et réinstaller (prochain fix) »

**Devoir réinstaller l'APK pour voir une nouvelle version est un défaut en
soi** — c'est toute la raison d'être du module `maj/` et du manifeste publié par
le job `pages`. Je le prends comme le lot suivant, après MISE EN PAGE, sauf si tu
veux qu'il passe devant : tant qu'il n'est pas réglé, rien de ce que je livre ne
t'atteint autrement qu'à la main.

## ⚠ Vérifications appareil — NON EXÉCUTÉES

1. Les capacités de tes bâtiments de stockage à leur niveau courant — tes
   niveaux sont bas, donc dans le régime × 2 : **inchangées** par ce lot.
2. Rien n'est perdu : un stock au-dessus d'un plafond est GELÉ, pas amputé.
