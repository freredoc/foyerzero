# RAPPORT — lot CONQUÊTE-24H

Arbitrage d'Ethan du 07/09, point **13**, seconde moitié :

> **Pendant 24 h, la base rasée émet le territoire du vainqueur, du niveau de la
> base rasée. Après, la ruine disparaît, et les territoires sont recalculés.**

Livré le **07/09/2026**. Modèle : Opus 5, effort maximum.

---

## 0. Base de départ, et ce qui sort

| | avant | après |
|---|---|---|
| `npm test` | **1340 pass / 0 fail** | **1359 pass / 0 fail** |
| `dist/index.html` | **8 256 764 octets** | **8 344 729 octets** |
| delta | — | **+87 965 octets** |
| dont images | — | **+84 644** — l'atlas de carte s'alourdit de 18 ruines |
| dont code | — | **+3 321** |
| `data:` dans la page | 297 | **297** — aucune ressource nouvelle |
| marge sous la borne T10 | 1 043 236 · 11,22 % | **955 271 octets · 10,27 %** |
| `version` | 0.99.23 | **0.99.24** |
| `build` | 124 | **126** |
| `SAVE_VERSION` | 27 | **28** |

La base de départ correspond exactement à ce que le brief annonçait, mesurée
avant la première ligne.

⚠⚠ **CE RAPPORT A ÉTÉ ÉCRIT DEUX FOIS, ET LE §7 DIT POURQUOI.** À la première
livraison, l'archive S10 des ruines n'était pas au dépôt et le §6 du brief
prévoyait ce cas : le lot était complet sauf le dessin, déclaré comme le point en
suspens le plus visible. Ethan a fourni les deux planches dans la foulée ; elles
sont passées par la chaîne complète, et **le poids ci-dessus est celui d'après**.
Le code seul avait coûté **+1 929 octets**, marge 11,20 % ; les images ont pris
le reste.

**Fichiers.** Un nouveau, `src/sim/ruines.js`. Modifiés : `src/sim/territoire.js`,
`src/sim/site-entame.js`, `src/sim/site-de-la-case.js`, `src/sim/poi.js`,
`src/sim/fondation.js`, `src/sim/state.js`, `src/ui/monde.js`,
`src/render/embleme.js`, `src/data/sites.js`, `src/data/atlas.js` (généré),
`tools/emblemes.py`, `tools/atlas.py`, `tools/entrees.py`, plus `CLAUDE.md`.
Côté art : **2 sources**, **36 sprites** (18 ruines × 2 grilles), **2 atlas**
recousus. Onze fichiers de test, dont un nouveau.

---

## 1. ⚠⚠ LA MESURE DU §1 — UNE BASE DU JOUEUR RASÉE N'EST PAS RETIRÉE

**Le chemin symétrique n'existe pas, et voici pourquoi.** `raserLaBase` de
`src/sim/raid-ouvrage.js:522` ne retire rien : elle **redéploie** la base du
joueur de `RAID_OUVRAGE.sanctionRasage.redeploiementCases` cases vers le sud —
vingt —, par `poserLaBaseSur`, en rabotant sur le bord de carte, puis lui vide
ses stocks. La base reste dans `etat.bases`, à la même colonne, vingt rangées
plus bas. Elle n'entre **jamais** dans `basesRasees` : le seul endroit du dépôt
qui y écrive est `retirerLeSite` de `src/sim/site-entame.js`, et ses deux
appelants — `enregistrerLeRaid` et `fonderUneBase` — sont des gestes du
**joueur**.

**La règle est écrite symétrique quand même**, comme le brief le demande.
`retirerLeSite(etat, identite, vainqueur)` prend le camp en argument ; le modèle,
la sauvegarde, la carte et l'expiration ne savent pas de quel côté vient la
ruine. `C24 T4` passe par ce vrai écrivain avec `OUVRAGE` et vérifie les 37 cases
de l'octogone ennemi. Le jour où une base du joueur sera **retirée** au lieu
d'être redéployée, il n'y aura rien à écrire — seulement à passer `OUVRAGE`.

⚠ **Et les satellites ne deviennent pas des ruines** — §8 du brief, vérifié :
`retirerLeSite` ne pousse une entrée que si `identite.type === 'base'`. Un camp
ou un avant-poste passe par `detruireSatellite`, qui le reprogramme.

---

## 2. Le modèle, et la seule chose qui pouvait mentir

`etat.basesRasees` répond depuis ce lot à **deux questions qui n'ont pas la même
durée de vie** :

| question | durée | lecture |
|---|---|---|
| cette case porte-t-elle encore un site ? | **jamais**, définitivement | `casesRasees` |
| cette case émet-elle du territoire ? | **24 h**, pas une de plus | `ruinesActives` |

Les deux vivent côte à côte dans `src/sim/ruines.js`, sous deux noms qui ne se
ressemblent pas, pour qu'on ne puisse pas écrire l'une en croyant écrire l'autre.
C'est le seul défaut que la §10 du brief demandait de chercher — *« un endroit
qui lit les ruines sans regarder leur expiration »* —, et le relevé complet des
lecteurs est au §10 de ce rapport.

⚠⚠ **LA PURGE N'EST PAS FACULTATIVE, ELLE EST INTERDITE.** Le brief la disait
optionnelle ; ici elle est impossible. Retirer une entrée périmée ferait
**reparaître la base**, qui est dérivée de la graine — `TYPES_SITE.base.respawn`
vaut `false` et c'est cette liste qui porte le seul fait que la graine ne peut pas
connaître. Ce qui expire est la **revendication** de l'entrée, jamais son
existence. La lecture est donc le seul rempart, et `C24 T14` le vérifie sur un
état explicitement **non purgé**.

### La forme d'une entrée

```js
{ rangee, colonne }                                    // case rasée, sans revendication
{ rangee, colonne, type, vainqueur, niveau, tick }     // ruine : elle émet jusqu'à expiration
```

`caseRasee` et `ruineFraiche` sont les deux seules fabriques, et elles valident.
`revendique(entree)` exige **les quatre champs ou aucun** : une entrée à moitié
remplie ne revendique rien.

⚠⚠ **`type` ET `vainqueur` SONT DEUX FAITS DIFFÉRENTS, ET LE SECOND NE DONNE PAS
LE PREMIER.** Le `vainqueur` dit pour QUI la ruine émet ; le `type` dit CE QUI est
tombé, donc quelle carcasse se dessine — les deux planches d'Ethan sont « base
joueur détruite » et « base Ouvrage détruite ». Ils sont **opposés** dans les deux
cas d'aujourd'hui (le joueur ne rase que des bases de l'Ouvrage, et
réciproquement), et c'est justement pourquoi les déduire l'un de l'autre serait
une inférence : le jour où un camp rasera une base de son propre camp, la
déduction serait fausse et le dessin mentirait sans que rien ne lève.

### Les 24 heures

`APRES_RAID.ruineHeures = 24` dans `src/data/sites.js` — une valeur de **jeu**,
qui se règle là et nulle part ailleurs. `sim/ruines.js` la convertit :
`TICKS_DE_RUINE = APRES_RAID.ruineHeures * TICKS_PAR_HEURE`, soit **864 000
ticks**. C'est la route de `TICKS_APPARITION` et de `RETOUR_DEFENSES`.

L'expiration est une **soustraction** sur `etat.horloge.nbTicks`, pas une file :

```js
return nbTicks - entree.tick < TICKS_DE_RUINE;
```

Le bord est **franc et fermé en haut** — à `TICKS_DE_RUINE − 1` elle émet encore,
à `TICKS_DE_RUINE` pile elle se tait. Les deux côtés sont gardés (`C24 T5`,
`C24 T6`) : un `<=` passe le premier sans un mot et tombe sur le second.

---

## 3. La migration v27 → v28, et la preuve qu'une v27 se charge

**Lecture retenue pour les anciennes entrées : ruine expirée.** Une v27 ne retenait
qu'une chaîne `"rangée:colonne"`. Elle ne sait ni qui a rasé, ni de quel niveau
était la base, ni quand — les trois champs sont nés avec ce lot. La migration
rend donc `{ rangee, colonne }` et **rien d'autre** :

```js
27: (s) => {
  s.version = 28;
  const migrees = [];
  for (const entree of s.basesRasees ?? []) {
    // chaîne d'une vraie v27, ou objet d'un état fabriqué à la main
    ...
    if (!Number.isInteger(rangee) || !Number.isInteger(colonne)) continue;
    if (!estSurLaCarte(rangee, colonne)) continue;
    migrees.push({ rangee, colonne });
  }
  s.basesRasees = migrees;
},
```

⚠⚠ **AUCUN NIVEAU, AUCUN VAINQUEUR, MÊME PLAUSIBLES.** Donner à une entrée
héritée le niveau de sa rangée peindrait, dès le premier chargement, un territoire
que personne n'a conquis — et il durerait vingt-quatre heures. `C24 T13` l'exige
champ par champ, et **retire aussi** une revendication héritée d'un montage
fabriqué à la main, comme les migrations 25 et 26 retirent les valeurs malformées.

**Le comportement d'une v27 chargée est celui d'avant ce lot, à l'identique** :
la case reste retirée, rien n'émet. Aucune partie ne change sous les pieds
d'Ethan. `C24 T12` construit une vraie v27 depuis une v28 — même partie, entrées
retransformées en chaînes —, la charge et exige **21 cases joueur avant, 0 après**
avec `siteDeLaCase` toujours à `null`.

⚠ **Et le retrait de la case reste indépendant de la revendication**, comme le
brief l'exigeait : `site-de-la-case.js` interroge `casesRasees`, qui ne regarde
jamais l'horloge.

---

## 4. Les deux lectures déclarées — et elles sont réversibles

### La portée de la ruine : celle du camp pour lequel elle émet

`RAYONS[JOUEUR] = 2` si le joueur a gagné, `RAYONS[OUVRAGE] = 3` sinon. C'est
cohérent avec « le territoire du vainqueur » et ça évite qu'une ruine porte plus
loin que les bases du camp qui la tient.

**L'autre lecture — la ruine garde la portée de ce qu'elle était — tient en une
ligne** : il suffirait de ranger le rayon dans l'entrée au lieu de le déduire du
camp. Elle changerait `C24 T1` de **21 à 37 cases**.

### Une ruine n'a pas de plancher

Le plancher d'Ethan dit *« le territoire où la **base** se trouve ne change
pas »*. Une ruine n'est pas une base — §4 du brief — et le §5 veut que sa
frontière *« suive celle des autres, sans traitement particulier »*. Elle est
donc une contribution de plus dans la somme de son camp, **y compris sur sa
propre case**, qu'elle peut perdre face à plus fort qu'elle.

Retourner la lecture, c'est retirer `!base.ruine` dans `campDeLaCase` et
`!centre.ruine` dans `peindre` — deux mots. `C24 T1` mesure la lecture des deux
côtés (la case ET la carte) pour qu'elle ne soit gardée par rien d'autre qu'une
relecture : ruine du joueur à 20 sur sa case (2²³) contre ruine de l'Ouvrage à 25
posée juste à côté (2²⁷).

---

## 5. ⚠⚠ CE QUE LE §4 DU BRIEF AVAIT ANNONCÉ — LES DEUX DÉFAUTS Y ÉTAIENT

### `fondation.js` recalculait au lieu de lire

Il portait sa propre boucle : quarante-neuf cases interrogées autour de la cible,
`estBaseOuvrage` puis `siteDeLaCase`, pour redemander « une base de l'Ouvrage
est-elle à **portée** ». Trois choses s'y jouaient de travers :

1. il **ne voyait pas les ruines** — elles ne sont pas des bases ;
2. il demandait la **portée** là où la carte répond la **propriété** depuis
   TERRITOIRE-FORCE : une case atteinte par une base de l'Ouvrage mais tenue par
   le joueur était refusée alors que la carte la montrait alliée ;
3. c'était une **seconde écriture du territoire**, la faute que ce dépôt a déjà
   retirée deux fois — de `points-attaque.js` à EUCLIDE, des POI à TERRITOIRE-LU.

Il lit maintenant `campDeLaCase(etat, …) === OUVRAGE`. Trois imports disparaissent
(`GEOGRAPHIE`, `dansLOctogoneDInfluence`, `estBaseOuvrage`) et la fonction locale
avec eux.

⚠⚠ **CONSÉQUENCE MESURÉE ET ASSUMÉE : LE REFUS SE DESSERRE.** Fonder est désormais
permis partout où l'Ouvrage ne **tient** pas, y compris à deux cases d'une de ses
petites bases si le joueur y est plus fort. C'est la même bascule que la récolte
des POI au lot précédent, et c'est ce qu'Ethan a demandé le 07/09 : *« le
territoire de 24 h sert à fonder »*. ⚠ Le message ne parle plus de trois cases,
parce que ce n'est plus une distance : « Cette case est tenue par l'Ouvrage. »

### `releverLesPoisAcquis` bouclait sur les bases

Le brief l'avait nommé d'avance — *« si `releverLesPoisAcquis` boucle sur
`etat.bases`, les ruines n'y sont pas »* — et il y était. La récolte partait de
`basesDuJoueur(etat)` : une ruine qui **tient** une case n'aurait donné son
gisement que si une base du joueur l'atteignait aussi, c'est-à-dire **jamais**,
dans le seul cas où la question se pose.

Elle part maintenant de `forcesDuJoueur(etat)` — la liste des centres d'où le
joueur projette, bases et ruines actives ensemble. Le rayon ne change pas
(`RAYONS[JOUEUR]`, celui que la ruine prend déjà), et le partage se demande
toujours case par case à `campDeLaCase`, en dernière garde. `C24 T10` pose le
joueur à **quatre-vingt-dix rangées** du gisement : s'il est récolté, c'est que la
récolte part des émetteurs.

⚠ **Un POI pris reste pris.** `poisAcquis` est de l'HISTOIRE et la garde
d'acquisition passe avant celle de propriété : `C24 T11` récolte, laisse expirer,
vérifie que la case est redevenue `NEUTRE`, et exige que l'acquis n'ait pas bougé
— même après un relevé de plus.

---

## 6. ⚠⚠ LE PIÈGE DU §8 — L'EMPREINTE DU CACHE DE CARTE

Il était réel. Mesuré avant correction, `empreinteDeLaCarte` de `src/ui/monde.js`
ne portait que trois grandeurs :

```js
let empreinte = `${etat.baseCourante}:${etat.prochaineInstanceSatellite}`;
for (const base of etat.bases) empreinte += `:${base.satellites.presents.length}`;
```

Une ruine est le **premier élément de la carte qui change tout seul**, sans que le
joueur ait rien fait. À son expiration, aucune de ces trois grandeurs ne bouge :
`rafraichir` serait donc reparti sans redessiner, et la frontière serait restée
fausse jusqu'au prochain geste du joueur — *une carte juste au chargement et
fausse une heure plus tard*. Elle porte maintenant les **cases** des ruines
actives, pas leur compte : une ruine qui expirerait le tick où une autre naîtrait
laisserait le compte inchangé.

⚠ **Elle est sortie de la fermeture de `creerEcranMonde` pour être mesurable, et
c'est tout ce qui a bougé d'elle.** Elle ne lit que l'état — aucun canevas, aucun
DOM — et le dépôt ne sait pas monter cet écran (CLAUDE.md §3) : enfermée, le piège
le plus discret du lot n'aurait été gardé par **rien**. `C24 T17` l'y confronte,
et c'est le dix-septième test d'une liste qui en demandait seize (voir §11).

⚠ **La mémorisation de la carte de territoire elle-même ne change pas**, comme le
§8 l'exigeait : `dessiner()` reste gardé par l'empreinte, `territoireDeLaFenetre`
reste appelée à chaque dessin, et le mémo de `sim/peuplement.js` est indexé sur la
GRAINE — les ruines n'y entrent pas.

---

## 7. Les sprites — la chaîne complète, et ce qu'elle a appris

### 7.1 Le constat de départ, et ce qui l'a levé

**Vérifié avant toute chose, comme le §6 le demandait.** `art/sprites/carte/128/`
portait 54 emblèmes de site : **9 paliers × 3 états × 2 camps**, les trois états
étant `intact`, `_fumee` et `_feu` — **aucune planche « complètement détruite »**.
L'archive n'était pas jointe au brief, et le lot PICTOGRAMMES ne l'avait pas
emportée. **Ethan a fourni les deux planches en cours de lot**, et elles sont
passées par la chaîne complète : sources, `tools/planches.py` (rien à y faire —
les emblèmes vivent dans `tools/emblemes.py`), grilles 128 et 64, atlas,
`tools/entrees.py --declarer`, `tools/verifier.py` avant et après.

### 7.2 ⚠⚠ LE CAMP DE CHAQUE PLANCHE EST MESURÉ, PAS DÉDUIT DE L'ORDRE

Rien dans deux images ne dit laquelle est le joueur. On les a confrontées aux
quatre planches d'emblème déjà au dépôt, sur la couleur moyenne de leur matière :

| planche | moyenne RVB | écart au joueur | écart à l'Ouvrage |
|---|---|---|---|
| pierre claire | (90, 81, 63) | **10,3** | 34,0 |
| pierre sombre | (74, 56, 64) | 37,7 | **6,0** |

Le canal vert tranche seul : les emblèmes du joueur tiennent un sable chaud
(G ≈ 88–91), ceux de l'Ouvrage un gris froid (G ≈ 54–57). La claire est donc
`S10_base_joueur_completement_detruite_3x3_1024.png`, la sombre
`S10_base_ouvrage_completement_detruite_3x3_1024.png`. C'est le même motif que
`tools/ruines.py` emploie depuis le lot 10 pour ses deux ruines de mur : « le camp
est mesuré, pas déduit de l'ordre du nom de fichier ».

### 7.3 ⚠⚠ UN QUATRIÈME ÉTAT, ET POUR DEUX FAMILLES SEULEMENT

`ETATS` valait `['', '_fumee', '_feu']` pour les quatre familles. Le quatrième
n'y est **pas entré** : il n'existe que pour les familles qui en portent une
planche, et `None` en quatrième champ de `FAMILLES` dit « celle-ci ne laisse pas
de ruine ». C'est un fait de JEU, pas une planche qui manquerait — un camp ou un
avant-poste RESPAWNE, `retirerLeSite` ne range que les bases dans `basesRasees`.
D'où **18 sprites, et non 36**.

⚠⚠ **LA RUINE SE CONDITIONNE DANS SA FAMILLE, ET LA RÉFÉRENCE D'ÉCHELLE L'EXIGE.**
Une ruine de palier 9 doit faire la taille d'une base de palier 9 ; les quatre
états d'une famille partagent donc UNE échelle, et l'ajouter à côté aurait donné
des carcasses à une taille sans rapport. **Mesuré avant d'écrire un seul
sprite** : la ruine ne DÉPLACE pas la référence — 0,882 cellule côté joueur et
0,961 côté Ouvrage, contre 0,996 et 1,084 pour les états debout. Une ruine est
plus basse qu'une base, panache compris. **Conséquence vérifiée à l'octet : les
234 fichiers d'avant sont identiques, 36 nouveaux, 1 différent — le manifeste,
qui gagne 18 cellules.**

### 7.4 ⚠⚠ LA COUPE A DÛ APPRENDRE LE CAS SYMÉTRIQUE

`cellules_par_composante` savait traiter une colonne qui a **trop peu** de
composantes — une qui en vaut deux, coupée à sa taille. La planche de ruines de
l'Ouvrage en a **trop** : sa colonne 2 portait **cinq** composantes au-dessus du
`SEUIL_COMPOSANTE` de 500 px, parce qu'une carcasse projette des blocs détachés
de 654 et 728 pixels.

**La règle ajoutée est un RANG, pas un seuil** : on garde les `ny` plus grandes,
et le reste rejoint sa plus proche voisine — exactement ce que les braises font
déjà, par la même transformée de distance. Ce qui l'autorise est une mesure : la
plus petite gardée fait **24 886 px**, le plus gros surnuméraire **728** —
**un facteur 34**, le même fossé qui justifie `SEUIL_COMPOSANTE`, pris un cran
plus haut. Relever le seuil aurait marché aussi, et aurait été un nombre choisi
pour une planche.

### 7.5 L'atlas, et la garde qui refusait un ajout voulu

La famille `carte` passe de **115 à 133** cellules cousues, grille 12 × 12.
`tools/atlas.py` a refusé de l'écrire : sa garde — posée au lot PICTOGRAMMES
contre les écarts d'encodeur WebP — n'écrase **jamais** un atlas existant qui ne
se reproduit pas. Elle ne connaissait qu'un cas ; il y en avait deux.

⚠ **`--forcer <famille>` a été ajouté, et il est PAR FAMILLE.** Forcer tout
réécrirait les dix atlas qui ne diffèrent que par l'encodeur, pour des images
identiques — c'est-à-dire exactement ce que la garde existe pour empêcher.
`--forcer carte` nomme la famille qu'on entend réécrire ; les autres ne bougent
pas, et `PIC T6` continue de le garder ligne par ligne.

### 7.6 ⚠ TROIS OUTILS SUR TREIZE ÉCRIVENT ENFIN EN LF

Le lot PICTOGRAMMES avait signalé que « les treize outils écrivent leurs fichiers
texte **sans `newline=`** » : sous Windows, Python rend du CRLF, le dépôt est en
LF, et `tools/verifier.py` annonce « DIFFÈRE » sur un contenu **identique**. Les
trois outils que ce lot fait écrire sont corrigés — `emblemes.py`, `atlas.py`,
`entrees.py` —, ce qui retire **quatre faux écarts** du verdict :
`emblemes-mesures.json`, `atlas-empreintes.json`, `src/data/atlas.js`,
`sources-declarees.json`. Les dix autres outils restent, et c'est un lot à part.

### 7.7 Le verdict de `tools/verifier.py`

**Avant le lot**, `--outil emblemes` : **234 identiques, 1 différent, 0 nouveau,
0 MANQUANT**. Le seul écart était `emblemes-mesures.json`, **CRLF contre LF,
contenu identique** — le défaut du §7.6.

**Après le lot**, chaîne complète : **718 identiques à l'octet, 268 différents,
0 nouveau, 0 MANQUANT**, en 571 s. **Aucun sprite ne diffère.** Les 268 se
ventilent en deux tas connus :

- **264 `.opus`** — `opusenc` est absent de cette machine. `tools/entrees.py
  --declarer` rejoue TOUTE la chaîne, sons compris ; il a été joué avec un
  `opusenc` local délégant à `ffmpeg`, et **cet encodeur-là n'est pas
  `opus-tools`**. Les 264 écarts sont donc l'artefact de la mesure, pas un fait
  du dépôt : le §7.8 dit comment la déclaration a été vérifiée de face.
- **4 JSON** — `ancres-blindes.json`, `ancres-defense.json`,
  `fond-empreintes.json`, `sol-empreintes.json` : le défaut `newline=` des dix
  outils non corrigés.

⚠ **Et la ligne « ATLAS » du vérificateur reste, en s'améliorant.**
`atlas.py --verifier` rendait **10 identiques / 10 différents** sur un arbre
pristine ; il rend maintenant **12 / 8** — les deux atlas `carte` ont été
recousus par cette machine, donc ils se reproduisent. Les huit qui restent sont
les écarts d'encodeur d'avant le lot.

### 7.8 La déclaration des sources

`tools/entrees.py --declarer` a été joué avec le même `opusenc` local, et **son
résultat est vérifiable de face** : la déclaration ne bouge **que des deux
planches**, qui passent de rien à consommées — **402 → 404 consommées, 114
dormantes inchangées**, rien d'autre. `sources-declarees.json` n'a pas été édité
à la main.

### 7.9 Le niveau → palier, et l'ancrage

⚠ **La correspondance niveau → palier existait déjà, et dans `src/data/` :**
`palierDeNiveau(niveau)` de `src/data/sites.js:1260`, adossée à
`PALIERS_EMBLEME`. Il n'y avait rien à écrire — la dériver une seconde fois pour
les ruines aurait fait deux tables.

⚠ **`ancrage='centre'` n'a pas eu à être demandé** : l'appel des familles le
passe depuis le lot EMBLÈME-CENTRÉ, et les ruines entrent par ce même appel. Le
§6 du brief l'exigeait ; il est tenu par construction, pas par une ligne de
plus.

---

## 8. Le coût, mesuré des deux côtés

Relevé sur `main` (f5c5bac) dans un `git worktree`, puis sur la branche, même
machine, même graine 31 082 026, même fenêtre (31 × 31 rangées 270–300).

| appel | avant | après |
|---|---|---|
| `territoireDeLaFenetre`, aucune case rasée | 518,1 µs | 537,3 µs |
| `campDeLaCase`, aucune case rasée | 1,9 µs | 2,2 µs |
| `releverLesPoisAcquis`, aucune case rasée | 4,4 µs | 4,7 µs |
| `empreinteDeLaCarte`, aucune case rasée | — | 0,2 µs |
| `territoireDeLaFenetre`, 90 rasées / 12 ruines | 265,1 µs | 346,4 µs |
| `campDeLaCase`, 90 rasées / 12 ruines | 4,7 µs | 13,1 µs |
| `releverLesPoisAcquis`, 90 rasées / 12 ruines | 3,7 µs | **80,3 µs** |
| `empreinteDeLaCarte`, 90 rasées / 12 ruines | — | 1,0 µs |
| `tickJeu`, 90 rasées / 12 ruines | 8,7 µs | **92,3 µs** |

**Sur une partie sans ruine, rien ne bouge** : +4 % au plus, dans le bruit.

⚠⚠ **SUR UNE PARTIE À DOUZE RUINES ACTIVES, `tickJeu` PASSE DE 8,7 À 92,3 µs, ET
C'EST LA RÉCOLTE DES POI QUI LE PAIE.** La cause est structurelle et assumée :
`releverLesPoisAcquis` boucle désormais sur **treize** centres au lieu d'un, et
chacun demande `poiDeLaCase` sur les 25 cases de son carré — 325 hachages par
tick au lieu de 25. Le coût est **linéaire en nombre de ruines actives**, environ
6 µs par émetteur.

**Ce que ça vaut, en clair :** le tick fait 100 ms (`TICK_MS`). 92 µs, c'est
**0,09 % du budget**, et cinquante ruines simultanées en feraient 0,4 %. Le
rattrapage hors ligne, lui, est ANALYTIQUE et ne multiplie pas — 25 h se
rattrapent en 11 ms. Aucune correction n'est faite ici : il n'y a pas de mémo
à poser qui ne rouvre pas exactement le défaut que la §10 existe pour chercher —
un cache dont l'invalidation dépendrait de l'horloge. **Signalé pour être
surveillé**, pas corrigé de sa propre initiative.

---

## 9. Les tests — PASS/KO, et le montage effectivement écrit

Tous dans `test/conquete-24h.test.js`, **17 tests, 17 PASS**.

| Code | PASS | Montage effectivement écrit |
|---|---|---|
| **C24 T1** | ✅ | Base `200:9` de niveau 20, voisinage rasé, joueur en `290:16`. **37 cases OUVRAGE avant, 21 cases JOUEUR après**, et `campDeLaCase` confronté à `occupantDeLaCase` sur cinq écarts. Porte aussi la mesure de la lecture « pas de plancher ». |
| **C24 T2** | ✅ | ⚠ **Montage du brief impossible, reconstruit** — voir §11.1. Ruine du joueur contre une **ruine de l'Ouvrage de niveau 18** à géométrie fixe, jouée **deux fois** : la rasée de niveau 20 l'emporte, celle de niveau 17 perd, tout le reste étant égal. |
| **C24 T3** | ✅ | Ruine 10 + base du joueur 10, chacune à une case : 2¹² + 2¹² = 2¹³, contre une ruine de l'Ouvrage de 11 à une case, 2¹³ — égalité au joueur. Mordant : les deux ruines naissent à **cent ticks d'écart**, si bien que seule celle du joueur expire, et la case tombe. |
| **C24 T4** | ✅ | `retirerLeSite(etat, identite, OUVRAGE)` — le vrai écrivain, avec l'autre camp. La base disparaît de la carte (`siteDeLaCase` à `null`) et l'Ouvrage garde ses **37 cases** ; à l'expiration, plus rien. |
| **C24 T5** | ✅ | `rattraperJeu(TICKS_DE_RUINE − 1)`, 21 cases. Garde que la base du joueur n'a pas bougé pendant le rattrapage. |
| **C24 T6** | ✅ | `rattraperJeu(TICKS_DE_RUINE)`, 0 case joueur **et** 0 case Ouvrage. Les deux côtés du seuil, pas un. |
| **C24 T7** | ✅ | `serialiser` puis `charger` **vingt-cinq heures plus tard** — le vrai chemin du hors-ligne, aucun tick joué. Et un second chargement à **vingt-trois heures** qui exige le contraire : un code qui expirerait tout au chargement passerait le premier. |
| **C24 T8** | ✅ | Un **mois** de rattrapage : `ruineEstActive` à `false`, `siteDeLaCase` toujours `null`, la case toujours dans `casesRasees`. |
| **C24 T9** | ✅ | Case `200:10` **disputée** : `200:12` reste debout et la tient (2²¹) ; la ruine à une case pèse 2²². Refus `territoire-ennemi` **avant**, absent **après**, et de retour à l'expiration sans qu'on ait rien purgé. |
| **C24 T10** | ✅ | Gisement `202:10` (poiRedoute, bande 4) à deux cases de la ruine, joueur à **quatre-vingt-dix rangées**. `releverLesPoisAcquis` rend 1. |
| **C24 T11** | ✅ | Récolte, expiration, `campDeLaCase` redevenu `NEUTRE`, acquis inchangés — et inchangés encore après un relevé de plus. |
| **C24 T12** | ✅ | Une vraie v27 construite depuis la v28 (entrées retransformées en chaînes), chargée : version à jour, mêmes cases, **0 case émise**, `siteDeLaCase` à `null`. Porte la garde `SAVE_VERSION === 28`. |
| **C24 T13** | ✅ | `migrer({version: 27, basesRasees: [...]})` : `vainqueur`, `niveau`, `tick` tous `undefined`, `ruinesActives` vide. Retire aussi une revendication héritée et les cases hors carte. |
| **C24 T14** | ✅ | Entrée périmée **sans purge** — la longueur de `basesRasees` est asserted inchangée —, `ruinesActives` vide, carte et case à zéro. |
| **C24 T15** | ✅ | La case est dans `ciblesAPortee` **avant**, plus après ; `etat.bases` inchangé en longueur et en contenu ; `siteDeLaCase` à `null` — alors que `campDeLaCase` dit que la ruine tient sa case. |
| **C24 T16** | ✅ | Deux parties identiques → même texte à l'octet. Mordant : **l'ordre** des deux rasements change le résultat (les ticks diffèrent), et un aller-retour `serialiser`/`charger` rend le même texte. |
| **C24 T17** | ✅ | ⚠ **Hors liste** — le §8. `empreinteDeLaCarte` change quand la ruine paraît, ne change pas à `−1` tick, et **revient à sa valeur d'origine** à l'échéance. |
| **C24 T18** | ✅ | ⚠ **Hors liste** — le §5. La base rasée QUITTE `sitesDeLaFenetre` (elle y restait : défaut antérieur au lot), la ruine a un nom d'atlas au palier de son niveau, et à l'expiration **ni l'une ni l'autre** n'y sont. |
| **C24 T19** | ✅ | ⚠ **Hors liste** — le §5. `spriteDeLaRuine('base', 5)` rend la carcasse d'**Ouvrage**, `'baseJoueur'` celle du **joueur** ; les cinq autres types LÈVENT, les 18 noms sont cousus, et la géométrie ne rend aucun `undefined` — la garde que `drawImage` ne donne pas. |

### Falsification — on casse UNE chose, on note ce qui rougit

Chaque ligne a été jouée : la modification posée, la suite lancée, la
modification retirée.

| # | Ce qu'on casse | Ce qui tombe |
|---|---|---|
| **F1** | les ruines du joueur n'entrent plus dans la somme | T1 T2 T3 T5 T7 T9 T10 T11 T12 T15 |
| **F2** | le seuil devient `<=` (un tick de trop) | T3 T4 T6 T9 T14 T17 |
| **F3** | `site-de-la-case` se met à regarder l'horloge | T3 T6 **T8** T12 |
| **F4** | l'empreinte de la carte oublie les ruines | **T17** |
| **F5** | la récolte des POI repart de `etat.bases` | **T10 T11** |
| **F6** | la migration invente un niveau et un vainqueur | **T12 T13** |
| **F7** | la fondation ne voit pas les ruines | **T9** |
| **F8** | les ruines de l'Ouvrage n'entrent plus dans la somme | T1 T2 T3 **T4** |
| **F9** | la ruine reçoit le plancher des bases | **T1** |
| **F10** | la carte cesse de filtrer les bases rasées | **T18** |
| **F11** | la carcasse devient celle du vainqueur | T18 **T19** |

Aucune ligne ne rend « aucun test ne tombe ». **F9 en rendait un avant
correction** : la lecture « une ruine n'a pas de plancher » n'était gardée par
rien, et deux assertions ont été ajoutées à `C24 T1` pour qu'un retournement de
cette lecture se voie.

⚠ **Une douzième falsification n'a pas eu besoin d'être jouée : la chaîne d'art
tombe d'elle-même.** Retirer la branche « trop de composantes » de
`cellules_par_composante` fait LEVER `tools/emblemes.py` sur
« colonne 2 porte 5 emblèmes au lieu de 3 » — donc les 36 sprites n'existent pas,
donc l'atlas ne se coud pas. C'est la forme la plus forte qu'une garde puisse
prendre, et c'est ainsi que le défaut a été trouvé.

---

## 10. ⚠⚠ LA RELECTURE DU §10 — LE RELEVÉ COMPLET DES LECTEURS

*« Chercher une chose : un endroit qui lit les ruines sans regarder leur
expiration. »* Voici les **six** endroits de `src/` qui touchent
`etat.basesRasees`, et le verdict de chacun.

| lecteur | ce qu'il demande | regarde l'horloge ? | verdict |
|---|---|---|---|
| `site-de-la-case.js:178` | la case porte-t-elle un site ? | **non**, par `casesRasees` | **juste** — le retrait est définitif, `C24 T8`, et `F3` le prouve en cassant |
| `territoire.js:185` | quelle base de l'Ouvrage est encore debout ? | **non**, par `casesRasees` | **juste** — une base rasée ne peint plus jamais, `TF T10` |
| `territoire.js:154` | qui émet pour le joueur ? | **oui**, par `ruinesActives` | juste |
| `territoire.js:201` | qui émet pour l'Ouvrage ? | **oui**, par `ruinesActives` | juste |
| `ui/monde.js:1197` | faut-il redessiner ? | **oui**, par `ruinesActives` | juste, §6 |
| `missions.js:212` | combien de bases le joueur a-t-il rasées ? | **non**, `.length` | **juste** — un compte d'HISTOIRE, sans durée |

**`ruinesActives` est la seule porte vers l'émission**, et elle lève plutôt que de
deviner l'heure : un état sans horloge qui porterait une revendication ne peut pas
dire si elle a expiré, et rendre « active » par défaut peindrait un territoire sur
une ruine peut-être vieille d'un mois.

Deux gardes supplémentaires ont été posées pendant la relecture :

- ⚠ **`casesRasees` lève sur la forme d'avant la v28.** Une chaîne
  `"rangée:colonne"` ne lève pas d'elle-même : `entree.rangee` vaudrait
  `undefined`, la clé serait `"undefined:undefined"`, et la base rasée
  **reparaîtrait en silence**. `migrer` convertit les sauvegardes ; ce qui reste
  est un montage écrit à la main, et il doit s'en apercevoir. C'est ce qui a rendu
  la mise à jour des huit montages existants sûre plutôt que espérée.
- ⚠ **Le mémo de `sim/peuplement.js` est indexé sur la GRAINE**, pas sur l'état :
  les ruines n'y entrent pas, donc il ne peut pas en retenir une périmée.

---

## 11. Écarts

### 11.1 ⚠⚠ Le montage de `C24 T2` ne se construit pas comme le brief le décrit

Le brief demandait « raser une base de niveau 20 **près d'une base Ouvrage de
niveau 18** ». **C'est géométriquement impossible, et c'est mesuré.** Le niveau
d'une base de l'Ouvrage est celui de sa RANGÉE, à
`GEOGRAPHIE.niveauParCase = 0,2` niveau par case — soit **cinq rangées par
niveau**. Deux niveaux d'écart valent **dix rangées**, et le plus grand rayon
d'influence en vaut trois : les octogones de ces deux bases ne se rencontrent
jamais.

Le montage est donc bâti avec une **ruine de l'Ouvrage** de niveau 18, ce qui est
légitime — la règle est symétrique, une ruine est un émetteur de plein droit, et
son niveau se choisit puisqu'il est stocké. L'adversaire vaut donc 18 exactement,
comme le brief le voulait. Et pour que le test distingue vraiment « le niveau de
la rasée » de n'importe quelle autre valeur, **il tourne deux fois** : à 20 la
ruine l'emporte, à 17 elle perd, même géométrie et même adversaire.

### 11.2 Un dix-septième test, hors de la liste T1–T16

Le §8 du brief nommait l'empreinte du cache « le piège le plus discret du lot » et
le §9 en demandait la **vérification**. Rien dans T1–T16 ne l'aurait attrapée :
`C24 T17` a été ajouté, et `empreinteDeLaCarte` sortie de la fermeture de
`creerEcranMonde` pour être appelable. C'est le seul changement de structure du
lot qui ne vienne pas de la règle.

### 11.3 Trois gardes de `SAVE_VERSION` corrigées, en le sachant

`PD T10` de `state.test.js` et `RCU T12` de `raid-ouvrage.test.js` écrivaient le
numéro en clair, et le commentaire du premier disait pourquoi : *« un lot qui
bumpe légitimement `SAVE_VERSION` doit passer par cette ligne et la corriger en le
sachant »*. CONQUÊTE-24H y est passé. `SAT-R T11` de `satellites.test.js` portait
la garde du numéro le plus récent (`=== 27`) ; elle descend à `>= 27` — « son »
maillon existe toujours — et la garde du numéro passe à `C24 T12`, comme la règle
du dépôt le veut depuis SITE-ENTAMÉ.

### 11.4 Huit montages de test suivent la forme des entrées

`bases.test.js`, `euclide.test.js`, `missions.test.js`, `poi.test.js`,
`raid-ouvrage.test.js`, `site-entame.test.js`, `state.test.js` et
`territoire.test.js` poussaient des chaînes dans `basesRasees` ou appelaient
`retirerLeSite` sans vainqueur. Tous emploient maintenant `caseRasee(r, c)` —
**sans revendication**, ce qui reproduit exactement l'ancien comportement : ces
montages **écartent** des bases, ils ne les **conquièrent** pas. Leur donner une
ruine fraîche aurait couvert la carte de territoire joueur, et douze montages de
`territoire.test.js` auraient mesuré autre chose que ce qu'ils annoncent.

### 11.5 ⚠ Trois outils sur treize écrivent en LF, dix restent

Détaillé au §7.6. Le correctif est d'un mot par écriture, et il retire quatre
faux écarts du vérificateur. Les dix autres outils rendent encore du CRLF sous
Windows — `ancres-blindes.json`, `ancres-defense.json`, `fond-empreintes.json` et
`sol-empreintes.json` en portent la trace dans le verdict du §7.7. **Les corriger
tous est un lot à part** : ce lot-ci n'a corrigé que ce qu'il fait écrire, pour
que son propre verdict soit lisible.

### 11.6 ⚠⚠ La carte dessinait les bases rasées — défaut ANTÉRIEUR au lot

Trouvé en câblant le dessin de la ruine, mesuré avant d'être corrigé :
`sitesDeLaFenetre` de `src/ui/monde.js` partait de
`basesDeLaFenetre(etat.graine, …)` — **la graine seule, sans l'état** —, si bien
qu'une base rasée restait dessinée **intacte** (`avarie: 'aucune'`) pendant que
`siteDeLaCase` y rendait déjà `null`. Le joueur voyait une base qu'il venait de
détruire, et la toucher n'ouvrait rien.

C'est le **jumeau exact** du défaut que `TF T10` a corrigé dans `forcesDeLOuvrage`
au lot TERRITOIRE-FORCE, pris par l'autre bout — la force d'abord, le dessin
maintenant. Les deux venaient du même oubli. `C24 T18` le garde.

### 11.7 `--forcer` ajouté à `tools/atlas.py`

Détaillé au §7.5. C'est une addition à un outil, pas à la règle du jeu, et elle
répare une garde qui refusait un ajout **voulu** dans une famille existante.

### 11.8 `basesDuJoueur` de `territoire.js` n'a plus d'appelant dans `src/`

`sim/poi.js` était son seul consommateur de production ; il appelle maintenant
`forcesDuJoueur`. Elle reste exportée et employée par `test/territoire.test.js`.
⚠ **Elle n'a pas été retirée** : c'est un rangement, pas une règle, et il n'était
pas demandé. À noter que `sim/points-attaque.js` porte une **autre** fonction du
même nom, celle-là bien vivante (raid, site-de-la-case, points d'attaque).

### 11.9 Le refus de fonder change de nature

Détaillé au §5 : le refus passe de la **portée** à la **propriété**, et le message
change. Aucun test existant ne mesurait le cas où les deux divergent — la suite est
restée verte sans qu'une ligne soit touchée dans `fondation`. C'est un
**changement de règle**, pas un nettoyage, et il est déclaré comme tel.

---

## 12. Points en suspens

1. ⚠ **Le rendu n'a pas été vu à l'écran, et se déclare non exécuté.** Le dépôt
   ne sait pas monter `creerEcranMonde` (CLAUDE.md §3) : ce qui est vérifié est
   le NOM du sprite, sa présence dans l'atlas, et que la géométrie rendue est
   faite de nombres finis — pas les pixels à l'écran. C'est la même limite que
   les lots d'art précédents déclarent.
2. ⚠ **`tickJeu` à douze ruines actives** : 92,3 µs contre 8,7. 0,09 % du budget
   de tick, linéaire en nombre de ruines. Signalé au §8, non corrigé —
   la seule correction évidente serait un cache indexé sur l'horloge, c'est-à-dire
   exactement ce que la §10 du brief demande de ne pas écrire.
3. ⚠ **Le chemin symétrique n'existe toujours pas.** La règle est écrite et
   testée ; le jour où une base du joueur sera retirée au lieu d'être redéployée,
   il faudra passer `OUVRAGE` à `retirerLeSite` — et ce jour-là, relire le
   plancher : une ruine de l'Ouvrage posée sur la case d'une base du joueur qui
   se réinstalle ailleurs n'a pas été pensée.
4. ⚠ **La ruine ne se répare pas, ne se prend pas, ne se conteste pas.** Rien ne
   permet à l'Ouvrage de reprendre une ruine du joueur autrement qu'en la
   surpassant en force. C'est cohérent avec « elle n'est pas une base », mais
   personne n'a arbitré le cas où les deux camps voudraient la même ruine.
5. ⚠ **`basesDuJoueur` de `territoire.js`**, §11.8.
6. ⚠ **Les dix outils qui écrivent encore en CRLF**, §11.5 — et les 264 `.opus`
   qui ne se reproduiront pas tant qu'`opusenc` manquera à cette machine.
7. ⚠ **Une ruine ne se répare pas et ne s'attaque pas**, et personne n'a arbitré
   ce qui devrait se passer si les deux camps voulaient la même. Voir le point 4.

---

## 13. Rendu

Branche `claude/lot-conquete-24h`, **PR ouverte, non mergée**.
