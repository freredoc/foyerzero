# RAPPORT — lot ÉCRANS (13/09/2026)

Deux lignes d'affichage manquantes, dans deux fichiers de `src/ui/`, sur les
points 2 et 4 d'Ethan du 13/09 :

> « Les points de recherche doivent apparaître sur les reports. »
>
> « Caserne, aérodrome, usine affiche le plafond de réserve or je voulais qu'il
> affiche le plafond de réparation actuelle (par exemple j'ai 1 Épervier ça me
> coûte combien en repa et qu'est-ce que cela me coûterait en cas d'amélioration
> de l'aérodrome). »

⚠⚠ **LE NOM DE CE FICHIER EST UN ÉCART AU BRIEF, ET IL EST DÉCLARÉ.** Le §6
demande `rapports/RAPPORT-lotECRANS.md` ; **ce fichier-là existe déjà**, à la
RACINE, et c'est le rapport du lot ÉCRANS du 10/09 — un autre lot, d'un autre
jour, sur d'autres écrans. L'écraser aurait effacé un rapport commité ; le
recréer sous le même nom court dans `rapports/` aurait mis au dépôt deux
fichiers que le sélecteur d'un téléphone affiche à l'identique, ce que `CLAUDE.md`
§6 raconte déjà pour `combat.js` — le moteur de combat écrasé le 27/08. La date
tranche.

---

## 1. Ce qui est mesuré

⚠⚠ **DEUX COLONNES, ET C'EST LA SECONDE QUI DÉCRIT CE QUI EST LIVRÉ.** Ethan a
fusionné la PR #141 — lot CONTACT-2 — pendant que celle-ci était ouverte : `main`
est passé de `f21ba4e` à `0c4a546`, et le lot a dû être fusionné et **remesuré**.
Le §9 raconte la fusion. La colonne « seul » est gardée parce qu'elle dit contre
quoi le lot a été écrit et vérifié ; **la colonne « fusionné » est celle du
disque**.

| | mesuré seul (`f21ba4e`) | **livré, fusionné (`0c4a546`)** |
|---|---|---|
| `npm run check` | exit 0 | **exit 0** |
| `npm test` | 1608 décl. · 1607 pass · 0 fail · 1 skip | **1609 décl. · 1608 pass · 0 fail · 1 skip** |
| `npm run build` | 9 385 638 octets | **9 385 997 octets**, 0 référence externe |
| Version · build | 0.99.56 · build 158 | **0.99.57 · build 159** — les DEUX restent des CHAÎNES, vérifié au type |
| `SAVE_VERSION` | 33, inchangé | **33, inchangé** — démontré au §5, pas supposé |
| Borne T10 | 9 600 000, non touchée | **9 600 000, non touchée** |
| Marge | 214 362 octets, 2,23 % | **214 003 octets, 2,23 %** |
| Coût | +589, entièrement JS | **+589, entièrement JS** — le même nombre, MESURÉ |

Le skipped est `LIMITE T8`, suspendu par Ethan le 08/09 ; il l'était déjà.

**Coût : +589 octets, ENTIÈREMENT DU JAVASCRIPT.** Mesuré poste par poste contre
le livrable REBÂTI dans un `git worktree` sur l'arbre pristine de `main` =
`f21ba4e` :

| poste | avant | après | écart |
|---|---:|---:|---:|
| JavaScript | 424 777 | 425 366 | **+589** |
| feuille | 46 538 | 46 538 | +0 |
| balisage | 36 785 | 36 785 | +0 |
| images | 7 683 603 | 7 683 603 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |
| **total** | **9 385 049** | **9 385 638** | **+589** |

⚠ **LA SOMME DES CINQ POSTES TOMBE EXACTEMENT SUR LE TOTAL DES DEUX CÔTÉS**
(écart 0 · 0), la partition étant **positionnelle** et non textuelle — chaque
octet du fichier appartient à un poste et à un seul. **306 URI `data:` et 307
lignes `data:` de part et d'autre** : aucune image, aucun son n'entre ni ne sort.

Fichiers touchés : `src/ui/rapport.js`, `src/ui/chantier.js`, `package.json`,
`CLAUDE.md`, et trois fichiers de `test/` — `raid.test.js`, `chantier.test.js`,
`pictogramme.test.js`. **Pas une ligne de `src/sim/`, `src/data/`, `src/render/`,
`src/son/`, `tools/` ni `art/`** — vérifié au diff.

---

## 2. La base confrontée, et ce que le brief a dit de faux

Le §0 demandait de confronter cinq faits. **Quatre étaient exacts**, et le
cinquième est faux de trois jours.

1. ✅ `executerRaid` range bien `rechercheMilli` dans l'objet rapport, et
   `enregistrerLeRapport` pousse l'objet **entier** dans `etat.rapports`.
2. ✅ `lignesDuResultat` est écrite **une seule fois**, dans `src/ui/rapport.js`,
   et sert **trois** surfaces : le panneau du simulateur, le panneau de fin de
   raid et le dépliant du journal.
3. ✅ `lignesDeLaDefense` est une autre fonction, et un raid SUBI ne rapporte
   aucun point : rien n'est ajouté de ce côté.
4. ✅ `formaterPoints` est exportée de `sim/recherche.js` et
   `PICTOGRAMMES.recherche` existe.
5. ⚠⚠ **FAUX** — le brief écrit que les entrées du journal portent
   `rechercheMilli` « y compris celles d'avant ce lot ».

### ⚠⚠ La fenêtre de sauvegardes, et elle est MESURÉE, pas crainte

`etat.rapports` entre dans l'état à la **v18 → v19**, lot RAID-A, le **02/09** ;
`rechercheMilli` n'entre dans l'objet rapport que le **06/09**. Et **aucune
migration ne vide `rapports`** — le lot REJEU l'écrit en toutes lettres, « les
dix derniers raids sont de l'histoire ». Une sauvegarde de cette fenêtre-là porte
donc des entrées **sans le champ**, et `BigInt(undefined)` **LÈVE** : le dépliant
du journal aurait vidé l'écran, exactement comme une garnison de Fusiliers a vidé
l'écran de la base le 30/08.

⚠ **ET LE CAS N'EST PAS HYPOTHÉTIQUE : IL EST DÉJÀ DANS LA SUITE.** Deux montages
du dépôt forgent un rapport sans ce champ — `RAID-A T7` et le dépliant de
`JD T1`. La falsification F3 le prouve empiriquement : **retirer la garde
d'absence fait tomber TROIS tests, dont DEUX antérieurs au lot.**

D'où la garde `!== undefined && !== null`, et `ÉCRANS T1 bis` qui la tient.
⚠ **« Absent » vaut « pas de ligne », jamais « zéro point »** — c'est l'idiome de
`rapportRejouable` cinquante lignes plus bas dans le même fichier. Un raid qui
rapporte **vraiment** zéro garde sa ligne et dit « 0 », comme le butin dit
« 0 quartz · 0 scorie ». `ÉCRANS T1 bis` mesure les deux.

---

## 3. La conversion secondes → ticks, citée

C'est le piège que le §2.4 du brief nomme, et il est réel : `secondesPleines`
rend des **secondes**, `direLaDuree` — que `forme: 'duree'` appelle — attend des
**ticks**, et sa voisine `plafondDeLaReserveDeLaBase` en rend. Le type est le
même, la forme est la même, la ligne s'affiche : brancher les secondes telles
quelles afficherait des durées **dix fois trop courtes** sans que rien ne
bronche.

La ligne, dans `src/ui/chantier.js`, au bout de `coutPleinEnTicks` :

```js
function coutPleinEnTicks(armee, chassis, niveauBatiment) {
  const pieces = armee.filter((piece) => UNITES[piece.id].chassis === chassis);
  if (pieces.length === 0) return null;
  const secondes = pieces.reduce(
    (total, piece) => total + secondesPleines(piece.id, piece.niveau, niveauBatiment),
    0,
  );
  return Math.ceil(secondes * TICKS_PAR_SECONDE);
}
```

⚠ **`TICKS_PAR_SECONDE`, JAMAIS UN 10 ÉCRIT À LA MAIN** — la constante vient de
`sim/clock.js`, qui la dérive de `TICK_MS`.
⚠ **L'ARRONDI SE PREND SUR LA SOMME, PAS PIÈCE PAR PIÈCE**, et il est `Math.ceil`
comme partout où `sim/reparation.js` convertit un temps en ticks : arrondir
chaque pièce ferait payer à quatre Pionniers quatre demi-ticks de plus que ce que
la somme vaut.
⚠ **ET `ÉCRANS T2` ASSERTE L'ÉGALITÉ EN TICKS**, pas la décroissance : une
assertion qui ne vérifierait que « après < avant » passerait avec des secondes
brutes. Deux assertions de plus refusent de face que la ligne porte des secondes,
après avoir prouvé que les deux unités se distinguent sur ce montage.

---

## 4. Les nombres du §2.5, confrontés

### Les six paliers du brief — **les six secondes tombent au centième**

Quatre Pionniers de niveau 1, au **Dépôt de véhicules** :

| niveau du Dépôt | diviseur | brief | mesuré | ticks | `direLaDuree` |
|---:|---:|---:|---:|---:|---|
| 1 | 1,0000 | 3 888 s | **3 888,00 s** | 38 880 | **« 1.1 h »** |
| 2 | 1,0900 | 3 567 s | **3 566,97 s** | 35 670 | **« 60 min »** |
| 5 | 1,4116 | 2 754 s | **2 754,36 s** | 27 544 | **« 46 min »** |
| 10 | 2,1719 | 1 790 s | **1 790,14 s** | 17 902 | **« 30 min »** |
| 12 | 2,5804 | 1 507 s | **1 506,73 s** | 15 068 | **« 26 min »** |
| 13 | 2,8901 | 1 345 s | **1 345,29 s** | 13 453 | **« 23 min »** |

⚠⚠ **MAIS LES COLONNES DE TEXTE DU BRIEF SONT FAUSSES, ET C'EST UN ÉCART QUI SE
VOIT À L'ÉCRAN.** Il annonce « **1 h 04** → 59 min 26 » ; la fiche affiche
**« 1.1 h » → « 60 min »**. Les deux ne se contredisent pas sur la grandeur — ce
sont les mêmes 3 888 et 3 567 secondes — elles se contredisent sur le
FORMATEUR : « 1 h 04 » est la convention de `formaterDuree`, de `ui/rapport.js` ;
la fiche emploie `direLaDuree`, de `sim/reparation.js`, qui est **le formateur de
sa ligne voisine, celle du plafond de réserve**.

⚠⚠ **ET IL Y A UN DÉFAUT DE LISIBILITÉ, RELEVÉ ET NON CORRIGÉ.** Sur l'exemple
même du brief, la ligne se lit **« 1.1 h → 60 min »** : l'unité bascule au milieu
de la ligne, et un œil pressé lit une AUGMENTATION là où il y a 8,3 % de gain.
Le corriger demanderait `formaterDuree`, que `ui/chantier.js` **ne peut pas
importer** — c'est le cycle d'imports que `ui/rapport.js` existe pour éviter,
`rapport.js` important `chantier.js` et jamais l'inverse — et en écrire un
second dans `ui/chantier.js` ferait diverger cette ligne de sa voisine, le
plafond de réserve, qui est sous les yeux du joueur à trois pixels de là.
**Ethan tranche** : soit on garde `direLaDuree` et les deux lignes restent
cohérentes, soit `formaterDuree` descend dans `sim/reparation.js` et les deux
écrans le partagent — c'est un lot, pas une ligne.

### Les trois bâtiments — l'appariement du brief est exact

`BATIMENT_DE_CHASSIS` rend `{"escouade":"caserne","blinde":"depotDeVehicules","aeronef":"aerodrome"}`.
Une pièce de niveau 1, bâtiment monté de 1 à 2 :

| fiche | pièce | `reparation` | avant → après | à l'écran | gain |
|---|---|---:|---:|---|---:|
| **Caserne** | Fusiliers | 441 | 4 410 → 4 046 ticks | « 8 min » → « 7 min » | −8,3 % |
| **Dépôt de véhicules** | Pionnier | 972 | 9 720 → 8 918 ticks | « 17 min » → « 15 min » | −8,3 % |
| **Aérodrome** | Épervier | 1 070 | 10 700 → 9 817 ticks | « 18 min » → « 17 min » | −8,3 % |

⚠⚠ **L'EXEMPLE D'ETHAN, MOT POUR MOT : « j'ai 1 Épervier ça me coûte combien en
repa et qu'est-ce que cela me coûterait en cas d'amélioration de l'aérodrome »
→ la fiche de l'Aérodrome affiche « Remise à neuf · avion : 18 min → 17 min ».**
Et son second exemple, quatre Pionniers au Dépôt de niveau 1 : **« 1.1 h →
60 min »**, soit les 321 secondes que le brief annonce.

⚠ Les **8,3 %** ne sont pas une coïncidence : sous la rupture du niveau 12, le
diviseur monte de 1,09 par palier, et `1 − 1/1,09` vaut 8,26 %. Le gain ne dépend
donc ni de la pièce ni du nombre de pièces — c'est ce qui rend la ligne lisible.

### Ce que la ligne chiffre, et ce qu'elle ne chiffre pas

⚠⚠ **C'EST LE COÛT PLEIN, PAS LA DEMANDE COURANTE, ET C'EST TOUTE LA
DIFFÉRENCE.** `reservoirsDeLArmee` et `coutDeLaReparation` sont indexées sur
`degatsMilli` — `part = degats / pvMax` — donc elles rendent **zéro** sur une
armée intacte, c'est-à-dire exactement rien à l'instant où le joueur regarde la
fiche pour décider d'une amélioration. Les deux sont justes pour l'écran de
réparation, qui chiffre une DÉPENSE ; celle-ci chiffre une CAPACITÉ. `ÉCRANS T2`
asserte que l'armée du montage est intacte **puis** que la ligne rend un nombre
strictement positif : elle tombe si la ligne emprunte l'une des deux.

⚠⚠ **ET LA SCORIE N'Y EST PAS** — Ethan : « on ne prend que le temps, pas les
scories ». La raison est solide et non de commodité : `coutDeLaReparation` indexe
la scorie sur le niveau de l'**unité** « et rien d'autre », donc améliorer le
bâtiment ne la baisse pas d'un point — une colonne identique des deux côtés se
lirait comme un défaut d'affichage, très exactement ce que le pavé du plafond dit
du « 13 h → 13 h » quinze lignes plus bas dans le même fichier. ⚠ Et une pièce de
niveau 1 est **gratuite** en scorie : sur une armée neuve, cette colonne
afficherait zéro partout. Deux raisons pour la même décision, et `ÉCRANS T2 ter`
la garde — avec une assertion qui prouve d'abord que le mot « scorie » EST écrit
ailleurs dans le même panneau, sans quoi « aucune scorie » serait vrai d'un
panneau vide.

### ⚠⚠ Le plafond de réserve n'est pas retiré — c'est un AJOUT

Arbitrage du 13/09 : « ajoute ». La ligne « Plafond de réserve · armée » du lot
VITESSE répondait à une autre question, posée le 11/09, et `VIT T8` la tient,
**intacte**. La fiche des trois bâtiments de production porte donc désormais
TROIS lignes : le diviseur de réparation, la remise à neuf, le plafond.

### ⚠⚠ Le cas vide rend `null`, jamais « 0 s » — et il a fait tomber un piège que le brief ne nomme pas

Un châssis sans une seule pièce rend `null` : c'est la convention du dépôt depuis
`niveauDeCommandement`, réaffirmée par `batimentDuChassis`, du module même d'où
vient la mesure. « 0 s » se lirait « réparer mon aviation est gratuit » là où la
vérité est « tu n'as pas d'aviation ».

⚠⚠ **MAIS `formaterEffet` ÉCRIVAIT « aucun retour » EN DUR POUR TOUT `null`, ET
C'EST LA PHRASE DU COMPLEXE DE DÉFENSE.** Elle était juste tant qu'une seule
ligne du dépôt pouvait rendre `null` — celle du Complexe, où l'absence veut dire
« rien ne revient, jamais ». Sur une fiche de production, elle aurait parlé d'un
mécanisme que ce bâtiment-là ne commande pas. La phrase a donc quitté le
formateur pour **la ligne**, qui seule sait de quoi elle parle :
`'rien à réparer'` ici, `'aucun retour'` pour le Complexe.

⚠ **LE RENDU DU COMPLEXE NE BOUGE PAS D'UN CARACTÈRE** — `F-J T10` l'asserte au
mot, et il n'a pas été touché.
⚠ **ET UNE LIGNE QUI PEUT VALOIR `null` SANS DIRE CE QUE SON ABSENCE SIGNIFIE
LÈVE**, au lieu d'écrire `undefined` à l'écran. C'est un fait de PROGRAMME, et il
tombe au dépôt : `CH-F T7` rend les lignes des six uniques à chaque
`npm run check`.

---

## 5. Le simulateur (§1.4), et où se retire la ligne

`lignesDuResultat` est écrite **une fois** et sert **trois** surfaces. Le
simulateur en est une : **il affiche donc désormais, AVANT engagement, les points
de recherche que le raid rapporterait.** Le brief le déclare comme un
élargissement voulu, et c'en est un — mais il faut le dire dans ce sens-là : ce
n'est pas un effet de bord, c'est un renseignement de plus donné au joueur avant
qu'il ne paie ses points d'attaque.

⚠ **RIEN DE NEUF N'EST CALCULÉ POUR LUI.** `simulerRaid` appelle `executerRaid`
sur un `structuredClone` de l'état : le rapport qu'il rend porte déjà
`rechercheMilli`, exact par construction depuis le lot RAID-0 — « le simulateur
est exact par CONSTRUCTION, pas par vérification ».

⚠⚠ **ET SI ETHAN LA REFUSE AU PREMIER ESSAI, VOICI OÙ ELLE SE RETIRE.** La ligne
naît dans le `if` de `lignesDuResultat`, `src/ui/rapport.js`. Trois issues, par
ordre de coût :

1. **Tout retirer** — le `if` entier part, et `ÉCRANS T1` avec lui. Une ligne de
   code, un test.
2. **La garder partout SAUF au simulateur** — `lignesDuResultat` prend un second
   argument, `{ simule }`, que `ui/raid.js` passe à `false` sur le panneau de fin
   et à `true` sur celui du simulateur ; le `if` gagne `&& !simule`. Le dépliant
   du journal, lui, ne connaît pas de simulation et garde le défaut.
   ⚠ **C'est l'issue à prendre si la gêne est « le joueur voit son gain avant de
   payer »**, et elle ne touche qu'un fichier.
3. **La garder au simulateur et pas ailleurs** — l'inverse du 2, même coût.

Aucune des trois ne touche `src/sim/`, aucune ne demande une migration.

---

## 6. T1 et T2 vus ROUGES avant, verts après

Les deux tests ont été écrits puis exécutés **sur l'arbre pristine de `main` =
`f21ba4e`**, dans un `git worktree`, avant qu'une ligne de `src/` ne bouge :

| test | sur `f21ba4e` | message |
|---|---|---|
| `ÉCRANS T1` | **ROUGE** | `le panneau rend 0 ligne(s) de recherche au lieu d'une` |
| `ÉCRANS T1 bis` | **ROUGE** | `un raid à zéro point perd sa ligne` |
| `ÉCRANS T2` | **ROUGE** | `caserne : la fiche ne dit pas le coût de remise à neuf` |
| `ÉCRANS T2 bis` | **ROUGE** | `caserne : la ligne a disparu au lieu de se dire sans nombre` |
| `ÉCRANS T2 ter` | **VERT** | — voir ci-dessous |

⚠ **`ÉCRANS T2 ter` EST VERT DES DEUX CÔTÉS, ET C'EST VOULU : IL GARDE CE QUI NE
DEVAIT PAS BOUGER.** Sur l'arbre d'avant, la fiche de production ne dit aucune
scorie parce qu'elle ne dit rien du tout ; il attrape une RÉGRESSION — le jour où
quelqu'un ajoutera la colonne de scorie que l'arbitrage écarte. Le précédent est
`FE T4`/`FE T5` du lot FICHES-ENNEMIES, « ils gardent ce qui ne devait pas
bouger ».

⚠ Huit autres tests tombent dans ce worktree, et ce ne sont pas eux qu'on
mesure : ils lisent `dist/index.html`, qui n'y est pas bâti. Les quatre
ci-dessus sont les seuls dont le rouge porte sur le sujet du lot.

### ⚠⚠ Douze falsifications, douze chutes — et DEUX n'ont pas mordu au premier relevé

Chacune est appliquée derrière un `assert count == 1` sur le motif, la suite
COMPLÈTE est jouée, et l'arbre est rendu ensuite.

| | falsification | tests tombés |
|---|---|---|
| F1 | la ligne Recherche retirée du panneau | `ÉCRANS T1`, `T1 bis` |
| F2 | le formatage réécrit sur place (`/1000`) | `ÉCRANS T1` |
| F3 | la garde d'absence retirée | `ÉCRANS T1 bis`, **`RAID-A T7`**, **`JD T1`** |
| F4 | la ligne posée APRÈS les pourcentages | `ÉCRANS T1` |
| F5 | le champ brut affiché, en milli-points | `ÉCRANS T1` |
| F6 | la ligne de remise à neuf retirée | `ÉCRANS T2`, `T2 bis` |
| F7 | les SECONDES branchées telles quelles | `ÉCRANS T2` |
| F8 | l'« après » recalculé au niveau COURANT | `ÉCRANS T2` |
| F9 | la demande courante au lieu du coût plein | `ÉCRANS T2` |
| F10 | le filtre de châssis retiré | `ÉCRANS T2` |
| F11 | un châssis vide rend ZÉRO au lieu de `null` | `ÉCRANS T2 bis` |
| F12 | la phrase d'absence remise en dur | `ÉCRANS T2 bis` |

⚠⚠ **F10 N'A PAS MORDU AU PREMIER RELEVÉ, ET C'EST LE MONTAGE QU'ON A RÉPARÉ.**
La première écriture d'`ÉCRANS T2` posait **un seul châssis par montage** :
retirer le filtre — donc faire compter à la Caserne les Pionniers du Dépôt —
laissait le test ENTIÈREMENT VERT, `armee.filter(…)` et `armee` rendant la même
liste. L'armée du test est désormais **mêlée sur les trois châssis** (deux
Fusiliers, des Perceurs, quatre Pionniers, un Épervier), avec une assertion qui
exige les trois AVANT de mesurer. F10 mord.

⚠⚠ **ET F2 NON PLUS, POUR LA MÊME RAISON D'UN CRAN PLUS LOIN.** Le raid du
montage rapporte quelques dizaines de points, où `formaterPoints` et une division
naïve par mille rendent **exactement le même texte** : l'égalité passait des deux
côtés. Le test reçoit désormais, en plus du raid réel, une valeur au-delà de dix
mille — là où `formaterPoints` **compacte** — et une assertion refuse que les
deux écritures coïncident. **Une falsification qui ne mord pas se vérifie avant
d'être crue** ; c'est la règle du dépôt, et elle a servi deux fois ici.

⚠ **AUCUNE ASSERTION N'A ÉTÉ RETIRÉE NI ASSOUPLIE.** Un seul test change de
valeur : **`PIC T7` est réancré** — voir §7.

---

## 7. Relecture hostile

### ⚠⚠ `PIC T7` mentait déjà AVANT ce lot, de 274 octets

Son ancre écrivait **9 384 775**, la mesure du lot REJEU. Le disque de `main` en
rendait **9 385 049** : le lot CONTACT est passé dessus sans la toucher, et
l'écart — 274 octets, **un cent-quatre-vingtième de sa tolérance de 50 000** —
restait VERT. Pendant ce temps, la §0 de `CLAUDE.md` annonçait 9 385 049 : **les
deux documents du dépôt se contredisaient.** C'est très exactement ce que la
dernière assertion de ce test existe pour empêcher — « la tolérance garde contre
la dérive LENTE, pas contre un lot qui sait ce qu'il déplace ». Réancré à
**9 385 638**, marge **214 362 octets, 2,23 %**, et le fait est écrit à côté.

### ⚠⚠ Un commentaire s'est retrouvé au-dessus de la mauvaise fonction, et il a été déplacé

Trouvé à la relecture, pas aux tests : `coutPleinEnTicks` avait été inséré
**entre** le pavé de documentation d'`effetsDuBatiment` et sa fonction. Le pavé —
trente lignes qui racontent trois arbitrages d'Ethan — décrivait donc, pour tout
lecteur, la fonction voisine. Aucun test ne lit les commentaires ; le dépôt
punit ailleurs très exactement cette faute (« ne jamais laisser un commentaire
qui ment »). L'aide est remontée au-dessus du pavé, et le `@returns`
d'`effetsDuBatiment` nomme désormais le champ `absence`. **Le livrable ne bouge
pas d'un octet** — 9 385 638 avant comme après le déplacement, `esbuild`
retirant les commentaires.

### Le champ `absence` ne fuit nulle part

Recensement de tous les consommateurs de `.effets` : un seul dans `src/`,
`lignesDuPanneau`, qui **mappe des clés explicites** — `libelle`, `picto`,
`avant`, `apres`. `absence` ne traverse donc pas jusqu'à la ligne rendue, et
`CH-F T7`, qui exige l'égalité STRICTE du jeu de clés d'une ligne
(`'apres,avant,libelle,picto'`), reste vert sans avoir été touché. Les trois
consommateurs de `test/` lisent par libellé ou par forme, et aucun ne compte les
clés d'un effet.

### Deux comptes de ligne vérifiés

`F-J T10` asserte `apercu.effets.length === 1` sur le **Complexe de défense** et
un autre test l'asserte sur une fiche non unique : ni l'un ni l'autre n'est un
bâtiment de production, donc la ligne neuve ne les déplace pas. Le seul test qui
énumère les effets des trois bâtiments de production, `VIT T8`, les cherche par
**préfixe de libellé** et par **forme**, jamais par indice — il est resté vert
sans être touché.

### Aucun cycle d'imports n'est ouvert

`src/ui/rapport.js` gagne un import de `src/sim/recherche.js`. `src/sim/`
n'importe jamais `src/ui/` : la flèche va dans le sens autorisé, et
l'arborescence `chantier.js` ← `rapport.js` ← `raid.js` est intacte —
`JRN T8` la mesure des deux côtés, et il n'a pas bougé.

### `SAVE_VERSION` reste à 33, et c'est démontré

`src/sim/state.js` n'apparaît pas au diff. Mieux : une partie neuve se sérialise
et se recharge **identique à l'octet** sur trois graines, et un état portant un
vrai raid — `rechercheMilli: "30000"` — fait l'aller-retour identique (4 519
octets), le dépliant du journal rendant « 30 points » après rechargement. Les
deux lignes du lot ne lisent que des champs déjà rangés.

### `python3 tools/verifier.py` n'a pas été lancé, et c'était conforme

Le lot ne touche ni `art/`, ni un outil de la chaîne — **zéro fichier au diff**.

### ⚠⚠ Le rendu n'a pas été vu, et se déclare NON EXÉCUTÉ

Ce que le lot change est du TEXTE à l'écran, et rien n'a été ouvert dans un
navigateur : tout est mesuré sur les fonctions PURES — `lignesDuResultat`,
`apercuDuBatiment`, `lignesDuPanneau` — et sur les valeurs qu'elles rendent.
**À regarder au premier essai :**

1. **La ligne « 1.1 h → 60 min »** du §4 — c'est le défaut de lisibilité relevé
   et non corrigé, et c'est la seule décision de ce lot qui demande un
   arbitrage.
2. **Le panneau du simulateur**, qui annonce désormais la recherche avant
   engagement (§5).
3. **La largeur de la fiche de production**, qui porte trois lignes d'effet là où
   elle en portait deux — « tu compresses tout dans l'UI » est une consigne
   permanente, et une troisième ligne dans « Ce qu'il commande » n'a pas été
   mesurée à l'écran.

### ⚠ Et le lot n'est pas sur la branche que le brief nomme — écart déclaré

Le §6 demande `claude/[descriptive]` ; l'environnement d'exécution épingle la
session à **`claude/new-session-ic99ey`** et interdit de pousser ailleurs sans
autorisation explicite. **PR ouverte, jamais fusionnée**, comme le brief l'exige.


---

## 9. La fusion — `main` a bougé sous le lot

Ethan a fusionné la **PR #141**, lot **CONTACT-2**, pendant que celle-ci était
ouverte. `main` passe de `f21ba4e` à **`0c4a546`**. Il l'a signalé en disant qu'il
ne pouvait pas résoudre les conflits sur GitHub web — et il avait raison de ne pas
essayer : l'éditeur de conflits de GitHub demande de reconstruire à la main un
fichier de plus de deux mille lignes, sur téléphone, et **deux des trois conflits
ne se résolvent pas en choisissant un côté**.

### 9.1 Trois fichiers se croisent, et ce sont toujours les mêmes

| fichier | conflit | résolution |
|---|---|---|
| `CLAUDE.md` | les deux lots insèrent un bloc §0 en tête | **les DEUX gardés** |
| `package.json` | les deux bumpent la version | ⚠ **auto-fusionné en silence** |
| `test/pictogramme.test.js` | les deux réancrent `PIC T7` | **remesuré** |

Ce sont les trois que deux lots parallèles heurtent toujours : le bloc de tête, le
numéro de version, l'ancre de taille du livrable. **Aucun fichier de `src/` n'est
partagé** — CONTACT-2 touche `src/sim/combat.js`, ÉCRANS `src/ui/chantier.js` et
`src/ui/rapport.js`.

### 9.2 ⚠⚠ Le piège est `package.json`, et git ne l'a pas signalé

Les deux lots avaient bumpé au **MÊME** numéro, `0.99.56 · build 158` : chacun
l'avait pris comme « le suivant disponible » sur la même base. Git ne voit alors
aucun conflit — les deux côtés écrivent la même chose — et garde la valeur.
**Deux livrables différents auraient porté le même `config.build`**, que
`android/app/build.gradle.kts` lit et que le manifeste de Pages publie.
`git status` n'aurait rien dit, et aucun test JS ne regarde ce nombre.

La fusion prend **0.99.57 · build 159**. C'est la **quatrième fois** du dépôt —
après ÉCRANS du 10/09, ARRIVÉE-CARTE-ET-BUILD et le lot ÉCRANS d'origine, tous
trois consignés en §0. **Deux lots parallèles ne peuvent pas choisir leur numéro
chacun de son côté ; c'est la fusion qui le choisit.**

### 9.3 Les deux blocs §0 sont gardés

CONTACT-2 est sur `main`, ÉCRANS atterrit après lui : le bloc d'ÉCRANS passe en
tête, celui de CONTACT-2 est **rétrogradé en « Auparavant »**, sans qu'un mot de
son corps ne bouge. En garder un seul aurait effacé un lot entier de l'historique
que `CLAUDE.md` **est**.

### 9.4 `PIC T7` : deux ancres justes séparément, fausses ensemble

Écrit seul, ÉCRANS portait l'ancre à 9 385 638 ; CONTACT-2, écrit en parallèle sur
la même base, à 9 385 408. **Les deux étaient justes contre `f21ba4e` et fausses
contre le disque fusionné** — la faute que `CLAUDE.md` §6 nomme ailleurs, « deux
modules justes séparément peuvent être faux ensemble ».

Le test écrit désormais **9 385 997**, et il gagne une **seconde**
contre-assertion, `notEqual(MARGE, 214_592)` : sans elle, un lot qui défferait la
fusion et rendrait l'ancre de CONTACT-2 repasserait au vert. ⚠ La garde
`notEqual(MARGE, 215_225)` de CONTACT-2 est **conservée**, pas remplacée — aucune
assertion n'a été retirée.

### 9.5 ⚠⚠ Le nombre ne s'additionne pas, il se mesure

`main` pristine à `0c4a546`, rebâti dans un `git worktree` : **9 385 408**, à
l'octet ce que `PIC T7` de CONTACT-2 écrit. Le fusionné : **9 385 997**.

| poste | `main` pristine | fusionné | écart |
|---|---:|---:|---:|
| JavaScript | 425 153 | 425 742 | **+589** |
| feuille | 46 553 | 46 553 | +0 |
| balisage | 36 753 | 36 753 | +0 |
| images | 7 683 603 | 7 683 603 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |
| **total** | **9 385 408** | **9 385 997** | **+589** |

La partition tombe **exactement** sur le total des deux côtés (écart 0 · 0), et
les **306 URI / 307 lignes `data:`** sont identiques de part et d'autre.

Le coût retombe sur **+589**, le nombre du lot seul. ⚠ **C'est un fait mesuré et
non une addition** : le lot ARRIVÉE-CARTE-ET-BUILD avait relevé **six octets**
d'écart entre la somme de deux diffs et le livrable fusionné, parce que les deux
lots partageaient deux fichiers de `src/ui/`. Ici ils n'en partagent aucun du
livrable, et la ventilation le confirme au lieu de le supposer.

### 9.6 Rien de CONTACT-2 n'est perdu — vérifié fichier par fichier

`src/sim/combat.js` est **identique à `main`** au diff, et ses **quatorze**
fichiers de `test/` aussi, `temoins-combat.js` et `temoins-bases-0.js` compris.
`rapports/RAPPORT-lotCONTACT-2.md` est en place. Le diff de la fusion contre
`main` ne porte **que** les fichiers d'ÉCRANS, plus le pavé de fusion de
`CLAUDE.md` et le réancrage de `PIC T7`.

### 9.7 Le compte de tests s'additionne, lui

1 603 avant les deux lots ; CONTACT-2 en ajoute **1**, ÉCRANS **5**, et le
fusionné en déclare **1 609** — vérifié par la garde de `documentation.test.js`,
qui compare la §0 au dépôt et est **tombée** avant d'être mise à jour.
