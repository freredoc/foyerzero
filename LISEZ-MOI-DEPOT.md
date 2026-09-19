# LISEZ-MOI — dépôt du lot MODE-DEV

**22 fichiers : 3 nouveaux, 18 modifiés, plus ce fichier-ci (à ne pas déposer).**

L'archive reproduit l'arborescence du dépôt. GitHub **ne décompresse pas** une
archive : décompresse-la sur le téléphone, puis téléverse **dossier par
dossier** via *Add file → Upload files*.

⚠ **Piège à éviter** : téléverser depuis la racine des fichiers destinés à
`test/` les dépose à la racine. Fais un envoi par dossier.

## Ordre de dépôt

1. `src/sim/` — 8 fichiers (`mode-developpeur.js` est NOUVEAU)
2. `src/ui/` — 2 fichiers (`sauvegarde-portable.js` est NOUVEAU)
3. `src/index.src.html`
4. `test/` — 8 fichiers (`mode-dev.test.js` est NOUVEAU)
5. racine — `CLAUDE.md`, `package.json`, `RAPPORT-lotMODE-DEV.md`

Un seul commit, ou autant que tu veux : `main` n'est rouge à aucune étape
intermédiaire **sauf** si tu déposes `src/` sans `test/` (six épingles de
`SAVE_VERSION` attendent 38) ou `test/` sans `src/` (le nouveau test importe
deux modules qui n'existeraient pas encore). **Dépose `src/` et `test/`
ensemble**, le reste peut suivre.

## Ce que ça fait

- Écran Options → **Sauvegarde** : exporter / importer une partie en texte
  hexadécimal, à copier-coller.
- Écran Options → **Mode développeur** : un interrupteur qui rend tout gratuit.
  Le bloc `<div id="options-bloc-dev">…</div>` de `src/index.src.html` se retire
  seul quand tu n'en veux plus — le reste du code tient sans lui.
  ⚠ **Éteins le mode avant de retirer le bloc**, sinon la partie reste allumée
  sans interrupteur pour l'éteindre.

## Vérifié

`npm ci && npm run check` → **1 640 pass · 0 fail · 1 skipped**.
`dist/index.html` servi en HTTP et piloté dans Chromium à la géométrie du
S25 FE : 16 vérifications vertes. Détail complet dans `RAPPORT-lotMODE-DEV.md`.

Version `0.99.66` · build `178`. `dist/` n'est pas dans l'archive — la CI le
rebâtit.
