# RAPPORT — lot TICK : audit du code retrouvé, et le surplus gelé

> Ces fichiers viennent d'un tour qui a planté. Ils sont de MOI, écrits entre
> 20:04 et 20:10, et leur contexte a été jeté à la relance — d'où le fait que je
> ne les reconnaissais pas. Ils ont été audités de zéro avant d'être livrés.

---

## 1. Résultat, mesuré

| | `main` | après ce lot |
|---|---|---|
| `npm test` | 219 pass / 0 fail | **234 pass / 0 fail** |
| Fichiers `*.test.js` | 20 | **21** |
| Fichiers `src/sim/` | 9 | **10** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **inchangé, même SHA-256** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

`sim/economie-base.js` vit **à côté** de `sim/economy.js`, il ne le remplace
pas. L'ancien reste branché à `state.js` ; le débrancher est un lot à part.

---

## 2. L'audit — ce qui tenait

- **Pas tronqués** malgré le plantage : syntaxe valide, fins de fichier propres.
- **L'arithmétique en milli avec résidu par (bâtiment, ressource) est juste.**
  Le résidu par bâtiment SEUL aurait mélangé les deux flux d'une raffinerie.
- **Le rattrapage analytique est correctement démontré** : le reste ne dépend
  que de `nbTicks mod TICKS_PAR_HEURE`, et la composition des `min` est valide
  parce que tous les apports sont positifs.
- **Le « facteur 5,47 » est exact**, recalculé indépendamment. Le pire cas réel
  est un collecteur niveau 50 entouré de huit raffineries : **45 738 385 u/h**,
  contre un seuil de 2,502 × 10¹¹ milli/h. L'ancien « facteur 19 » de
  `CLAUDE.md` avait été mesuré sur le collecteur SEUL, avant que le voisinage
  n'entre au modèle.

## 3. Une mesure qui ne s'est pas reproduite

Le module affirmait « 21,7 µs par tick sur une base de huit bâtiments ».
**Re-mesuré : 30,1 µs sur neuf bâtiments**, 20 000 ticks. La configuration
d'origine n'était pas écrite, donc le chiffre n'était pas refaisable. Remplacé
par le mien, configuration détaillée. La conclusion ne bouge pas : **0,301 ms
par seconde de jeu réel**, trois centièmes de pour cent d'un cœur.

---

## 4. Le défaut réel — et il était sérieux

Le module annonçait en tête que le rattrapage rend « un état **strictement
identique** à N appels de `tickEconomieBase` ». **C'était faux.**

| Stock de départ | Divergence tick ↔ rattrapage |
|---|---|
| toujours ≤ plafond | **0 sur 300 bases** |
| parfois > plafond | **197 sur 300 bases** |

**Cause.** `tickEconomieBase` ne parcourait que les ressources qu'un bâtiment
**produit**. Un stock au-dessus du plafond dans une ressource que plus rien ne
produit n'était donc jamais saturé. `rattrapageEconomieBase`, lui, parcourait
les trois ressources et saturait toujours. Sur un cas nu : **3 380 000 contre
2 880 000**.

**Ça arrive en jeu** : un raid détruit tes collecteurs et une raffinerie. Plus
de production de quartz, plafond descendu, stock au-dessus.

**Et le comportement d'origine n'était même pas cohérent avec lui-même** : il
gardait le stock jusqu'à la prochaine unité produite, puis le rabattait d'un
coup. Ni gelé ni rabattu — les deux, selon le moment.

### Pourquoi douze tests verts ne le voyaient pas

**Ils partaient tous de `creerEtatEconomie`, donc de zéro.** Depuis zéro, un
stock ne peut jamais dépasser sa capacité — et c'était exactement le seul état
où les deux chemins divergeaient. Les tests ne mentaient pas : ils regardaient
ailleurs.

> **Une suite qui ne construit ses états qu'avec le constructeur du module ne
> peut atteindre que les états que le module sait produire.** Les états HÉRITÉS
> — une sauvegarde d'avant, une base amputée par un raid — se posent à la main,
> sinon ils ne sont jamais testés.

---

## 5. La correction — arbitrée le 26/08

**Le surplus se GÈLE, il ne se rabat pas.** Perdre une raffinerie ne prend rien
au joueur : le stock cesse de monter, il ne tombe pas. Le plafond effectif d'un
tick devient `max(cap, stock)` au lieu de `cap`.

**Et cette sémantique fait disparaître la divergence d'elle-même**, sans aucun
cas particulier : un stock gelé ne bouge plus, des deux côtés.

Vérifié par test différentiel après correction :

| | avant | après |
|---|---|---|
| départ ≤ plafond | 0 / 300 | **0 / 300** |
| départ parfois > plafond | 197 / 300 | **0 / 300** (317 stocks gelés tirés) |

---

## 6. Trois tests neufs, et la falsification

| Test ajouté | Sur l'ancien code |
|---|---|
| un stock au-dessus du plafond est GELÉ, jamais amputé | **tombe** |
| un stock gelé ne remonte pas non plus | **tombe** |
| tick et rattrapage identiques SUR DES STOCKS HÉRITÉS | **tombe** |

⚠ **Le premier ne discriminait pas dans sa première rédaction.** Sa base ne
produisait pas de quartz, donc l'ancien code la préservait **par le bug
même** — le test passait des deux côtés. Un collecteur a été ajouté au montage,
et une assertion vérifie maintenant qu'il produit vraiment, sinon le test ne
mesure rien.

---

## 7. Fichiers, et ⚠ DEUX ARCHIVES

| Fichier | Archive |
|---|---|
| `src/sim/economie-base.js` | **archive 1**, seul |
| `test/economie-base.test.js` | archive 2 |
| `CLAUDE.md` | archive 2 |
| `RAPPORT-lotTICK-audit-et-gel-du-surplus.md` | archive 2 |

**Pourquoi deux.** `economie-base.js` et `economie-base.test.js` ne diffèrent
que par `.test` — exactement la paire qui a fait dérailler les deux dernières
livraisons, deux fois de suite. J'avais dit que je ne les remettrais plus dans
la même archive. C'est la première fois que ça s'applique.

⚠ **Entre les deux dépôts, `main` sera ROUGE** : `CLAUDE.md` annoncera 10
fichiers dans `src/sim/` que l'archive 1 vient de créer, mais pas encore les
tests. C'est attendu, et c'est le garde-fou qui le dit. Déposer l'archive 1,
puis l'archive 2, et c'est vert.

---

## 8. Ce qui reste

1. **Le redéploiement change les champs** — découle du code, jamais dit.
2. **Débrancher `sim/economy.js`** : retirer les colis, bouger `SAVE_VERSION`,
   brancher `economie-base` sur `state.js`. Une seule migration pour tout.
3. **Les valeurs manquantes ailleurs** : coûts de réparation, plafonds
   d'électricité, réserve de temps, formule du dépassement.
