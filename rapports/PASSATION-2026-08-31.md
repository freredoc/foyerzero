# PASSATION — 31/08/2026

**version 0.51.0 · build 52** — lot **MODULES-A**, branche
`claude/lot-modules-a`, **PR ouverte, NON fusionnée**.

---

## Où en est le projet

`npm run check` → **667 pass / 0 fail**. `dist/index.html` → **1 260 325
octets**, marge **39 675** sous la borne T10 (1 300 000), soit **3,05 %**.
`node tools/audit-maquette.mjs` → **ROUGE, 7 écarts, rc=1** — le même compte
qu'avant le lot, écart par écart. `SAVE_VERSION` reste à **14**.

Le rapport complet est dans `RAPPORT-lotMODULES-A.md` : chiffres, matrice de
falsification, raid comparé sur huit graines, banc navigateur.

---

## Ce que le lot a fait

**Trois modules sur quatorze sont désormais câblés** — l'Écraseur (déjà là), le
**Tir de barrage** et le **Booster** — et le drapeau de câblage est passé
**par branche** : `cable: { offense, defense }` dans `src/data/modules.js`,
`moduleEstCable(nom, branche)` à deux arguments qui **lève** sur une branche
inconnue.

Les trois câblés le sont **tous en offense, aucun en défense**, parce que
`moduleActif` ne lit `p.module` que du côté qui attaque. Sous l'ancien drapeau
global, la ligne défense des Grenadiers aurait vendu 200 000 000 de points un
Tir de barrage qui n'aurait jamais tiré.

---

## Ce qui a coûté cher, et qu'il ne faut pas re-payer

⚠ **LA RÉFÉRENCE `main` DU CLONE ÉTAIT PÉRIMÉE D'UNE PR.** Elle pointait sur
**b16f0b2** (PR #42) alors que la vraie base est **6cce620** (PR #43, RECHERCHE).
Le premier audit « avant » a donc été joué sur le mauvais arbre — et il donnait
le bon nombre, ce qui l'aurait rendu invisible. **Faire `git fetch origin main`
et comparer à `origin/main`, jamais à `main`.** La ligne de base d'octets a été
refaite de la même façon : `git archive origin/main` dans un dossier neuf, puis
`node tools/build.js` — **1 259 092 octets** constatés, pas repris du brief.

⚠ **`peindre` DE L'ÉCRAN RECHERCHE RECONSTRUIT LE DOM.** Un banc navigateur qui
capture le nœud d'une ligne AVANT l'achat le relit ensuite **détaché** : il
affiche encore le prix et `disabled: false` alors que les points ont bien été
débités. Le banc a conclu à un défaut d'écran qui n'existait pas. **Relire la
ligne vive avant chaque geste.**

⚠ **DEUX TROUS DE COUVERTURE ONT ÉTÉ TROUVÉS PAR LA MATRICE DE FALSIFICATION, ET
COMBLÉS.** Retirer le filtre de **camp** du Tir de barrage, puis retirer le
filtre de **genre**, ne faisaient tomber **aucun test** : les montages ne
contenaient ni structure alliée adjacente, ni unité ennemie adjacente. Un test
qui passe sur du code saboté ne prouve rien. La matrice complète — onze
sabotages, chacun appliqué puis restauré depuis `/tmp/combat.orig.js` — est au
§4 du rapport.

⚠ **LE MESSAGE DE REFUS IMPRIMAIT LA CLÉ, PAS LE MOT.** Première version :
« n'a pas d'effet en **defense** », sans accent, parce que `branche` est une
clé. C'est visible par le joueur. Le mot vient désormais de
`MOT_DE_LA_BRANCHE`.

---

## Les pièges du moteur que ce lot a rencontrés

- **`rangeeMilli` est en milli-cases, `colonne` en cases.** Le rayon du barrage
  se calcule en `caseDepuisMilli` d'un côté, en entier de l'autre.
- **`distanceTchebychev` de `sim/points-attaque.js` NE S'IMPORTE PAS** dans
  `combat.js` : elle traînerait `clock.js` et `niveau-de-base.js` dans un
  fichier qui ne dépend que de `grille.js`.
- **Les éclaboussures partent dans le tampon de l'étape 4**, avec le tir
  principal — sinon la simultanéité normative des neuf étapes est cassée.
- **L'étape 8 compte les tirs, pas les impacts** : le barrage ne coûte aucune
  munition supplémentaire.
- **Le déclencheur du Booster est à l'étape 6 bis**, après le retrait des morts.
  Lu avant `appliquerDegats`, il rate la blessure du tick même.
- **Le ×10 s'applique APRÈS la réduction d'obstacle** : 60 → 24 → 240. L'inverse
  rendrait l'obstacle inopérant sous boost.
- **`modulesActifs` est la mémoire, `effetsTemporises` la fenêtre.** Le marqueur
  n'est jamais retiré ; c'est lui qui interdit la seconde poussée.

---

## Ce qui reste ouvert

**Onze modules sur quatorze ne sont pas câblés.** Le refus `effetNonCable`
continue de les protéger — le joueur les voit et ne peut pas les payer.

- **Cinq offensifs** demandent d'ouvrir le ciblage ou la structure du combat :
  `flashbang` et `emp` (empêcher de tirer), `camouflage` (le ciblage doit
  pouvoir ignorer une entité), `bouclier` (absorber avant de retrancher),
  `garnison` (des entités apparaissent hors `apparitionDeVague`).
- **Quatre purement défensifs** — `autoReparation`, `rayonMiniMoinsUn`,
  `pvPlusVingt`, `rayonPlusUn` — n'ont **aucun lecteur** aujourd'hui :
  `moduleActif` ne consulte `p.module` que du côté qui attaque. Les câbler
  suppose de décider d'abord **comment un ouvrage porte son module**.
  ⚠ Le drapeau par branche est désormais prêt pour ça : on peut câbler un module
  d'un seul côté sans mentir de l'autre.
- **Deux que seul `moduleOuvrage` porte** : `munitionSpeciale`, `volDeVie`.

**Le Booster est câblé et il est perdant, mesuré.** Il se déclenche à chaque
raid (3 à 5 Cuirassiers sur 6) et rend **−3,7 % de points médians** : il fait
courir l'unité blessée droit sur la défense. Le Tir de barrage, lui, rend
**+28,1 % de butin médian** et fait tomber 37 bâtiments sur 64 contre 27. Si le
Booster doit servir, c'est le barème (`BOOSTER_FACTEUR = 10`, `BOOSTER_TICKS =
30`, tous deux du brief) qu'il faut rouvrir, pas le câblage.

**L'audit maquette reste rouge avec ses sept écarts** — terrain, disposition,
emplacements, trois débits, raffinerie. Aucun n'est de ce lot ; ils attendent un
lot dédié. Le porter à 6 ou à 8 sans ce lot serait une régression, dans les deux
sens.

**Aucun appareil réel n'a été joint.** Le banc est un Chromium headless au
gabarit du téléphone (360 × 740, dpr 2, tactile), pas la WebView Android.
