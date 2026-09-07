# RAPPORT — lot CONQUÊTE-24H

Arbitrage d'Ethan du 07/09, point **13**, seconde moitié :

> **Pendant 24 h, la base rasée émet le territoire du vainqueur, du niveau de la
> base rasée. Après, la ruine disparaît, et les territoires sont recalculés.**

Livré le **07/09/2026**. Modèle : Opus 5, effort maximum.

---

## 0. Base de départ, et ce qui sort

| | avant | après |
|---|---|---|
| `npm test` | **1340 pass / 0 fail** | **1357 pass / 0 fail** |
| `dist/index.html` | **8 256 764 octets** | **8 258 693 octets** |
| delta | — | **+1 929 octets**, entièrement du code |
| `data:` dans la page | 297 | **297**, aucune image ajoutée |
| marge sous la borne T10 | 1 043 236 · 11,22 % | **1 041 307 octets · 11,20 %** |
| `version` | 0.99.23 | **0.99.24** |
| `build` | 124 | **125** |
| `SAVE_VERSION` | 27 | **28** |

La base de départ correspond exactement à ce que le brief annonçait, mesurée
avant la première ligne. Aucun fichier d'`art/` n'est touché — `git status` le
montre —, `src/data/atlas.js` est intact, et les 297 `data:` de la page sont
donc les mêmes des deux côtés.

**Fichiers.** Un nouveau, `src/sim/ruines.js`. Neuf modifiés :
`src/sim/territoire.js`, `src/sim/site-entame.js`, `src/sim/site-de-la-case.js`,
`src/sim/poi.js`, `src/sim/fondation.js`, `src/sim/state.js`, `src/ui/monde.js`,
`src/data/sites.js`, plus `CLAUDE.md`. Neuf fichiers de test, dont un nouveau.

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
{ rangee, colonne }                              // case rasée, sans revendication
{ rangee, colonne, vainqueur, niveau, tick }     // ruine : elle émet jusqu'à expiration
```

`caseRasee` et `ruineFraiche` sont les deux seules fabriques, et elles valident.
`revendique(entree)` exige **les trois champs ou aucun** : une entrée à moitié
remplie ne revendique rien.

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

## 7. Les sprites : l'archive S10 n'est pas au dépôt

**Vérifié avant toute chose, comme le §6 le demandait.** `art/sprites/carte/128/`
porte 54 emblèmes de site : **9 paliers × 3 états × 2 camps**, et les trois états
sont `intact`, `_fumee` et `_feu`. `art/sources/` porte
`S10_base_ouvrage_degats_fumee_3x3_1024.png` et `S10_base_ouvrage_en_feu_3x3_1024.png`
côté Ouvrage, les deux mêmes côté joueur — **aucune planche « complètement
détruite »**. L'archive `S10_2_planches_3x3_completement_detruites_1024.zip`
n'était pas jointe au brief, et le lot PICTOGRAMMES ne l'a pas emportée.

**Rien n'a donc traversé la chaîne art**, et c'est pourquoi le poids ne bouge que
de code. `tools/verifier.py` n'a pas été relancé : aucun fichier d'`art/` ni de
`tools/` n'est touché, et CLAUDE.md §0.5 réserve ce passage aux lots qui y
touchent.

⚠ **Conséquence, et c'est le point en suspens le plus visible du lot : la ruine
tient son territoire sans rien montrer sur sa case.** Le joueur voit une frontière
alliée autour d'un endroit vide. La frontière, elle, est juste — elle suit celle
des autres sans traitement particulier, §5 du brief.

⚠ **La correspondance niveau → palier existait déjà, et dans `src/data/` :**
`palierDeNiveau(niveau)` de `src/data/sites.js:1260`, adossée à
`PALIERS_EMBLEME`. Il n'y avait rien à écrire — la dériver une seconde fois pour
les ruines aurait fait deux tables.

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

Aucune ligne ne rend « aucun test ne tombe ». **F9 en rendait un avant
correction** : la lecture « une ruine n'a pas de plancher » n'était gardée par
rien, et deux assertions ont été ajoutées à `C24 T1` pour qu'un retournement de
cette lecture se voie.

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

### 11.5 `basesDuJoueur` de `territoire.js` n'a plus d'appelant dans `src/`

`sim/poi.js` était son seul consommateur de production ; il appelle maintenant
`forcesDuJoueur`. Elle reste exportée et employée par `test/territoire.test.js`.
⚠ **Elle n'a pas été retirée** : c'est un rangement, pas une règle, et il n'était
pas demandé. À noter que `sim/points-attaque.js` porte une **autre** fonction du
même nom, celle-là bien vivante (raid, site-de-la-case, points d'attaque).

### 11.6 Le refus de fonder change de nature

Détaillé au §5 : le refus passe de la **portée** à la **propriété**, et le message
change. Aucun test existant ne mesurait le cas où les deux divergent — la suite est
restée verte sans qu'une ligne soit touchée dans `fondation`. C'est un
**changement de règle**, pas un nettoyage, et il est déclaré comme tel.

---

## 12. Points en suspens

1. ⚠⚠ **Les planches de ruines.** L'archive S10 n'était pas jointe ; une ruine
   tient donc son territoire sans emblème sur sa case. C'est la seule partie du
   §5 du brief qui ne soit pas livrée, et elle est visible en jeu.
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
5. ⚠ **`basesDuJoueur` de `territoire.js`**, §11.5.

---

## 13. Rendu

Branche `claude/lot-conquete-24h`, **PR ouverte, non mergée**.
