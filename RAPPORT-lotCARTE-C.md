# RAPPORT — lot CARTE-C

Retours d'Ethan du 06/09/2026 : la **flèche** hors champ, l'**origine du niveau**
sur la fiche d'un site, et un **bouton Attaquer** dans le panneau.

Version produite : **0.99.10 · build 111**, les deux en chaînes JSON.

---

## 0. La base, et ce que le lot coûte

| | avant | après |
|---|---|---|
| `npm test` | 1215 pass / 0 fail | **1231 pass / 0 fail** |
| `dist/index.html` | 8 001 031 octets | **8 003 118 octets** |
| version | 0.99.9 · build 110 | 0.99.10 · build 111 |
| `SAVE_VERSION` | 27 | **27, inchangé** |

⚠ La base du brief — 1 201 pass, 8 000 552 octets, 0.99.8 · build 109 — était
exacte au moment où il a été écrit ; le lot SATELLITES-RESPAWN a été livré entre
temps sur la même branche, et c'est **son** état qui sert de référence ici.

Ventilation du **+2 087**, poste par poste :

| poste | avant | après | delta |
|---|---|---|---|
| JavaScript | 356 112 | 356 910 | **+798** |
| feuille | 3 186 734 | 3 187 921 | **+1 187** |
| balisage | — | — | **+102** |
| images | 6 306 190 | 6 306 190 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |

La somme des cinq postes tombe **exactement** sur le total. **296 lignes `data:`
avant, 296 après ; 291 URI de part et d'autre** — aucune image, aucun son
n'entre. Borne T10 inchangée à 9 300 000, marge **1 296 882 octets, 13,95 %**.

Fichiers touchés : `src/ui/monde.js`, `src/data/sites.js`, `src/index.src.html`,
`test/monde.test.js`, `CLAUDE.md`, `package.json`.

---

## 1. La flèche s'arrête au bord — et le cas est le cas COURANT

`traitRogne(trait, largeur, hauteur)` entre dans `src/ui/monde.js`, **pure et
exportée**, à côté de `traitDeLaFleche`. L'algorithme est Liang–Barsky : le
segment est paramétré, chaque bord donne une borne sur le paramètre, et
l'intersection des quatre bornes est le morceau visible.

### Le choix retenu pour le départ hors champ, et sa mesure

**Les DEUX bouts sont rognés**, pas seulement l'arrivée. Liang–Barsky les traite
par construction, et le cas du départ est atteignable :

> Au dernier cran, une case vaut **256 pixels physiques**. Un téléphone de
> 1 080 × 2 340 en montre donc **4,2 × 9,1**. La portée d'un raid est de **dix
> cases** : deux sites attaquables ne tiennent PAS ensemble dans le cadre, et le
> joueur qui promène la carte jusqu'à sa cible a sa base hors du champ.

`CARTE-C T5` écrit cette mesure en assertion — `1080 / ECHELLE_MAX < 10` — avant
de mesurer le rognage du départ.

### Ce qui ne bouge pas

- **`traitDeLaFleche` n'a pas un caractère de changé.** Elle rend le trait de
  centre à centre — l'arbitrage du 06/09 —, et sa garde « même case → `null` »
  est intacte. Le rognage est une **seconde** opération, posée après elle.
- **L'angle est REPRIS, jamais recalculé.** `trait.angle` est celui du segment
  ENTIER, et c'est lui qui porte la direction de la cible.
- **L'épaisseur n'est pas touchée.** Ethan : « on fait croître avec le zoom ».
  Une proposition de la borner en pixels d'écran a été faite et refusée ;
  `CARTE-C T7` fige l'arbitrage dans les deux sens.
- **Le nombre de points d'attaque ne revient pas sur la flèche.**

⚠ **Un trait entièrement visible ressort par IDENTITÉ D'OBJET** : `t0` et `t1`
valent exactement 0 et 1, aucune arithmétique n'est faite, et le cas courant ne
paie pas un arrondi flottant pour rien. `CARTE-C T3` l'asserte de face.

⚠ **Entièrement dehors → `null`**, jamais un segment de longueur nulle :
`dessinerFleche` peindrait une pointe sur un point qui ne désigne rien.

---

## 2. La fiche dit d'où vient le niveau

`ORIGINE_DU_NIVEAU` entre dans `src/data/sites.js`, **à côté du champ qu'elle
explique**, et `lignesDuSite` pousse une ligne « Indexé sur » juste sous
« Niveau ».

| type | `indexeSur` | ce que la fiche dit |
|---|---|---|
| camp | `niveauDuJoueur` | « le niveau de vos bâtiments » |
| avant-poste | `rayon` | « la position sur la carte » |
| base de l'Ouvrage | `rayon` | « la position sur la carte » |

⚠⚠ **LE DISCRIMINANT EST `TYPES_SITE[x].indexeSur`, JAMAIS UN `if` SUR LE TYPE.**
`CARTE-C T9` change `indexeSur` dans un montage et exige que la ligne SUIVE : un
`site.type === 'camp'` recopié dans l'écran le fait tomber, mesuré.

⚠ **Aucun chiffre n'est recalculé** : la ligne explique l'ORIGINE, elle ne
réévalue pas le niveau, qui est déjà dans l'état.

⚠ **Rien sur sa propre base, ni sur un POI.** La base du joueur n'a pas UN niveau
mais trois moyennes, et elle n'est pas dans `TYPES_SITE`.

⚠ **Un `indexeSur` sans libellé LÈVE**, il ne rend pas un vide — et `CARTE-C T9`
exige la couverture EXACTE de la table dans les deux sens : un troisième type de
satellite indexé autrement fera tomber la garde et obligera à écrire sa phrase.

---

## 3. Un bouton Attaquer dans le panneau

`#monde-panneau-attaquer` entre dans la tête du panneau, à côté de « Fermer ».

### Le discriminant, et d'où il vient

**Il n'est pas inventé : c'est celui de la flèche.**

| | condition | d'où elle vient |
|---|---|---|
| présent | `ciblage !== null` | `ciblageDuSite` rend `null` sur sa propre base comme sur une case sans rien à attaquer — c'est ce que `dessinerFleche` lit pour décider de peindre |
| actif | `ciblage.cout !== null` | « hors de portée », le motif que `dessinerFleche` porte depuis CARTE-A |

⚠ **Hors de portée, il se voit et ne se touche pas.** Un bouton absent laisserait
le joueur chercher ; un bouton éteint lui dit qu'il y a quelque chose à faire pour
l'allumer, et `#monde-panneau-refus` écrit déjà quoi.

⚠ **Les autres refus ne l'éteignent pas.** Manquer de points d'attaque est un fait
qui change à la minute : « un indice n'est pas une interdiction », et
`entrerDansLaCible` refuse ET chiffre en appuyant. `CARTE-C T12` le mesure.

### Le second toucher reste, et le motif écrit est renversé plutôt qu'enjambé

Le commentaire du balisage interdisait **quatre mots** — Attaquer, Raider,
Piller, Conquérir — depuis le 27/08, contre le bouton « Assaut » du lot
ÉCRAN-CHANTIER. Ce motif tenait tant que le second toucher SUFFISAIT ; il ne
suffit plus, le panneau couvrant la moitié basse de l'écran. **Le commentaire est
réécrit, la garde est RETOURNÉE, et elle ne se relâche pas :**

- la liste des boutons reste **EXACTE** — deux boutons nommés, aucun autre ;
- les **trois** autres mots restent interdits ;
- le libellé « Attaquer » doit être dans le BALISAGE et **pas** dans l'écran ;
- le bouton doit passer par `entrerDansLaCible`, donc par `problemesDuRaid` — un
  bouton qui appellerait `surEntreeRaid` lui-même fait tomber la garde, mesuré.

### ⚠⚠ Le mode de déplacement — ce que le brief demandait, et ce qui est vrai

Le brief demandait que « Attaquer » **désarme** le déplacement. **Relevé : la
question ne se pose pas comme ça**, et ce qu'on a trouvé est plus intéressant.

`armerLeDeplacement` appelle `fermerPanneau()` **puis ROUVRE le panneau** pour y
écrire son propre message — titre « Déplacer la base », corps vide. Le panneau
reste donc VISIBLE pendant que le mode est armé, ce que le brief ne disait pas.

Ce qui rend le cas inatteignable est autre chose, et ce sont **deux lignes** :

1. `fermerPanneau` cache le bouton Attaquer, et `armerLeDeplacement` ne le rouvre
   pas ;
2. `relacher` route tout toucher vers `poserLaBase` tant que le mode est armé,
   donc aucun panneau de site ne peut se rouvrir.

Appeler `desarmerLeDeplacement` depuis le bouton serait **du code mort**.
`CARTE-C T14` garde les deux lignes et tombe le jour où l'une cède.

---

## 4. Les tests

Seize entrent, tous dans `test/monde.test.js`. **1 215 → 1 231.**

| Code | PASS/KO | Montage effectivement écrit |
|---|---|---|
| **CARTE-C T1** | PASS | Trait dont `x2` sort du cadre : le point rendu est **sur** un bord, et le départ ne bouge pas. Balayé sur les deux axes, dans les deux sens. |
| **CARTE-C T1 bis** | PASS | **Sur l'écran monté**, canevas volontairement petit (100 × 200 CSS) : la cible est prouvée hors du cadre, puis tous les `moveTo`/`lineTo` peints sont dans le canevas. Sans lui, retirer l'appel laisserait T1 à T5 verts — voir §5. |
| **CARTE-C T2** | PASS | L'angle rendu **égale** celui du trait entier, par égalité stricte. |
| **CARTE-C T3** | PASS | Égalité stricte des quatre coordonnées **et identité d'objet** sur un trait entièrement visible. |
| **CARTE-C T4** | PASS | `null` — pas un segment nul — sur les quatre directions droites **et en diagonale**, plus un témoin qui prouve que le montage ne refuse pas tout. |
| **CARTE-C T5** | PASS | Départ hors champ, arrivée dedans ; puis les deux bouts à la fois. Précédé de la mesure « moins de dix cases tiennent en largeur au zoom maximum ». |
| **CARTE-C T6** | PASS | `traitDeLaFleche` rend toujours centre à centre et `null` sur sa case ; et `traitRogne` ne mute pas son entrée. |
| **CARTE-C T7** | PASS | L'épaisseur vaut `pas × EPAISSEUR_HALO` **à un demi-pixel près sur chaque cran**, et elle croît d'un cran au suivant. Voir §5 : le rapport des entiers ne convenait pas. |
| **CARTE-C T8** | PASS | Camp et avant-poste rendent **deux** libellés différents, et la ligne est juste sous « Niveau ». |
| **CARTE-C T9** | PASS | `indexeSur` changé dans un montage → la ligne suit ; couverture exacte de la table dans les deux sens ; un `indexeSur` inconnu LÈVE. |
| **CARTE-C T10** | PASS | Écran monté, panneau ouvert au doigt sur un camp : le clic entre dans **cette** cible, et le panneau se ferme. |
| **CARTE-C T11** | PASS | Panneau ouvert sur sa propre base : bouton absent, et « Déplacer la base » présent — le témoin qui prouve que c'est bien SON panneau. |
| **CARTE-C T12** | PASS | Points d'attaque à zéro sur une cible à portée : le bouton reste **vif**, et le panneau refuse en le disant. |
| **CARTE-C T12 bis** | PASS | Dézoomé au cran le plus large pour qu'une base de l'Ouvrage hors de portée entre dans le cadre, puis touchée : bouton **présent ET désactivé**, refus affiché. Voir §5. |
| **CARTE-C T13** | PASS | Le second toucher entre toujours dans la cible. |
| **CARTE-C T14** | PASS | Armer le déplacement : le panneau reste ouvert sur son propre message, le bouton est éteint, et un toucher ne le rallume pas. |

**Aucune assertion n'a été retirée ni assouplie.** Deux gardes changent de cible,
et **les deux se resserrent** :

- **« panneau — aucun bouton d'action »** devient **« la liste des boutons est
  close, et trois mots restent interdits »**. Elle perd un mot et gagne trois
  assertions : le libellé doit être dans le balisage et pas dans l'écran, et le
  bouton doit passer par `entrerDansLaCible`.
- **« panneau — il dit ce qu'on sait »** voit sa liste de lignes passer de quatre
  à cinq, **écrite en entier**, et ses valeurs se cherchent désormais **par nom**
  plutôt que par indice — une ligne insérée au milieu décalait trois assertions
  qui n'avaient rien à voir avec elle. Elle gagne en plus « le panneau du joueur
  ne dit pas d'où vient un niveau qu'il n'a pas ».

⚠ **Le faux document gagne `append` et `disabled`.** Il n'avait que
`appendChild`, si bien qu'il ne montait AUCUN panneau — `ouvrirPanneau` pose le
couple libellé/valeur par `append`. C'est un manque du montage, pas du code.

---

## 5. Trois écritures corrigées avant d'être crues

⚠⚠ **`CARTE-C T1 bis` a été ÉCRIT parce que les tests purs ne mordaient pas.**
Retirer l'appel à `traitRogne` dans `dessinerFleche` laissait T1 à T5
**entièrement verts** : ils mesurent la FONCTION, pas le CHEMIN. C'est le proxy
que le dépôt a déjà payé plusieurs fois.

⚠⚠ **Et une seconde falsification a montré que T1 bis ne couvrait que deux bords
sur quatre.** Remplacer `canvas.width, canvas.height` par `Infinity, Infinity`
laissait le test VERT : sur cette graine les trois satellites sont **au-dessus et
à gauche** de la base, donc la flèche ne sort que par les bords zéro, que
`Infinity` ne touche pas. Une assertion de source ferme le trou, et **le fait est
déclaré ici** plutôt que maquillé.

⚠⚠ **`CARTE-C T7` mesurait la mauvaise grandeur.** Sa première écriture comparait
le RAPPORT des deux épaisseurs à celui des pas : mesuré, à `pas = 32` l'épaisseur
exacte vaut 2,56 et l'arrondi rend 3, si bien que le rapport des entiers vaut
**6,67 quand celui des pas vaut 8**. C'est l'arrondi du petit bout, pas un
plafond. Le test asserte désormais chaque cran contre sa valeur exacte, à un
demi-pixel près.

⚠⚠ **`CARTE-C T12 bis` lisait la source, et il mesure maintenant l'écran.** Sa
première écriture asseyait la CONDITION écrite dans `monde.js` ; elle mesure
désormais le bouton peint. Il a fallu pour ça trouver comment amener une cible
hors de portée dans le cadre : **promener la carte jusqu'à elle SORT LA BASE du
cadre, donc le halo cesse d'être peint** — et le halo est la seule fenêtre honnête
sur la vue. On dézoome au cran le plus large, où les deux tiennent ensemble.

⚠ **Un défaut de montage a coûté une mise au point** : `dpr` manquait au retour
d'`ouvrirSurUnSatellite`, donc les coordonnées du second toucher valaient `NaN` —
et `relacher` calculait une case `NaN`, ne trouvait aucun site, et refermait le
panneau **sans rien dire**. Un `undefined` qui traverse une multiplication ne lève
pas.

---

## 6. Dix falsifications, dix chutes

| # | Falsification | Chutes |
|---|---|---|
| C1 | l'appel à `traitRogne` retiré de l'écran | **1** — T1 bis |
| C1 bis | bornes remplacées par `Infinity` | **1** — T1 bis, par la garde de source ajoutée après mesure |
| C2 | l'angle recalculé depuis le segment rogné | **1** — T2 |
| C3 | seule l'arrivée est rognée | **1** — T5 |
| C4 | `null` remplacé par un segment de longueur nulle | **1** — T4 |
| C5 | la ligne d'origine écrite avec un `if` sur le type | **1** — T9 |
| C6 | le bouton apparaît partout | **2** — T11, T12 bis |
| C7 | le bouton n'est jamais éteint | **1** — T12 bis |
| C8 | le bouton court-circuite `entrerDansLaCible` | **2** — la garde des boutons, T10 |
| C9 | `fermerPanneau` ne cache plus le bouton | **1** — T14 |
| C10 | l'épaisseur de la flèche plafonnée | **1** — T7 |

⚠ **Deux ont dû être refaites avant de mordre.** C4 visait d'abord la branche
« parallèle à ce bord-là », qu'aucun montage n'atteint ; reprise sur les deux
vraies sorties, elle mord. C1 visait d'abord les bornes plutôt que l'appel —
voir §5.

---

## 7. Ce que le lot n'a PAS touché

- **`src/sim/`** — pas une ligne. `TYPES_SITE.indexeSur` est **lu**, aucune règle
  de niveau ne change.
- **`traitDeLaFleche`**, **`EPAISSEUR_HALO`**, l'ordre de dessin, le recentrage à
  l'ouverture et le zoom maximum de CARTE-B.
- **`src/render/embleme.js`** et `tools/` — le décalage vers le sud est un autre
  lot.
- **`SAVE_VERSION`** — vérifié plutôt que cru : une géométrie de trait, un libellé
  de fiche et un bouton vivent tous dans l'écran, et rien n'entre dans l'état.
- **`art/`** — d'où `tools/verifier.py` non lancé, et c'était conforme.

---

## 8. Non exécuté, déclaré

⚠ **Rien n'a été vu sur un appareil.** Le dépôt n'a ni jsdom ni navigateur (§3 de
`CLAUDE.md`) ; tout ce qui touche le DOM est ici mesuré par le **faux document**
de `monde.test.js`, qui monte l'écran pour de bon et rejoue de vrais évènements de
pointeur — mais qui n'est pas un navigateur. La géométrie du bouton, sa lisibilité
et la flèche rognée **à l'œil** restent à confronter sur le S25 FE.

---

## 9. Points en suspens

1. **Le panneau reste ouvert pendant le mode de déplacement**, avec le titre
   « Déplacer la base » et un corps vide. Relevé en écrivant `CARTE-C T14`, non
   corrigé : ce n'est pas dans le brief, et c'est peut-être voulu — le panneau
   sert de surface de message au mode. **À trancher.**
2. **Le libellé « la position sur la carte »** est une proposition. La règle est
   `niveauDeLaRangee(position.rangee) ± 1` ; dire « la distance au bord » serait
   plus exact et moins lisible. **Un mot se change seul.**
3. **Le bouton est dans la TÊTE du panneau**, comme le brief le demande — donc
   petit. Ethan avait demandé le contraire sur l'écran de raid (« vraiment en gros
   à droite ») ; si le même geste doit être aussi visible ici, c'est une règle CSS.
