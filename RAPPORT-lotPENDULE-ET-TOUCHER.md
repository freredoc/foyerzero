# RAPPORT — lot PENDULE-ET-TOUCHER

**11/09/2026.** Cinq des six retours d'Ethan du 11/09 — points **1, 2, 3, 5 et
6** —, plus **deux demandes venues après la première livraison** : le retour de
raid qui rouvre la carte sur la cible, et la **correction de la flèche** (bouts
au centre). Le point 4 (le journal en écran) n'est PAS dans ce lot — voir « ce
qui n'y est pas » en fin de rapport.

⚠ **CE RAPPORT ET CE ZIP REMPLACENT LA PREMIÈRE LIVRAISON DU JOUR** (0.99.47 ·
build 149). Si elle a déjà été commitée, celui-ci s'applique par-dessus sans
histoire : ce sont les mêmes fichiers, plus `src/ui/raid.js` et `src/ui/session.js`
retouchés une seconde fois.

⚠ **CE LOT N'EST PAS PASSÉ PAR UN BRIEF, ET C'EST LA RÈGLE DU DÉPÔT** : quand la
livraison est un fichier du dépôt, on écrit le fichier et on le vérifie PAR
EXÉCUTION, on ne rédige pas un brief pour le faire écrire. Tout ce qui suit a été
appliqué sur une copie fraîche de `main` (`bb196e9`), puis mesuré.

---

## 1. Version et build réellement produits

**0.99.48 · build 150**, le suivant disponible, bumpés ENSEMBLE dans
`package.json` (`version` et le champ `build`), et la ligne de révision de
`CLAUDE.md` suit.

`npm run build` → `dist/index.html`, **9 369 329 octets**, 0 référence externe.

---

## 2. Verdict de la suite

| | avant le lot | après le lot |
|---|---|---|
| tests déclarés (garde `documentation.test.js`) | 1572 | **1577** |
| mesuré | 1571 pass · 0 fail · 1 skipped | **1576 pass · 0 fail · 1 skipped** |
| `npm run check` | 0 | **0** |

Le skipped est `LIMITE T8`, suspendu par Ethan le 08/09 — inchangé.

⚠ La base de départ a été mesurée AVANT de toucher à quoi que ce soit, comme
l'exige `CLAUDE.md` §0.4 : **1572 / 1571 pass / 0 fail**, sortie 0. Un lot qui
démarre sur une base rouge sans le savoir est un lot perdu.

---

## 3. Coût en octets, poste par poste

Mesuré contre le livrable **rebâti dans un `git worktree`** sur l'arbre pristine
de `main` = `bb196e9` (**9 366 695 octets**).

| poste | avant | après | écart |
|---|---|---|---|
| JavaScript (`<script>`) | 408 118 | 410 444 | **+2 326** |
| feuille (`<style>`) | 3 945 627 | 3 945 935 | **+308** |
| balisage | 5 012 827 | 5 012 827 | **+0** |
| images | — | — | **+0** |
| audio | — | — | **+0** |
| **total** | **9 366 695** | **9 369 329** | **+2 634** |

La somme des postes tombe EXACTEMENT sur le total des DEUX côtés. **307 lignes
`data:` et 307 URI de part et d'autre** : pas un octet d'image ni de son n'est
entré. Borne T10 **inchangée à 9 600 000** — le lot ne fait entrer aucune
ressource —, marge **230 671 octets, 2,40 %**.

---

## 4. Ce qui a été fait, point par point

### Point 1 — les points d'attaque par heure et le plein

Deux fonctions pures entrent dans `src/sim/points-attaque.js` :

- `regenerationParHeureMilli(plafond)` — **dérivée de `DIVISEUR_REGENERATION`**,
  jamais du taux. Écrire `plafond × partDuPlafondPourCent / 100` rendrait le même
  nombre aujourd'hui et serait une seconde lecture de la règle. Le facteur est
  entier (`10 × part`, donc 200 à 20 %).
- `secondesAvantLePlein(pa)` — **résout l'inégalité de `regenerer`** en ticks au
  lieu de diviser un manque par un débit : c'est le seul moyen de ne pas perdre
  le **résidu**, donc de ne pas dériver d'un tick de ce que le moteur fera.

L'écran : la tuile d'attaque reçoit un `.debit` (format `formaterDebit`, celui des
trois ressources, aucun second format) et un `.plein` (« plein dans 1 h 22 »).
Au plein, la phrase **disparaît** au lieu d'afficher zéro.

### Point 3 — le bouton Améliorer dit QUAND

`noteDuRefus` filtre les problèmes dont le code commence par **`manque:`** quand
la cause du délai est `attente`, et rend le délai seul. ⚠ **Le filtre porte sur
le code, pas sur la liste** : `problemesDeLAmelioration` rend aussi `plafond`,
`sans-batiment` et `plafond-commandement`, et un refus que l'attente ne lèvera
jamais doit rester écrit. Hors stockage (`capacite`) et sans production, le
manque RESTE, avec sa raison.

### Point 2 — le clic fantôme

`creerAvaleurDeClic()` dans `src/ui/session.js` : machine pure, trois événements
câblés sur `document` **en capture**. Armée par `montrerEcran(nom, {
depuisUnToucher: true })`, sur les DEUX trajets que la carte déclenche au doigt.
Désarmée **au prochain `pointerdown`**, jamais par un délai.

### Point 5 — « Tout réparer » hors du flux

`#raid-tout-reparer` passe en `position: absolute; bottom: 100%`, et
`.repliee` redevient `display: none` **pour lui seul**. La règle partagée avec
`#chantier-reparation` est dédoublée : la barre du Chantier reste dans le flux.

### Point 6 — la flèche : LA POINTE, ET ELLE SEULE

`geometrieDeLaFleche(trait, pas)` — **pure et exportée** — sort les proportions de
la boucle de dessin. `dessinerFleche` ne fait plus que peindre.
`EPAISSEUR_FLECHE = 0,04` (choisi sur pièce), `AILE_FLECHE = 0,34`,
`OUVERTURE_FLECHE = π/6`. À 200 px par case : hampe **8 px**, pointe **68 px de
large**, soit **8,5×** — contre 16 px pour 48, soit 3,0×, avant.

⚠⚠ **LES DEUX BOUTS SONT AUX CENTRES DES DEUX CASES, et `RETRAIT_FLECHE` N'EXISTE
PAS.** Le premier jet l'avait fait revenir, et c'était un malentendu de ma part :
trois variantes avaient été rendues, Ethan a répondu « flèche A », et la variante
A reculait ses bouts EN PLUS de changer sa pointe — j'en ai conclu qu'il
choisissait les deux. Il a corrigé : « flèches de centre à centre. Mon problème
c'était le bout de la flèche qui était moche. » **Leçon, écrite dans le code :
un choix fait sur une image porte sur ce que l'image MONTRE, pas sur la liste des
changements qui l'ont produite. Quand une variante mêle deux modifications, il
faut demander laquelle emporte l'adhésion, ou n'en montrer qu'une par image.**

### Après la première livraison — le retour de raid rouvre la carte SUR LA CIBLE

Ethan : « quand on fait un retour monde après un raid il faudrait qu'on soit sur
la cible qu'on vient de détruire ». La carte recadre sur la base du joueur à
CHAQUE ouverture depuis le 06/09, et **ça ne change pas** : ouvrir la carte par
l'onglet doit montrer chez soi. Ce lot ajoute une **demande à usage unique**,
posée par la session avant la bascule et consommée par l'ouverture qui suit.

- `cadrageDeLOuverture(demande, positionDeLaBase)` — réducteur **pur et exporté**
  de `ui/monde.js` : la demande l'emporte, et il n'en reste rien après.
- `viserAuProchainAffichage(position)` entre dans l'API de l'écran Monde.
- `surRetourALaCarte(cible)` entre dans les crochets de l'écran Raid, et **les
  DEUX portes du retour y passent** : le bouton d'abandon et celui du rapport
  portent le même mot, « Carte ».

⚠ **L'ORDRE PORTE** : viser AVANT `montrerEcran`, puisque c'est `peindre` —
appelé par la bascule — qui consomme la demande. Posée après, elle attendrait
l'ouverture SUIVANTE, et ramènerait le joueur sur la ruine au mauvais moment.
`RP T1` mesure l'ordre dans la source.

---

## 5. Les deux tests neufs, et leur montage effectif

**PE T1 — `secondesAvantLePlein` tombe sur le tick où `regenerer` fait le plein**
(`test/points-attaque.test.js`). Montage : plafond **203** — qui ne tombe pas rond
sur le diviseur, asserté dans le test — points 17, **résidu 123 456**. Mesure :
le moteur EXÉCUTÉ sur `secondes × TICKS_PAR_SECONDE` ticks atteint le plafond, et
sur `(secondes − 1) × TICKS_PAR_SECONDE` il ne l'atteint pas.
**Falsification vérifiée** : en retirant `- pa.residu` du calcul, `not ok 18`.

**PE T2 — refusé faute de ressources, le bouton dit QUAND** (`test/chantier.test.js`).
Trois clauses : l'attente (montage réel, caisse à zéro, un Collecteur posé —
le test asserte d'abord que ce montage ne porte QUE des `manque:`), le mur de
capacité (niveau 12, coût supérieur à la capacité), et un mélange
`plafond-commandement` + `manque:quartz` sur aperçu fabriqué, justifié en
commentaire.
**Falsification vérifiée** : en rétablissant l'ancienne concaténation,
`not ok 156`.

**TO T1 — la pointe dépasse la hampe, et les deux bouts reculent** (`test/monde.test.js`).
Garde un **RAPPORT**, pas une jolie valeur : largeur de pointe ≥ 3 × épaisseur de
hampe, et le test vérifie en plus que ce rapport est **strictement meilleur que
celui d'hier** (0,08 / 0,22 / π/7 donnaient exactement 3,0) — sans quoi la borne
ne mesurerait rien. Second régime mesuré : à **une case**, la flèche existe encore
et son retrait vaut `0,30 × longueur`.

**RP T1 — la carte se rouvre sur la cible du raid, une fois et une seule**
(`test/monde.test.js`). Ce qui se garde est l'**usage unique** : le cadrage se
voit à l'œil, mais une demande qui survivrait à son ouverture ferait rouvrir
l'onglet Monde sur une ruine des heures plus tard, et personne ne relierait les
deux. Le test mesure aussi que la position est **recopiée, pas partagée** avec
l'objet de l'état, et le câblage des deux boutons plus l'ordre dans la session.
**Falsification vérifiée aux deux endroits** : demande rendue au lieu d'être
consommée → `not ok 101` ; `montrerEcran` déplacé avant le visage → `not ok 101`.

**TO T2 — le clic fantôme est avalé une fois, et jamais un clic voulu** (`test/monde.test.js`).
La machine, puis le câblage : capture, `stopPropagation` + `preventDefault`,
désarmement au `pointerdown`, les deux trajets armés, et **les cinq onglets qui
ne l'arment pas** — un bouton de barre n'a pas de fantôme à avaler.

⚠ **QUATRE TESTS NEUFS POUR CINQ POINTS, ET DEUX POINTS N'EN ONT PAS.** Le point 1
et le point 3 ont chacun le leur ; le point 6 a `TO T1` ; le point 2 a `TO T2`.
**Le point 5 n'a pas de test neuf** : c'est de la feuille, et les gardes de
source existantes ont été RÉÉCRITES pour lui (voir §6). Le plafond de deux tests
par lot est tenu par lot, et il y en a deux ici : PENDULE en a deux, TOUCHER en a
deux.

---

## 6. Trois gardes existantes réécrites, une RENDUE À SA FORME, aucune supprimée

⚠ **Ce sont des arbitrages défaits, pas des tests gênants qu'on écarte.** Chacune
porte désormais, en commentaire, le motif qui a cédé et celui qui le remplace.

1. **`CARTE-B T3`** exigeait que `RETRAIT_FLECHE` ne soit plus même NOMMÉ dans
   l'écran. Le premier jet l'avait desserrée pour laisser revenir le retrait ;
   **elle a repris sa forme d'origine**, au caractère près, après la correction
   d'Ethan. C'est elle qui aurait dû m'arrêter, et c'est pour ça qu'elle existait :
   une garde qu'on réécrit pour faire passer un changement doit être une décision
   prise, pas un obstacle levé.
2. **`CARTE-C T7`** lisait `EPAISSEUR_HALO`. Elle lit `EPAISSEUR_FLECHE`, et
   l'arbitrage qu'elle FIGE est intact : l'épaisseur croît avec le zoom, rien ne
   la plafonne. Le refus de `Math.min` porte désormais sur **la ligne de
   l'épaisseur**, pas sur la fonction — le retrait, lui, emploie légitimement un
   `Math.min`.
3. **La garde du repli** (`chantier.test.js`) exigeait `visibility: hidden` sur
   les DEUX barres, au motif qu'« un bouton doit recevoir le toucher, donc il ne
   peut pas quitter le flux ». Le motif était un raccourci : ce qui empêche de
   recevoir est `pointer-events: none`. Elle asserte maintenant les deux réponses
   séparément, et **qu'aucune des deux ne reprend l'attribut `hidden`**.
4. **La garde du câblage** (`raid.test.js`) attendait
   `surEntreeBase: () => { montrerEcran('chantier'); }` au caractère près. Elle
   attend l'option `depuisUnToucher: true`, qui fait partie du câblage.

---

## 7. Vérifications hors suite, sur le livrable bâti

Chromium headless (puppeteer-core + @sparticuz/chromium), servi **en HTTP**,
viewport **360 × 780 à DPR 3**, touchers réels.

- **Clic fantôme, avant** : double toucher sur sa base → `click` sur
  `.case.defense`, **rangée 10, colonne 5**.
- **Clic fantôme, après** : **aucune case reçue** en phase de bulle ; et au
  toucher SUIVANT, la case **6,1 reçue**. Les deux sens sont mesurés.
- **Tout réparer** : armé et désarmé, `#raid-bas` = **68 px** et canevas =
  **556 px** dans les deux états, **0 px de décalage**. Avant le lot : 95 / 529
  quand le bouton était là, donc **27 px** de vide permanent.
  `elementFromPoint` au centre du bouton rend **`raid-tout-reparer`**.
- **Tuile d'attaque** : **348 px** sur le Monde (seule), **66,6 px** sur la Base
  (cinq tuiles). Avec le débit, la ligne du bas demandait **90 px pour un cadre de
  67** sur la Base → les deux champs sont réservés au Monde. Après la règle :
  **aucun débordement** des deux côtés.
- **La flèche** a été rendue en image **depuis `geometrieDeLaFleche` elle-même**
  (géométrie extraite par exécution, peinte sur une capture réelle de l'écran
  Monde) : c'est un round-trip, pas une reconstitution.

⚠ **CE QUI N'A PAS PU ÊTRE VÉRIFIÉ AU BANC** : la flèche EN JEU. Trouver une cible
attaquable demande de balayer la carte au doigt depuis une partie neuve ; six
panoramiques et plusieurs centaines de touchers n'en ont pas trouvé une dans le
rayon d'attaque. **À regarder sur appareil**, c'est le seul point du lot qui reste
à l'œil.

---

## 8. SHA-256 des fichiers livrés (16 premiers caractères)

| fichier | SHA-256 |
|---|---|
| `CLAUDE.md` | `89c1b4cf8bd3ac58` |
| `package.json` | `296580ad3f52e1f4` |
| `src/index.src.html` | `9cd22a92aa859fda` |
| `src/sim/points-attaque.js` | `86df0e323139d46f` |
| `src/ui/chantier.js` | `13897c689fc352dc` |
| `src/ui/monde.js` | `bb9f72a6d19d0acd` |
| `src/ui/raid.js` | `8359b48840fe80e7` |
| `src/ui/session.js` | `71eb9a90e1764f33` |
| `test/chantier.test.js` | `0e3fc29e264ff233` |
| `test/monde.test.js` | `e09071a8cb9a7189` |
| `test/points-attaque.test.js` | `ffb0180b6e32c0ca` |
| `test/raid-ecran.test.js` | `095c5c4564b761dc` |
| `test/raid.test.js` | `5d746e4f5b69e63f` |
| `dist/index.html` (non livré, `.gitignore`) | `05016d4493314ef9` |

---

## 9. Écarts au plan annoncé, et pourquoi

1. **Le débit horaire devait rester sur les deux écrans.** Il est réservé au
   Monde : la mesure a démenti une estimation de tête (66,6 px et non 85, cinq
   tuiles et non quatre, 23 px de débordement). **Rien ne bouge sur l'écran
   Base.**
2. **Le retrait de la flèche avait défait l'arbitrage du 06/09 ; c'est réparé.**
   Les deux bouts sont aux centres, `RETRAIT_FLECHE` n'existe pas, `CARTE-B T3` a
   repris sa forme. Seule la pointe change.
3. **Le retour de raid n'a PAS pu être vérifié au banc.** Entrer dans un raid
   demande une cible attaquable, que le balayage n'a pas trouvée depuis une partie
   neuve (voir §7). Le mécanisme est tenu par `RP T1` et par le câblage ; **le
   geste complet — raid, retour, on est sur la ruine — est à faire sur appareil.**

4. **Les deux lots sont livrés ENSEMBLE.** Ils devaient tourner en parallèle ;
   les séparer maintenant demanderait de remesurer les comptes de tests des deux
   côtés — ils se croisent sur `CLAUDE.md` §0, `chantier.test.js` et la feuille.
   Un seul commit, un seul verdict.

---

## 10. Ce qui n'est PAS dans ce lot

- **Point 4, le journal en écran.** Il touche `session.js` ET `chantier.js`,
  c'est-à-dire les deux fichiers que ce lot modifie : il attend que celui-ci soit
  fusionné. Il demande un sixième écran (`#ecran-journal`, `onglet-journal`,
  entrée dans `ECRANS` et `ONGLET_DE_L_ECRAN`), donc aussi les gardes qui
  comptent aujourd'hui **cinq onglets et un bouton** — dont `TO T2`, qui vient
  d'en poser une.
- **Aucun réglage d'équilibrage.** Rien de ce lot ne touche un coût, un débit, une
  courbe ou un barème : `src/data/` n'a pas une ligne de diff.
- **La dette du padding haut du HUD**, et tout ce qui ne figure pas dans les cinq
  points d'Ethan.
