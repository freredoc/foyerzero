# BRIEF — lot ÉCRAN-ACTIONS

## MODÈLE ET EFFORT

**Modèle : Opus 5, effort élevé.** Ce lot touche le DOM et rien d'autre ; le
moteur est déjà écrit et testé. Le travail est du câblage soigneux, pas de la
conception.

**Fichiers joints : aucun — brief autosuffisant.** Tout ce qui suit se lit dans
le dépôt.

---

## 0. Premier geste, sans exception

1. Lire `CLAUDE.md` à la racine, entièrement.
2. `npm ci && npm run check` **avant de toucher quoi que ce soit**, et noter le
   résultat. La base attendue est **306 pass / 0 fail**, `dist/index.html`
   **134 118 octets**, version **0.18.1 · build 19**.
3. Lister `src/ui/` pour voir la structure réelle. Elle bouge entre les
   sessions.

Si la base n'est pas celle-là, **s'arrêter et le dire** plutôt que de bâtir
dessus.

---

## 1. Ce que le moteur sait déjà faire

Rien à écrire dans `src/sim/` ni `src/data/`. Tout est là, testé, falsifié :

| Fonction | Module | Ce qu'elle rend |
|---|---|---|
| `problemesDeLAmelioration(etat, index)` | `sim/state.js` | liste de `{ code, message }`, vide si c'est jouable |
| `ameliorer(etat, index)` | `sim/state.js` | monte d'un niveau, débite, **lève** si refusé |
| `problemesDeLaDemolition(etat, index)` | `sim/state.js` | idem, code `central` pour le Chantier |
| `demolir(etat, index)` | `sim/state.js` | retire, rend 90 %, renvoie le rendu **en unités** |
| `coutDeMontee(id, niveau)` | `data/base.js` | `{ quartz, scorie, electricite }` du palier visé |

⚠ **Les `message` sont déjà écrits en français et déjà chiffrés** — « il manque
14 de quartz ». Le toast les affiche tels quels. **Ne pas les réécrire dans
l'UI** : deux formulations pour la même cause divergeront.

⚠ **Ne jamais appeler `ameliorer` ou `demolir` sans passer par la fonction
`problemes…` d'abord.** Elles lèvent, et une exception non attrapée fige
l'écran. Le chemin est : problèmes → si vide, agir ; sinon, toast.

**Réparer n'a pas d'équivalent moteur.** `REPARATION_BASE_JOUEUR` existe dans
`data/base.js`, mais aucune fonction ne répare, et aucun bâtiment ne porte de
dégâts aujourd'hui. Voir §7.

---

## 2. Le modèle d'interaction — il CHANGE

Aujourd'hui : on sélectionne un bâtiment, puis les boutons s'activent. Les trois
boutons sont désactivés en dur dans `selectionner()` de `src/ui/chantier.js`,
avec ce commentaire :

> `// Ils restent désactivés : la couche d'action n'existe pas.`

Arbitré par Ethan le 27/08, le nouveau modèle est **l'inverse** :

```
1. le joueur touche AMÉLIORER  →  le bouton passe en mode « armé »
2. le joueur touche un bâtiment de la grille
3a. ressources suffisantes  →  l'action se fait, l'écran se rafraîchit
3b. sinon                   →  TOAST d'échec, l'action ne se fait pas
4. dans les deux cas, le mode armé se DÉSARME
```

Identique pour **DÉMOLIR** et **RÉPARER**.

**Ce qu'il faut trancher et écrire dans le rapport :**

- Un deuxième appui sur le bouton armé le **désarme** (c'est l'attendu).
- Armer AMÉLIORER quand DÉMOLIR est armé **désarme DÉMOLIR** : un seul mode à
  la fois.
- Toucher une case **vide** en mode armé : désarme sans toast, comme un clic à
  côté d'un menu.
- Le mode armé doit se **voir** — l'état d'un bouton armé n'est pas l'état d'un
  bouton désactivé, et le joueur doit savoir pourquoi son prochain toucher ne
  fera pas ce qu'il fait d'habitude.

---

## 3. Les cases distinguées : le collecteur seulement

Aujourd'hui, toucher n'importe quel bâtiment de la palette distingue ses cases
légales. Arbitré le 27/08 : **seul le collecteur** garde cette distinction.

C'est le seul bâtiment pour qui le terrain compte — `CHAMPS.posableDessus` ne
contient que `'collecteur'`. Pour les dix autres, toute case libre de la bande
convient, et distinguer soixante cases sur soixante-douze n'apprend rien.

⚠ **Ne pas retirer la distinction en retirant la vérification.** La pose reste
refusée aux mêmes endroits qu'avant : c'est l'AFFICHAGE qui disparaît, pas la
règle. `problemesDeLaPose` ne change pas d'une ligne, et le toucher d'une case
illégale continue de dire pourquoi (c'est la vérification appareil 17, qu'Ethan
a passée OK).

---

## 4. La désélection après la pose

Arbitré le 27/08 : **une fois le bâtiment posé, la palette se désélectionne
immédiatement.** Le joueur qui veut en poser deux resélectionne.

Le rappel `apresPose` existe déjà dans `session.js` — il sert à sauvegarder tout
de suite. C'est le bon endroit pour désarmer aussi, mais **vérifier l'ordre** :
la sauvegarde doit rester la première chose faite après une pose (c'est la
vérification appareil 19, passée OK sur navigateur, à refaire sur appareil).

---

## 5. La barre de gauche disparaît, l'UI se centre

Arbitré le 27/08 :

1. **Retirer la barre de gauche** de l'écran base, avec son compteur de cases.
2. **Centrer** l'UI base dans la largeur disponible.
3. S'il reste des pixels, les **répartir également** à gauche et à droite —
   pas tout d'un côté.

⚠ **CE QUI DISPARAÎT AVEC ELLE.** Le compteur d'emplacements `poses / ouverts`
est ce que la vérification appareil 18 lit pour constater qu'une pose a eu lieu,
et ce que la 20 lit pour savoir que la base est pleine. Les deux vérifications
devront être réécrites après ce lot ; le signaler dans le rapport plutôt que de
les laisser pointer un élément supprimé.

⚠ **NE PAS ZOOMER POUR CENTRER.** `transform: scale()` sur le conteneur casse
la correspondance entre le doigt et la case. Centrer par la mise en page —
marges automatiques, `justify-content` — jamais par une transformation.

---

## 6. La saturation se dit au clic, plus dans un compteur

La vérification appareil 20 est notée **KO** par Ethan : aujourd'hui, la base
pleine ne s'annonce pas avant qu'on essaie. Et le compteur qui l'annonçait part
au §5.

Arbitré le 27/08 : **si la limite d'emplacements est atteinte, un toast au clic
de sélection du bâtiment.** Le joueur touche une vignette de la palette, et le
toast lui dit que la base est pleine — avant qu'il ne cherche une case.

Le nombre d'emplacements se lit par `emplacementsDuNiveau(niveau)` de
`data/base.js` — le niveau étant celui du **Chantier**, pas la moyenne des
bâtiments. Au niveau 1 il vaut **2**, dont un pris par le Chantier lui-même :
une base neuve n'a qu'**un** emplacement libre.

---

## 7. Réparer — à trancher avant de coder

Ethan demande le même fonctionnement pour RÉPARER. Or **rien ne répare
aujourd'hui** : `REPARATION_BASE_JOUEUR` est une table de calibrage, aucun
bâtiment ne porte de dégâts, et aucune fonction n'existe dans `sim/`.

**Ne pas inventer un moteur de réparation dans l'UI.** Deux issues acceptables,
au choix, à écrire dans le rapport :

- câbler le bouton sur le même modèle, et lui faire dire au toast que rien
  n'est endommagé — le chemin existe, il n'a simplement rien à réparer ;
- laisser RÉPARER désactivé et le noter comme ouvert.

La première est préférable : elle rend le lot complet côté interaction, et le
jour où les dégâts arriveront il n'y aura qu'une fonction à brancher.

---

## 8. Versionnage

Le brief ne propose aucun numéro ; **bumper `version` ET `config.build`
ensemble**, en choisissant le numéro disponible au moment de l'exécution.

`dist/index.html` va changer, donc le bump est dû. Après le bump, **mettre à
jour `CLAUDE.md` §0** — le nombre de tests ET le nombre d'octets. Une garde
(`test/documentation.test.js`) le vérifie et fera tomber la suite sinon. C'est
voulu : ne pas toucher à ce test, mettre le fichier à jour.

---

## 9. Ce qui doit être vrai à la fin

- `npm run check` **vert**, avec **plus** de tests qu'au départ.
- `node tools/audit-maquette.mjs` **vert**.
- Chaque composant modifié **rendu à l'écran et cliqué**. `node --check` et un
  démarrage sans erreur laissent passer les défauts de rendu — c'est écrit dans
  `CLAUDE.md` et ça s'est déjà produit.
- Les six actions exercées **de bout en bout** : améliorer avec les ressources,
  améliorer sans, démolir un collecteur, démolir le Chantier (refusé), poser
  avec désélection, palette pleine.

⚠ **Un test qui asserte le champ que le patch vient d'écrire ne peut pas
échouer.** Pour chaque garde ajoutée, écrire dans le rapport **quel montage la
ferait tomber**. La meilleure preuve reste une assertion existante qui passe de
KO à PASS.

---

## 10. Livrable final obligatoire

`RAPPORT-lotECRAN-ACTIONS.md`, écrit sur le disque en fin de session, contenant :

- version et build réellement produits ;
- compte de tests avant / après, octets de `dist/index.html` avant / après ;
- chaque arbitrage du §2 tranché, avec ce qui a été choisi ;
- l'issue retenue pour RÉPARER (§7) ;
- pour chaque test ajouté : le résultat **et le montage qui le falsifierait** ;
- les vérifications appareil 18 et 20 **réécrites**, puisque l'élément qu'elles
  lisaient a disparu ;
- les écarts au brief et leurs raisons ;
- ce qui reste ouvert.

**Relire ce rapport en lecteur hostile avant de le rendre.** Corriger tous les
défauts trouvés — ne jamais livrer en signalant un défaut connu.
