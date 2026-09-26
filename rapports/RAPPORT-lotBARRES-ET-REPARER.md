# RAPPORT — lot BARRES-ET-RÉPARER

Retours d'Ethan du 25/09/2026, points 1 à 4 : retouches d'écran seulement. Pas
une ligne de `src/sim/`, `src/data/`, `src/son/`, `tools/` ni `art/` — vérifié au
diff. `SAVE_VERSION` ne bouge pas et reste à **41**.

Version et build produits : **0.99.77 · build 189** (les deux restent des
chaînes). Livrable : `dist/index.html`, **10 608 405 octets**, 0 référence
externe.

---

## 1. La base relevée avant travail

- `main` = **`78af575`** — le merge du lot ARTILLERIE-RECHERCHE (#169). Revérifié
  au `git fetch` avant de pousser : `main` n'a pas bougé sous le lot.
- `npm ci && npm run check` sur l'arbre intact : **1668 déclarés · 1667 pass ·
  0 fail · 1 skipped** (`LIMITE T8`, suspendu le 08/09), sortie 0.
- Livrable pristine rebâti dans un `git worktree` sur `78af575` :
  **10 606 810 octets**, le nombre de la §0, retrouvé à l'octet.
- `python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot
  ne touche ni `art/`, ni un outil de la chaîne.

---

## 2. Les diffs cités

### 2.1 `marquerBoutonsAction` — Base (`src/ui/chantier.js`)

```diff
     const barre = $('chantier-reparation');
     if (barre === null) return;
     const repliee = actionArmee !== 'reparer';
     barre.classList.toggle('repliee', repliee);
+    // ⚠⚠ ET CE QU'ELLE COUVRIRAIT MONTE AVEC ELLE — lot BARRES-ET-RÉPARER, …
+    const champ = $('chantier-champ');
+    if (champ !== null) champ.classList.toggle('sous-reparation', !repliee);
     if (!repliee) ecrireLaReserve();
```

Et la feuille :

```css
#chantier-reparation { … bottom: 100%; z-index: 3; height: 22px; … }
#chantier-champ.sous-reparation #chantier-avis { bottom: 22px; }
#chantier-champ.sous-reparation #chantier-bascule-bande { bottom: 28px; }
/* tutoriel ouvert : la barre de réparation ne couvre rien, rien ne monte */
#chantier-champ.sous-reparation:has(> #chantier-tuto:not([hidden])) #chantier-avis { bottom: 0; }
#chantier-champ.sous-reparation:has(> #chantier-tuto:not([hidden])) #chantier-bascule-bande { bottom: 6px; }
```

⚠ **LES DEUX RÈGLES `:has()` NE SONT PAS DANS LE BRIEF.** Sans elles, avec le
tutoriel ouvert, la ligne de mode montait de 22 px au-dessus d'un vide : la
mini-fenêtre du tutoriel est DANS le flux et pousse déjà la barre contextuelle,
donc la barre de réparation ne recouvre rien. Mesuré tutoriel ouvert : ligne de
mode 488–514, bascule 468–508 — **identiques avant et après le lot** (capture 1b).
La falsification F8 ci-dessous les garde.

### 2.2 `marquerBoutonsAction` — Armée (`src/ui/offense.js`)

```diff
 function marquerBoutonsAction() {
   for (const [nom, action] of Object.entries(ACTIONS_ARMEE)) {
     $(action.bouton).classList.toggle('arme', actionArmee === nom);
   }
+  const toutReparer = $('offense-tout-reparer');
+  if (toutReparer !== null) {
+    toutReparer.classList.toggle('repliee', actionArmee !== 'reparer');
+  }
 }
```

Le bouton naît `class="repliee"` dans le balisage, et
`#offense-tout-reparer.repliee { visibility: hidden; }` : il RÉSERVE sa place,
donc la grille ne bouge pas d'un pixel (§5, capture 2).

### 2.3 Les quatre `desarmer()` de `src/ui/raid.js`

```diff
       avis(problemes.map((p) => p.message).join(' ; '));
-      desarmer();                          // (1) après un refus
       peindreVagues();
       return;
…
     retenir();
-    desarmer();                            // (2) après une réussite
+    avis(m.invite);
     peindreVagues();
…
     if (mode !== null) {
       if (index !== undefined) agirSur(Number(index));
-      else desarmer();                     // (3) sur une case vide
       return;
     }
…
     resynchroniserLaFormation(etatCourant, formation);
-    desarmer();                            // (4) après « Tout réparer »
     peindreVagues();
```

⚠ **`avis(m.invite)` REMPLACE LE (2), IL N'EST PAS UN AJOUT DE CONFORT.**
`desarmer` était le seul à vider la ligne d'avis ; sans lui, un refus suivi d'une
réparation réussie laisserait le message de refus sous un mode toujours armé. Cet
écran n'a pas de `toast`.

⚠ **ÉCART DÉCLARÉ : « ACTIVER » RESTE ARMÉ AUSSI.** Les lignes retirées sont
communes aux deux modes de `MODES_RAID`. C'est la règle « le mode est collant »
que la Base et l'Armée ont reçue le 17/09 ; si Ethan veut qu'Activer se désarme,
c'est une condition sur `mode` dans `agirSur`, une ligne.

---

## 3. Les ΔE2000, recalculés

Script jetable **hors du dépôt**, dans le bloc-notes de session : sRGB → XYZ (D65)
→ Lab, puis CIEDE2000 complet, et le contraste WCAG contre le fond `#161914`.

| ton | valeur | accent le plus proche | ΔE2000 mesuré | brief §4.1 | contraste vs `#161914` |
|---|---|---|---|---|---|
| entamée | `#E0D060` | `#F5B636` | **13,35** | 13,3 | **11,29** |
| critique | `#C23A5A` | `#E43E32` | **15,92** | 15,9 | **3,42** |
| (pleine, kaki lumière) | `#8C9A72` | — | — | — | **5,90** |

**Écart au brief : 0,05 et 0,02 — sous le demi-point.** Aucune des deux teintes
ne se confond avec un accent de ciblage. ⚠ Le critique ne fait que **3,42** contre
le fond sombre : il passe le seuil de 3 d'un élément graphique, pas celui de 4,5
d'un texte — il n'en porte aucun.

La palette passe de **quarante et une à quarante-trois** teintes ; les deux
entrent dans `FICHE-STYLE.md` sous leur propre titre, `PALETTE_FICHE` de
`test/banc.test.js` les porte, et `couleurDeLaBarrePv` de `render/scene.js` a
**quatre lecteurs** — le champ de bataille, la légende, `barreDeVie` et le jeton
du Chantier. `COULEUR_BARRE_PV` a disparu avec son dernier lecteur.

---

## 4. Les falsifications, messages réels

Chacune jouée sur l'arbre final, suite rejouée, arbre restauré et `cmp`-vérifié.

| # | falsification | tombe | message recopié |
|---|---|---|---|
| F1 | `desarmer()` remis après `m.agir` (raid) | `MODE T1` | « le mode s'est désarmé après une réparation » |
| F2 | `desarmer()` remis dans « Tout réparer » (raid) | `MODE T1` | « le mode s'est désarmé après « Tout réparer » » |
| F3 | bascule de `repliee` retirée de `marquerBoutonsAction` (Armée) | `EC T4` | « sans mode, « Tout réparer » est visible sur l'écran d'armée » |
| F4 | bascule de `sous-reparation` retirée (Base) | `RÉPARER T11` | « armer Réparer déplie la barre sans faire monter la ligne de mode : elle la recouvre » |
| F5 | `>` → `>=` au premier seuil | `BARRE T1` | « exactement quatre cinquièmes n'est pas « entamée » : le premier seuil est inclusif » |
| F6 | barre retirée du peintre de l'Armée | `BARRE T1` | « la Meute abîmée de la colonne 2 n'a pas de barre » |
| F7 | barre retirée de la grille du raid | `MODE T1` | « une pièce abîmée ne porte pas de barre de vie » |
| F8 | les deux règles `:has()` du tutoriel retirées | `RÉPARER T11` | « la ligne de mode monte aussi tutoriel ouvert : elle flotte au-dessus d'un vide » |

⚠ Les tests nomment leur échec plutôt que de tomber sur un `TypeError` : la
présence de chaque barre est assertée AVANT sa teinte, comme le brief l'avait vu
au prototype.

---

## 5. Les quatre captures, et les boîtes

Chromium sans tête, livrable servi en HTTP, **360 × 780 CSS à DPR 3**, sauvegarde
injectée. Captures dans `rapports/`, préfixe `barres-`.

### Capture 1 — Base, bande Bâtiments, Réparer armé

`barres-avant-1-base-reparer.png` · `barres-apres-1-base-reparer.png` ·
`barres-apres-1b-base-reparer-tuto-ouvert.png`

| boîte | AVANT | APRÈS |
|---|---|---|
| ligne de mode `#chantier-avis` (z 1) | 576 → 602 | **554 → 580** |
| bascule `#chantier-bascule-bande` (z 2) | 556 → 596 | **534 → 574** |
| barre `#chantier-reparation` | 581 → 603, z **auto** | 581 → 603, z **3** |
| réserve | 587 → 597, x 8 → 228,92 | identique |
| « Tout réparer » | 584 → 600, x 251,48 → 352 | identique |
| `elementFromPoint` au centre du bouton | `chantier-tout-reparer` | `chantier-tout-reparer` |
| `elementFromPoint` sur la réserve | `chantier-reserve` | `chantier-reserve` |

Texte de la réserve : « Réserve : 1.1 h / 14.2 h · 2 à réparer : 0 q · 2 min ».

⚠⚠ **LA RELECTURE HOSTILE : AVANT, LE BOUTON RECEVAIT LE DOIGT ET NE SE VOYAIT
PAS.** `elementFromPoint` rendait déjà le bouton — la ligne d'avis est en
`pointer-events: none` —, mais elle était peinte PAR-DESSUS, au `z-index` 1 contre
`auto`. C'est exactement l'écart du point 1 : présent au DOM, touchable, et
illisible. **APRÈS, la barre est au-dessus de tout (z 3) et rien ne la chevauche**
— la ligne de mode finit à 580, la barre commence à 581. La capture 1 le montre :
la ligne de mode, la réserve et le bouton se lisent tous les trois.

### Capture 2 — Armée, sans le mode puis au mode

`barres-avant-2a-armee-sans-mode.png` · `barres-apres-2a-armee-sans-mode.png` ·
`barres-2b-armee-mode-avant-et-apres.png`

| boîte | sans mode (AVANT) | sans mode (APRÈS) | au mode (APRÈS) |
|---|---|---|---|
| grille `#offense-vagues` | 110 → 573,5 | 110 → 573,5 | **110 → 573,5** |
| « Tout réparer » | 579,75 → 595,75, **visible** | 579,75 → 595,75, **hidden** | 579,75 → 595,75, **visible** |
| barre `#offense-reparation` | 573,5 → 602 | 573,5 → 602 | 573,5 → 602 |

**La grille ne bouge pas d'un pixel** entre les trois états ; le bouton paraît au
premier toucher sur Réparer et reçoit le doigt (`elementFromPoint` →
`offense-tout-reparer`).

⚠ **RELEVÉ, NON CORRIGÉ — ANTÉRIEUR AU LOT.** Au mode, `#offense-avis` couvre
110 → 148, donc le haut de la vague 1, **identiquement avant et après le lot**.
Le brief ne le demande pas ; le corriger toucherait la mise en page de l'écran
d'armée. **Ethan tranche.**

### Capture 3 — Armée aux trois teintes, et la grille du raid

`barres-apres-2a-armee-sans-mode.png` (trois unités abîmées, vague 1) ·
`barres-apres-3b-raid-preparation.png`

Mesuré sur les deux grilles, Fusiliers à 90 %, 50 % et 10 % de PV :

| PV | largeur | fond |
|---|---|---|
| 90 % | 90% | `rgb(140, 154, 114)` = `#8C9A72` pleine |
| 50 % | 50% | `rgb(224, 208, 96)` = `#E0D060` entamée |
| 10 % | 10% | `rgb(194, 58, 90)` = `#C23A5A` critique |

Grille du raid en préparation : `#raid-vagues` 564,44 → 734. Le liseré `.abimee`
a disparu des deux grilles : la barre dit l'avarie, un seul signal.

### Capture 4 — un raid en cours

`barres-apres-4-raid-en-cours.png`

`fillStyle` instrumenté sur le canevas, relevé à 136 ms : `#161914` ×192 (fonds
de barre), `#8C9A72` ×120, `#68727E` ×48, **`#E0D060` ×8** et **`#C23A5A` ×8** —
au moins une barre jaune et une rouge sur le champ, comme le brief l'exige.
`scrollWidth` 360, **zéro erreur de page**.

---

## 6. Le compte final

- `npm run check` : **1670 déclarés · 1669 pass · 0 fail · 1 skipped**, sortie 0.
- **Deux tests entrent** — `BARRE T1` (`test/offense.test.js`) et `MODE T1`
  (`test/raid-ecran.test.js`). `test/` reste à **81** fichiers.
- `documentation.test.js` **vert** : `CLAUDE.md` §0 annonce « **1670 pass /
  0 fail** », la palette « quarante-trois teintes », et la ligne version · build.
- Réécrits sur place, **aucune assertion retirée ni assouplie** : `RÉPARER T11`,
  `RÉPARER T12`, `PAL T5`, `RAID-E T8`, `EC T4`, les quatre sondes de
  `rendu.test.js`, `PALETTE_FICHE` de `banc.test.js`.
- **`PIC T7` réancré sur le POURCENTAGE** — 10 606 810 → **10 608 405**, marge
  213 190 → **211 595**, 1,97 % → **1,96 %**, avec son `notEqual` sur l'ancienne
  marge. Les 1 595 octets valent un trente et unième de sa tolérance de 50 000 :
  il serait resté VERT en faisant mentir la §0. Quatrième fois de suite.

### Le livrable, poste par poste

Contre le livrable pristine de `78af575` (**10 606 810**) :

| poste | écart |
|---|---|
| JavaScript | **+894** |
| feuille | **+685** |
| balisage | **+16** |
| images | +0 |
| audio | +0 |
| **total** | **+1 595** |

Les cinq postes partitionnent le fichier des deux côtés — écart **0 · 0** —,
`data:` à **316 lignes / 315 URI** de part et d'autre. Borne T10 **10 820 000,
non touchée**, marge **211 595 octets, 1,96 %**.

⚠ **Le brief prévoyait +1 288.** Sur les 307 octets d'écart, les deux règles
`:has()` du tutoriel ouvert en pèsent **211**, mesurés en les retirant et en
rebâtissant (10 608 194) ; les **96** qui restent sont des écarts d'écriture au
prototype — commentaires et formulation —, non ventilés.

---

## Écarts au brief, déclarés

1. **Deux règles `:has()`** pour le tutoriel ouvert (§2.1) — sans elles, la ligne
   de mode flotte au-dessus d'un vide.
2. **« Activer » reste armé** comme « Réparer » (§2.3) — les lignes retirées sont
   communes.
3. **`test/pictogramme.test.js`** touché en plus des douze fichiers du brief :
   `PIC T7`.
4. **Livrable +1 595 contre +1 288** (§6).
5. **`#offense-avis` couvre le haut de la vague 1 au mode** — antérieur, relevé,
   non corrigé.
6. **La branche** : l'environnement d'exécution épingle la session à
   `claude/new-session-ib50iz` et interdit de pousser ailleurs sans autorisation
   explicite.

## Non exécuté

**Le rendu n'a pas été vu sur l'appareil d'Ethan.** Tout ce qui précède est
relevé dans Chromium à la géométrie du S25 FE. À regarder au premier essai : que
la barre de 3 px se lise sur une vignette de 34 px, et que le jaune d'une
entamée ne se prenne pas pour l'ambre d'une cible.
