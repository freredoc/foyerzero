# PASSATION — 31/08/2026 (soir), lot MODULES-B

**version 0.52.0 · build 53** — lot **MODULES-B**, branche
`claude/lot-modules-b`, **PR ouverte, NON fusionnée**.

⚠ `PASSATION-2026-08-31.md` était déjà pris par MODULES-A : ce fichier porte un
suffixe. Vérifier qu'un nom est libre avant d'écrire.

---

## Où en est le projet

`npm run check` → **682 pass / 0 fail**. `dist/index.html` → **1 261 788
octets**, marge **38 212** sous la borne T10 (1 300 000), soit **2,94 %**.
`node tools/audit-maquette.mjs` → **ROUGE, 7 écarts, rc=1** — le même compte
qu'avant le lot, ligne par ligne. `SAVE_VERSION` reste à **14**.

Le rapport complet est dans `RAPPORT-lotMODULES-B.md` : chiffres, matrice de
falsification à dix-neuf sabotages, raid sur site réel, banc navigateur.

---

## Ce que le lot a fait

**Six modules sur quatorze sont désormais câblés** — l'Écraseur, le Tir de
barrage et le Booster (déjà là), plus le **Flashbang**, l'**EMP** et le
**Camouflage**. Tous en offense, aucun en défense.

Trois modules, **deux crochets seulement** :

- **Une entité qui ne peut plus tirer.** Flashbang (colonne `infanterie`) et EMP
  (colonne `vehicule`) partagent **une seule mécanique** : l'étape **3 bis**,
  entre le ciblage et le tir. 50 ticks, **−20 % de durée par niveau d'écart, par
  soustraction** (50 · 50 · 40 · 30 · 20 · 10 · 0 · 0), une fois par combat, et
  **une durée nulle ne consomme pas l'usage**. La garde est dans `tir`, avant
  `tirDeBarrage` : la neutralisée **garde sa cible**, elle ne tire plus, c'est
  tout.
- **Une entité qu'on ne peut plus viser.** Le Camouflage rend son porteur
  invisible pour la **défense** tant qu'aucune entité de sa colonne de
  prédilection n'est à sa portée. L'ensemble des camouflés est calculé une fois
  en tête de `ciblage`, et le `Set` sert **deux fois** — les candidats et la
  cible conservée.

Quinze tests ajoutés, `MODULES-B T1` à `T15`.

---

## Ce qui a coûté cher, et qu'il ne faut pas redécouvrir

1. **`escouade` n'est pas `infanterie`.** La table de neutralisation nomme des
   **colonnes de matrice**. Les défenses n'ont pas de châssis, et les trois
   artilleries sont des **véhicules**. Lire `chassis` fait tomber six tests.

2. **Un test qui asserte le champ que le patch vient d'écrire ne prouve rien.**
   Dix-neuf sabotages ont été appliqués à la source, la suite rejouée à chaque
   fois, la source restaurée (md5 vérifié). **Deux d'entre eux ne font tomber
   aucun test, et ce sont des no-op sémantiques démontrés**, pas des trous —
   c'est écrit tel quel dans le rapport. **Un troisième était un vrai trou** :
   le départage de `cibleDeNeutralisation` n'était gardé par personne. `T14` le
   ferme.

3. **`peutAvancer` n'est pas ce qui bloque une unité devant un mur.** Le brief
   l'affirmait ; mesuré au sabotage, la fonction forcée à `true` ne fait
   franchir aucun mur. Elle alimente `progresse` (repli, Écraseur) ; le refus
   d'avancer est exécuté **à la fin de `deplacement`**, sur la case occupée que
   `peutEcraser` refuse.

4. **Le banc d'écran de MODULES-A divisait le débit par 1 000.** Corrigé, et
   revérifié à la main : la différence brute de `#recherche-points` est
   exactement le prix affiché.

5. **Les sites de début de partie n'ont ni artillerie ni véhicule.** Deux camps
   niveau 1 (`{meute: 3}`) et un avant-poste niveau 6 : l'EMP n'y a **rien** à
   neutraliser. La preuve d'existence est donc jouée sur des avant-postes de
   niveau 20 et 40 du même générateur.

6. **Les effets de neutralisation S'EMPILENT.** Deux porteurs sur la même cible
   posent deux `neutralise` ; `estNeutralisee` étant un `.some()`, le plus long
   fait foi. Constaté en raid, figé par `T15`, **non demandé par le brief et non
   arbitré** — à trancher si Ethan veut un remplacement ou un plafond.

7. **`T7` pose son effet à la main, et c'est dit.** L'état — un ATTAQUANT
   neutralisé — n'est pas atteignable aujourd'hui : `declencherNeutralisations`
   ne balaie que le camp `attaque`. Le test verrouille la **position** de la
   garde, pas un scénario de jeu.

---

## Ce qui reste ouvert

- **Huit modules non câblés** : `bouclier` et `garnison` (offensifs),
  `autoReparation`, `rayonMiniMoinsUn`, `pvPlusVingt`, `rayonPlusUn` (purement
  défensifs), `munitionSpeciale` et `volDeVie` (portés par le seul
  `moduleOuvrage`). Vérifié en balayant les porteurs.
- **Aucune branche `defense` n'est câblée.** Le moteur ne lit `p.module` que du
  côté qui attaque : câbler un module en défense demandera un second balayage,
  pas un drapeau.
- **La marge sous la borne T10 est à 2,94 %** (4,4 · 3,1 · 3,05 · 2,94). Le
  prochain atlas la fera tomber ; il faudra rouvrir la borne, pas la contourner.
- **L'audit maquette est rouge à 7 écarts**, et il l'était avant.
- **Rien n'a été vérifié sur un appareil réel.**
