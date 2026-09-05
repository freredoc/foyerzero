# RAPPORT — lot ERGONOMIE

**Version produite : 0.93.0 · build 95.**
`npm run check` → **1080 pass / 0 fail**, `npm run build` → `dist/index.html`,
**6 801 384 octets**, 0 référence externe.

Huit retours d'Ethan du 04/09, **huit commits**, dans l'ordre où ils ont été
faits. Chacun tient debout tout seul : Ethan peut en laisser tomber un sans
défaire les sept autres, ce qui était la contrainte du brief.

| # | Commit | Ce qu'Ethan a demandé |
|---|---|---|
| 1 | `27f6898` | « Le zoom dans la base se fait depuis l'angle en haut à gauche, très bizarre » |
| 2 | `e0e37bd` | « Une grille apparaît quand on déplace un bâtiment […] faire de même lorsque l'on construit un bâtiment et sur défense » |
| 3 | `c256a36` | « assombrir la défense quand on regarde la base et inversement — grandes barres hachurées en travers » |
| 4 | `d150800` | « Les nombres qui montrent les niveaux des bâtiments et unités sont trop petits et peu lisibles » |
| 5 | `effec2d` | « Quand on clique sur une unité en défense ou armé, afficher un onglet comme pour les bâtiments » |
| 6 | `8f20c4c` | « Toast quand on n'a plus assez de points d'armement […] en plus gros et rouge » |
| 7 | `94732a2` | « les noms des éléments de la carte persistent jusqu'à ce que je dézoome, environ dix cases en largeur » |
| 8 | `1365b0e` | « Les sprites obstacles Ouvrage ne sont pas placés, c'est les mêmes que le joueur » |

⚠ Le lot **ARRÊT** (`edbc521`) est sur la même branche, avant les huit. Il a son
propre rapport, `RAPPORT-lotARRET.md`, et il n'est pas mesuré ici — sauf pour le
partage des octets, ci-dessous, où les deux comptes sont donnés séparément.

---

## 1. Le compte de tests

| Étape | `npm test` |
|---|---|
| base, `origin/main` à `6825f81` | **1053 pass / 0 fail** |
| après le lot ARRÊT | 1063 |
| après les huit commits d'ERGONOMIE | **1080 pass / 0 fail** |

**Dix-sept tests entrent pour ce lot-ci.** Aucune assertion n'a été retirée.
**Six gardes existantes CHANGENT DE CIBLE et deux se RESSERRENT**, chacune en
écrivant pourquoi dans le fichier — elles sont nommées au §5.

---

## 2. Les quinze tests, avec leur montage effectif

| Test | Fichier | Montage |
|---|---|---|
| `ERGO T1` | `chantier.test.js` | `defilementAncre` : `coteCase` × 1,4 sous une ancre donnée, le point du contenu sous l'ancre revient au même pixel |
| `ERGO T1 bis` | `chantier.test.js` | garde de source : le pincement de la base APPELLE vraiment `defilementAncre`, et lit `getBoundingClientRect` |
| `ERGO T2` | `chantier.test.js` | les quatre coins, défilement déjà en butée : le rognage borne, il ne saute pas |
| `ERGO T3` | `chantier.test.js` | les cases distinguées suivent `problemesDeLaPose` du moteur, et plus aucun bâtiment n'est privilégié |
| `ERGO T4` | `chantier.test.js` | **sortie** des trois modes, annulation comprise : c'est la même fonction qui pose et qui retire |
| `ERGO T5` | `chantier.test.js` | le voile de bande : `pointer-events: none`, exactement deux `voile.hidden`, un seul `hidden = cle === cleBande` |
| `ERGO T6` | `chantier.test.js` | la pastille de niveau : la règle grossit sans qu'aucune des six barres fixes ne bouge |
| `ERGO T7` | `chantier.test.js` | `apercuDeLaPiece` sur une pièce de garnison ET une d'assaut, sans DOM |
| `ERGO T7 bis` | `chantier.test.js` | la vue d'une pièce a la MÊME forme que celle d'un bâtiment |
| `ERGO T7 ter` | `chantier.test.js` | un seul rendu de panneau — `peindreVueDuPanneau` —, et les deux écrans l'appellent |
| `ERGO T8` | `offense.test.js` | `ligneAAfficher` rend un TON, et aucune taille n'est écrite dans le JS |
| `ERGO T9` | `monde.test.js` | deux boîtes qui se coupent d'UN pixel : la seconde tombe ; à un pixel de plus, les deux passent |
| `ERGO T10` | `monde.test.js` | la moins prioritaire en TÊTE du tableau : la sortie suit la priorité, pas l'entrée |
| `ERGO T11` | `monde.test.js` | même priorité, même rangée, colonnes 4 et 2 : la colonne 2 gagne, et la rangée passe avant la colonne |
| `ERGO T12` | `monde.test.js` | douze boîtes disjointes : **toutes** retenues ; plus la liste vide et la boîte seule |
| `ERGO T13` | `monde.test.js` | seuil à 36 px CSS, échelle continue : les noms tiennent à dix cases de large et partent à onze ; et l'écran mesure, retient, peint — dans cet ordre |
| `ERGO T14` | `sprite.test.js` | trois obstacles, trois types, une graine : le nom posé au combat est celui que l'écran de la base poserait, et deux graines rendent des dessins différents |
| `ERGO T15` | `sprite.test.js` | `COULEUR_OBSTACLE` n'existe plus dans les quatre dossiers de `src/` ; `kakiOmbre` reste et garde ses lecteurs ; l'atlas de terrain est fourni aux trois endroits qui peignent la scène |

⚠ **T12 et T4 sont les tests qui mordent, et le brief avait raison de le dire.**
Une règle d'anti-recouvrement qui écarte tout passe T9, T10 et T11 sans rien
valoir ; une grille qui s'arme partout et ne se retire jamais passe T3. Les deux
ont été falsifiés de face — voir §5.

---

## 3. Les mesures à l'écran

Boot Chromium, `playwright-core` installé **hors du dépôt**, fixture injectée
dans `localStorage` avant le chargement. Viewport 360 × 780 px CSS, **DPR 3**,
soit la géométrie du S25 FE.

### 3.1 Point 4 — les hauteurs, avant et après

**Les six barres à hauteur fixe ne bougent pas d'un pixel** : 40 pour les
onglets, 44 pour les ressources, 26 pour la bascule entre bases, 46 pour la barre
contextuelle, 86 pour la palette et 46 pour la barre du bas — **288 px de chrome,
avant comme après**, ce que la garde de `chantier.test.js` somme déjà. La case
mesure 36 px dans les deux livrables, le jeton 36,28, la vignette de palette 75,
et **il n'y a pas un pixel de débordement horizontal** ni avant ni après.

**Ce qui change est la boîte de la pastille, et elle seule** : de
**8 × 5,28 px** à **11,25 × 8,02 px**, soit un peu plus du DOUBLE en surface. La
règle est `font-size: max(11px, calc(var(--case-cote) / 3.2))` avec
`font-weight: 700` : un plancher de 11 px pour que le nombre reste lisible quand
la case est au plancher du zoom, et une fraction de case au-delà pour qu'il suive
le doigt. **Aucune rangée ne déborde et aucun libellé n'est coupé** — c'est ce
que le relevé mesure, et c'est ce que la pastille pouvait casser.

### 3.2 Point 5 — les deux panneaux

Fixture riche, écran par écran :

- **Défense** — « Tourelle mitrailleuse · niv. 3 », **1 210 → 1 331 PV**,
  « 10 % de dégâts », bouton « Améliorer → niv. 4 · 6 quartz · 2 élec. » ;
- **Offense** — « Fusiliers · niv. 2 », **770 → 847 PV**, « intacte »,
  « vitesse 60 ».

Captures : `rapports/ergo-2-panneau-defense.png`,
`rapports/ergo-3-panneau-offense.png`. **Zéro erreur de page.**

### 3.3 Point 7 — les étiquettes, mesurées et non regardées

`fillRect` instrumenté dans la page : on enregistre les plaques réellement
peintes, on les dédoublonne — une même vue peut être redessinée deux fois dans la
fenêtre du relevé —, et on compte les paires qui se coupent. **Douze vues à
chaque échelle**, obtenues par des glissements identiques des deux côtés, contre
un livrable **rebâti sans la garde**.

| Échelle | Plaques (avec) | Croisements (avec) | Plaques (sans) | Croisements (sans) |
|---|---|---|---|---|
| **dix cases de large** (9,35 mesuré) | 510 | **0** | 510 | **0** |
| **six cases de large** (5,84 mesuré) | 246 | **0** | 258 | **12** |

⚠⚠ **ET LA PREMIÈRE LIGNE EST À LIRE TELLE QUELLE : au seuil, le recouvrement
n'existe pas.** Le seuil descendu à dix cases ne fait donc pas se recouvrir les
plaques ; c'est en zoomant **au-delà** que la police relative grandit avec son
arrondi et que les plaques débordent leur case. La garde mord là, et elle y mord
sur les douze vues : **12 vues sur 12 portent un recouvrement sans elle, zéro
avec**, pour **douze plaques retirées** — exactement les douze fautives, pas une
de plus.

⚠ **Ce que ça change pour Ethan** : ce qu'il demandait — voir les noms jusqu'à
dix cases — est acquis sans contrepartie visible, et la garde est ce qui rend
tenable de zoomer plus loin.

Captures : `rapports/ergo-4-etiquettes.png` (noms affichés),
`rapports/ergo-5-dezoom.png` (noms partis après dézoom). **Zéro erreur de page.**

### 3.4 Point 8 — les obstacles, mesurés sur un raid réel

`drawImage` instrumenté, entrée dans un vrai raid — base de l'Ouvrage de
**niveau 6, en (272, 16)**, atteinte au second toucher depuis la carte.

- **10 poses depuis `atlas-terrain`**, soit exactement les dix obstacles que
  `montageDuRaid` porte pour ce site ;
- leurs **dix cellules source tombent au pixel** sur ce que `nomDeVariante` rend
  hors ligne pour la même graine et les mêmes cases — relevé côte à côte :
  `obs_vehicule_b · obs_infanterie_a · obs_vehicule_b · obs_infanterie_b ·
  obs_vehicule_a · obs_les_deux_b · obs_infanterie_b · obs_vehicule_b ·
  obs_vehicule_b · obs_vehicule_b` ;
- les autres atlas répondent aussi : 12 poses de bâtiment, 1 de défense, 6
  d'unité, 1 de décor.

**L'écran de la base est revérifié après le déplacement de la fonction** :
162 cases, **22 à fond de terrain, dix positions distinctes**, exemple
`var(--atlas-terrain)` en `500% 400%` à `0% 33.3333%`. **Zéro erreur de page.**

Captures : `rapports/ergo-6-obstacles-raid.png`,
`rapports/ergo-7-base-terrain.png`.

---

## 4. Le coût en octets, poste par poste

Mesuré contre un livrable **rebâti** — pour le lot seul, contre le livrable du
lot ARRÊT ; pour la branche entière, contre `origin/main` à `6825f81`.

| Poste | ERGONOMIE seul | branche entière (ARRÊT + ERGONOMIE) |
|---|---|---|
| feuille | **+4 179** | +4 179 |
| JavaScript | **+4 811** | +4 774 |
| balisage | **+635** | +635 |
| audio | **0** | 0 |
| images | **0** | 0 |
| **total** | **+9 625** | **+9 588** |

**289 `data:` avant, 289 après.** L'atlas de terrain entre dans le canevas par
une balise `<img>` de plus, mais il était déjà dans la feuille pour le fond CSS
du Chantier : **le livrable ne l'inline pas une seconde fois**, et c'est
exactement le couplage décrit au lot SPRITES-ET-ZOOM.

**Borne T10 inchangée à 7 000 000**, marge **198 616 octets, 2,84 %**.

---

## 5. Les falsifications

**Vingt-sept falsifications, vingt-sept chutes — mais DEUX D'ENTRE ELLES NE
MORDAIENT PAS AU PREMIER RELEVÉ, et les deux gardes ont été resserrées après la
mesure.** Le compte entre parenthèses est celui des tests tombés.

**Points 1 à 6 — douze falsifications.** L'ancre retirée du calcul (2) · les
bornes du défilement retirées (1) · la grille rendue au seul Collecteur (1) · la
grille qui ne se retire plus (1) · le voile qui avale les touchers (1) · aucune
bande zébrée (1) · la pastille remise à 8 px fixes (1) · le refus repassé en ton
d'alerte (1) · la règle CSS du ton qui ne s'applique plus (1) · **l'Offense qui
n'appelle plus le rendu commun (1, après resserrage)** · **la vue du panneau
écrite en dur sur les bâtiments (1, après resserrage)** · le bouton du panneau
écrit en dur (1).

⚠⚠ **LES DEUX QUI NE MORDAIENT PAS SONT LES DEUX QUI COMPTAIENT LE PLUS, ET
ELLES SE DÉCLARENT.**

1. **`ERGO T7 ter` vérifiait que l'Offense IMPORTE le rendu commun, pas qu'elle
   l'APPELLE.** Mesuré : en remplaçant l'appel par celui d'une fonction voisine,
   la suite restait **entièrement verte** — l'import demeurait, aucune seconde
   déclaration n'apparaissait — pendant que le panneau de l'Offense ne se
   peignait plus du tout. La garde compte désormais les APPELS, un par écran,
   **la déclaration retirée avant le comptage** : une garde qui compte sa propre
   définition est la faute que ce dépôt a déjà payée cinq fois.
2. **Rien ne tenait le TERRAIN que le panneau décrit.** Remplacer
   `TERRAINS[terrainSelection]` par `TERRAINS.batiments` dans la vue laissait la
   suite verte — c'est-à-dire que le défaut latent corrigé au §6 pouvait revenir
   sans qu'un test bronche. La garde exige maintenant les trois lectures par
   `terrainSelection`, refuse les deux terrains écrits en dur, et **prouve
   d'abord que le choix compte** : les deux terrains rendent des vues
   différentes pour le même indice, sans quoi l'index serait sans conséquence.

**Point 7 — huit falsifications, huit chutes.** Anti-recouvrement retiré (3) ·
priorité ignorée (1) · colonne triée avant rangée (1) · `indexOf` brut, donc
`−1` en tête (1) · ne garder que la première boîte (3) · peindre avant de retenir
(1) · seuil remis à 64 (2) · largeur estimée au nombre de caractères au lieu de
`measureText` (1).

**Point 8 — sept falsifications, sept chutes.** Variante figée sur `_a` (2) ·
graine ignorée (1) · mauvais type d'obstacle (2) · atlas de terrain retiré de la
scène (1) · légende revenue à l'aplat (1) · second tirage écrit dans l'écran (1)
· `COULEUR_OBSTACLE` réintroduite (1).

### Les six gardes qui changent de cible, et pourquoi

Aucune n'est assouplie ; chacune porte sa raison dans le fichier.

1. **`monde.test.js`, la densité des étiquettes.** Elle exigeait « au plus 20
   sites étiquetés à l'écran », ce que le seuil garantissait quand il valait 64.
   Il vaut 36 : le seuil a cessé d'être un plafond de densité, donc il ne peut
   plus être ce rempart-là. La garde exige désormais **l'inverse** — que le seuil
   laisse passer plus de vingt — et le rempart est tenu par `ERGO T9` à `T13`.
   ⚠ Sa prose a été réécrite **après** la mesure : une première version affirmait
   « à dix cases les plaques se recouvrent », ce que le relevé de §3.3 contredit.
2. **`monde.test.js`, le compte d'atlas de la page** : quinze à seize, l'atlas de
   terrain entrant. C'est la boucle au-dessus — aucune balise ne porte de `src` —
   qui garde l'invariant, pas ce nombre.
3. **`rendu.test.js`, l'ordre de dessin.** Elle lisait une TEINTE,
   `COULEUR_OBSTACLE`, qui n'existe plus ; elle lit maintenant le NOM du dessin,
   donc le type de l'obstacle **et** sa variante. Elle en dit plus qu'avant.
4. **`repli.test.js`, la légende.** Elle refusait toute primitive `sprite` ; elle
   l'accepte, et exige en retour qu'il y en ait **exactement un**, qu'il porte le
   nom que rend la fonction commune, et que `drawImage` soit appelé une fois.
5. **`chantier.test.js`, le quinconce et la pastille** (point 4) : le sélecteur
   lisait une taille en dur, il lit la règle.
6. **`offense.test.js`, la garde d'import** : elle exigeait `poserCouches` comme
   DERNIER nom avant `} from './chantier.js'` ; elle analyse maintenant le bloc
   d'import et teste l'appartenance, donc elle ne dépend plus d'une position.

---

## 6. Un défaut trouvé en chemin, et corrigé

**Le bouton « Améliorer » du panneau du Chantier appelait les fonctions des
BÂTIMENTS en dur** — `problemesDeLAmelioration` et `ameliorer` de la disposition
—, sans regarder `terrainSelection`. Le panneau décrivant désormais aussi une
pièce de garnison, il aurait **amélioré le bâtiment de même indice** pendant que
le panneau parlait d'une tourelle. C'est la faute exacte que `rafraichir` avait
déjà commise au lot NIVEAU-DES-PIÈCES, vue par l'autre bout. Le bouton passe
maintenant par `TERRAINS[terrainSelection].actions.ameliorer`, et `ERGO T7 ter`
exige un seul rendu de panneau pour les deux écrans.

---

## 7. Ce que le lot ne tranche pas

- ⚠⚠ **Un conflit de geste subsiste sur l'écran de raid, et il n'est pas
  arbitré.** Le glisser-déposer des pièces vit sur `#raid-vagues`, le pincement
  sur `#raid-canvas` : deux éléments, et un contact tombe sur un seul. Ce lot ne
  l'aggrave pas d'un pixel et n'y touche pas — la dette est déclarée en tête de
  `ui/raid.js` depuis le lot ÉCRAN-RAID, et la refermer demande de décider quel
  geste l'emporte. **Ethan tranche.**
- ⚠ **Le seuil de dix cases est un nombre, et il se change seul.**
  `ETIQUETTE_CARTE.cssMiniParCase` vaut **36** : dix cases sur les 360 px CSS
  d'un téléphone, ce qu'Ethan a dit mot pour mot. S'il en veut douze, c'est 30 ;
  huit, c'est 45. Une ligne.
- ⚠ **L'ordre de priorité des étiquettes est une proposition.**
  `ordreDePriorite` met la base du joueur puis la base terminale puis les bases
  de l'Ouvrage, puis les sept POI, puis l'avant-poste et le camp. Ethan n'a pas
  donné d'ordre ; celui-ci met en tête ce qui ne bouge pas et en queue ce qui
  réapparaît. **Une ligne à réordonner s'il lit autrement.**
- ⚠ **Le dessin de l'obstacle en légende est un choix, pas un arbitrage.** La
  ligne de légende parle des trois types à la fois ; elle montre celui qui
  ralentit tout. Montrer les trois demanderait trois lignes, donc trois hauteurs
  de vignette dans une fenêtre qui doit tenir.
- ⚠ **Rien n'a été touché au calibrage.** Aucune valeur de `src/data/` ne bouge
  hors des deux du point 7 — le seuil d'affichage et l'ordre de priorité —, qui
  sont du calibrage d'AFFICHAGE et rien d'autre.

## 8. Écarts au brief, et points déclarés

- ⚠ **`AUDIT-REPARATION.md` n'existe pas au dépôt.** Les deux briefs le citent en
  hors-lot ; vérifié par `grep` sur tout le dépôt, il n'y est pas. Rien n'en
  dépend dans ce lot ; c'est signalé pour que la référence ne se propage pas.
- ⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 24.** Pas un champ n'entre dans
  l'état : un ancrage de défilement, un voile de bande, une taille de police, un
  panneau, un ton d'avis, un seuil d'affichage et un nom de sprite vivent tous
  dans l'écran.
- ⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le
  lot ne touche ni `art/`, ni `tools/` — pas un octet de `art/sprites/` ne
  change. Les sept captures du rapport vivent dans `rapports/`, hors de la
  chaîne.
- ⚠ **Le lot touche `src/ui/`, `src/render/`, `src/data/` et la page**, ce que le
  brief d'ERGONOMIE demande. Le brief d'ARRÊT interdisait `src/ui/` : cet
  interdit-là porte sur SON lot, et il a été tenu — le diff de `edbc521` ne
  contient aucun fichier d'interface.
