# LISEZ-MOI-DEPOT.md — passation du 27/08/2026

Dépôt : **`freredoc/foyerzero`**, branche `main`.

⚠ **Ce zip est le seul à commiter de la journée.** Il remplace tous les
précédents. Si tu as encore `foyerzero-S0-S1.zip` sous la main : **son dossier
`sprites/terrain/` contient 29 tuiles périmées** — elles décrivaient la carte du
monde, pas le champ de bataille. Ne les commite pas. Tout le reste de ce zip-là
est repris ici, à jour.

| Fichier du zip | Où le déposer | Action |
|---|---|---|
| `PASSATION-2026-08-27.md` | racine | **nouveau — à lire en premier** |
| `PROMPTS-sol-de-base.md` | racine | nouveau |
| `FICHE-STYLE.md` | racine | remplace — deux rampes de sol ajoutées au §3 |
| `INVENTAIRE-SPRITES.md` | racine | remplace — v4 ⚠ son §2 reste à corriger |
| `BRIEF-SPRITES-IA.md` | racine | remplace — v5 |
| `PLAN-PRODUCTION-SPRITES.md` | racine | remplace ⚠ S1 à rouvrir |
| `RAPPORT-S0-rampe-ouvrage.md` | racine | nouveau |
| `RAPPORT-S1-terrain.md` | racine | nouveau ⚠ décrit le mauvais lot |
| `sprites/terrain/` (4 PNG) | `sprites/terrain/` | **nouveau dossier** |
| `art/ouvrage/` (3 PNG) | `art/ouvrage/` | nouveau dossier |
| `art/joueur/` (1 PNG) | `art/joueur/` | nouveau dossier |

Les deux fichiers marqués « décrit le mauvais lot » sont commités **tels quels et
à dessein** : le §3 de la passation explique pourquoi ils sont faux, et un
document faux dont on sait qu'il est faux vaut mieux qu'un trou. Ils se
corrigeront quand le lot en cours sera fini.

⚠ GitHub ne décompresse pas un zip. Extraire sur le téléphone, puis
*Add file → Upload files*, **dossier par dossier**. Les PNG doivent partir depuis
`sprites/terrain/`, `art/ouvrage/` et `art/joueur/` extraits, jamais depuis la
racine.

Aucun fichier de `src/`, `test/` ou `tools/` n'est touché : la suite reste à
240 tests sans avoir à tourner, `dist/index.html` ne bouge pas, **ne pas bumper
`package.json`**.
