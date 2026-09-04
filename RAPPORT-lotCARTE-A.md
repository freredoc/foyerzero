# RAPPORT — lot CARTE-A

**Version produite : 0.90.0 · build 92.** `npm run check` → **1044 pass / 0
fail**, `dist/index.html` **6 786 776 octets**, 0 référence externe.

Trois retours d'Ethan du 04/09, tous sur la LECTURE de la carte. Aucune règle de
jeu ne bouge, aucun module de `src/sim/` n'est modifié — sauf lecture.
`SAVE_VERSION` reste à **24** et la sauvegarde ne grandit pas d'un octet.

---

## 0. La base de départ n'est pas celle du brief — écart déclaré, lot poursuivi

Le brief attend **1015 pass, 6 779 831 octets, 0.87.0 · build 89**, et fait d'un
écart de compte de tests un point d'arrêt : « Un écart de version est normal ;
un écart de compte de tests ne l'est pas. »

Mesuré sur un clone d'`origin/main` au premier geste : **1037 pass / 0 fail,
6 780 316… non — 6 783 659 octets, 0.89.0 · build 91**.

⚠⚠ **L'écart se décompose exactement, et il n'y a rien d'inexpliqué.** Deux lots
ont été fusionnés entre l'écriture de ce brief et son exécution, et le brief les
nomme tous les deux :

| lot | tests | ce que le brief en dit |
|---|---|---|
| ZOOM-CONTINU | +11 → 1026 | §4 : « le zoom continu — lot ZOOM-CONTINU, **qui passe avant** » |
| ASSAUT | +11 → 1037 | §4 : le double-toucher, « en attente d'arbitrage » — arbitré depuis |

1015 + 11 + 11 = **1037**, au test près. La condition d'arrêt vise un écart
*inexpliqué* ; celui-ci est entièrement attribué, et les deux lots sont ceux que
le brief annonce comme passant avant. **Écart déclaré, lot poursuivi.**

`python3 tools/verifier.py` n'a **pas** été lancé, et c'était conforme (§0.4 du
brief, §0.5 de `CLAUDE.md`) : le lot ne touche ni `art/` ni `tools/`.

---

## 1. « Base n°1 · niv 1,0 » au lieu de « Votre base »

### Ce qui a changé

`sitesDeLaFenetre` pose deux champs de plus **sur les seules `baseJoueur`** :

- `numeroBase: indice + 1` — le joueur compte à partir de un, et le bandeau de
  bascule affiche déjà « BASE 1 / 1 » ;
- `niveauBatimentsDixiemes: niveauDesBatiments(base.disposition)` — en dixièmes
  entiers, jamais en flottant.

### ⚠⚠ `nomDuSite` entre, et c'est le premier nom que la table ne porte pas

L'étiquette de la carte et le titre du panneau lisaient tous deux
`EMBLEMES_CARTE[type].nom`. Un numéro de base ne s'y écrit pas : le calculer aux
DEUX endroits aurait donné deux libellés pour la même base sur le même écran —
exactement ce que le commentaire de `lignesDeLEtiquette` interdisait déjà pour
les noms de la table. Une fonction, deux lecteurs.

`EMBLEMES_CARTE.baseJoueur.nom` **reste `'Votre base'`** et devient le repli. Il
est aussi la source de la ligne « Type » du panneau et de son test : y écrire
« Base » tout court aurait fait mentir les deux. **Relevé à l'écran** : le titre
dit « Base n°1 », la ligne Type dit « Votre base » — le titre NOMME la base, la
ligne dit son ESPÈCE.

### Le formatage ne s'écrit pas une seconde fois

`formaterDixiemes` de `src/ui/chantier.js` porte la règle depuis le 27/08 —
« 6,0 », jamais « 6 ». `src/ui/monde.js` l'importe ; `src/ui/recherche.js`
importe déjà de ce module pour la même raison (ce sont des fonctions PURES d'un
module d'écran, pas son DOM), donc l'import croisé est un motif établi et il n'y
a pas de cycle.

### ⚠ Le mot dit la grandeur

`niv` en minuscules pour la base du joueur, `Niveau` capitalisé pour les sites de
l'Ouvrage. Ce ne sont pas la même grandeur — un niveau ENTIER de carte contre une
MOYENNE à une décimale — et deux mots identiques les feraient lire comme telles.

### ⚠⚠ Un défaut multi-bases trouvé en tenant la règle du brief

Le brief exige : « L'étiquette lit **la même grandeur que l'emblème qu'elle
légende** ». `palierDuSite` lisait `baseCourante(etat)` : **avec deux bases,
toutes se seraient dessinées au palier de la courante** pendant que leurs plaques
auraient dit chacune leur niveau. Le site porte désormais sa propre moyenne, et
la base courante n'est plus que le repli des montages qui composent un site à la
main — `palierDuSite` est appelée ainsi par un test existant, qui reste vert.

**Mesuré** (`CARTE-A T4`) : deux bases aux dispositions différentes rendent deux
niveaux différents ET deux paliers différents. Avant le lot, le second était
impossible.

---

## 2. Le prix du raid quitte la flèche pour le panneau

### Ce qui a changé

1. Le cartouche de `dessinerFleche` est **retiré** — tout le bloc depuis
   `// Le coût, au milieu du trait.` jusqu'au `ctx.fillText`. La flèche garde son
   trait et sa pointe, et `CARTE-A T5` l'exige dans les deux sens.
2. **Le commentaire de la garde d'entrée est réécrit.** Il disait « PAS DE FLÈCHE
   SANS PRIX » : le motif meurt avec le cartouche. Le test `cout === null`
   **reste**, pour une autre raison — une flèche vers une cible hors de portée
   promettrait un raid que `problemesDuRaid` refusera. Un motif mort sous une
   conclusion vivante est le mensonge que `CLAUDE.md` §6 raconte trois fois.
3. Le prix devient un **bloc** au-dessus de `#monde-panneau-corps` : le nombre en
   corps 28, le solde à côté sous la forme `110 / 110`, et « points d'attaque »
   en petit dessous, à la casse et à la teinte des `.nom` du bandeau.
4. Le coût **quitte aussi** la liste de `lignesDuSite`. Deux afficheurs du même
   nombre dans le même panneau finiraient par ne plus dire la même chose.

### ⚠⚠ Un seul calcul, comme avant

`coutDUnRaid` n'apparaît toujours qu'**une fois** dans tout `src/ui/monde.js`, et
c'est dans `ciblageDuSite`. Le bloc **relit** `ciblage`, il ne rappelle pas le
barème. `CARTE-A T6` le compte, et `F10` — « le bloc rappelle le barème » — le
fait tomber.

### ⚠ Hors de portée, le bloc est caché

Le coût vaut alors `null`, `#monde-panneau-refus` écrit déjà pourquoi, et un
tiret en corps 28 crierait un vide. `F12` le falsifie.

### ⚠ Et la garde du `fillText` se resserre : une exception de moins

`monde.test.js` nommait deux exceptions à l'interdiction de dessiner du texte —
`dessinerFleche` (obtenue le 02/09, pour le coût) et `dessinerEtiquette`. La
flèche n'écrit plus rien : l'exception n'a plus d'objet, elle est **retirée**, et
l'interdiction couvre à nouveau `dessinerFleche`. C'est la boucle qui EXIGE que
chaque exception écrive vraiment du texte qui est tombée — et c'est ce qu'on lui
demande. La garde a **gagné** en portée ; elle n'a rien perdu.

---

## 3. Le bandeau porte les points d'attaque, et s'allège sur la carte

### La quatrième tuile, et sa place est l'ordre du DOM

`.ressource.attaque` est construite **entre** la boucle des trois ressources et
le bloc des emplacements — c'est l'ordre qu'Ethan donne, et l'ordre du DOM le
donne à lui seul. Un `order` CSS ferait diverger l'ordre lu et l'ordre vu, donc
la navigation au clavier et la lecture d'écran. `CARTE-A T7` compare les trois
positions d'appel dans la source, et `F13` les inverse.

Elle réemploie `.ressource`, `.ligne`, `b`, `.capacite`, `.nom`, affiche
`etat.attaque.points` sur `/ etat.attaque.plafond` et « ATTAQUE » en nom, et se
rafraîchit **dans la même passe** que les trois autres — pas par un second
minuteur.

### ⚠ Rien n'y est peint « saturé »

`b.sature` dit « le stock est gelé au-dessus de sa capacité, il ne redescendra
pas tout seul » — un DÉFAUT que le joueur doit voir. Des points d'attaque au
plafond, c'est le PLEIN : le marquer en rouge dirait le contraire de ce qui se
passe. `F14` le falsifie.

### ⚠⚠ La teinte est mesurée, pas choisie à l'œil

Contraste sur le fond `#343A2C` du bandeau, candidates de `FICHE-STYLE.md` :

| teinte | contraste | verdict |
|---|---|---|
| `#8A1E17` | **1,27** | illisible |
| `#E43E32` | **2,82** | sous le plancher, **et réservé à ce qui attaque le joueur** |
| `#8C9A72` | 3,90 | pris par l'électricité |
| `#F5B636` | 6,50 | pris par la scorie |
| `#F5F3E8` | 10,55 | pris par le quartz et les emplacements |
| **`#E0B9A8`** | **6,53** | **retenu** — poussière de la terre cuite, la rampe du JOUEUR, employée nulle part ailleurs dans la feuille |

### ⚠⚠ Le masquage partiel ne passe pas par `CHROME_MASQUE_PAR`

Le mécanisme existant est **par bloc entier** : y ajouter `monde` aurait emporté
la tuile d'attaque, qui est justement ce qu'on veut voir là. La session écrit
`data-ecran` sur `#ressources` **dans la fonction qui masque déjà**, et la
feuille cache `.ressource:not(.attaque)` sous cet attribut. Une seule source
décide, et c'est l'écran courant ; `CHROME_MASQUE_PAR` reste ce qu'il est.
`F15`, `F16` et `F17` couvrent les trois façons de casser ce montage.

### ⚠ Ce qui reste

`#navigation` (« BASE 1 / 1 ») **reste visible sur la carte** : Ethan ne l'a pas
demandé, et il dit quelle base attaque. Le compteur d'emplacements n'est pas
supprimé — il est **masqué sur un écran**, et son commentaire raconte déjà
l'aller-retour du 27 au 28/08.

---

## 4. Les sept tests, avec leur montage effectif

Six dans `test/monde.test.js`, un dans `test/chantier.test.js` — les tests vivent
avec le module qu'ils gardent. **Le compte passe de 1 037 à 1 044.** Aucune
assertion n'a été retirée.

| test | montage effectif | verdict |
|---|---|---|
| `CARTE-A T1` | `lignesDeLEtiquette({type:'baseJoueur', numeroBase:2, niveauBatimentsDixiemes:58})` ; `nomDuSite` sur le même site ; garde de source sur le titre du panneau ; repli sans numéro ; absence du mot `Niveau` | **PASS** — rend `['Base n°2', 'niv 5,8']` |
| `CARTE-A T2` | le même avec `60`, `10` et `507` ; garde de source : `formaterDixiemes` employé, aucun `toFixed` ni `replace('.')` | **PASS** — `niv 6,0`, `niv 1,0`, `niv 50,7` |
| `CARTE-A T3` | `camp` niveau 12, `base` 40, `avantPoste` 3, `poiQuartz` 3 ; et les onze types d'`EMBLEMES_CARTE` hors `baseJoueur` par `nomDuSite` | **PASS** — `['Camp','Niveau 12']`, inchangé |
| `CARTE-A T4` | état à deux bases (la seconde clonée trois rangées plus haut), `sitesDeLaFenetre` sur la carte entière ; puis la seconde montée au niveau 30 | **PASS** — numéros `[1, 2]`, jamais 0 ; niveaux distincts ; **paliers distincts** |
| `CARTE-A T5` | `extraireFonction(nu, 'dessinerFleche')` : ni `fillText` ni `measureText`, mais toujours `ctx.stroke()` et `ctx.fill()`, et toujours `ciblageOuvert.cout === null` | **PASS** |
| `CARTE-A T6` | un seul `coutDUnRaid(`, un seul `panneauPrixCout.textContent`, aucun `Coût du raid` ; les quatre ids une seule fois dans `dist/index.html` ; le bloc AVANT le corps ; `hidden` au balisage et `hidden = prix === null` dans l'écran | **PASS** |
| `CARTE-A T7` | `compteurDeContexte` sur les trois contextes — aucun ne dit « attaque », `'attaque'` LÈVE ; la tuile lit `etat.attaque` directement ; les trois `appendChild` dans l'ordre ; aucun `order:` sur `#ressources` ; aucun `sature` dans le bloc de la tuile ; `data-ecran` écrit par la session ; `CHROME_MASQUE_PAR` sans `monde` ; la règle CSS présente | **PASS** |

### ⚠⚠ Ce que `T5` et `T6` ne prouvent pas

Ce sont des gardes de SOURCE. Elles disent qu'un afficheur a disparu du fichier ;
elles ne disent pas que la flèche se dessine encore. Le §3 de `CLAUDE.md` rappelle
que l'écran est hors de portée des tests faute de DOM, et le lot JOURNAL a montré
qu'une garde qui ne lit que l'APPEL reste verte quand le corps est tronqué. D'où
le §5.

### Dix-huit falsifications, dix-huit chutes, zéro muette

| # | falsification | tombe |
|---|---|---|
| F1 | la base ne porte plus son numéro | T4 |
| F2 | le numéro part de zéro | T4 |
| F3 | tout site devient « Base n°… » | T1, T3, + la garde des étiquettes |
| F4 | la base emprunte le mot `Niveau` de l'Ouvrage | T1, T2 |
| F5 | la décimale se perd (`Math.round(d / 10)`) | T1, T2 |
| F6 | le titre du panneau reprend le nom de la table | T1 |
| F7 | l'emblème relit la base courante | T4 |
| F8 | le cartouche revient sur la flèche | T5, + la garde du `fillText` |
| F9 | le coût revient dans la liste du panneau | T6, `RAID-A T1` |
| F10 | le bloc rappelle `coutDUnRaid` | T6 |
| F11 | le prix passe sous le corps du panneau | T6 |
| F12 | le prix ne se cache plus hors de portée | T6 |
| F13 | la tuile d'attaque passe après les emplacements | T7 |
| F14 | la tuile se peint saturée | T7 |
| F15 | la session n'écrit plus l'écran courant | T7 |
| F16 | `monde` entre dans `CHROME_MASQUE_PAR` | T7, `RAID-A T4` |
| F17 | la règle CSS qui réduit le bandeau disparaît | T7 |
| F18 | l'attaque devient un quatrième contexte du compteur | T7, + la garde du compteur |

### Deux gardes existantes resserrées, aucune assouplie

- **`fillText`** — l'exception `dessinerFleche` est retirée : l'interdiction
  couvre à nouveau cette fonction, et une ligne nommée refuse explicitement le
  retour du cartouche.
- **`RAID-A T1`** — il exigeait **quatre** lignes de ciblage et la présence de
  « Coût du raid ». Il en exige **trois**, et **l'ABSENCE** du coût. Ce qu'il
  gardait ne change pas d'un mot : `ciblage.cout` vaut toujours exactement
  `coutDUnRaid`, asserté dix lignes plus haut. Ce qui change, c'est qui l'affiche.

---

## 5. Boot Chromium — ce qui a été vu, pas asserté

Viewport 360 × 720 CSS, tactile, une sauvegarde fabriquée par le moteur (graine
2026, six Meutes posées, 5 000 points d'attaque) injectée dans `localStorage`
avant chargement. Zéro erreur de page.

| ce qu'on regarde | relevé |
|---|---|
| bandeau, écran Base | **cinq** tuiles en 44 px de haut : `30/50 QUARTZ` · `30/50 SCORIE` · `20/40 ÉLEC.` · **`110/110 ATTAQUE`** · `1/3 EMPLAC.` — 71 px chacune, 47 pour les emplacements |
| teinte de la tuile | `rgb(224, 185, 168)` = `#E0B9A8` |
| bandeau, écran Carte | **une seule** tuile visible, `110 / 110 · ATTAQUE`, les quatre autres à largeur 0 ; `data-ecran="monde"` |
| `#navigation` sur la carte | visible — « BASE 1 / 1 » |
| étiquette de sa base | **« Base n°1 » / « niv 1,0 »** |
| étiquette d'un camp | **« Camp » / « Niveau 1 »** — inchangé |
| étiquette d'un avant-poste | **« Avant-poste » / « Niveau 2 »** — inchangé |
| titre du panneau, sa base | **« Base n°1 »** ; ligne « Type » : « Votre base » |
| flèche vers la cible | trait et pointe, **aucun nombre** |
| bloc de prix | `11` en **28 px**, `110 / 110` à côté, `POINTS D'ATTAQUE` dessous ; boîte 360 × 45 |
| corps du panneau | sept lignes, **sans** « Coût du raid » |
| retour sur l'écran Base | **les cinq tuiles sont revenues** — le masquage qui ne se lève pas était le défaut le plus probable du lot |

Quatre captures dans `rapports/` : `carte-a-1-bandeau-base.png`,
`carte-a-2-carte-et-prix.png`, `carte-a-3-retour-base.png`,
`carte-a-4-etiquettes.png`. Elles sont prises à dpr 1 pour peser 1 Mio en tout ;
les mesures ci-dessus ont été relevées à **dpr 3**, qui est l'appareil d'Ethan —
seule la définition change, la mise en page est en pixels CSS.

---

## 6. Le coût, poste par poste

Mesuré contre un livrable **rebâti** depuis `origin/main` dans un `git worktree`.

| poste | `main` | lot | écart |
|---|---|---|---|
| total | 6 783 659 | **6 786 776** | **+3 117** |
| feuille (hors `data:`) | 93 522 | 95 580 | **+2 058** |
| JavaScript (hors `data:`) | 333 775 | 334 581 | **+806** |
| balisage | 1 964 265 | 1 964 518 | **+253** |
| audio `data:` | 1 193 346 | 1 193 346 | **+0** |
| images `data:` | 5 130 772 | 5 130 772 | **+0** |
| nombre de `data:` | 289 | **289** | **+0** |

**Aucune ressource n'entre.** Borne T10 **inchangée à 7 000 000**, marge
**213 224 octets, 3,05 %**.

⚠ **La feuille pèse plus que le code, et c'est attendu** : le lot ajoute une
tuile, un bloc de prix et une règle de masquage — trois blocs de style pour deux
fonctions et quatre lignes de câblage.

⚠ **`SAVE_VERSION` reste à 24 et la sauvegarde ne grandit pas d'un octet.** Les
deux champs neufs entrent dans ce que `sitesDeLaFenetre` REND ; cette fonction
est pure et ne stocke rien.

---

## 7. Les ancres, extraites du fichier et comptées

Chaque édition a été faite par substitution sur une ancre **lue dans le fichier**,
sous `assert count == 1`. Vérification rejouée sur les fichiers finaux —
**dix-huit ancres, toutes à 1** :

| fichier | ancre | occurrences |
|---|---|---|
| `src/ui/monde.js` | `numeroBase: indice + 1,` | 1 |
| `src/ui/monde.js` | `niveauBatimentsDixiemes: niveauDesBatiments(base.disposition),` | 1 |
| `src/ui/monde.js` | `import { formaterDixiemes } from './chantier.js';` | 1 |
| `src/ui/monde.js` | `export function nomDuSite(site) {` | 1 |
| `src/ui/monde.js` | `export function lignesDeLEtiquette(site) {` | 1 |
| `src/ui/monde.js` | `panneauTitre.textContent = nomDuSite(site);` | 1 |
| `src/ui/monde.js` | `const dixiemes = site.niveauBatimentsDixiemes === undefined` | 1 |
| `src/ui/monde.js` | `const prix = ciblage === null ? null : ciblage.cout;` | 1 |
| `src/ui/monde.js` | `panneauPrix.hidden = prix === null;` | 1 |
| `src/ui/monde.js` | `const panneauPrix = $('monde-panneau-prix');` | 1 |
| `src/ui/chantier.js` | `blocAttaque.className = 'ressource attaque';` | 1 |
| `src/ui/chantier.js` | `bandeauRessources.appendChild(blocAttaque);` | 1 |
| `src/ui/chantier.js` | `attaquePoints.textContent = formaterEntier(etat.attaque.points);` | 1 |
| `src/ui/session.js` | `$('ressources').dataset.ecran = ecranCourant;` | 1 |
| `src/index.src.html` | `<div id="monde-panneau-prix" hidden>` | 1 |
| `src/index.src.html` | `.ressource.attaque b { color: #E0B9A8; }` | 1 |
| `src/index.src.html` | `#ressources[data-ecran="monde"] .ressource:not(.attaque) { display: none; }` | 1 |
| `src/index.src.html` | `#monde-panneau-prix {` | 1 |

---

## 8. Écarts au brief, et points en suspens

### Écarts déclarés

1. **La base de départ** — §0 ci-dessus. Écart entièrement attribué à
   ZOOM-CONTINU et ASSAUT, tous deux nommés par le brief.
2. **Les sept tests sont répartis, pas rassemblés.** Six vivent dans
   `test/monde.test.js` et un dans `test/chantier.test.js` — les tests vivent
   avec le module qu'ils gardent, comme le reste du dépôt. Aucun fichier neuf,
   donc la liste de `CLAUDE.md` §2 ne change que par son compte.
3. **`palierDuSite` est modifiée**, ce que le brief ne demandait pas. C'est sa
   propre exigence qui l'a imposé : « l'étiquette lit la même grandeur que
   l'emblème qu'elle légende ». Sans ça, le dessin et sa plaque se contredisaient
   dès la seconde base.
4. **La ligne « Type » du panneau dit toujours « Votre base ».** Le brief ne
   demande que le TITRE ; le titre NOMME la base, la ligne dit son ESPÈCE, et
   `EMBLEMES_CARTE.baseJoueur.nom` est explicitement gardé comme repli.
5. **Le libellé de la tuile est « ATTAQUE »**, rendu en capitales par
   `text-transform` comme les trois autres `.nom` ; la chaîne écrite dans le code
   est « Attaque ».

### Hors lot, non pris au passage — et rien n'a paru « à deux lignes »

- les étiquettes de la carte : **`ETIQUETTE_CARTE` n'a pas été touchée**, pas
  même d'un nombre. Le seuil reste `cssMiniParCase: 64` ;
- le zoom continu : passé au lot ZOOM-CONTINU, avant celui-ci ;
- le double-toucher : passé au lot ASSAUT, avec le bouton d'attaque ;
- le déplacement de base sous le niveau 5, et l'origine du zoom de l'écran Base :
  non entamés.

### Ce que le lot a trouvé sans que le brief le demande

⚠ **`palierDuSite` était faux pour toute base autre que la courante** — voir §1.
Invisible aujourd'hui, la partie n'ayant qu'une base par défaut ; le lot BASES-1
a ouvert la seconde.

⚠ **Le panneau de la carte couvre les étiquettes du bas de l'écran.** Relevé en
prenant les captures : à fort zoom, la plaque d'un site proche du bas passe sous
le panneau ouvert. C'est la même géométrie que le point déjà signalé au lot
ASSAUT — le panneau couvre le bas de la carte, où se trouvent les seules cibles à
portée d'une partie neuve. **Non corrigé** : c'est une géométrie de panneau, donc
un autre lot.

### Les deux points que le rapport doit trancher — un nombre se change seul

1. **Le corps du prix dans le panneau : 28 px.** Relevé à l'écran, la boîte fait
   360 × 45 px et le nombre à deux chiffres tient largement ; à trois chiffres il
   tiendrait encore. C'est une proposition.
2. **Le libellé `niv 1,0`.** Ethan a écrit « niv x » ; la décimale est un choix,
   et c'est celui que le dépôt fait partout ailleurs pour une moyenne depuis le
   27/08 — « un niveau moyen qui tombe rond reste une moyenne ». S'il la veut
   entière, c'est une ligne de `lignesDeLEtiquette`.

**Ethan tranche.**
