# AMENDEMENT au BRIEF ÉCRAN-CHANTIER — la navigation, le miroir, le coût

## MODÈLE ET EFFORT

**Opus 5, effort élevé.** Suite du lot ÉCRAN-CHANTIER (PR 12). Lot DOM : la
preuve reste le test sur appareil.

**Fichiers joints : aucun — amendement autosuffisant.**

---

## 0. D'où ça vient

La PR 12 a été **essayée sur GitHub Pages** le 27/08. Elle fonctionne. Ethan a
relevé quatre écarts, tous confirmés dans le code avant d'être écrits ici. Trois
touchent la NAVIGATION, un touche un chiffre affiché.

Il a fourni trois captures de Tiberium Alliances, la référence du jeu — base,
défense, offense. Elles ne sont pas au dépôt ; ce document en porte ce qui a été
lu.

⚠ **Confronter d'abord.** `npm ci && npm run check`, et consigner. Référence
après la PR 12 : **271 pass / 0 fail** · `dist/index.html` **123 785 octets**,
SHA-256 `ba594508…45702` · **0.13.0 · build 13**.

---

## 1. LE MIROIR — la base d'abord, le déploiement en dernier

**Constat mesuré.** `src/ui/chantier.js` écrit `case_.style.gridRow = rangee`,
et le segment de rail `gridRow = bande.premiere / span …`. La rangée 1 tombe
donc en **ligne 1 de la grille CSS**, donc au premier plan de l'écran. L'écran
montre aujourd'hui, dans l'ordre de lecture : déploiement, défense, bâtiments.

**C'est l'inverse de ce qu'il faut.** De haut en bas :

| À l'écran | Rangées | Ce que c'est |
|---|---|---|
| en premier | **18 → 11** | les bâtiments — 8 rangées × 9 |
| au milieu | **10 → 3** | la défense — 8 rangées × 9 |
| en dernier | **2 → 1** | le déploiement — 2 rangées × 9 |

**Le modèle ne bouge pas d'un pouce.** La rangée 18 reste la rangée 18, la
rangée 1 reste celle d'où arrivent les vagues. C'est une transformation
d'AFFICHAGE, et une seule :

```
ligne CSS = GRILLE.longueur + 1 − rangée
```

À appliquer aux **deux** endroits — les cases et les segments de rail. Pour un
segment, la ligne de départ se calcule depuis sa rangée la plus HAUTE en numéro.

⚠ **NE JAMAIS EMPLOYER LE MOT QUE CE DOCUMENT ÉVITE PARTOUT** — celui qui
désigne le sommet. Il a coûté un lot le 26/08 : selon qu'on regarde l'écran ou
les numéros de rangée, il désigne l'un ou l'autre bout de la bande. Dire « la
rangée 18 », « le fond », ou « la première ligne d'écran », qui sont trois
choses non ambiguës. Ce document ne l'emploie nulle part, y compris dans ses
titres — et un balayage l'a vérifié.

⚠ **La même vue servira à regarder une base de l'OUVRAGE en raid.** Ethan :
« il faut toujours que la base, quoi qu'il arrive, joueur ou Ouvrage, soit
[d'abord], puis défense, puis les deux petites rangées ». C'est la même
géométrie des deux côtés — `GEOMETRIE_BASE` de `data/base.js` référence `GRILLE`
justement pour ça. Écrire ce retournement en dur dans l'écran Chantier
l'obligerait à être réécrit pour le raid : le sortir dans une fonction pure,
testable sans DOM, avec sa réciproque.

---

## 2. DEUX ÉCRANS, PAS TROIS BANDES

**Ce qu'Ethan décrit, mot pour mot :** « quand on arrive sur le jeu, on arrive
sur notre base. On fait défiler sur notre défense […]. Base et défense, c'est le
même [écran], et on fait scroller comme prévu. Et par contre, il faut un passage
dans un autre écran pour voir l'offense. »

### 2.1 L'écran Base — deux bandes, un seul défilement

La barre du bas passe de **trois boutons à deux** : **Chantier** et **Défense**.
Le défilement reste continu — ce sont deux repères dans la même grille, pas deux
écrans. Le jeu s'ouvre sur le Chantier.

Chaque bouton garde **son** niveau : Chantier `4,6`, Défense `—`.

⚠ **Le bouton « Assaut » sort de cette barre.** Il pointait sur les rangées 1–2,
qui sont l'endroit où les vagues **apparaissent** pendant un combat — pas celui
où on les **compose**. C'était une erreur de ma part dans le brief initial.

### 2.2 L'écran Offense — un autre écran, atteint par un bouton

**Quatre vagues de neuf.** Ce n'est pas une invention : `EMPLACEMENTS_ASSAUT` de
`data/sites.js` vaut `{ vagues: 4, parVague: 9 }` — **36 emplacements**. La
donnée était là avant la question.

Ce que la capture de référence montre, et qu'il faut reprendre :

- quatre rangées empilées, chacune titrée — « Vague d'attaque 1 », puis
  « Vague d'attaque 2 (+10 s) », 3, 4 : **les vagues suivantes partent
  décalées**, et le décalage s'affiche sur le titre ;
  ⚠ `GRILLE.intervalleVagueSec` vaut **5**, pas 10. La capture est celle d'un
  autre jeu. **Lire la table, ne pas recopier l'image** — et si l'écart mérite
  d'être discuté, le dire dans le rapport, pas le trancher.
- le niveau de l'armée en tête d'écran, et le budget de points d'armée
  consommé / disponible ;
- une palette d'unités en bas, avec pour chacune son coût en points.

⚠ **RIEN NE PEUT ÊTRE COMPOSÉ AUJOURD'HUI, et c'est à dire, pas à contourner.**
L'état du joueur ne porte pas d'armée : `serialiser` écrit `position`,
`fondation`, `disposition` et `economie`, rien d'autre. `ui/arsenal.js` est un
**éditeur** dont la sortie n'est sauvegardée nulle part.

Cet écran se fait donc en **coquille honnête** : les 36 emplacements dessinés et
vides, le niveau à `—`, la palette **présente et désactivée**, et un mot qui dit
que la composition d'armée n'existe pas encore. Exactement le traitement des
trois boutons d'action de l'écran Base. Ne pas inventer d'état d'armée : ce
serait choisir seul une forme qu'Ethan n'a pas arbitrée.

### 2.3 Le passage entre les deux

Un bouton dans chaque sens, visible, qui dit où il mène. Le jeu s'ouvre toujours
sur la Base.

⚠ La boucle de jeu et la sauvegarde **ne s'arrêtent pas** quand on passe à
l'Offense — l'économie continue de tourner. Vérifier que `suspendre()` /
`reprendre()` de `ui/session.js` ne sont pas appelés au passage : ils sont là
pour le banc d'essai, qui remplace l'écran, pas pour une navigation interne.

---

## 3. LE NIVEAU 1 EST GRATUIT — la palette ment

**Constat mesuré.** `chantier.js` affiche `COUT_NIVEAU_DEUX[classeDeCout]` sur
chaque bâtiment posable, sous forme d'un **nombre nu** : 8 / 5 / 3 / 2. Ça se lit
« poser coûte 3 ».

Or `ECONOMIE_NIVEAU.premierNiveauPayant` vaut **2** : **poser au niveau 1 ne
coûte rien.** Le fichier le sait — un commentaire de `chantier.js` l'écrit noir
sur blanc — et affiche le chiffre quand même.

Ce nombre est le coût de la **première amélioration**, celle du niveau 1 vers le
niveau 2. Il doit le dire, ou disparaître de la vignette de pose.

⚠ **Ne pas se contenter de changer un libellé.** Vérifier que le même chiffre
n'est pas lu ailleurs comme un coût de pose — le bandeau contextuel porte déjà
un « Améliorer » avec un niveau cible.

⚠ **Une part de scorie n'est PAS arbitrée.** `COUT_NIVEAU_DEUX` donne un nombre
unique et `COUT_ELECTRICITE` une fraction du coût **en quartz** ; rien ne dit
comment le total se répartit entre quartz et scorie depuis que le modèle du lot 1
est parti avec `params.js`. **Ne pas inventer une répartition pour rendre
l'affichage plus riche.** Un nombre sans ressource, dit comme tel, est plus
honnête qu'un « 3 quartz » faux.

---

## 4. Ce qui est confirmé et ne bouge pas

- **La palette du bas défile horizontalement.** Le rapport de la PR 12 la
  signalait comme à confirmer : la référence fait pareil, sur une bande unique.
  Question close.
- **Les couleurs de terrain de la fiche restent inemployées.** `#9FB3C5` ·
  `#C1CEDA` · `#382E47` sont dans `FICHE-STYLE.md` depuis le 27/08 mais leur
  emploi n'est **toujours pas arbitré**. Ne pas trancher seul.
- **Le banc derrière l'appui long sur le numéro de version** : gardé tel quel.
- **La garde §11 retournée** : gardée telle quelle, elle est juste.

---

## 5. Deux points relevés, à signaler et NON à traiter

À écrire dans le rapport pour que quelqu'un les arbitre, pas à coder :

1. **La bande de défense du joueur n'a ni garnison ni obstacles.** La référence
   montre des trous d'eau, des gravats et des souches dans la zone de défense.
   `OBSTACLES` existe (`{ nombre: 10, … }`) mais **seul `sim/generateur.js` en
   pose**, pour un site de l'Ouvrage. Rien n'en pose sur la base du joueur, et
   rien ne dit qu'il devrait y en avoir.
2. **Le niveau se lit à deux décimales dans la référence** (« Niv. base :
   55.28 »). Ethan a arbitré **une** décimale le 27/08, et `niveau-de-base.js`
   range des dixièmes. **L'arbitrage prime sur la capture.** Le signaler, ne rien
   changer.

---

## 6. Ce qui doit être vrai à l'arrivée

- `npm run check` **vert**, compte mesuré et consigné ;
- `node tools/audit-maquette.mjs` toujours vert ;
- `CLAUDE.md` §0 et §2 à jour — `documentation.test.js` les asserte contre le
  disque, **noms de fichiers compris** ;
- **bumper `version` ET `config.build` ensemble**, au numéro disponible au
  moment de l'exécution. **Aucun numéro n'est proposé ici.**
- `foyer-zero-ui.html` **est maintenant faux sur la navigation** : il montre
  trois bandes et une grille non retournée. Soit le reprendre dans ce lot, soit
  écrire au rapport qu'il est périmé sur ce point — `tools/audit-maquette.mjs`
  ne regarde pas la navigation et ne le dira pas.

### Tests

Sans DOM, donc ce qui est testable l'est vraiment :

- **la transformation de miroir et sa réciproque** — fonction pure, aller-retour
  sur les 18 rangées, et le fait que la rangée 18 tombe en première ligne
  d'écran et la rangée 1 en dernière. Falsifier : une identité passerait un
  aller-retour, il faut asserter la position.
- **la bande de chaque rangée** après retournement, aux quatre frontières
  (2/3 et 10/11), lues depuis `GRILLE.bandes` et jamais écrites en dur ;
- **les 36 emplacements d'assaut** comptés depuis `EMPLACEMENTS_ASSAUT` ;
- **le coût affiché** : un test qui asserte qu'aucune vignette de pose ne
  présente `COUT_NIVEAU_DEUX` comme un coût de pose.

### Appareil — la preuve

Galaxy S25 FE. **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais
passé.** Les six de la PR 12 n'ont **aucune** été exécutée : elles restent dues.
Six de plus ici :

7. le jeu s'ouvre sur le Chantier, bâtiments en premier à l'écran ;
8. en défilant vers le bas on passe la défense, puis les deux rangées de
   déploiement ;
9. le bouton mène à l'Offense, et on en revient ;
10. les quatre vagues de neuf sont visibles et vides ;
11. l'économie a continué de tourner pendant le passage à l'Offense ;
12. aucune vignette de pose ne présente un coût comme un coût de pose.

---

## 7. Livraison

- **PR.** Le merge sur `main` appartient à Ethan seul.
- **`RAPPORT-ECRAN-NAVIGATION.md` écrit sur disque**, à la racine : version et
  build réellement produits · taille et SHA-256 du `dist/index.html` produit ·
  chaque test avec son montage effectif · **les douze vérifications appareil,
  une par une, exécutées ou déclarées non exécutées** · les deux points du §5 ·
  écarts par rapport à cet amendement et leurs raisons · points en suspens.
- **Ne jamais livrer en signalant un défaut connu.** Le corriger avant.
