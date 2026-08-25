# RAPPORT — lot 5C · le banc en sens Défense

## Version produite

| | |
|---|---|
| `version` | **0.11.0** (était 0.10.0) |
| `config.build` | **11** (était 10) |
| `dist/index.html` | **80 962 octets** (79,1 Kio) — était 80 333 |

Le brief ne proposait aucun numéro : 0.11.0 / 11 est le couple disponible au
moment de l'exécution, bumpé ensemble.

---

## Fichiers touchés

| fichier | avant | après | delta |
|---|---:|---:|---:|
| `src/render/scene.js` | 23 972 | 27 581 | **+3 609** |
| `src/ui/banc.js` | 27 517 | 42 560 | **+15 043** |
| `src/index.src.html` | 5 269 | 6 956 | **+1 687** |
| `test/defense.test.js` | 22 254 | 25 100 | **+2 846** |
| `test/banc.test.js` | 12 955 | 14 445 | **+1 490** |
| `package.json` | 486 | 486 | 0 (deux valeurs remplacées) |

**`src/ui/defense.js` : INTACT**, vérifié par `git diff --exit-code`.
**`montageDuBanc` : INTACT**, vérifié octet pour octet (923 octets, corps
identique entre `HEAD` et l'arbre de travail) — les six tests qui en dépendent
ne pouvaient donc pas bouger.
**Aucun des 148 tests d'avant retouché** : `git diff -U0 test/` ne compte
**0 ligne supprimée**. Les deux fichiers de test sont en ajout pur.

---

## Compte de tests

| | |
|---|---|
| avant le lot | **148** — 148 PASS, 0 KO |
| après le lot | **150** — 150 PASS, 0 KO |

`npm run check` (build + tests) passe : build à 80 962 octets sans référence
externe, puis `1..150 / # pass 150 / # fail 0`.

### T15 — l'alignement de `listeDefense` · **PASS**

`test/defense.test.js`, `ok 82`.

**Montage effectif.** Une grille `defenseVide(50)` remplie de **48 `meute`**
(Fusiliers, 5 pts pièce = 240 points sur un budget de 290) — colonnes 1 à 6 de
chacune des huit rangées, six par rangée, ce que la règle permet exactement.
Puis, pour chacun des trois viewports `[412,810]`, `[360,640]`, `[800,800]` :
`listeDefense(grille, projection)`, filtre `forme === 'cadre'`, et

- `cadres.length === NB_EMPLACEMENTS` (72) ;
- `new Set(cadres.map(c => c.x))` **deepEqual** `{xDeColonne(p, 1..9)}` ;
- `new Set(cadres.map(c => c.y))` **deepEqual** `{yDeRangee(p, 3..10)}` ;
- 72 couples `(x, y)` distincts ;
- chaque cadre à `projection.tailleCase` de côté.

**Deux pièges rencontrés, et pourquoi le montage est celui-là.**

1. **Remplir avec une structure fausse le filtre.** `dessinerStructure` pousse
   elle aussi un `cadre` : une grille de `merlon` rend **76** primitives
   `cadre` pour 72 cases. `dessinerEscouade` ne pousse que des `rect` — d'où
   le remplissage à l'infanterie, qui laisse le filtre ne voir que les cadres
   de case.
2. **Remplir en quinconce affaiblirait le test.** Les colonnes 1 à 6 sont
   remplies dans *chaque* rangée, jamais en quinconce : un dessin qui ne
   cadrerait que les cases occupées rendrait alors six abscisses au lieu de
   neuf, et l'égalité d'ensembles le ferait tomber. En quinconce, il passerait.

L'assertion de couples distincts est un ajout au brief : deux cadres empilés
sur une même case satisfont les deux ensembles séparément, et le brief ne
l'attrapait pas.

### T16 — la page porte ses éléments · **PASS**

`test/banc.test.js`, `ok 27`.

**Montage effectif.** Lecture de `dist/index.html` produit, et présence des
cinq identifiants `banc-defense`, `banc-defense-ouvrir`, `banc-palette-defense`,
`banc-compteur-defense`, `banc-sens`. Plus une assertion sur le sélecteur :
`[...html.matchAll(/<option value="(raid|defense)"/g)]` vaut exactement
`['raid', 'defense']` — les deux sens, `raid` en premier, donc par défaut faute
de `selected`.

**Écart assumé sur la forme.** Le brief dit « étendre la boucle du T10 », mais
il attend **aussi** un total de 150 et, au §10, « les 148 tests d'avant tous
verts et **aucun retouché** ». Les deux ne tiennent qu'en écrivant un test à
part : étendre T10 aurait laissé le compte à 149 **et** retouché l'un des 148.
T10 est donc intact et T16 est un test neuf. C'est écrit en commentaire dans
le test lui-même.

---

## Les six tests appareil — **NON EXÉCUTÉS**

Ils sont hors de portée du harnais : le dépôt n'a ni jsdom ni navigateur de
test, et ce lot n'en ajoute aucun. Ils restent à faire tourner par Ethan sur
appareil.

1. Ouvrir la Défense, poser six pièces sur une rangée, vérifier que la septième
   est refusée **et que le statut nomme la rangée**. — **non exécuté**
2. Poser une Faucheuse en rangée 3 : le marquage apparaît, et le statut dit
   « engagement réduit », **jamais** « inerte ». — **non exécuté**
3. Basculer en sens Défense au niveau 30, lancer : les défenseurs portent les
   noms du JOUEUR, les attaquants ceux de l'Ouvrage. — **non exécuté**
4. Sens Défense au niveau 5 : le sélecteur est grisé et la raison est lisible.
   — **non exécuté**
5. Changer la graine avec une composition posée : rien ne disparaît en silence.
   — **non exécuté**
6. Ouvrir l'Arsenal quand la Défense est ouverte : l'une se ferme.
   — **non exécuté**

### Ce qui a tout de même été mesuré, et où

Faute d'appareil, les six scénarios ont été **rejoués dans un Chromium de
bureau au gabarit 412 × 915, réseau coupé** (toute requête non `file:` avortée).
Ce n'est **pas** un test appareil et ne le remplace pas — c'est ce qui a permis
de trouver et de corriger un défaut avant de livrer. Relevé, tel quel :

```
niveau 5 — option Défense désactivée : true
           libellé : Défense — l'Ouvrage n'attaque pas avant le niveau 10
           bouton Défense désactivé : true
palette : Mur de défense 5 pts | Barbelés 5 pts | Barrière anti-char 5 pts
          | Tourelle mitrailleuse 8 pts | Canon anti-char 10 pts | DCA 10 pts
Mirador rangée 3 : ⚠ (rangée 3, colonne 5) : Mirador n'engage que 32 cases
          sur 50 depuis cette rangée — une artillerie avancée tire moins longtemps.
7e pose rangée 8 : defense : la rangée 8 porte déjà 6 occupants, il faut laisser passer
compteur : 70 / 190 points · 7/72 emplacements · rangée pleine 8 · 1 engagement réduit
Arsenal ouvert  → bloc Défense caché : true  | bloc Arsenal visible : true
Défense rouverte → bloc Arsenal caché : true | bloc Défense visible : true
tout fermé      → les deux cachés : true     | banc-tick visible : false
graine 424242 (aucun obstacle sous une pièce) → compteur inchangé, 70 / 190, 7/72
graine 45 (obstacles en (8,2) et (3,5))       → ⚠ 2 pièce(s) retirée(s) de la
          garnison : un obstacle est apparu en (3, 5), (8, 2) — compteur 40 / 190, 5/72
requêtes bloquées : 0 | erreurs : aucune
```

Le sens des noms (test 3) a été vérifié **dans la couche pure**, ce qui vaut
mieux qu'une lecture de statut : montage niveau 30, garnison de deux Tourelles
mitrailleuses et d'une escouade de Fusiliers, combat joué jusqu'à sa fin
(tick 459). Noms rendus par `nomAffiche` :

```
défense : meute → Fusiliers · casemate → Tourelle mitrailleuse
attaque : crecelle → Crécelle · guetteur → Guetteur · ratisseur → Ratisseur
          busard → Busard · fendeur → Fendeur · frappeur → Frappeur
          belier → Bélier · fouisseurs → Fouisseurs
bâtiments : Souche, Étai, Nœud, Gangue, Terril (un seul nom, des deux côtés)
```

---

## Un défaut trouvé au banc, et corrigé avant de livrer

**`hidden` ne cachait NI le bloc de Défense NI celui d'Arsenal.** Le premier
passage a rendu `Arsenal ouvert → bloc Défense caché : false` alors que la
mécanique d'exclusivité, elle, était juste.

La cause n'est pas dans le JS : `#banc-arsenal` et `#banc-defense` fixent
`display: flex` par **sélecteur d'id** (spécificité 1,0,0), et un id l'emporte
sur la règle `[hidden] { display: none }` de la feuille par défaut (0,1,0).
L'attribut était donc posé correctement et **sans aucun effet visuel**.

C'est un défaut **hérité du lot 5A** : le bloc d'Arsenal en souffrait déjà et
personne ne l'avait vu, faute d'un second bloc à cacher. Corrigé une fois pour
toutes, en tête de feuille :

```css
[hidden] { display: none !important; }
```

`#banc-fin` et `#banc-tick` n'étaient pas touchés — ils ne déclarent aucun
`display`, la règle par défaut y gagnait déjà.

**Fausse alerte de mesure, pour mémoire.** Le même passage a d'abord rendu
« option Défense désactivée : false » au niveau 5. La faute était à l'outil, pas
au code : `isDisabled()` de Playwright ne connaît que `button`, `select`,
`input` et `textarea` — sur un `<option>` il rend toujours `false`. Lu par
`element.disabled`, l'option **est** bien désactivée, et son libellé porte la
raison. Aucun correctif n'a été apporté pour ça.

---

## Écarts par rapport au brief, et leurs raisons

### 1. `depuisDefenseurs` ne fait pas ce que le brief lui prête

Le §6.4 écrit que `depuisDefenseurs(liste, niveau, obstacles)` « refuse les
cases devenues interdites ». **Vérifié : il ne le fait pas.** Il enregistre bien
`interdites`, mais accepte une pièce déjà posée sur un obstacle ; c'est `poser`
qui refuse, et lui seul.

Corriger `defense.js` était interdit (§3, §10). Le banc s'en charge donc, dans
`reconstruireDefense()` : il trie la liste contre les obstacles du site courant
**avant** de la rendre à `depuisDefenseurs`, et **nomme les pièces tombées** au
statut. Testé à la graine 45, qui pose un obstacle en (8,2) et en (3,5) : les
deux pièces tombent, le compteur passe de 70 à 40 points, et le statut le dit.

À arbitrer par Ethan : soit `defense.js` est corrigé pour tenir sa promesse et
le banc simplifie, soit sa signature est celle-ci et le brief se corrige.

### 2. Le panneau de fin se lisait à l'envers en sens Défense

Non demandé, mais le brief pose lui-même la règle (§3) : « un provisoire muet
serait un mensonge d'affichage ».

`butin` et `pointsRecherche` comptent la prise de l'**assaillant**. En sens
Défense, l'assaillant est l'Ouvrage — et le panneau affichait « butin 15 104 237
quartz » sans dire à qui, sous un titre « Souche détruite — butin intégral » qui
désigne alors la Souche **du joueur**. Un calibrage lu là serait pris pour un
gain du joueur.

Trois mots ajoutés, aucune table touchée (`LIBELLES_CAUSE` intact) :

- une ligne d'en-tête, en sens Défense seulement — « sens Défense — l'Ouvrage
  donne l'assaut, le joueur tient le site » ;
- « butin » → « **butin de l'Ouvrage** » ;
- « survivants » → « **survivants de l'Ouvrage** ».

En sens Raid le panneau est **inchangé**, vérifié au banc : ni en-tête, ni
« de l'Ouvrage », ni note de régime.

### 3. Une garnison VIDE se lance — asymétrie voulue avec l'Arsenal

`lancer()` refuse un Arsenal vide, mais accepte une garnison vide. Un assaut
sans unité n'est rien ; un site sans défense reste un site, ses bâtiments
tiennent seuls, et c'est justement la mesure qui sert de plancher au calibrage.
Écrit en commentaire à l'endroit du branchement.

### 4. Le sens Défense grisé sous le niveau 10 est une décision d'interface

Rien ne l'impose côté données : `budgetRaid(5)` rend une valeur par
extrapolation basse et ne lève pas. Le sélecteur est donc grisé par choix, avec
la raison écrite dans le libellé de l'option plutôt qu'un contrôle mort sans
explication — et une règle CSS générale fait que tout contrôle désactivé se
voie.

---

## Vérifications de régime, chiffrées

Les trois notes du panneau de fin ne sont pas décoratives. La deuxième est
conditionnelle : elle ne se déclenche que si le raid laisse des points à quai.
Mesuré sur `genererVague` + `budgetRaid`, graine 1 :

| niveau | budget | unités | engagés | **restants** |
|---:|---:|---:|---:|---:|
| 10 | 30 | 5 | 30 | 0 |
| 20 | 105 | 12 | 105 | 0 |
| 30 | 170 | 18 | 170 | 0 |
| 40 | 225 | 18 | 190 | **35** |
| 50 | 250 | 18 | 195 | **55** |

Le chiffre du brief est retrouvé **exactement** : au niveau 50, 18 unités sur
les dix-huit cases de déploiement, **55 points sur 250 non engagés**. Le plafond
de cases mord avant le budget dès le niveau 40 — le sens Défense y est donc plus
facile qu'il ne devrait, et le panneau le dit. Vérifié à l'écran au niveau 50 :

```
Souche détruite — butin intégral
sens Défense — l'Ouvrage donne l'assaut, le joueur tient le site
tick 215 · butin de l'Ouvrage 4617040137 quartz + 4328475129 scorie
bâtiments provisoires — base du joueur au lot suivant
l'Ouvrage n'a pu déployer que 18 unités sur les dix-huit cases de déploiement,
55 points sur 250 non engagés
```

---

## Relecture hostile — la liste du §10

| point | état |
|---|---|
| `defense.js` intact | ✅ `git diff --exit-code` muet |
| `montageDuBanc` intact | ✅ corps identique octet pour octet (923 o) |
| les 148 tests d'avant verts | ✅ 150/150, dont les 148 |
| aucun test d'avant retouché | ✅ 0 ligne supprimée dans `test/` |
| `verrouilles`, pas `verrouillees` | ✅ `bd.verrouilles` pour la Défense ; `b.verrouillees` reste à l'Arsenal, chacun son registre |
| aucun numéro de version proposé par le brief | ✅ 0.11.0 / 11 choisi à l'exécution |
| aucune référence externe dans le HTML produit | ✅ garde de `tools/build.js` + T10, et 0 requête sortante au banc |
| l'adversaire est l'Ouvrage | ✅ aucune occurrence de « l'IA » |
| « engagement réduit », jamais « inerte » | ✅ statut et compteur |
| deux jeux de noms jamais mélangés | ✅ palette et garnison en noms joueur, assaut en noms Ouvrage |

---

## Points laissés en suspens

1. **`depuisDefenseurs` et sa promesse.** Écart n° 1 ci-dessus. Le contournement
   vit dans `banc.js` ; la correction, si elle vient, appartient à `defense.js`
   et à un autre lot.

2. **Le préfixe `defense : ` fuit jusqu'au statut.** Quand `poser` refuse, le
   banc reprend son message mot pour mot — c'est ce que le doc de `defense.js`
   exige, et l'Arsenal fait pareil. Le joueur lit donc « defense : la rangée 8
   porte déjà 6 occupants ». La rangée est bien nommée, mais l'espace de noms
   du module n'a rien à faire à l'écran. Ni `defense.js` ni les messages ne
   pouvaient être retouchés ce lot.

3. **Pas de base du joueur.** Les bâtiments derrière la ligne restent ceux du
   site, et les trois notes du panneau le disent. Lot suivant.

4. **Pas de sauvegarde.** La garnison vit dans la fermeture d'`initialiserBanc`,
   comme l'Arsenal : elle ne survit pas à un rechargement.

5. **Les six tests appareil ne sont pas exécutés**, et le harnais ne peut pas
   les exécuter. Ils sont listés ci-dessus, prêts.
