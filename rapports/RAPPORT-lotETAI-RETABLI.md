# RAPPORT — lot ÉTAI-RÉTABLI

**Version produite : 0.99.78 · build 190** — 0.99.77 · build 189 avant la fusion
avec BARRES-ET-RÉPARER, voir §9. `SAVE_VERSION` passe de **41 à 42**,
par un maillon vide.
Branche : `claude/new-session-9gp1vq`. Le brief ne nomme aucune branche, et
l'environnement d'exécution épingle celle-ci.

Arbitrage d'Ethan, 25/09 : un Étai rasé ne condamne plus la garnison d'une base
de l'Ouvrage pendant mille heures. Il remonte **en ligne droite en une heure**,
comme les autres bâtiments d'une base, et la vitesse des défenses **suit la
santé qui remonte**. Côté joueur, réparer le Complexe **relance** la rampe à
pleine vitesse, sans rejouer le palier.

---

## 1. La base relevée avant travail

| Grandeur | Valeur |
|---|---|
| `main` | `78af575` — squash merge de #169, lot ARTILLERIE-RECHERCHE (parent `40c83a3`) |
| Tests déclarés | **1668** |
| Verdict | **1 667 pass · 0 fail · 1 skipped** (`LIMITE T8`, suspendu le 08/09) |
| `npm run check` | sortie 0 |
| `dist/index.html` | **10 606 810 octets**, 0 référence externe |
| `SAVE_VERSION` | 41 |

Ces valeurs sont celles de la §0 de `CLAUDE.md`, retrouvées à l'octet. La base
n'avait pas bougé depuis l'écriture du brief.

---

## 2. Le diff des fonctions touchées, cité

Les extraits ci-dessous sont le **code** du diff, commentaires ôtés. Le diff
complet compte 20 fichiers, 1 137 lignes ajoutées et 157 retirées ; la plupart
des lignes ajoutées sont des commentaires et des tests.

### 2.1 `src/sim/site-entame.js` — la remontée des bâtiments et le branchement

Une seule lecture du « type qui se régénère », dérivée de `TYPES_DE_BASE` de
`data/sites.js`, dont l'export existait déjà :

```js
export function ticksDeRegeneration(type) {
  if (!TYPES_DE_BASE.includes(type)) return null;
  return TYPES_SITE[type].reparationHeures * TICKS_PAR_HEURE;
}
export const TICKS_REPARATION_BASE = ticksDeRegeneration('base');
```

Les quatre tests `=== 'base'` passent à `TYPES_DE_BASE.includes(…)` :

- `plancheAUnPv` ;
- `retirerLeSite`, qui fait désormais entrer un verrou rasé parmi les ruines (§4) ;
- le garde de `montageCourant` ;
- la purge de `reparerLesSites`.

Les bâtiments remontent en ligne droite, **à la lecture**. L'entrée de
`sitesEntames` n'est pas réécrite (§3.1 du brief) :

```js
function pvCourantsDesBatiments(etat, entree, montage) {
  const regeneration = ticksDeRegeneration(entree.type);
  if (regeneration === null) return entree.pvBatimentsMilli;
  const ecoule = Math.max(0, etat.horloge.nbTicks - entree.tickDuRaid);
  if (ecoule >= regeneration) return entree.pvBatimentsMilli.map(() => null);
  return entree.pvBatimentsMilli.map((pv, i) => {
    if (pv === null || pv === 0) return pv;
    const piece = montage.batiments[i];
    const max = BATIMENTS[piece.id].pv * facteurMilli(piece.niveau);
    return pv + Math.floor(((max - pv) * ecoule) / regeneration);
  });
}
```

La forme neuve ne s'applique **que sous 1000** :

```js
function remonteeDeLEtai(entree, sante) {
  if (!rendLesPv(sante) || sante >= MILLE) return null;
  return ticksDeRegeneration(entree.type);
}
```

`pvCourantsDesDefenses` et `dureeDuRetourDesDefenses` construisent le même
objet de rampe. Elles appellent `pvApresRetour` / `ticksDeRetour` quand
`remontee === null`, et `pvSousUneSanteQuiRemonte` /
`ticksDeRetourSousUneSanteQuiRemonte` sinon. La branche des défenses de
`reparerLesSites` purge au bout de la durée ainsi calculée, sans autre
changement.

### 2.2 `src/sim/reparation.js` — l'intégrale, en `BigInt`

```js
function renduSousUneSanteQuiRemonte(pvMaxMilli, santeMilli, facteur, ticksDeRemontee, e) {
  const h = BigInt(RETOUR_DEFENSES.heuresDeBase * TICKS_PAR_HEURE);
  const t = BigInt(ticksDeRemontee);
  const s0 = BigInt(santeMilli);
  const mille = BigInt(MILLE);
  const x = BigInt(e);
  const sigma = e <= ticksDeRemontee
    ? 2n * t * s0 * x + (mille - s0) * x * x
    : t * t * (s0 + mille) + 2n * t * mille * (x - t);
  return Number((BigInt(pvMaxMilli) * sigma) / (2n * t * h * BigInt(facteur)));
}
```

- La durée est le plus petit `e` tel que `A(e) ≥ reste`. Elle se trouve par
  **dichotomie entière** sur `[1, T + durée à pleine santé + 2]`, dans
  `ticksDeRetourSousUneSanteQuiRemonte`.
- **Le contrôle du plafond de niveau est factorisé**, ce que le prototype
  n'avait pas fait. `controlerLaRampe` porte les trois contrôles d'entrée, la
  borne `1 + dépassement ≤ NIVEAU.plafond` et rend `facteurMilli(1 +
  dépassement)`. `ticksDeRetour` et les deux fonctions neuves l'appellent.
  Aucune copie.
- `palierDeLaRampe(perdus, santé, avecPalier)` est **la seule lecture
  d'`avecPalier`**. Elle LÈVE sur tout ce qui n'est pas un booléen : une
  chaîne `'false'` serait vraie.
- `avecPalierDuRetour(retour)` = `retour.sansPalier !== true` est **la seule
  lecture de `sansPalier`**.
- `reparerUnBatiment` finit par `ramenerLaGarnison(etat);`.
- `ramenerLaGarnison` relance une pièce dont le stamp porte une santé
  **inférieure** à celle du Complexe d'aujourd'hui. Le nouveau stamp porte
  `tickDuRaid: maintenant`, la santé et le niveau du jour, `degatsAuDebutMilli:
  <dégâts attendus maintenant>` et `sansPalier: true`. Une pièce déjà revenue
  perd son stamp au lieu d'en recevoir un.
- `problemesDuRetour` refuse `sansPalier` quand il n'est ni absent ni `true`.

### 2.3 `src/sim/state.js`

```js
export const SAVE_VERSION = 42;
// dans poser :
if (id === RETOUR_DEFENSES.indexeeSur) ramenerLaGarnison(etat);
// dans ameliorer :
ramenerLaGarnison(etat);
// migrations :
41: (s) => {
  s.version = 42;
},
```

Le maillon ne fait rien d'autre. Une v41 ne porte aucun `sansPalier`, et
« absent » vaut « avec palier ». C'est exactement le comportement d'hier.

### 2.4 Deux fichiers que le brief ne nommait pas, et pourquoi

- **`src/render/embleme.js`** : `spriteDeLaRuine` rend la ruine de base pour
  `TYPES_DE_BASE.includes(type)`. Le brief nommait ce fichier ; il est cité ici
  pour le compte.
- **`src/sim/territoire.js`**, **écart déclaré**. Une ruine de verrou ou de
  finale émet du territoire depuis que `retirerLeSite` la range. Deux
  conséquences :
  - `CAMP_D_ORIGINE_DE_LA_RUINE` levait « type inconnu » : il se dérive
    désormais de `TYPES_DE_BASE` (plus `baseJoueur`), au lieu de nommer
    `base` seul ;
  - `NIVEAU_MAX` valait `GEOGRAPHIE.niveauPlafond` (50), et une ruine de finale
    est de niveau **60**. Il lit `NIVEAU_MAXIMAL_DUN_SITE`. Changer
    `NIVEAU_MAX` multiplie toutes les forces par un facteur COMMUN
    `DEN^10` : aucune comparaison ne bouge, et `TF T1` à `T3` comme `RT T1` et
    `RT T2` restent verts.
- **`src/data/base.js`, `src/ui/monde.js`** : commentaires seulement. Ceux du
  §3.3 du brief devenaient faux.
- **`MODELE-REPARATION-1.md`** : §6 point 5 rouvert et tranché le 25/09. Le
  brief dit « §5, point 5 » ; le paragraphe est au **§6**. La règle et le motif
  y sont : l'objection d'intégration ne tient plus, la rampe reste analytique.

---

## 3. Le tableau du §1, refait par un harnais jetable hors du dépôt

Le harnais `tableau.mjs` vit dans le scratchpad de la session, **pas dans
`tools/`**. Il porte sur une base de l'Ouvrage, 34 défenses, Étai rasé. Les
pourcentages sont ceux des PV, rapportés au plein.

### Avant le lot (build 188)

| Instant | Étai | Défenses |
|---|---|---|
| fin du raid | 0,0 % | 0,007 % |
| 15 min | 0,0 % | 0,032 % |
| 30 min | 0,0 % | 0,057 % |
| 45 min | 0,0 % | 0,082 % |
| 1 h | 100,0 % | 0,107 % |
| 1 h 15 | 100,0 % | 0,132 % |
| 1 h 30 | 100,0 % | 0,157 % |

- Défenses pleines, Étai rasé : 35 998 866 ticks, soit **999,97 h**.
- Défenses pleines, Étai à 50 % : 1,300 h.
- Défenses pleines, Étai intact : 0,300 h.

### Sur le code livré

| Instant | Étai | Défenses |
|---|---|---|
| fin du raid | 0,0 % | 0,007 % |
| 15 min | 25,0 % | 3,132 % |
| 30 min | 50,0 % | 12,507 % |
| 45 min | 75,0 % | 28,132 % |
| 1 h | 100,0 % | **50,007 %** |
| 1 h 15 | 100,0 % | 75,007 % |
| 1 h 30 | 100,0 % | **100,000 % — entrée purgée** |

- Défenses pleines, Étai rasé : 53 999 ticks, soit **1,500 h**.
- Défenses pleines, Étai à 50 % : 32 305 ticks, soit 0,897 h. Le retour complet
  prend ≤ 1,000 h, les bâtiments bornant.
- Défenses pleines, Étai intact : **0,300 h, identique à avant**.

**« 50 % à l'heure, pleines à 1 h 30 » est reproduit.** L'Étai intact ne bouge
pas d'un tick, ce qui est la première question de la relecture hostile (§8).

---

## 4. Le verrou rasé (§3.4), avant et après

Harnais `verrou.mjs`, graine 2026. Verrou en (3, 16), `baseVerrou`, niveau 50,
rasé par sa Souche.

| | Avant le lot | Après |
|---|---|---|
| `enregistrerLeRaid` | `{"rase":true}` | `{"rase":true}` |
| `basesRasees` | **0** | **1** |
| verrous debout | **6** | **5** |
| finale déverrouillée | false | false |
| emprise (3,16)(3,17)(4,16)(4,17) | `baseVerrou` ×4 | `null` ×4 |
| `sitesEntames` | `{}` | `{}` |

Avant le lot, **un verrou rasé ne l'était pas** : `retirerLeSite` ne rangeait
une ruine que pour `type === 'base'`. Le verrou disait « rasé » au rapport,
restait debout sur la carte, et la porte de la finale ne descendait jamais sous
six. `VERROU T8` le garde.

---

## 5. Les falsifications, messages réels

Chaque ligne a été jouée sur l'arbre du lot, puis défaite. Les messages sont
recopiés depuis la sortie de `node --test`.

| # | On casse | Test | Message obtenu |
|---|---|---|---|
| 1 | `ramenerLaGarnison(etat);` retiré de `reparerUnBatiment` | `RETOUR-D T11` | « boucle et rattrapage divergent après une réparation du Complexe : 1664123 contre 1688480 » |
| 2 | `avecPalierDuRetour` rend `true` — `sansPalier` ignoré | `RETOUR-D T11` | « la relance a rendu des PV d'un coup : le palier a rejoué (666092 milli-PV de trop) » — `285468 !== 951560` |
| 3 | `retirerLeSite` : `TYPES_DE_BASE.includes(identite.type)` → `identite.type === 'base'` | `VERROU T8` | « le verrou rasé n'a pas rejoint les ruines » — `0 !== 1` |
| 4 | les bâtiments ne remontent plus pendant l'heure (`return pv;`) | `RETOUR-D T13` | « base : l'Étai ne remonte pas linéairement (1000 sur 39657500) » — `1000 !== 19829250` |
| 5 | la vitesse reste sur la santé figée (`remonteeDeLEtai` rend `null`) | `RETOUR-D T13` | « base : la défense n'a pas reçu la moitié de ses PV à l'heure (12104, attendu 5553050) » |
| 6 | `ticksDeRegeneration` et `plancheAUnPv` repassent à `=== 'base'` | `RETOUR-D T13` | « baseVerrou : l'Étai ne planche pas à 1 PV » |
| 7 | **fq1** — la garde `sante >= MILLE` retirée de `remonteeDeLEtai` | `RETOUR-D T13` | « base : un Étai INTACT a pris la rampe de la remontée au tick 7 (attendu 7775328, la formule d'avant) » — `+ 7775329 / - 7775328` |
| 8 | **fq2** — l'intégrale passée en `Number` et `Math.floor` | `RETOUR-D T13` | « baseTerminale : au tick 39360 de la rampe, la défense ne porte pas le quotient EXACT (attendu 114965682, un produit en flottant rendrait 114965681) — l'intégrale est passée hors de `BigInt` » |

Les messages 1, 2, 4, 5 et 6 sont **ceux que le brief annonce** pour son
prototype, au caractère. Suite complète sous fq1 comme sous fq2 : **1669 tests ·
1666 pass · 2 fail · 1 skipped**. Les deux rouges sont `RETOUR-D T13` et la
garde de compte de `documentation.test.js`, qui attendait alors le compte de la
base.

⚠⚠ **fq1 ET fq2 NE MORDAIENT PAS AU PREMIER RELEVÉ, ET C'EST LA RELECTURE
HOSTILE QUI L'A TROUVÉ.** Au premier jet, `RETOUR-D T13` restait **vert** sous
les deux : la suite ne disait donc rien des deux questions du §8.

- **Pour fq1** : le test ne montait aucun Étai **intact** sur un site entamé.
  Il en monte un désormais et compare, tick par tick, à la formule d'avant. Les
  deux formules décrivent la même rampe mais **pas au même arrondi** : le
  premier tick où elles divergent est le 7, d'un milli-PV.
- **Pour fq2** : un produit flottant n'a d'écart qu'au-delà de 2⁵³. Le test
  cherche désormais, sur une `baseTerminale` de niveau 60, un tick où le
  quotient exact et le quotient flottant diffèrent. Il **exige** qu'ils
  diffèrent avant de comparer, sans quoi il ne mesurerait rien : c'est le cas au
  tick 39 360.

**Les deux réponses de la relecture hostile ont donc été obtenues en lançant la
suite** :

- la forme neuve ne s'applique pas à un Étai intact ;
- aucun produit de l'intégrale ne passe hors de `BigInt`.

Sans ces deux montages, elles ne l'auraient pas été.

Les deux assertions « non prototypé » du §5.1 sont écrites et vertes :

- `problemesDuRetour({ …, sansPalier: false })` rend un problème ;
- un aller-retour `serialiser` / `charger` garde `sansPalier: true`.

---

## 6. `temoins-bases-0.js` : vert, et pas touché

`test/temoins-bases-0.js` n'apparaît pas au diff, et `test/bases.test.js` est
vert. Le scénario du témoin ne rase jamais l'Étai d'une base de l'Ouvrage, et la
relance côté joueur n'agit que sous une santé de Complexe qui MONTE après un
stamp.

**Aucune couche `DEPLACES_PAR_*` n'est ajoutée**, faute de quoi que ce soit à
attribuer. La sauvegarde ne grandit pas d'un octet : `sansPalier` n'est posé que
par une relance.

---

## 7. Ce qui reste ouvert

### Les deux lectures d'écran du §6 du brief — non corrigées, comme demandé

- **« Étai 0 % » au rapport d'un raid.** `restantEtai` est relevé au moment du
  combat, et `restantPct` arrondirait de toute façon 1 PV à 0 %. Le rapport dit
  ce qui s'est passé pendant le raid ; il ne dit pas que l'Étai remonte en une
  heure.
- **`forceDeLaDefense`** somme les points des pièces présentes sans regarder
  leurs PV. Un site entamé s'annonce aussi fort qu'un site plein.
- L'écart ne dure plus qu'une heure et demie au lieu de mille heures.
  **Ethan tranche** s'il veut les deux corrigés.

### Déclarations

- **Le dessin d'une ruine de verrou ou de finale.** Elle se dessine avec le
  sprite de ruine de BASE, sur la case d'ancrage, à la taille d'une case, et
  non à celle de son emprise de 2 × 2 ou 3 × 3. C'est le sprite qui existe ;
  une ruine à l'échelle de l'emprise est un lot d'art.
- **La mission `sites-detruits` coche désormais sur un verrou rasé.** C'est
  juste, puisqu'il est rasé pour de bon, mais c'est une conséquence du lot.
- **Cas limites de la relance, conformes à la règle et relevés pour
  qu'Ethan les sache :**
  - un Complexe démoli puis reposé relance, puisque sa santé repart pleine ;
  - améliorer un Complexe abîmé relance aussi : ses PV maximaux montent, donc
    sa santé en millièmes monte ;
  - une vieille sauvegarde de verrou dont l'Étai est à 0 reprend la rampe
    neuve au chargement ;
  - au milieu de l'heure, `resumeCourant` montre des PV de bâtiment partiels.
- **Un paragraphe périmé de `MODELE-REPARATION-1.md`** parle encore de la
  pénalité linéaire de 24 h. Elle n'existe plus depuis VITESSE ; il est relevé,
  pas réécrit.
- **Livrable : 10 609 741 octets**, contre **10 606 810** sur `78af575`.
  - Coût **+2 931 octets, entièrement du JavaScript**, mesuré poste par poste :
    JavaScript +2 931 · images +0 · audio +0 · feuille +0 · balisage +0.
  - La partition du fichier tombe juste des deux côtés, écart 0 · 0, avec 316
    lignes `data:` et 315 URI de part et d'autre.
  - Borne T10 **10 820 000, non touchée**, marge **210 259 octets, 1,94 %**.
  - `PIC T7` est réancré avec sa contre-assertion `notEqual(…, 213_190)`.
  - Le brief annonçait **10 609 026** pour son prototype. L'écart de 715 octets
    est **mesuré et non attribué** : le lot factorise le contrôle de plafond et
    ajoute les deux assertions et les commentaires que le prototype n'avait pas,
    mais aucun de ces trois ajouts n'a été isolé à l'octet.
- **Sept épingles `SAVE_VERSION`** réancrées 41 → 42 dans six fichiers :
  `B4 T7`, `FR T3`, `JRN T10`, `RCU T12`, `PD T10`, `MODULES-PIÈCE T1` et
  `VERROU T7` / `LONGUE T2`.
- **Le rendu n'a pas été vu dans un navigateur.** Ce que le lot change se lit
  sur la carte, la ruine d'un verrou, et sur la garnison d'un site revisité
  dans l'heure. Tout est mesuré sur des fonctions pures et sur l'état.
- **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : le
  lot ne touche ni `art/` ni un outil de la chaîne.

---

## 8. Résultat

| Grandeur | Valeur |
|---|---|
| Tests déclarés | **1669** (+1, `VERROU T8`) |
| Verdict | **1 668 pass · 0 fail · 1 skipped** |
| `npm run check` | sortie **0**, relevé sur l'arbre final : `# tests 1669 · # pass 1668 · # fail 0 · # skipped 1` ; `dist/index.html` **10 609 741** octets |
| `test/` | 81 fichiers, inchangé |

## 9. Fusion avec BARRES-ET-RÉPARER (PR #170)

Ethan a fusionné la PR #170 pendant que celle-ci était ouverte : `main` passe de
`78af575` à `252fb50`. Les deux lots ont été écrits sur la même base, et ils ne
partagent **aucun fichier de `src/`**. Ils se croisent sur les trois fichiers que
deux lots parallèles heurtent toujours :

| Fichier | Résolution |
|---|---|
| `CLAUDE.md` | les deux blocs §0 gardés mot pour mot ; ÉTAI en tête, BARRES rétrogradé en « Auparavant » — c'est l'ordre d'atterrissage qui tranche |
| `test/pictogramme.test.js` | les deux paragraphes de `PIC T7` gardés ; ancre **remesurée** sur le livrable fusionné, deux `notEqual` neufs (210 259 = ÉTAI seul, 211 595 = BARRES seul) |
| `package.json` | **auto-fusionné EN SILENCE** : les deux lots avaient pris `0.99.77 · build 189`. Fusion bumpée à **0.99.78 · build 190**, deux chaînes |

Mesures, prises sur l'arbre fusionné et non additionnées :

| Grandeur | Valeur |
|---|---|
| `main` = `252fb50`, rebâti dans un `git worktree` pristine | **10 608 405** octets, retrouvé à l'octet |
| Livrable fusionné | **10 611 332** octets |
| Coût contre `main` | **+2 927**, JavaScript seul — images +0 · audio +0 · feuille +0 · balisage +0 ; `data:` 316 lignes / 315 URI des deux côtés |
| Somme des deux diffs | 10 611 336 — **4 octets de trop**, d'où la mesure |
| Marge T10 | **208 668 octets, 1,93 %** (borne 10 820 000 non touchée) |
| `npm run check` | sortie **0** : `# tests 1671 · # pass 1670 · # fail 0 · # skipped 1` (1668 + `VERROU T8` + `BARRE T1` + `MODE T1`) |
