# RAPPORT — lot VITESSE

*Écrit le 12/09/2026. À lire avec le §0 de `CLAUDE.md`, qui porte la version
courte.*

---

## 0. Ce qui a été mesuré au départ, et ce qui l'a été à l'arrivée

| | avant | après |
|---|---|---|
| commit de départ | `87153e3` (fusion de la PR #135) | — |
| branche | `claude/new-session-34lj7g` | — |
| `npm test` — tests déclarés | **1 581** | **1 599** |
| verdict mesuré | 1 580 pass · 0 fail · 1 skipped | **1 598 pass · 0 fail · 1 skipped** |
| `npm run check` | sortie 0 | **sortie 0** |
| `dist/index.html` | **9 377 421** octets | **9 383 149** octets |
| version · build | 0.99.51 · 153 | **0.99.52 · 154** |

Le skipped est `LIMITE T8`, suspendu par Ethan le 08/09 — il n'a pas été touché.

**Le livrable de départ a été REBÂTI, il n'a pas été cru.** `git worktree` détaché
sur `87153e3`, `node tools/build.js` : **9 377 421 octets**, au bit ce que le §0
annonçait. Les deux mesures qui suivent sortent de ce même livrable.

### Coût, poste par poste

| poste | avant | après | écart |
|---|---:|---:|---:|
| images | 7 683 603 | 7 683 603 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| JavaScript | 418 178 | 422 985 | **+4 807** |
| feuille | 45 724 | 46 553 | **+829** |
| balisage | 36 570 | 36 662 | **+92** |
| **total** | **9 377 421** | **9 383 149** | **+5 728** |

La somme des cinq postes tombe EXACTEMENT sur le total **des deux côtés** — chaque
poste est NET de ses `data:`. **306 URI et 307 lignes `data:` de part et
d'autre** : le lot ne fait entrer ni une image ni un son.

Borne T10 **inchangée à 9 600 000** — aucune ressource n'entre, donc rien ne la
justifierait. Marge **216 851 octets, 2,26 %**.

⚠ **`PIC T7` EST RÉANCRÉ, ET SON ANCRE ÉTAIT JUSTE.** Elle écrivait 9 377 421, ce
que le livrable pristine rend au bit. La dérive de ce lot vaut 5 728 octets, soit
très en dessous de la tolérance de 50 000 : la laisser aurait été exactement la
« dérive lente » que la dernière assertion de ce test existe pour refuser, et le
§0 de `CLAUDE.md` le dit — « la tolérance garde contre la dérive LENTE, pas contre
un lot qui sait ce qu'il déplace ».

### Fichiers touchés

`src/data/base.js` · `src/index.src.html` · `src/render/scene.js` ·
`src/sim/reparation.js` · `src/sim/site-entame.js` · `src/ui/chantier.js` ·
`src/ui/offense.js` · `src/ui/rapport.js` · `src/ui/recherche.js` ·
`src/ui/session.js` · `package.json`, plus huit fichiers de `test/`.

Entrent : `test/vitesse.test.js` et ce rapport.

**Pas une ligne de `src/sim/combat.js`, `src/sim/generateur.js`, `src/data/` hors
`base.js`, `src/son/`, `tools/` ni `art/`** — vérifié au diff.

---

## 1. §1 — « une heure » devient une vitesse

### La formule, telle qu'elle est écrite

```
palier = ⌊ perdus × partInstantaneeMilli × santeMilli / 10⁶ ⌋
reste  = perdus − palier
heures = (reste / pvMax) × heuresDeBase × (1000 / max(1, santeMilli))
                         × facteurMilli(1 + dépassement) / 1000
ticks  = max(1, ⌈ heures × TICKS_PAR_HEURE ⌉)
```

`heuresDeBase` vaut `APRES_RAID.reparationDefensesHeures` — elle ne s'écrit pas,
elle se LIT : c'est la même heure que celle des bâtiments d'une base de l'Ouvrage,
et l'écrire deux fois aurait donné deux vérités pour la même grandeur.
`partInstantaneeMilli` reste à **700**, l'arbitrage du 05/09.

### Les six valeurs de la table — MESURÉES, pas recopiées

Sur une pièce de référence à 1 000 000 milli-PV (voir §1.4) :

| montage | ticks | dit |
|---|---:|---|
| niv. 10, Complexe 10 intact, **20 % de dégâts** | 2 160 | 3 min 36 s |
| niv. 10, Complexe 10 intact, **rasée** | 10 800 | 18 min |
| niv. 10, Complexe 10 **à 50 % de santé**, rasée | 46 800 | 1 h 18 min |
| **niv. 20**, Complexe 10 intact, rasée | 28 016 | 46 min 42 s |
| **niv. 50**, Complexe 10 intact, rasée | 488 798 | 13 h 35 min |
| niv. 10, Complexe **à 1 PV** (santé 1 ‰), rasée | 35 974 800 | 999 h 18 min |
| niv. 10, Complexe 10 intact, **1 milli-PV perdu** | **1** | 1 s |

Les deux premières lignes sont le lock de `VIT T1` : **deux pièces de MÊME niveau,
sous le MÊME Complexe intact, rendent 3 min 36 s et 18 min.** C'est très
exactement ce que l'ancienne règle interdisait — elle rendait une heure dans les
deux cas.

### `heuresAuPlancher` est SUPPRIMÉ, et ce lot renverse l'arbitrage du 06/09

Le lot RETOUR-DÉFENSES posait « 1 h à pleine santé, plancher **24 h** à 1 PV »,
sur l'arbitrage d'Ethan du 06/09 (« la courbe choisie est géométrique. je préfère
linéaire. 24h, pas 72h »). La pénalité de santé n'est plus une interpolation entre
deux points : c'est une **division par la santé**, et elle n'a plus de plancher à
interpoler. Le champ est RETIRÉ de `REPARATION_BASE_JOUEUR`, avec le paragraphe
qui dit pourquoi et ce qu'il valait — le laisser à une valeur inerte l'aurait fait
relire comme une règle.

**Ce que ça coûte, et c'est dit :** à 1 ‰ de santé une pièce rasée demande
**999 h**, contre 24 h hier. Le plancher ne borne plus rien ; ce qui borne est le
plancher de DIVISION à un millième, qui est la plus petite santé que l'échelle
sache écrire. **Ethan tranche** s'il veut un plafond de durée — c'est un
`Math.min` sur le retour de `ticksDeRetour`, et rien d'autre.

### `santeMilli === 0` : ce qui a été décidé

`ticksDeRetour` **LÈVE**. Elle ne rend ni `Infinity`, ni un très grand nombre :
à santé nulle, `pvApresRetour` ne rend RIEN — `rendLesPv` est faux — donc il n'y a
pas d'attente à décrire, et une durée quelconque serait un mensonge. C'est le
même contrat que `complexeDeLaBase`, qui rend `null` plutôt que zéro.

⚠ **Le plancher de division à un millième ne touche PAS le palier.** Le palier
garde la santé VRAIE : à zéro il ne rend rien, ce qui est juste, et surtout
`pvApresRetour` calcule le sien avec la même valeur. Deux `reste` différents
feraient diverger la rampe de son échéance.

### La durée se calcule sur les dégâts GELÉS

`retour.degatsAuDebutMilli`, jamais `degatsMilli`. C'est la seule façon dont le
rebours peut DESCENDRE : `degatsMilli` baisse à chaque tick sous la rampe, donc
une durée qui le lirait se recalculerait plus courte ET repartirait d'un « reste »
plus petit — le rebours se figerait au lieu de descendre. `VIT T1 bis` le mesure
tick par tick sur cent ticks : strictement décroissant, jamais remontant.

⚠ **`SAVE_VERSION` NE BOUGE PAS ET RESTE À 32.** Le champ existe depuis le
06/09 ; la formule neuve le LIT. Une sauvegarde d'avant le lot voit simplement ses
attentes recalculées à la lecture, et c'est juste — la rampe est ANALYTIQUE, elle
n'accumule rien.

### Les onze assertions réécrites

Le brief en nomme dix ; il y en a **onze**, et la onzième n'était pas prévue.

| fichier | ligne d'origine | ce qu'elle disait | ce qu'elle dit |
|---|---|---|---|
| `test/reparation.test.js` | 1250 | « 1 h à pleine santé » | la durée suit les PV perdus |
| — | 1278 | idem, autre montage | idem |
| — | 1293-1298 | les quatre points de la droite linéaire | la division par la santé |
| — | 1305 | plancher 24 h | plus de plancher, et le pourquoi |
| — | 1313 | 24 h tout rond à 1 PV | 999 h, et le plancher de DIVISION |
| — | 1321 | la forme linéaire contre la géométrique | la forme neuve contre les deux |
| — | 1330 | `heuresAuPlancher` lue dans la table | son ABSENCE, assertée de face |
| `test/chantier.test.js` | 5818-5839 | la fiche annonce une heure | elle annonce le pire cas du niveau |
| — | 5861 | idem | idem |
| `test/chantier.test.js` | `CH-F T7` | toute ligne d'effet a un `apres` | `apres: null` toléré, **et compté** |

**Aucune n'a été SUPPRIMÉE, aucune n'a été assouplie.** `CH-F T7` est le seul cas
où la garde a perdu sa prémisse sans que le brief le prévoie : elle exigeait
`ligne.apres.length > 0` de toute ligne d'effet, et la ligne neuve du point 10 dit
un ÉTAT sans « si j'améliorais ». Elle tolère donc `null` **et compte** les lignes
qui portent un `apres` — un code qui les annulerait toutes tombe encore.

---

## 2. §2 — barre de vie et rebours par pièce

**Deux enfants ABSOLUS du jeton**, sur le modèle de `.couche-tournante` du lot
SPRITES-V2-JOUEUR. Un enfant dans le flux volerait au sprite la surface où
`background-image` le peint, et un pixel art recalé d'un pixel n'est plus du pixel
art — c'est le motif que la feuille écrit déjà pour l'`outline` de `.abimee`.

**Jeton ou dépliant ? JETON, et la mesure qui décide est celle-ci :** la bande
Défense porte jusqu'à soixante-douze cases, et le brief demande « sans la
sélectionner ». Un dépliant est un geste ; quatorze gestes pour lire quatorze
attentes n'est pas une lecture, c'est un inventaire. **Relevé au banc, géométrie
du S25 FE :** le rebours le plus long écrit « 18.9 h » et demande **22,84 px**
pour une case de **36 px** — il tient, et il tient encore au plancher du zoom.
C'est cette mesure-là qui a tranché : à 40 px de texte il aurait fallu le
dépliant.

⚠ **Rien n'est peint sur une pièce INTACTE.** `retourDeLaPiece` rend `intacte` et
les deux nœuds sont `hidden` : quatorze rebours à zéro seraient quatorze fois la
même absence d'information, et c'est la règle que `cadreDOM` applique déjà aux
`div.raison` vides.

⚠ **Sans Complexe, la ligne dit « jamais », jamais une durée.** `sans-retour`
n'est pas une attente longue : c'est l'absence de mécanisme, et une durée
quelconque promettrait un retour qui n'arrivera pas.

⚠⚠ **LE REBOURS SE RÉÉCRIT SANS REFABRIQUER UN SEUL JETON.** `rafraichir` passe
dix fois par seconde ; reconstruire la grille y ferait clignoter les cent
soixante-deux cases sous le doigt. `VIT T3 bis` ne compte pas les nœuds — il
garde une RÉFÉRENCE sur chacun et exige l'IDENTITÉ après quatre rafraîchissements.
Un peintre qui referait la grille passerait un test qui compterait.

---

## 3. §3 — la ruine d'un bâtiment de l'Ouvrage reste à l'écran

**C'est du RENDU, et rien d'autre.** `src/sim/combat.js` n'a pas une ligne de
changée, `estActive` non plus, `estDansLaGrille` non plus, et les deux cents
témoins de combat sont verts sans avoir été régénérés.

`listeAffichage` garde le bâtiment tombé dans la liste, en état `detruit`. La
règle se lit dans `RESTE_APRES_DESTRUCTION` — `VIT T2 bis` refuse qu'elle soit
écrite pour les bâtiments dans `render/scene.js`.

### Vu à l'écran, dans un vrai raid, avec sa contre-épreuve

Chromium, géométrie du S25 FE, sauvegarde injectée, carte ouverte au doigt, cible
trouvée par balayage, `#monde-panneau-attaquer` puis `#raid-attaquer`.
`drawImage` instrumenté sur `#raid-canvas`, les cellules d'atlas résolues contre
`src/data/atlas.js`.

| | ruines posées | lesquelles |
|---|---:|---|
| **le lot** | **5** | `bat_o_etai_detruit` (relevé 17) · `_gangue_` (18) · `_terril_` (18) · `_souche_` (20) · `_noeud_` (21) |
| `main` pristine | 3 | `_gangue_` (21) · `_noeud_` (21) · `_terril_` (24) |

**Les deux qui manquent à `main` sont exactement l'Étai et la Souche — les deux
bâtiments qui tombent PENDANT le combat.** Sur `main` leur dernier état vu est
`_tres_abime`, puis ils disparaissent ; les trois ruines qu'il pose sont celles de
l'EFFONDREMENT, qui dessinait déjà des ruines avant ce lot. C'est la seule mesure
qui distingue les deux codes, et c'est pourquoi elle est prise des deux côtés.

Capture prise au dix-septième relevé, `#raid-fin` encore caché :
`rapports/` n'en garde pas de copie — elle vit dans le bac à sable de la session —
mais la ruine de l'Étai y est visible au milieu de la bande des bâtiments, pendant
que les attaquants montent encore.

---

## 4. §4 — les cinq points d'écran

### (2) Le module d'une unité non achetée ne dit ni son prix ni ce qu'il fait

Le masquage se fait dans la vue **PURE**, `ligneDuModule`, jamais dans le DOM :
`cadreDOM` n'écrit pas de `div.description` vide, exactement comme il ne peint
aucun `div.raison` vide depuis `RECH-É T4`.

Les **DEUX cadres du 06/09 restent** — point 15 d'Ethan, « diviser en 2 cases
l'unité et son amélioration ». Le second porte **« Verrouillé »** au lieu du prix,
et **aucune seconde formulation du refus n'est écrite** : la phrase « la pièce
doit être débloquée avant son module » est celle que `lignePourLAchat` rend déjà.

**Relevé à l'écran :** Fusiliers « Acquis » → son Flashbang affiche « 10,0M » et
sa description entière ; Pionnier « 100 » → son Flashbang affiche « Verrouillé »
et rien d'autre.

### (8) `rafraichir` de l'Offense — et la cause racine était ailleurs

**Lecture retenue : (a).** « Le bouton améliorer de l'onglet offense ne se met pas
à jour » a deux sens — (a) le temps de réparation de la pièce choisie, (b) une
durée d'amélioration. **(b) n'existe pas** : `ameliorerEffectif` est INSTANTANÉ et
se paie d'avance, donc annoncer une attente promettrait un mécanisme que le moteur
n'a pas. La barre contextuelle écrit (a) — « réparer : 2 min de réserve ·
63 scorie » —, et rien n'est recalculé dans l'UI.

⚠⚠ **ET LA CAUSE RACINE ÉTAIT DANS LA SESSION, PAS DANS L'ÉCRAN.** `rafraichir`
s'écrivait `if (etatCourant === null) peindre(etat);` — l'écran ouvert restait
figé sur l'image de son ouverture. Corrigé ; **et la boucle ne l'appelait de toute
façon jamais** : `ui/session.js` ne rafraîchissait que le Chantier et la carte.
Les deux moitiés sont corrigées.

**`VIT T4` ne pouvait pas voir la seconde**, et c'est la leçon du point : il monte
l'écran et appelle `rafraichir` lui-même, donc il garde que la fonction REPEINT,
jamais qu'elle est APPELÉE. C'est le boot sans tête qui l'a dit — **la réserve
restait à « 39 s » après huit secondes d'onglet ouvert, alors que le moteur avait
crédité quatre-vingts ticks.** `VIT T4 ter` lit le bloc des 100 ms de
`ui/session.js`. **Après : 40 s → 48 s en huit secondes, exactement quatre-vingts
ticks.**

⚠ **La boucle RAFRAÎCHIT, elle ne repeint pas.** `peindre` referait les
trente-six emplacements dix fois par seconde ; `rafraichir` écrit trois
`textContent` et sort du panneau sur sa signature.

### (9) Le journal sépare le mené du subi

⚠⚠ **LA PRÉMISSE DU BRIEF EST RÉFUTÉE, MESURÉE.** Il pose que « le verdict est
celui de l'ATTAQUANT des deux côtés » : **faux**. `verdictDeLaDefense` est écrite
et documentée depuis le lot JOURNAL comme « le miroir de `verdictDuRaid`, vu du
côté de celui qui se défend », et les deux ensembles mesurés le disent —
mené `{victoire-totale, victoire, defaite-totale}`, subi
`{victoire-totale, defaite, defaite-totale}`. **Le verdict est DÉJÀ celui du
joueur des deux côtés.**

Ce qui manquait n'était pas le sens, c'était que **rien ne le DISAIT**.
`VERDICTS_MENES` et `VERDICTS_SUBIS` ajoutent la clause — « victoire totale · site
rasé » contre « victoire totale · attaque repoussée » —, et `issueEstBonne` donne
la teinte.

⚠ **Aucune teinte neuve** : `#8C9A72` est le kaki clair du joueur, `#E43E32` le
rouge des refus. ⚠ Et les quatre règles CSS sont écrites **APRÈS**
`.panneau-detail .section.depliable h3` : les trois sélecteurs ont la MÊME
spécificité 0,3,1, donc c'est l'ORDRE qui décide, et les mettre plus haut aurait
laissé le titre d'un rapport déplié à sa couleur d'origine.

⚠ **Les six clauses se confrontent à la SOURCE.** `VIT T6` grep les `return '…'`
de `verdictDuRaid` et de `verdictDeLaDefense` et les compare aux clés des deux
tables — l'idiome de `JD T1`. Un cinquième verdict ajouté au moteur ferait
afficher « undefined » à un journal qui recopierait la liste de mémoire.

### (10) La fiche d'un bâtiment de production — la phrase exacte

**`Plafond de réserve · armée`**, avec son `apres` à **`null`**.

⚠⚠ **LE NIVEAU NE CRÉDITE PAS, IL DÉCOTE — et écrire « +X h de plafond » aurait
été FAUX.** Le plafond de la réserve d'armée est indexé sur le niveau de l'ARMÉE
(`plafondDeLaReserve`), pas sur celui du bâtiment. Ce que le bâtiment commande,
c'est le DIVISEUR du coût de réparation :

| niveau | diviseur |
|---:|---:|
| 1 | ÷ 1,0000 |
| 10 | ÷ 2,1719 |
| 12 | ÷ 2,5804 |
| 20 | ÷ 6,3890 |
| 30 | ÷ 19,8434 |
| 50 | ÷ 191,4152 |

soit **−8,3 % par niveau sous la rupture** (`niveauRupture` 12) et **−10,7 %
au-dessus**. La fiche porte donc DEUX lignes : `Réparation · <famille>`, rendue
« ÷ 2,17 → ÷ 2,37 », et le plafond, qu'améliorer ce bâtiment ne déplace pas d'une
seconde — d'où `apres: null`.

### (13) Le dépliant de réparation en Offense

**La ligne était COMPLÈTE et seulement TRONQUÉE — mesuré AVANT de toucher une
ligne.** Dans Chromium, géométrie du S25 FE : elle demandait **345,91 px** et sa
boîte en faisait **235,48** — **110,42 px coupés, 32 % de la phrase**. Ethan
lisait « Réparation, max 12.0 h — infanterie 43 min · véhi… » et croyait voir
trois maxima.

Le remède est donc d'AFFICHAGE — `white-space: nowrap`, `text-overflow: ellipsis`
et `overflow: hidden` partent, `line-height: 1.25` entre — et **pas un mot du
texte n'a été raccourci**. Après : texte **203,86 px** dans une boîte de
**235,48**, soit **31,62 px de mou**, débordement 0, barre **28,5 px**.

**Et « Tout réparer » ouvre un dépliant au lieu de dépenser.** Le geste a changé
de porteur : le bouton de la barre OUVRE, le bouton du PANNEAU répare. Une dépense
globale et irréversible gagne son devis AVANT le geste, ce que `data/base.js`
demande déjà pour la démolition.

⚠ **ÉCART DÉCLARÉ** : le brief écrit « Réparer », et la barre CONTEXTUELLE porte
un bouton de ce nom. Lui donner le panneau aurait été impossible — il ARME un
mode, et le panneau couvre les vagues que le second toucher vise. C'est la faute
que le lot ÉCRAN-DÉFENSE a corrigée au Chantier, où armer FERME le panneau.

⚠ **Aucun coût n'est recalculé** : tout vient de `coutDeLaReparation` et de
`reservoirsDeLArmee`, et la scorie s'arrondit comme `reparerUnePiece` débite —
`Math.ceil`, **pièce par pièce**, jamais sur la somme.

**Relevé à l'écran :** « Dépôt de véhicules · Réserve véhicule 48 s · Demandé
28 s · Pionnier · v1 21 s · 38,8k scorie · Pionnier · v1 7 s · 12,9k scorie »,
débordement 0.

### (15) Quelle barre est peinte vide — et aucune n'est retirée

**Mesuré, comme le brief l'exige, et la réponse est : aucune.**
`#offense-reparation` porte la ligne de réserve — complète, désormais entière — et
le bouton ; elle est la moitié du point 13. Les autres barres de l'écran Offense
portent toutes quelque chose : `#offense-contexte` porte le nom de la pièce, son
niveau, ses points et désormais son devis ; `#offense-palette` porte les quatorze
vignettes ; `#offense-boutons` les quatre actions.

**Rien ne sort.** Le chrome de l'Offense reste à **288 px**, comme celui du
Chantier — la garde de `chantier.test.js` somme les deux écrans et elle est verte.

---

## 5. Les tests : ce qu'ils gardent, et le montage qui les ferait tomber

Dix-huit tests entrent. Le compte passe de **1 581 à 1 599**.

| test | ce qu'il garde | **le montage qui le ferait tomber** |
|---|---|---|
| `VIT T1` | deux pièces de MÊME niveau sous le MÊME Complexe intact rendent **2 160** et **10 800** ticks | remettre `heuresAuPlancher` et la droite linéaire : les deux rendent 36 000 ticks, l'égalité tombe. Ou lire `degatsMilli` au lieu de `degatsAuDebutMilli` : la seconde valeur change dès le premier tick |
| `VIT T1 bis` | le rebours DESCEND d'un tick par tick, jamais il ne remonte | faire lire la durée sur `degatsMilli` — le rebours se fige (mesuré : il reste à sa valeur d'ouverture cent ticks durant) |
| `VIT T2` | un bâtiment de l'Ouvrage tué au combat reste dans la liste d'affichage, en `detruit` | remettre le filtre `visible(e)` sur les bâtiments : la liste perd l'entrée, le compte tombe de 5 à 3 |
| `VIT T2 bis` | la règle se lit dans `RESTE_APRES_DESTRUCTION` | écrire `genre === 'batiment'` dans `render/scene.js` : le test compte les occurrences de la table et n'en trouve plus |
| `VIT T2 ter` | les trois lecteurs qui refusent une ruine sont NOMMÉS dans la source | retirer l'un des trois renvois : la garde ne retrouve plus le nom et tombe |
| `VIT T3` | chaque pièce de la bande Défense porte son rebours sans être sélectionnée | poser les deux nœuds sur la seule pièce sélectionnée : le balayage n'en trouve qu'un |
| `VIT T3 bis` | le rebours se réécrit sans refabriquer un jeton | remplacer `rafraichir` par `peindre` : les références gardées ne sont plus les mêmes objets |
| `VIT T4` | `rafraichir` repeint la réserve et reprend `etatCourant` | rendre `rafraichir` à sa forme d'avant (`if (etatCourant === null) peindre`) : la ligne ne bouge plus |
| `VIT T4 bis` | la barre contextuelle dit le devis du MOTEUR | recalculer la scorie avec `Math.round` : la sonde `${ceil} scorie` ne trouve plus rien, et la sonde négative sur `round` mord |
| `VIT T4 ter` | **la BOUCLE appelle `rafraichir`** — et ne repeint pas | retirer l'appel du bloc des 100 ms de `ui/session.js` ; ou le remplacer par `peindre` |
| `VIT T5` | un module verrouillé ne dit ni prix ni description | rendre `MODULES[x].description` sans regarder `estAcquise` |
| `VIT T5 bis` | la pièce acquise rend au module son prix et sa description | masquer sans condition : le module d'une pièce acquise perd son prix |
| `VIT T6` | les six clauses d'issue sont celles que le moteur produit | ajouter un `return 'deroute'` à `verdictDeLaDefense` sans toucher la table : le grep trouve une clé de plus |
| `VIT T7` | la ligne d'issue nomme ce qui s'est passé, et sa couleur suit | inverser `issueEstBonne` ; ou donner la même classe aux deux sens |
| `VIT T8` | la fiche des trois bâtiments dit le plafond ET le diviseur | écrire « +X h de plafond » avec un `apres` non nul : le test exige `apres === null` sur cette ligne |
| `VIT T9` | le dépliant met le stock en tête et dit le coût du moteur | retirer la ligne de réserve ; ou arrondir la scorie au plus proche |
| `VIT T9 bis` | le bouton de la barre OUVRE, celui du panneau répare | rendre `toutReparerMaintenant()` au bouton de la barre ; ou retirer le routage par `modePanneau` |
| `VIT T9 ter` | la ligne de réserve ne se coupe plus | remettre `white-space: nowrap` ou `text-overflow: ellipsis` |

### Les falsifications : vingt-huit jouées (F1 à F28), vingt-huit chutes

**Deux ont dû être REPRISES avant de mordre, et les deux disent quelque chose.**

1. **La première tombait dans un COMMENTAIRE.** Le `Math.ceil(cout.scorie)` que le
   patch visait est nommé deux fois dans `ui/offense.js`, et la PREMIÈRE
   occurrence est de la prose — le paragraphe qui explique pourquoi c'est `ceil`.
   Un `replace(..., 1)` frappait donc le commentaire, et le code restait juste.
   *Une falsification qui ne mord pas se vérifie avant d'être crue.*

2. **La seconde reposait sur un montage DÉGÉNÉRÉ.** Une Meute de niveau 3 abîmée
   de 400 milli rend **0,0000245** de scorie : `Math.ceil` rend 1, `Math.round`
   rend 0, et la sonde `includes('1')` tombait sur un chiffre de la DURÉE, dans la
   même phrase. Remesuré au niveau 12 et 50 000 milli : **62,355 → `ceil` 63,
   `round` 62, durée « 52 s »** — les trois se distinguent, et la sonde porte
   désormais le MOT (`« 63 scorie »`) et non le seul chiffre.

**Et deux de mes propres montages tombaient rond — quatrième et cinquième fois du
dépôt.** `VIT T9` posait une réserve de trois heures pile, où `Math.floor` et
`Math.ceil` rendent « 3.0 h » tous les deux. ⚠ Et **au-delà de l'heure ils
rendraient le même nombre QUOI QU'IL ARRIVE** : `direLaDuree` le dit en toutes
lettres — passé 3 600 s c'est la DÉCIMALE qui arrondit, et le paramètre cesse de
mordre. L'assertion ne peut donc vivre que SOUS l'heure, et 30 min + 1 tick y rend
30 contre 31.

### Le témoin de BASES-0 prend sa vingt-et-unième couche

**Deux couples sur 350, et les deux sont `sitesEntames`.** C'est la couche la plus
étroite que ce témoin ait jamais reçue, et c'est l'attribution du lot : les
défenses d'un site RAIDÉ se relèvent plus vite entre deux passes.

⚠ **`rapports` NE BOUGE PAS, ce qui est la moitié qui prouve.** Le lot ne touche
NI le combat NI son résultat : ce qui change est l'état du site APRÈS coup. Un lot
qui aurait fui dans le moteur aurait déplacé les deux rapports sur les vingt-cinq
graines, comme APPROCHE. Les onze premières phases sont identiques AU BIT, et
aucun des huit scalaires ne bouge.

⚠ **Les deux cents témoins de combat sont verts sans avoir été régénérés** —
`test/temoins-combat.js` n'a pas une ligne de changée.

---

## 6. §8 — les six gestes, joués au banc

Chromium, géométrie du S25 FE (360 × 780, dpr 3), sauvegardes injectées dans
`localStorage`, page servie par un `node:http` sur `127.0.0.1` — `setContent`
laisse une origine opaque où le `localStorage` est perdu.

⚠ **L'instant de sauvegarde est remis à maintenant avant chaque injection, et
c'est obligatoire** : `charger` RATTRAPE le temps écoulé depuis l'écriture du
fichier. Une sauvegarde fabriquée trois minutes plus tôt arrive avec trois minutes
de réserve en plus — mesuré : 380 ticks posés, « 4 min » à l'écran.

| geste | relevé |
|---|---|
| **1.** subir un raid, lire le rebours d'une pièce à 20 % et le voir DESCENDRE | **« 47 s » → « 40 s » → « 33 s »**, barre 98,7 % → 98,9 % → 99,1 % |
| **2.** la même pièce revenue à 100 % | **« 4 s » → nœuds masqués** — barre et rebours disparus |
| **3.** un Complexe abîmé : le rebours s'allonge, il ne se fige pas | intact **4 min / 18 min / 17 min** → abîmé **3,8 h / 18,9 h** ; et il continue de descendre (geste 2) |
| **4.** tuer un bâtiment de l'Ouvrage en raid et VOIR la ruine | cinq ruines posées, la première au 17ᵉ relevé, `#raid-fin` encore caché — contre TROIS sur `main` |
| **5.** onglet Offense laissé ouvert : la réserve avance | **40 s → 48 s** en huit secondes, exactement 80 ticks |
| **6.** un module d'unité non achetée | Pionnier « 100 » → son Flashbang dit **« Verrouillé »** et rien d'autre |

⚠ **Ni `Infinity`, ni `NaN`, ni `undefined` dans un texte affiché** — balayé sur
`document.body.innerText` des SEPT parties montées. **Zéro erreur de page** sur
les sept.

⚠ **Le geste 1 a demandé un montage à la seconde.** À la granularité de la minute,
`direLaDuree` n'aurait pas montré le rebours bouger en sept secondes : la partie
est fabriquée pour que le rebours tienne en SECONDES (486 et 972 ticks), la seule
granularité où il descend à l'œil.

---

## 7. Écarts au brief, déclarés

1. **La branche.** Le brief demande `claude/vitesse-defenses` ; l'environnement
   d'exécution épingle la session à `claude/new-session-34lj7g` et interdit de
   pousser ailleurs sans autorisation explicite. Le lot y est poussé d'un seul
   tenant.
2. **« Aucun test sur le §4 ».** Le brief l'annonce au motif que « le dépôt n'a ni
   jsdom ni navigateur » : c'est vrai de cinq écrans et **FAUX** de l'Offense et
   de la Recherche, qui portent un faux document écrit à la main depuis le lot
   RETOUR-DE-RAID. Sept tests du §4 sont donc écrits — et `VIT T4 ter`, qui
   attrape la cause racine du point 8, n'aurait existé sous aucun autre régime.
3. **Onze assertions réécrites, pas dix.** `CH-F T7` a perdu sa prémisse sans que
   le brief le prévoie — voir §1.
4. **Le point 13 nomme « Réparer », le lot met le dépliant sur « Tout réparer ».**
   Motivé au §4.13 : le bouton « Réparer » ARME un mode, et le panneau couvrirait
   les vagues que le second toucher vise.
5. **Point 15 : aucune barre n'est retirée.** La mesure que le brief demande dit
   qu'aucune n'est peinte vide.
6. **`tools/verifier.py` N'A PAS ÉTÉ LANCÉ**, et le brief l'interdisait nommément.
   Le lot ne touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff.

---

## 8. Ce qui reste ouvert

1. **Le plafond de durée.** À 1 ‰ de santé, une pièce rasée demande **999 h**.
   L'ancien plancher de 24 h est parti avec l'arbitrage qu'il portait ; rien ne
   borne plus la durée par le haut. C'est un `Math.min` sur le retour de
   `ticksDeRetour`, et **Ethan tranche**.
2. **`partInstantaneeMilli` reste à 700**, l'arbitrage du 05/09, et il n'a pas été
   remesuré contre la règle neuve : sous l'ancienne il décidait d'un palier
   suivi d'une rampe de durée FIXE ; sous celle-ci il décide aussi de la pente.
   **Un nombre se change seul.**
3. **Le rendu sur l'appareil d'Ethan n'a pas été vu** (§3 de `CLAUDE.md`). Tout ce
   qui précède est relevé dans Chromium à la géométrie du S25 FE, et ce n'est pas
   son téléphone. **À regarder au premier essai** : que le rebours et la barre de
   vie tiennent sur une case de 36 px au plancher du zoom, et que les cinq ruines
   d'un site rasé ne se confondent pas avec ses bâtiments debout.
4. **Le dépliant de réparation ne se ferme pas tout seul après « Tout réparer ».**
   Il reste ouvert sur « Rien à réparer », ce qui dit la vérité — mais c'est un
   geste de plus pour le refermer. **Relevé, non corrigé.**
5. **La couleur d'issue du journal ne distingue pas `victoire` de
   `victoire-totale`.** Les deux sont vertes, les trois autres rouges — c'est ce
   que `issueEstBonne` dit. Une troisième teinte demanderait d'élargir la palette
   close pour une nuance qu'Ethan n'a pas demandée.
