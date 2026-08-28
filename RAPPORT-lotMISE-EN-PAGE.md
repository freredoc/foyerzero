# RAPPORT — lot MISE EN PAGE

Deuxième des trois lots répondant à la liste du 28/08. Il prend la **structure de
la page** ; le suivant prendra la pose en deux temps et le déplacement.

**Version produite : 0.23.0 · build 24.** `dist/index.html` : 153 505 →
**156 633 octets** (+3 128), SHA-256
`5434c7bf4489d706deeb6a6c499a4741984a40dbbb85f6a03588836c4bf80956`, 0 référence externe. `SAVE_VERSION` **inchangée à 6**.

**Suite : 326 → 332 pass / 0 fail** — six tests ajoutés, quatre réécrits, aucun
retiré ni assoupli. `audit-maquette.mjs` : **vert** (la maquette a suivi la
nouvelle navigation, sinon elle enseignerait une barre du bas que le jeu ne fait
plus).

---

## 1. L'en-tête a quitté l'écran de la base — et c'est tout le lot

> « Garder la barre quartz scories etc et monde option dans le menu offense »

Les onglets et le bandeau des ressources vivaient **dans** `#ecran-chantier` :
passer à l'Offense les faisait disparaître. La page a donc changé de forme.

```
body
  #jeu                      ← ce que le banc cache, d'un seul geste
    #tete-onglets           Base | Mission | Recherche | Monde | Options
    #ressources             quartz · scorie · élec. · compteur contextuel
    #navigation             ◀  Base 1 / 1  ▶
    #ecrans
      #ecran-chantier       champ · avis · contexte · palette
      #ecran-offense        avis · vagues · palette
      #ecran-options        version (et le geste qui ouvre le banc)
      #chantier-alerte      (par-dessus, sauvegarde illisible)
    #barre-bas              Base | Défense | Offense
  #banc
```

Trois conséquences que je n'avais pas prévues en commençant, et qui sont
maintenant écrites dans `CLAUDE.md` :

- **L'ordre du document est l'ordre de l'écran, jamais un `order` CSS.** Le même
  dessin obtenu par `order` casserait la navigation au clavier et la lecture par
  un lecteur d'écran. Un test compare les **positions** des identifiants dans le
  HTML produit.
- **L'écran demande, la session décide.** `ui/chantier.js` construit la barre du
  bas — il a les formateurs et l'état — mais un de ses trois boutons change
  d'**écran**, ce que seule la session sait faire. Il appelle `versEcran`, comme
  il appelle déjà `apresPose` pour écrire. Un test refuse que l'écran de la base
  nomme `ecran-offense` en dur.
- **Le banc cache `#jeu`, plus les écrans un par un.** Il en nommait deux ; avec
  trois écrans et deux barres communes, en oublier un n'était qu'une question de
  temps — le banc se serait ouvert par-dessus les onglets restés visibles.

L'écran Offense y perd son en-tête et sa barre de retour : le retour se fait par
le bouton « Base », qui est là de toute façon, et ses deux chiffres d'armée
absents se disent maintenant une seule fois, dans le compteur commun.

## 2. Onglets : Mission arrive, Chantier devient Base

> « En haut entre recherche et chantier (a renommer base) onglet mission. Bouton
> mort pour l'instant. futur tuto. »

Cinq onglets : **Base · Mission · Recherche · Monde · Options**. Mission,
Recherche et Monde sont désactivés et le montrent (opacité 0,45, règle générale
de la feuille). **Options ne l'est plus** — voir le point suivant.

## 3. La barre du bas entière, et l'écran Options qu'elle a rendu nécessaire

> « Les boutons base défense offense doivent prendre toutes la place en bas,
> virer la version du jeu dans les options. »

Trois boutons égaux, pleine largeur. Deux font **défiler** la même grille, le
troisième change d'**écran** ; ils se ressemblent maintenant, ce qui est ce que
tu demandes — le lot précédent les séparait par un filet, précisément pour
l'éviter. Ce qui dit où l'on est, c'est le contenu de l'écran.

### ⚠ Et c'est ici qu'était le piège du lot

Le numéro de version **porte l'appui long de 1,5 s qui ouvre le banc d'essai**.
Le sortir de la barre du bas sans lui donner d'abri l'aurait rendu inatteignable
— et **T10 de `banc.test.js` serait resté vert**, puisqu'il exige la *présence*
des contrôles dans le HTML livré, pas leur accessibilité au doigt.

D'où `#ecran-options`, et l'onglet Options qui cesse d'être mort. Un test neuf
garde les deux ensemble : l'élément existe, l'onglet n'est pas `disabled`, et la
session écoute l'appui long **sur cet élément-là**.

## 4. Le compteur suit le contexte

> « Quand on passe en défense, le nombre d'emplacement change pour celui des
> points de défense. Idem pour offense. »

| écran / bande | libellé | valeur |
|---|---|---|
| Base | Emplac. | `1 / 2` |
| Défense | Pts déf. | **—** |
| Offense | Pts off. | **—** |

Le **libellé** change, comme demandé. La **valeur** reste un tiret pour les deux
autres : `sim/state.js` ne porte ni garnison ni armée d'assaut — `ui/defense.js`
et `ui/arsenal.js` sont des éditeurs dont rien n'est sauvegardé. Inventer un
chiffre serait pire que le tiret. `CONTEXTES[x].chiffre` dit si la grandeur
**existe**, pas si elle vaut zéro.

⚠ **L'écran l'emporte sur la bande** pour décider du contexte : sur l'Offense,
allumer « Base » parce que le défilement s'y était arrêté dirait au joueur qu'il
regarde sa base alors qu'il regarde ses vagues.

## 5. La palette tient dans l'écran

> « Faire rentrer dans l'ui tout les bâtiments du bas c'est à dire les deux
> rangées de 5 boutons. »

Deux rangées, plus de défilement horizontal. Elle avait des colonnes de 82 px :
la première vignette était coupée et deux bâtiments vivaient hors de l'écran.

⚠ **Une nuance sur le « 5 »** : il y a **onze** bâtiments, donc deux rangées font
**six** colonnes, pas cinq. Le nombre se **calcule** —
`Math.ceil(posables.length / 2)` — plutôt que de s'écrire : « 6 » marcherait
aujourd'hui et mentirait au douzième bâtiment. Mesuré dans un bouchon DOM : 11
vignettes, `repeat(6, minmax(0, 1fr))`, aucun débordement.

## 6. La bascule entre bases

> « Rajouter une barre spus quartz scories etc. Y mettre a gauche une flèche et
> droite une flèche. Elles serviront aux joueurs de basculer d'une base à
> l'autre. »

Barre ajoutée sous les ressources : `◀  Base 1 / 1  ▶`.

**Coquille assumée, et qui se dit telle.** L'état porte UNE `disposition` : il
n'y a structurellement qu'une base. Les deux flèches sont donc **désactivées**,
et le libellé « 1 / 1 » dit pourquoi mieux qu'une infobulle. Les rendre vives sur
du vide promettrait une bascule qui n'existe pas — la faute exacte du bouton
« Assaut » du lot ÉCRAN-CHANTIER, qu'on a passé un lot à réparer.

---

## 7. Tests

**Six ajoutés, quatre réécrits, aucun retiré ni assoupli.**

| Test | Résultat |
|---|---|
| `mise en page — l'en-tête est COMMUN aux écrans, il n'appartient plus au Chantier` | PASS |
| `compteur — le libellé suit le contexte, et la valeur reste honnête` | PASS |
| `navigation — la bascule entre bases est une coquille, et elle le dit` | PASS |
| `barre du bas — trois boutons égaux, et le troisième DEMANDE l'écran` | PASS |
| `palette — les onze vignettes tiennent en deux rangées, sans défilement` | PASS |
| `options — le banc reste atteignable après le déménagement de la version` | PASS |

Les quatre réécrits portaient sur des identifiants qui ont déménagé
(`chantier-onglets`, `chantier-ressources`, `chantier-bandes`,
`chantier-version`, `offense-tete`, `offense-vers-chantier`). Ils assertent
maintenant que ces noms **ont disparu** — deux bandeaux de ressources, l'un dans
l'écran et l'autre au-dessus, se rempliraient chacun de leur côté et l'un des
deux mentirait.

### Falsification — neuf mutations, une à la fois

| Mutation | Verdict |
|---|---|
| les onglets remis à l'intérieur de `#ecran-chantier` | ROUGE ✔ |
| le compteur garde toujours le libellé « Emplac. » | ROUGE ✔ |
| les flèches de bascule redeviennent vives | ROUGE ✔ |
| le nombre de colonnes écrit en dur | ROUGE ✔ |
| la palette redéfile horizontalement | ROUGE ✔ |
| la version reste dans la barre du bas | ROUGE ✔ |
| le banc cache les écrans un par un | ROUGE ✔ |
| l'onglet Options redevient mort | ROUGE ✔ |
| l'écran nomme `ecran-offense` en dur | ROUGE ✔ |

Sources byte-identiques à leurs sauvegardes en fin de campagne.

⚠ **Une garde a de nouveau failli se satisfaire de sa propre prose** — la
troisième fois en deux lots. Le test qui vérifie que `offense-tete` a disparu le
trouvait dans le commentaire qui **raconte** sa disparition. Corrigé de la même
manière que les précédentes : la garde lit le HTML **décommenté**. Une garde ne
doit lire que du code, jamais ce qu'on a écrit à son sujet.

---

## ⚠ Vérifications appareil — NON EXÉCUTÉES

1. **Les onze vignettes de la palette tiennent** sans défilement, et aucune
   n'est coupée sur les bords.
2. **Passer en Offense garde** les onglets, les ressources et la barre du bas.
   Le compteur devient « Pts off. — ».
3. **Le banc s'ouvre toujours** : onglet Options, puis appui long de 1,5 s sur le
   numéro de version. Et « ← Jeu » ramène la page entière, onglets compris.
4. La barre du bas : trois boutons de largeur égale, celui du contexte allumé.
5. Les deux flèches de bascule sont visiblement éteintes.
6. Rien ne déborde en haut ni en bas — l'en-tête a gagné une barre de 26 px, et
   les marges système du lot PANNEAU-ET-MARGES doivent toujours tenir.

## 8. Ce qui reste de ta liste

**Lot suivant — POSE ET DÉPLACEMENT**
- pose en deux temps : premier toucher = bâtiment fantôme + flèches de voisinage,
  second toucher = pose ; les mêmes flèches à l'ouverture du panneau ;
- déplacer un bâtiment, bouton entre Améliorer et Démolir.

**Puis — LA CHAÎNE DE MISE À JOUR**, que tu as signalée en passant : devoir
désinstaller et réinstaller l'APK pour voir une version neuve vide de son sens le
module `maj/` et le manifeste publié par le job `pages`. Tant que ce n'est pas
réglé, rien de ce que je livre ne t'atteint autrement qu'à la main.

**Toujours bloqués par l'état du jeu** : déplacer une défense ou des unités
d'attaque, et les vraies valeurs des points de défense et d'offense.
