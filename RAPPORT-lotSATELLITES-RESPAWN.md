# RAPPORT — lot SATELLITES-RESPAWN

Ethan, 06/09/2026 : « **Un camp ou avant poste rasé = un autre pop direct** »,
puis, sur la case du remplaçant : « **Ailleurs.** »

Version produite : **0.99.9 · build 110**, les deux en chaînes JSON.

---

## 0. La base, relevée

| | avant | après |
|---|---|---|
| `npm test` | **1201 pass / 0 fail** | **1215 pass / 0 fail** |
| `dist/index.html` | 8 000 552 octets | **8 001 031 octets** |
| version | 0.99.8 · build 109 | 0.99.9 · build 110 |
| `SAVE_VERSION` | 26 | **27** |

**La base annoncée par le brief était exacte** — 1 201 pass, 8 000 552 octets,
0.99.8 · build 109. C'est la première fois depuis six lots ; les cinq précédents
partaient d'un brief périmé.

Ventilation du **+479** poste par poste, contre le livrable bâti depuis
`origin/main` :

| poste | avant | après | delta |
|---|---|---|---|
| JavaScript | 355 633 | 356 112 | **+479** |
| feuille | 3 186 734 | 3 186 734 | +0 |
| balisage | — | — | +0 |
| images | 6 306 190 | 6 306 190 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |

La somme des cinq postes tombe **exactement** sur le total. **296 lignes `data:`
avant, 296 après ; 291 URI de part et d'autre.** Borne T10 inchangée à
9 300 000, marge **1 298 969 octets, 13,97 %**.

Fichiers touchés : `src/sim/satellites.js`, `src/sim/state.js`,
`test/satellites.test.js`, `test/reparation.test.js`, `test/bases.test.js`,
`test/temoins-bases-0.js`, `CLAUDE.md`, `package.json`.

---

## 1. Le délai tombe à zéro, et il passe quand même par `attentes`

`detruireSatellite` poussait `tickDu: etat.horloge.nbTicks + TICKS_APPARITION` ;
il pousse `tickDu: etat.horloge.nbTicks`. L'attente est donc **échue**, et
`resoudreSatellites` — le seul endroit du dépôt qui fasse paraître un satellite —
la sert au tick suivant, par le chemin normal.

⚠ **Fabriquer le remplaçant dans `detruireSatellite` a été écarté**, comme le
brief le demande : ce serait un second chemin de création, et les deux
divergeraient au premier réglage.

⚠ **`TICKS_APPARITION` ne bouge pas d'un tick**, et deux choses en dépendent
encore :

- `planifierSatellites`, le peuplement d'une base neuve — **`SAT-R T3`** est le
  test qui attrape un lot qui aurait mis la constante à zéro pour faire passer
  T1 et T2 ;
- la **relève naturelle** dans `resoudreSatellitesDeLaBase`, qui reprogramme à
  `quand + TICKS_APPARITION`. « Rasé » désigne une DESTRUCTION par le joueur, pas
  une expiration — et `satellitesDetruits` fait déjà exactement ce partage.

---

## 2. Le remplaçant paraît ailleurs

### Le mécanisme d'exclusion existait, et il est réemployé

Relevé avant d'écrire une ligne. `poserUnSatellite` écarte déjà trois choses :

| exclusion | forme | motif écrit dans le code |
|---|---|---|
| cases des satellites présents | `prises`, un `Set` de `` `${rangee}:${colonne}` `` | deux sites sur une case |
| bases de l'Ouvrage | `estBaseOuvrage(...)` dans le `filter` | dérivées de la graine, elles étaient là AVANT |
| POI | `poiDeLaCase(...) !== null` | même motif, mot pour mot |

**Il y en a donc bien un**, et la case rasée le rejoint : `prises.add(evite)`.
Une seconde façon d'exclure aurait été la seconde vérité que §4 de `CLAUDE.md`
interdit.

### Elle voyage sur l'attente — et c'est ce qui force le `SAVE_VERSION`

L'attente porte `evite: { rangee, colonne }`. Voir §5.

### La lecture prise, et elle est réversible d'une ligne

L'exclusion vaut **pour ce remplacement-là seulement**. La case n'est pas retenue
comme « brûlée » : un satellite ultérieur pourra y revenir. La lecture inverse
demanderait une liste de plus dans la sauvegarde, et Ethan n'a pas demandé ça.

### L'anneau saturé : le choix, et sa mesure

**Choix retenu : l'exclusion ne cède pas.** Un anneau plein sauf la case rasée
ne fait pas reparaître le remplaçant dessus ; l'attente est **reportée avec son
exclusion**, et repart dès qu'une place se libère. C'est le mécanisme que
`reportees` porte déjà pour un anneau saturé de bases de l'Ouvrage — aucune
branche neuve. Céder ici briserait « ailleurs » dans le seul cas où le joueur le
verrait.

**Le cas n'est pas atteignable, mesuré :**

| mesure | résultat |
|---|---|
| anneau du camp | **12 cases** (euclidien, 1 à 2) |
| anneau de l'avant-poste | **72 cases** (2 à 5) |
| cases bloquées au départ, 300 graines | **0 sur 12, sur les 300** |
| balayage carte entière, 20 graines × ~1 400 positions | pire cas **5 bloquées**, jamais moins de **7 libres** |
| positions laissant ≤ 3 cases libres | **0** |

La saturation demanderait 3 cases libres ou moins (2 camps présents + 1 exclue).
**La garde est écrite quand même**, et `SAT-R T6` la monte à la main.

---

## 3. Le déterminisme — et la prémisse du brief, qui est fausse

Le §4 du brief annonce qu'un re-tirage en boucle ferait « diverger deux parties
identiques dès le premier remplacement », le nombre de tirages consommés
dépendant du résultat.

⚠⚠ **C'est faux, et c'est mesuré.** Un `entier(rng, 0, 7)` inconditionnel glissé
avant le tirage laisse `test/satellites.test.js` **entièrement vert — 29 pass /
0 fail**. Deux exécutions du **même code** sur la **même graine** ne peuvent pas
diverger d'un nombre de tirages : elles le consomment toutes les deux. Le flux
est d'ailleurs propre à chaque apparition — `creerRng(graineDeLApparition(graine,
instance))` —, donc il n'alimente rien d'autre.

⚠⚠ **Le vrai motif du retrait avant tirage est la TERMINAISON, et lui se
mesure.** Écrit exactement comme le brief le décrit — pas de retrait, un `while`
qui recommence tant que le tirage rend la case exclue — le code **ne termine
pas** : sur un anneau dont la seule case libre EST la case exclue, `libres` n'a
qu'un élément et la boucle tourne pour toujours. **Mesuré : timeout à 90 s.** Le
retrait, lui, dégrade proprement en attente reportée.

⚠ **`SAT-R T7` a donc vu son commentaire réécrit.** Ce qu'il garde pour de bon
est une source d'aléa qui ne vient PAS de la graine : mesuré, un `Math.random()`
dans le choix de la case fait tomber ce test **et** les deux gardes d'équivalence
des chemins d'avancement, et rien d'autre. Ses deux destructions successives
restent, pour une autre raison : le second remplacement passe par un `libres`
plus court, donc c'est le seul endroit du montage où la longueur de l'ensemble
des candidates entre dans le tirage.

**Preuve d'exécution demandée par le brief** : `SAT-R T7` rejoue trois graines —
4242, 7 et 99 — avec deux destructions chacune, et compare `serialiser` au
caractère. Le montage asserte d'abord `satellitesDetruits.camp === 2`, sans quoi
il serait vert sur n'importe quel code.

---

## 4. Le témoin de BASES-0

**Treize couples sur 322**, tous à partir de la **phase 7** — le premier raid ;
les six premières phases sont identiques **au bit**.

| phase | champs déplacés |
|---|---|
| p07 | `satellites` |
| p08 à p11 | `satellites`, `prochaineInstanceSatellite` |
| p12 | `satellites`, `prochaineInstanceSatellite` |
| p13, p14 | `satellites` |

⚠⚠ **Et rien d'autre ne bouge :** les vingt autres champs sont identiques sur
les quatorze phases — `economie`, `disposition`, `garnison`, `armee`,
`sitesEntames`, `rapports`, `recherche`, `poisAcquis`, `basesRasees`, `attaque`.
**`satellitesDetruits` non plus** : on détruit autant, on remplace plus vite.

⚠⚠ **Les cinquante empreintes de rapport ne bougent pas, ni aucun des huit
scalaires** — gestes, gestes d'armement, taille de la sauvegarde, cases
atteignables, déplacement, bases attaquantes, nombre de cibles, cible retenue :
**0 sur 25 pour chacun**. C'est la mesure qui dit que le lot ne touche que les
satellites.

⚠ La taille de la sauvegarde ne bouge pas : le témoin la prend en phase 6, avant
le premier raid, donc aucune attente ne porte d'exclusion. Aucun terme ne
s'ajoute aux quatre de `test/temoins-bases-0.js`.

⚠ `version` reste **substituée** par `VERSION_AU_TEMOIN`, qui vaut toujours 22.

---

## 5. `SAVE_VERSION` — écart au brief, déclaré et mesuré

Le brief pose : « **`SAVE_VERSION`** : rien n'est ajouté à l'état. ⚠ **Le
vérifier plutôt que le croire** ». Vérifié : **quelque chose entre**, et le
brief se trompe.

**La chaîne d'appel, relevée :**

```
executerRaid            (src/sim/raid.js)
  → enregistrerLeRaid   (src/sim/site-entame.js)
    → retirerLeSite
      → detruireSatellite   ← l'attente est poussée ici
ui/raid.js : apresGeste()   ← LA SAUVEGARDE TOMBE ICI
… frame suivante …
tickJeu → resoudreSatellites ← l'attente est servie ici
```

Une exclusion gardée en mémoire seule serait donc perdue **exactement dans le cas
courant** : le joueur rase un camp et ferme le jeu. Le remplaçant reparaîtrait
sur la case rasée, sans que rien ne le dise. `SAT-R T12` mesure le trajet de bout
en bout — sérialisation, rechargement, tick — et asserte que le remplaçant est
sur la seule autre case libre.

**Le champ entre donc dans l'état, et `SAVE_VERSION` passe à 27**, comme
`RÉSERVE-BASE` et `RETOUR-DÉFENSES` l'ont fait pour un champ optionnel dont
l'absence vaut le neutre. La règle du dépôt est écrite : « Pas un champ n'entre
dans l'état » est la condition pour ne PAS bumper.

**Le maillon v26 → v27 ne calcule rien, et il ne peut rien calculer.** Une v26 ne
sait pas quel satellite a été rasé ni où : le champ est né avec ce lot. « Absent »
vaut « pas d'exclusion », ce qui est exactement juste pour une attente programmée
sous l'ancienne règle. Ce qu'il fait, et c'est tout : **retirer** une valeur
héritée malformée — même forme que la v25 → v26.

⚠ **Et il ne ramène pas à zéro le délai des attentes existantes** : une v26 peut
porter un remplacement programmé à cinq minutes, et l'avancer ferait paraître au
chargement un camp que la partie attendait encore.

---

## 6. Le commentaire de `detruireSatellite`, réécrit

Il annonçait deux points « non arbitrés » qui le sont. Cité :

> ⚠⚠ LES DEUX POINTS QUE CE COMMENTAIRE ANNONÇAIT « NON ARBITRÉS » LE SONT DEPUIS
> LE 06/09/2026. Il disait : « le même délai de cinq minutes, et un nouveau
> tirage dans l'anneau — c'est le même mécanisme rejoué […]. Les deux tiennent en
> une ligne chacun si la réponse est autre. » Ethan : « un camp ou avant poste
> rasé = un autre pop direct », puis, sur la case du remplaçant, « ailleurs ».
> Les deux ont tenu en une ligne chacun, et les voici.

Suivent cinq paragraphes : pourquoi « direct » passe quand même par `attentes`,
pourquoi `TICKS_APPARITION` ne bouge pas, pourquoi la relève naturelle non plus,
que l'exclusion vaut pour ce remplacement-là seulement, et pourquoi elle voyage
sur l'attente.

---

## 7. Les tests

Quatorze entrent, tous dans `test/satellites.test.js`. **1 201 → 1 215.**

| Code | PASS/KO | Montage effectivement écrit |
|---|---|---|
| **SAT-R T1** | PASS | Trois parus, un camp détruit : `attentes[0].tickDu === horloge.nbTicks`, **par égalité** — une inégalité passerait sur un délai divisé par deux. Asserte en plus que `TICKS_APPARITION` vaut encore sa dérivation et n'est pas nul. |
| **SAT-R T2** | PASS | Détruire, **un** seul `tickJeu`, trois présents et `attentes` vide. Distingue « échéance à zéro » de « effectivement servi ». |
| **SAT-R T3** | PASS | Base neuve : les trois attentes à `nbTicks + TICKS_APPARITION`, et rien de paru à `TICKS_APPARITION - 1`. |
| **SAT-R T4** | PASS | **Vingt graines**, anneau réduit à DEUX cases libres — la rasée et une autre —, le remplaçant doit être sur l'autre. Voir §8 : la première écriture n'en montait qu'une et **ne mordait pas**. |
| **SAT-R T4 bis** | PASS | Cent graines sur l'anneau NATUREL, où un tirage libre retomberait sur la case rasée environ une fois sur dix ; asserte en plus que ≥ 95 graines ont vraiment été mesurées. |
| **SAT-R T5** | PASS | Non-régression : aucune case portée deux fois après le remplacement. |
| **SAT-R T6** | PASS | Anneau saturé sauf la case rasée : `doesNotThrow`, rien ne paraît, l'attente est reportée **avec son `evite`**, rien ne s'est posé sur la case rasée ; puis on libère une case et le remplaçant part dessus. |
| **SAT-R T7** | PASS | Trois graines, deux destructions successives chacune, `serialiser` comparé au caractère, après avoir asserté que deux camps ont bien été détruits. |
| **SAT-R T8** | PASS | `satellitesDetruits` passe à 1 à la destruction et **ne bouge pas** quand le remplaçant paraît. |
| **SAT-R T9** | PASS | Camp → camp, avant-poste → avant-poste, sur le type de l'attente **et** sur celui du satellite paru. |
| **SAT-R T10** | PASS | Camp = `round(niveauDesBatiments / 10)` ; avant-poste = niveau de la rangée ±1. Le lot ne touche aucune règle de niveau. |
| **SAT-R T11** | PASS | `SAVE_VERSION === 27` (la garde qui déménage), la migration n'invente aucune exclusion, et elle **retire** une exclusion hors carte. |
| **SAT-R T11 bis** | PASS | Trois `evite` malformés — rangée négative, colonne hors carte, valeur non-objet — refusés par `problemesDesSatellites` **et** par `charger` ; et « absent » reste légal. **Écrit après une falsification muette**, voir §8. |
| **SAT-R T12** | PASS | Détruire, sérialiser (`/"evite"/` dans le JSON), recharger, ticker : le remplaçant est sur la seule autre case libre. **C'est la mesure qui justifie le bump.** |

**Aucune assertion n'a été retirée ni assouplie.** Deux gardes changent de
porteur, une se resserre, un montage est réancré :

- le `SAVE_VERSION === 26` de **`RETOUR-D T18`** devient `=== 27` sous
  **`SAT-R T11`** — « la garde du numéro appartient au maillon le plus RÉCENT,
  une seule fois » ;
- ce qui le remplace dans `RETOUR-D T18` est **plus fort qu'un nombre** : une v25
  au `retour` MALFORMÉ doit ressortir à `null`, ce que seul le maillon v25 → v26
  fait. Retirer ce maillon fait tomber cette ligne, là où un numéro figé se
  contentait de signaler qu'on avait ajouté un maillon ailleurs ;
- **« satellites — un camp détruit revient »** assertait « rattraper
  `TICKS_APPARITION - 1` laisse 2 présents, le tick suivant en rend 3 ». C'est UN
  tick qui suffit désormais : le montage est réancré **en écrivant les deux
  règles**, pas en assouplissant l'assertion.

---

## 8. Dix falsifications, huit chutes, deux muettes qui ont produit un travail

| # | Falsification | Chutes |
|---|---|---|
| F1 | délai remis à `+ TICKS_APPARITION` | **9** — T1, T2, T4, T4 bis, T6, T9, T10, et deux montages hérités |
| F2 | `TICKS_APPARITION = 0` | **19** — dont T1 et T3, et sept gardes d'avant le lot |
| F3 | `prises.add(evite)` désarmé | **3** — T4, T4 bis, T6 |
| F4 | `evite` non transmise à `poserUnSatellite` | **2** — T4 bis, T6 |
| F5 | l'attente reportée perd son exclusion | **1** — T6 |
| F6 | re-tirage en boucle, **conforme au brief** | **0** — voir ci-dessous |
| F6 bis | un `entier(rng, 0, 7)` inconditionnel | **0** — voir ci-dessous |
| F6 ter | `Math.random()` dans le choix de la case | **3** — T7 et les deux gardes d'équivalence des chemins |
| F7 | la saturation reprend la case rasée | **1** — T6 |
| F8 | `SAVE_VERSION` remis à 26 | **1** — T11 |
| F9 | la migration 26 → 27 ne nettoie plus | **1** — T11 |
| F10 | la garde de forme d'`evite` retirée | **0**, puis **1** — voir ci-dessous |

⚠⚠ **F6 et F6 bis ne mordent pas, et c'est la prémisse du brief qui est fausse.**
Détaillé au §3 : deux exécutions du même code sur la même graine ne peuvent pas
diverger d'un nombre de tirages. Ce qui rend le retrait obligatoire est la
TERMINAISON, mesurée par timeout à 90 s.

⚠⚠ **F10 ne mordait pas : rien ne mesurait le refus d'un `evite` malformé au
chargement.** Mesuré : **87 pass / 0 fail** sur `satellites` et `state` avec la
garde désarmée. `SAT-R T11 bis` a été **écrit après cette mesure**, et la
falsification mord alors.

⚠⚠ **Et `SAT-R T4` a dû être corrigé avant d'être cru.** Sa première écriture
montait UNE graine sur un anneau réduit à deux cases : le tirage sans exclusion y
évitait la case rasée par chance — retirer l'exclusion laissait ce test VERT.
C'est la falsification qui a dit que le TEST était faible, pas le code. Il balaie
vingt graines désormais.

⚠ **Un défaut de montage a été trouvé par une garde du moteur.** La première
version d'`occuperLAnneau` inventait des numéros d'instance à 90 000 :
`problemesDesSatellites` refuse une instance au-delà du compteur, et
`verifierEtat` **lève** au chargement. Le montage passait tant qu'on ne
sérialisait pas et tombait dès qu'on le faisait — la garde avait raison, et les
faux satellites tirent maintenant leurs numéros du compteur.

⚠ **Et un second, trouvé sur la graine 2** : la première case de l'anneau y est
occupée par le second camp, si bien que « la case libre » n'était pas libre. Le
montage la choisit désormais parmi ce qui l'est vraiment.

---

## 8 bis. Une course dans la suite, trouvée en mesurant — ÉCART AU BRIEF, DÉCLARÉ

⚠⚠ **`npm run check` a viré au rouge sans qu'une ligne ait changé**, sur
« options — le banc reste atteignable après le déménagement de la version », et
il repassait vert à l'exécution suivante. Ce n'est pas un aléa : **`banc.test.js`
T10 relance `tools/build.js` pour éprouver la garde hors ligne, donc il écrit
dans `dist/index.html` — que `chantier.test.js` et `sprite.test.js` LISENT.** Le
lanceur de `node --test` exécute les fichiers en PARALLÈLE : la suite tombe sur
un fichier tronqué. **Mesuré : une exécution sur quatre.**

⚠ **Le défaut est ANTÉRIEUR au lot** — `banc.test.js:476` ne porte pas une ligne
de ce lot-ci — et il n'est dans le périmètre d'aucun des quatre briefs.

**Corrigé quand même, et voici pourquoi :** il rend fausse la seule chose que ces
rapports affirment — « 1 215 pass / 0 fail, mesuré » —, et il aurait fait rougir
la PR au hasard. Le remède est celui que le dépôt emploie déjà pour
`tools/verifier.py` : **`FZ_SORTIE` déroute la destination du build**, comme
`FZ_SPRITES` déroute celle des outils d'art, sous le motif écrit là-bas — « un
contrôle qui écrit là où il compare est un piège ». T10 bâtit désormais dans un
fichier temporaire à lui.

⚠ **Ce que T10 mesure ne change pas d'un caractère** : le même build, les mêmes
sources, le même code de sortie, le même HTML. Seul l'endroit où il pose le
fichier bouge. Et la SOURCE n'est pas déroutable — ce serait faire tourner le
build sur un arbre vide et lui faire dire que tout va bien.

⚠⚠ **ET LA GARDE QUI ENTRE EST DÉTERMINISTE LÀ OÙ LA COURSE NE L'EST PAS.** T10
relève la date de `dist/index.html` avant et après, et exige qu'elle n'ait pas
bougé. **F11 — remettre la destination dans `dist/` — la fait tomber à tous les
coups**, quand la course elle-même ne mordait qu'une fois sur quatre. Une garde
qu'on ne peut pas faire tomber à volonté n'en est pas une.

⚠ **Trois exécutions complètes de suite après correction : 1 215 pass / 0 fail,
1 215, 1 215**, et `dist/index.html` intact à l'octet après chacune.

---

## 9. Ce que le lot n'a PAS touché

- **`niveauDuSatellite`** — aucune ligne. Ethan a choisi d'AFFICHER l'origine du
  niveau plutôt que de la changer ; c'est le lot CARTE-C.
- **`TICKS_APPARITION`**, **`planifierSatellites`**, la durée de vie naturelle et
  sa relève.
- **`satellitesDetruits`** et le tutoriel qui le lit.
- **`src/ui/`** — pas une ligne.
- **`art/`** — d'où `tools/verifier.py` non lancé, et c'était conforme.
- **`tools/build.js`** reçoit une ligne, et une seule : la destination déroutable
  du §8 bis. Aucun octet du livrable ne dépend d'elle — le build par défaut écrit
  exactement où il écrivait.

---

## 10. Points en suspens

1. **L'exclusion est « pour ce remplacement-là »** — lecture prise, réversible
   d'une ligne. La lecture inverse — une case rasée définitivement interdite —
   demanderait une liste de plus dans la sauvegarde. **Ethan tranche.**
2. **Le respawn direct rend les camps beaucoup plus disponibles.** Un joueur qui
   rase un camp en retrouve un au tick suivant, donc la boucle « raser pour du
   butin » n'a plus de temps mort. **Aucune valeur d'équilibrage n'a été
   touchée** ; le témoin montre que ni le butin ni les rapports ne bougent sur le
   scénario mesuré, mais celui-ci ne rase qu'une poignée de sites. **À arbitrer
   si le rythme paraît trop généreux.**
3. **La relève naturelle garde ses cinq minutes**, et elle passe par le même
   `attentes`. Si Ethan veut qu'elle soit directe aussi, c'est une ligne.
