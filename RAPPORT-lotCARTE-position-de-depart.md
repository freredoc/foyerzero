# RAPPORT — lot CARTE : des distances aux coordonnées

> ⚠ **Ce lot s'empile sur le lot COLIS, qui n'est pas encore commité.**
> Ordre : COLIS archive 1, COLIS archive 2, puis CARTE archive 1, CARTE archive 2.

---

## 1. Résultat, mesuré

| | après COLIS | après ce lot |
|---|---|---|
| `npm test` | 233 pass / 0 fail | **238 pass / 0 fail** |
| Fichiers `src/sim/` | 10 | **11** |
| Fichiers `*.test.js` | 21 | **22** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **inchangé, même SHA-256** |

---

## 2. Ta réponse et la donnée ne disaient pas la même chose

> « Le joueur démarre tout en bas au milieu. »

`GEOGRAPHIE.departJoueur` porte déjà : `{ strate: 5, casesDepuisBordBas: 25 }`.

**Le joueur ne démarre donc pas au bord**, et il ne peut pas : le bord bas
vaudrait le niveau **0**, qui n'existe pas. Les deux chiffres arbitrés sont liés
— 25 cases × 0,2 niveau/case = strate 5.

Ta réponse apporte ce qui manquait vraiment : **la colonne**. Elle n'était
écrite nulle part pour le joueur (`baseTerminale` disait `colonne: 'centre'`,
lui, sans dire laquelle).

**Position retenue : rangée 275, colonne 16, niveau 5.**

---

## 3. Le décalage n'a pas été choisi, il a été déduit

Traduire « 25 cases depuis le bord bas » en rangée demande de fixer un
« plus ou moins un ». Je ne l'ai pas tranché à la main : `GEOGRAPHIE` porte
**deux faits liés**, et un seul décalage les rend vrais **en même temps**.

Un test asserte les deux, **et** qu'aucune rangée voisine n'y arrive :

```
casesDepuisBordBas(275) === 25   ET   niveauDeLaRangee(275) === 5
274 : distance 26 → strate 5 mais distance fausse
276 : distance 24 → distance fausse et strate 5 fausse
```

Sans la seconde moitié, l'accord ne prouverait pas que le décalage est unique.

---

## 4. Deux conventions, posées une fois pour toutes

| Convention | Retenu | Pourquoi |
|---|---|---|
| Sens des rangées | **1 = bord haut**, `hauteur` = bord bas | même sens que la grille de combat, où la rangée 1 est le côté d'où arrivent les vagues. Une seule convention pour les deux grilles. |
| Centre d'une largeur paire | **16 sur 30** | 30 n'a pas de centre exact. Ce qui compte n'est pas lequel, c'est que les DEUX bouts du couloir emploient le même — la carte est un couloir. |

Un test injecte une colonne différente pour la base terminale et vérifie que ça
tombe : l'alignement des deux bouts est asserté, pas espéré.

## 5. Deux valeurs mesurées au passage

- **Le plafond de niveau mord à la rangée 52**, soit 248 cases du bas. Les 51
  rangées au-dessus valent toutes 50.
- **Le couloir fait 249 rangées** entre le départ du joueur et la base
  terminale. Un test exige plus de 200, sinon la progression n'aurait pas de
  place.

---

## 6. Falsification — six défauts, six tombés

| Défaut injecté | Résultat |
|---|---|
| décalage d'une rangée au départ | tombe |
| le niveau compte depuis le bord HAUT | tombe (3 tests) |
| pas de plancher à 1 (le bord bas vaut 0) | tombe |
| pas de plafond de niveau | tombe (2) |
| centre pris à 15 au lieu de 16 | tombe (3) |
| les deux bouts n'emploient plus le même centre | tombe (2) |

---

## 7. Fichiers — ⚠ DEUX ARCHIVES

| Archive | Fichiers |
|---|---|
| **1 — `src/`** | `src/sim/carte.js` |
| **2 — `test/` + racine** | `test/carte.test.js`, `CLAUDE.md`, ce rapport |

`carte.js` / `carte.test.js` : encore une paire qui ne diffère que par `.test`.

---

## 8. Ce qui reste avant la bascule

Il ne manque plus qu'**une** réponse sur les trois :

1. ✅ **Position de départ** — réglée par ce lot.
2. ✅ **Sauvegardes v2** — « aucune sauvegarde actuellement, personne ne joue ».
   La migration vers le nouvel état pourra donc reconstruire une base neuve sans
   rien préserver, et le dire.
3. ⬜ **La base initiale.** « Gratuite et immédiatement posée » — mais posée avec
   QUOI, et OÙ dans les 72 cases ? Un Chantier de construction niveau 1 seul
   (il ouvre 2 emplacements et en prend 1, donc 1 libre) ? Et sur quelle case
   de la bande ? Le centre de la dernière rangée serait le choix naturel, mais
   c'est une décision de jeu, pas de code.
