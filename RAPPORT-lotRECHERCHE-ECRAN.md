# RAPPORT — lot RECHERCHE-ÉCRAN

Exécuté le 06/09/2026. Les six retours d'Ethan du 06/09 — points **12** à **17** —
sont livrés.

---

## 0. Ce qui a été produit

| | |
|---|---|
| `package.json` `version` | `0.99.4` → **`0.99.5`** |
| `config.build` | `105` → **`106`** (les deux restent des **chaînes JSON**) |
| `SAVE_VERSION` | **26, inchangé** |
| `npm test` | **1148 pass / 0 fail → 1159 pass / 0 fail** |
| `dist/index.html` | **7 988 857 → 7 993 487 octets** (+4 630) |
| Borne T10 | **inchangée à 9 300 000**, marge **1 306 513 octets, 14,05 %** |
| `python3 tools/verifier.py` | **non lancé, et c'était conforme** — le lot ne touche ni `art/`, ni un outil de la chaîne |

**Coût poste par poste**, mesuré contre un livrable REBÂTI depuis `origin/main`
dans un `git worktree`, jamais estimé :

| poste | delta |
|---|---|
| JavaScript | **+209** |
| feuille | **+4 421** |
| balisage | **+0** |
| images | **+0** |
| audio | **+0** |
| **somme des cinq** | **+4 630**, soit exactement le total |

**296 lignes `data:` avant, 296 après ; 291 URI de part et d'autre.** Aucune
image, aucun son n'entre.

⚠ **LES 4 421 OCTETS DE FEUILLE SONT DES COMMENTAIRES, ET C'EST LE PRIX DU
DÉPÔT.** Le build ne minifie pas la feuille — plusieurs gardes la lisent, dont
celle des classes basculées et `RECH-É T11` — donc chaque paragraphe qui explique
une règle part au joueur. Les lots d'interface précédents ont payé le même prix
(feuille +2 058 au lot CARTE-A, +4 179 au lot ERGONOMIE, +1 623 à RÉPARER-ÉCRAN).

---

## 1. ⚠⚠ LA BASE ANNONCÉE PAR LE BRIEF N'ÉTAIT PLUS LÀ, ET C'ÉTAIT BÉNIN

Le brief pose **1135 pass, 7 987 956 octets, 0.99.2 · build 103**. Mesuré au
départ : **1148 pass, 7 988 857 octets, 0.99.4 · build 105**. Deux lots ont été
mergés entre l'écriture du brief et son exécution — **CARTE-B** (PR #93) et
**CHANTIER-FICHES** (PR #94), tous deux du 06/09.

**Les sept faits dont le lot dépend étaient intacts**, vérifiés un par un avant
d'écrire une ligne :

1. `offense.belier.unite === 12500` et `defense.belier === { unite: 940000, module: 14000000 }` ;
2. `problemesDeLAchat` pousse bien `code: 'pointsInsuffisants'` avec le message
   « il manque … point(s) » ;
3. `lignePourLAchat` compose sa `raison` par `restants.map((p) => p.message).join(' ; ')` ;
4. `ligneDePiece` construit **un seul bloc** `.piece` avec un `.module` imbriqué
   en retrait ;
5. `bloc.classList.toggle('acquise', …)`, `bouton.classList.toggle('acquis', …)`
   et `bouton.disabled = !vue.achetable` sont tous les trois en place ;
6. `#recherche-points` porte `font-size: 11px` dans la feuille ;
7. `src/data/combat.js` ne porte **aucune** phrase de description par pièce.

Signalé plutôt que traité comme un point d'arrêt — même cas que les lots BARÈME
et CHANTIER-FICHES.

⚠ **ET UN HUITIÈME FAIT DU BRIEF EST PÉRIMÉ : LA PALETTE FAIT QUARANTE-ET-UNE
TEINTES, PLUS TRENTE-TROIS.** Son §5 écrit « la palette du dépôt est fermée à
trente-trois teintes » ; elle s'est élargie de huit au lot LIMITES-VIVES (05/09),
pour les frontières de territoire. Sans conséquence ici : **le lot n'en ajoute
aucune**, et n'en emploie que des existantes.

---

## 2. Point 12 — le Pionnier d'offense à 100 points

`src/data/recherche.js`, une ligne : `belier: { unite: 12500 → 100 }`, branche
**offense seulement**.

- **La ligne défense ne bouge pas** — 940 000.
- **Les deux modules ne bougent pas** — 80 000 000 en offense, 14 000 000 en défense.
- **C'est 100, pas 100 000.** La table est en POINTS ; `coutMilli` porte le
  facteur mille, et lui seul. Mesuré : `coutMilli('offense','belier','unite')`
  rend **100 000n**.

⚠ **AUCUNE LIGNE NE SE DÉPLACE.** L'ordre d'affichage suit `Object.keys` et
l'arbitrage du 30/08 le dit libre. Le Bélier est déjà **quatrième**, après les
trois gratuites et avant les Grenadiers à 200 000 : à 100 il y reste, et la table
se lit encore par prix croissants. `RECH-É T1` vérifie les deux — sa place
(indice 3) et la croissance de toute la colonne.

⚠ **CE QUE ÇA CHANGE POUR LE JOUEUR, MESURÉ** : le Pionnier devient la première
pièce payante de l'arbre offensif **par un facteur deux mille** — la suivante,
les Grenadiers, coûte 200 000. Il est désormais atteignable dès les premiers
raids. Aucune autre valeur d'équilibrage n'a été touchée.

---

## 3. Point 13 — le stock de points, en plus gros

`#recherche-points` passe de **11 px** à **15 px**, graisse **600**.

⚠ **LA TAILLE NE SE DEVINE PAS, ELLE SE REPREND.** 15 px est la taille que le
dépôt emploie DÉJÀ pour « le nombre qui compte dans un panneau » —
`#transfert-bilan .recu b`, le montant reçu d'un transfert. La graisse 600 est
celle de `#monde-panneau-prix-cout`, le prix d'un raid. **28 px, la seule taille
plus grande du dépôt, a été mesurée et écartée** : à 28 px, « 2 500 000 000
points » fait plus de trois cents pixels et ne tient pas dans un en-tête qui
porte aussi trois pastilles.

⚠ **ET IL S'ENROULE PLUTÔT QUE DE POUSSER L'ÉCRAN.** `min-width: 0` laisse la
boîte se réduire et le texte passer à la ligne DANS son cadre ; `flex-wrap` sur
l'en-tête est la seconde ceinture. **Le nombre, lui, ne se coupe pas** :
`formaterPoints` groupe à l'espace fine INSÉCABLE (U+202F), donc la seule coupure
possible précède le mot « points ».

**RELEVÉ DANS CHROMIUM, GÉOMÉTRIE DU S25 FE (360 × 780 CSS, dpr 3), AVANT ET
APRÈS, SUR DEUX STOCKS :**

| stock | | en-tête | boîte du compteur | panneau | débordement du panneau |
|---|---|---|---|---|---|
| 250 000 | avant (11 px) | 360 × **31** | 144,8 × 13,0 | 360 × 593 | non |
| 250 000 | après (15 px) | 360 × **31** | 144,8 × **18,0** | 360 × 593 | non |
| 2 500 000 000 | avant | 360 × 31 | 144,8 × 13,0 | 360 × 593 | non |
| 2 500 000 000 | après | 360 × **55** | **344,0** × 18,0 | 360 × 569 | non |

**À 250 000 points, l'en-tête ne coûte pas un pixel de plus** ; au prix le plus
haut de l'arbre, il prend une seconde ligne et rend 24 px au panneau. C'est
exactement « il grandit quand il le faut, et jamais avant ».

⚠ **LE TEXTE, LE FORMATAGE ET LA SOURCE N'ONT PAS CHANGÉ** — `formaterPoints`
reste seul maître du groupement, et la ligne de `peindre` n'a pas bougé d'un
caractère.

---

## 4. Point 14 — « il manque X points » ne s'écrit plus

Le filtre est **dans l'écran** : `lignePourLAchat` écarte désormais les problèmes
de code `pointsInsuffisants` en plus de `dejaAcquise`.

⚠⚠ **`src/sim/recherche.js` N'A PAS UNE LIGNE DE CHANGÉE**, et `RECH-É T4` est le
test qui attrape un lot parti l'y corriger : il exige que le moteur rende encore
le problème ET son message, **par les deux chemins** — `problemesDeLAchat` et
`problemesDeLAchatDUneBase`, ce dernier servant le panneau de la base
supplémentaire.

⚠ **LE FILTRE PORTE SUR LE `code`, JAMAIS SUR LE TEXTE**, et un test le vérifie
de face : il refuse que `src/ui/recherche.js` **cite** le message entre
guillemets, sous quelque forme que ce soit.

⚠ **ET C'EST MON COMMENTAIRE QUI A DÛ CHANGER, PAS LA GARDE.** Le premier jet du
commentaire écrivait la faute en toutes lettres — un `startsWith` avec la chaîne
citée — donc la garde tombait sur ma propre prose. La phrase décrit désormais la
faute sans l'écrire ; c'est le remède que ce dépôt a déjà appliqué à
`FICHE-STYLE.md` pour une teinte écartée.

⚠ **AUCUN `div.raison` VIDE.** Une ligne dont le manque était le seul refus n'a
plus rien à dire : le cadre n'est pas peint du tout. Mesuré à l'écran monté —
**zéro raison vide sur les 62 cadres des deux branches**.

⚠ **LES AUTRES REFUS SURVIVENT TOUS**, et ce sont ceux que la couleur d'un bouton
ne peut pas dire : `effetNonCable` (« Garnison n'a pas encore d'effet en jeu ») et
`uniteNonAcquise` (« la pièce doit être débloquée avant son module »). `RECH-É T5`
les tient.

---

## 5. Point 15 — deux cases, la pièce puis son amélioration

Le module vivait DANS le bloc de sa pièce, décalé de 12 px sous un filet. Il a son
propre cadre, à côté. Le panneau de l'offense passe de **14 à 28 enfants**, celui
de la défense de **17 à 34**.

⚠⚠ **LE MOTIF DU RETRAIT NE DISPARAÎT PAS AVEC LUI.** Le commentaire qu'il portait
disait vrai — « aligné sur elle, il se lirait comme une quinzième pièce » — et le
risque est le même avec deux cadres de même forme. **Il est réécrit**, et il nomme
les TROIS choses qui portent l'appartenance à sa place :

1. la pastille `◈` à la place du sprite ;
2. le titre du module en kaki `#8C9A72` à 10 px, là où celui d'une pièce est
   blanc `#F5F3E8` à 11 px ;
3. **l'écart vertical** — la grille du panneau passe à `gap: 0` et l'écart se pose
   entre cadres VOISINS : **2 px** entre une pièce et SON module, **8 px** entre
   deux pièces. Relevé à l'écran : pièce à y = 147 (h 54,1), module à y = 203,1,
   pièce suivante à y = 277,4.

⚠ **`+` PLUTÔT QU'UN `margin-top` SUR CHACUN** : le premier cadre du panneau ne
gagne aucune marge, et le `padding: 6px` de la grille reste le seul blanc du haut.

⚠ **ET LE MODULE SUIT SA PIÈCE, IL NE SE RANGE PAS EN BLOC À LA FIN.** C'est
l'ORDRE qui apparie les deux cadres maintenant ; un test parcourt les 28 et les 34
cadres deux par deux et exige pièce puis module.

⚠ **UNE PIÈCE SANS MODULE NE FABRIQUE PAS DE CASE VIDE.** Aucune des trente et une
entrées n'est dans ce cas aujourd'hui — la table le dit en toutes lettres —, donc
`cadresDeLaLigne` est PURE et EXPORTÉE pour qu'on puisse lui donner une ligne
forgée. **Et le DOM la lit** : `RECH-É T8` compare les cadres peints à ce qu'elle
rend, ligne par ligne, sans quoi elle ne serait qu'un proxy.

---

## 6. Point 16 — trois codes visuels, et pas un de plus

| état | case | bouton |
|---|---|---|
| **acquis** | normale — fond `#343A2C`, filet gauche kaki `#6A7658` | « Acquis », éteint |
| **non acquis, impossible** | assombrie — fond `#1E2124` | éteint, gris `#68727E` |
| **non acquis, possible** | assombrie — fond `#1E2124` | **cerné et écrit en ambre `#F5B636`** |

**LES TEINTES EMPLOYÉES, ET D'OÙ CHACUNE VIENT — aucune n'est neuve :**

| teinte | rôle ici | d'où elle vient |
|---|---|---|
| `#343A2C` | fond d'une case acquise | le fond de `.piece` de cet écran, inchangé |
| `#6A7658` | filet gauche d'une case acquise | le `.piece.acquise` de cet écran, inchangé |
| `#1E2124` | fond d'une case assombrie | le fond de `.acheter` et de `#recherche-pastilles button`, sur cet écran |
| `#3E454C` | filet gauche d'une case assombrie | le `.piece` de base, inchangé |
| `#F5B636` | bouton achetable | l'ambre de `FICHE-STYLE.md` — déjà l'armé du Chantier, le compteur de cet écran et ses refus |
| `#68727E` | bouton éteint | le `.acheter:disabled`, inchangé |

⚠ **« VIF ET CONTRASTE » EST MESURÉ, PAS AFFIRMÉ.** Contraste WCAG de l'ambre sur
le fond assombri : **8,96**. Celui du gris d'un bouton éteint sur le même fond :
**3,31**. Un facteur **2,7**.

⚠⚠ **L'ÉTAT ARMÉ RESTE DISTINGUABLE, ET C'EST VÉRIFIÉ DE VISU.** Relevé dans
Chromium, sur le bouton du Pionnier :

| | fond | texte | bord | libellé |
|---|---|---|---|---|
| **achetable** | `rgb(30,33,36)` | `rgb(245,182,54)` | `rgb(245,182,54)` | « 100 » |
| **armé** | `rgb(245,182,54)` | `rgb(22,25,20)` | `rgb(245,182,54)` | « Confirmer ? » |

L'achetable est **cerné** d'ambre, l'armé est **rempli** d'ambre — et le libellé
change en plus. Deux discriminants, dont un qui ne dépend pas de la couleur.
Captures : `rapports/RECHERCHE-ECRAN-2-trois-codes.png` et
`rapports/RECHERCHE-ECRAN-3-arme.png`.

⚠ **LA FEUILLE EXCLUT L'ARMÉ DE LA RÈGLE DE L'ACHETABLE PAR `:not(.arme)`**,
plutôt que de compter sur l'ordre des lignes — que personne ne relit. Sans lui,
`#ecran-recherche .piece.achetable .acheter` (1,3,0) l'emporterait sur
`#ecran-recherche .acheter.arme` (1,2,0) et l'armé cesserait d'être rempli.
**Falsification F6ter : la garde tombe.**

⚠ **UNE SEULE CLASSE PAR CADRE, ET C'EST ELLE QUI COMMANDE AUSSI LE BOUTON.** La
feuille descend de la case au bouton plutôt que de poser une seconde classe sur
celui-ci : deux porteurs de la même grandeur finiraient par se contredire, et
`disabled` l'encode déjà.

⚠⚠ **ET CHACUNE DES TROIS CLASSES A SA RÈGLE, GARDÉ ICI ET NON AILLEURS.** La
garde générale de `chantier.test.js` n'extrait que les LITTÉRAUX passés à
`classList` ; celles-ci passent par la table `CLASSE_DE_L_ETAT`, donc elle ne les
voit pas. C'est le défaut livré du lot ÉCRAN-ACTIONS — une classe basculée que
rien ne peint —, et `RECH-É T6` le garde à sa place.

---

## 7. Point 17 — la brève description, et le point dur du lot

⚠⚠ **CE TEXTE N'EXISTE PAS DANS LE DÉPÔT.** `src/data/combat.js` porte des noms,
des nombres et des tables de dégâts ; **aucune phrase par pièce**. Écrire à la
main les quatorze phrases de l'offense et les dix-sept de la défense reviendrait à
trancher seul du CONTENU de jeu, ce que ce dépôt s'interdit.

La description est donc **dérivée**, par une fonction pure et exportée :

```
descriptionDeLaPiece(id) → « <classe visuelle> · <ce qu'elle tue> »
```

⚠⚠ **ET LES DEUX AXES DU BRIEF NE POUVAIENT PAS SERVIR — MESURÉ AVANT D'ÉCRIRE.**
Il donnait `chassis` × `specialite`. **Les NEUF ouvrages de `DEFENSES` ne portent
ni l'un ni l'autre** — vérifié champ par champ, et `RECH-É T9` l'asserte : ils
portent `type` (mur · barrière · tourelle · artillerie) et `cible`. La moitié de
la branche défense n'aurait eu **aucune** description, ce que `RECH-É T10` exige
pour les trente et une. ⚠ Et la liste des spécialités du brief était incomplète
d'une valeur : `UNITES[x].defense.cible` porte aussi `antiAerien`, que les
Grenadiers et le Pionnier prennent en garnison.

⚠⚠ **LES DEUX TABLES DE LIBELLÉS EXISTENT DÉJÀ, ET EN ÉCRIRE DEUX AUTRES AURAIT
ÉTÉ LA SECONDE VÉRITÉ QUE §4 INTERDIT.** `NOMS_CLASSE` et `NOMS_ACCENT` de
`src/render/scene.js` légendent le champ de bataille depuis le lot 3B :

```js
NOMS_CLASSE = { escouade: 'Escouade', blinde: 'Blindé', aeronef: 'Aéronef',
                mur: 'Mur', barriere: 'Barrière', tourelle: 'Tourelle',
                artillerie: 'Artillerie', batiment: 'Bâtiment' }
NOMS_ACCENT = { infanterie: 'anti-infanterie', vehicule: 'anti-véhicule',
                structureOuAviation: 'anti-structure / aérien', aucun: 'ne tue rien' }
```

**ÉCART AU BRIEF, DÉCLARÉ :** il demandait « deux tables de libellés, trois
entrées chacune, rangées dans `src/data/` ». Les écrire aurait mis au dépôt deux
vocabulaires pour la même grandeur, et le premier renommage aurait fait dire deux
choses à la même pièce sur deux écrans. Le lot RÉUTILISE les tables de la scène.
⚠ Elles rendent d'ailleurs **exactement l'exemple du brief** — « Blindé ·
anti-infanterie » — ce qui est le signe qu'on parle bien de la même chose.

⚠ **ET LES DEUX AXES SE MESURENT, ILS NE SE DÉCLARENT PAS.** `classeDe` rend le
châssis d'une unité ET le type d'un ouvrage ; `accentDe` rend la colonne de dégâts
**dominante**, lue dans `degats` ou `degatsFranchissement`. La description dit donc
ce que la pièce FAIT, pas ce qu'une colonne de classeur prétend — c'est ainsi que
la Herse, qui n'a que des dégâts de franchissement, ressort « Barrière ·
anti-véhicule ».

**LES TRENTE ET UNE DESCRIPTIONS PRODUITES :**

| offense | | défense | |
|---|---|---|---|
| Fusiliers | Escouade · anti-infanterie | Fusiliers | Escouade · anti-infanterie |
| Éclaireur | Blindé · anti-infanterie | Merlon | **Mur · ne tue rien** |
| Épervier | Aéronef · anti-véhicule | Casemate | Tourelle · anti-infanterie |
| Pionnier | Blindé · anti-structure / aérien | Chasseur | Blindé · anti-véhicule |
| Grenadiers | Escouade · anti-structure / aérien | Grenadiers | Escouade · anti-structure / aérien |
| Chasseur | Blindé · anti-véhicule | Herse | Barrière · anti-véhicule |
| Foudre | Aéronef · anti-structure / aérien | Éclaireur | Blindé · anti-infanterie |
| Cuirassiers | Escouade · anti-véhicule | Créneau | Tourelle · anti-véhicule |
| Sapeurs | Escouade · anti-structure / aérien | Pionnier | Blindé · anti-structure / aérien |
| Milan | Aéronef · anti-infanterie | Ronce | Barrière · anti-infanterie |
| Obusier | Blindé · anti-structure / aérien | Voltigeurs | Escouade · anti-infanterie |
| Voltigeurs | Escouade · anti-infanterie | Batterie | Tourelle · anti-structure / aérien |
| Percheron | Blindé · anti-véhicule | Cuirassiers | Escouade · anti-véhicule |
| Albatros | Aéronef · anti-structure / aérien | Faucheuse | Artillerie · anti-infanterie |
| | | Mortier | Artillerie · anti-véhicule |
| | | Harpon | Artillerie · anti-structure / aérien |
| | | Percheron | Blindé · anti-véhicule |

⚠ **CE QUI NE TUE RIEN LE DIT AVEC LE MOT DE LA TABLE, jamais avec un vide** — le
Merlon rend « Mur · ne tue rien ».

⚠ **ELLE NE DÉPEND PAS DE LA BRANCHE.** La même pièce se décrit pareil en offense
et en garnison, parce que c'est la même pièce et la même table de dégâts.
`structureOuAviation` est UNE colonne : « anti-structure / aérien » est juste des
deux côtés.

### ⚠⚠ PROPOSITION À ETHAN

**Que ces trente et une descriptions soient un jour écrites de sa main.** Une
phrase dérivée dit une chose vraie et vérifiable ; elle ne dit pas la saveur —
qu'un Percheron encaisse, qu'un Milan harcèle, qu'une Herse ne fait que retarder.
La dérivation **tient la place** en attendant, et le jour où les phrases arriveront
elles entreront dans `src/data/` et `descriptionDeLaPiece` deviendra leur repli.
`RECH-É T9` tombera alors, en disant quoi changer.

### ⚠ « DANS LE BOUTON » SE LIT « SUR LA LIGNE » — LECTURE DÉCLARÉE

Ethan écrit « rajouter brève description unités **dans le bouton** recherche ». Le
bouton porte déjà son prix ou « Acquis », et il fait une soixantaine de pixels de
large. La description va **dans la case de la pièce, sous son nom** — au même
endroit et dans la même forme que la `.description` d'un module, qui existe depuis
le lot RECHERCHE. C'en est une lecture, et elle se défait d'une ligne.

---

## 8. ⚠⚠ UN DÉFAUT ANTÉRIEUR AU LOT A ÉTÉ TROUVÉ ET CORRIGÉ, ET IL RENDAIT CET ÉCRAN ILLISIBLE

**Trouvé en faisant la vérification de visu que le brief exige au §5.** Sur un
livrable bâti depuis `origin/main`, l'écran Recherche est recouvert par **un
sprite géant** — un aéronef peint par-dessus les onglets, le bandeau et la moitié
des lignes. Voir `rapports/RECHERCHE-ECRAN-1-avant.png`.

**LA CAUSE EST ENTIÈRE, ET ELLE EST MESURÉE.** Le lot SPRITES-V2-JOUEUR (05/09) a
sorti la tourelle du fond CSS pour en faire un `<span class="couche-tournante">`
en position **absolue**, dimensionné en **pourcentage** de son premier ancêtre
positionné. Son rapport nomme QUATRE règles de la feuille qui gagnaient
`position: relative` — `.fantome`, `.posable i`, `#offense-palette .unite i` et la
pièce d'une vague. **Il en manquait une cinquième : `#ecran-recherche .sprite`.**
Sans ancêtre positionné, le `<span>` se cale sur `#ecrans` et se dimensionne sur
lui : relevé dans Chromium, les tourelles de cet écran se peignaient de
**153 × 265 à 403 × 699 pixels CSS**.

**Le correctif est une ligne** — `position: relative` sur la règle, avec le même
commentaire-marqueur que les quatre autres. Après : **zéro élément de plus de
60 px portant un fond d'atlas**, et l'écran est lisible
(`rapports/RECHERCHE-ECRAN-2-trois-codes.png`).

⚠⚠ **ET LA GARDE QUI MANQUAIT NE RECOPIE PAS LA LISTE : ELLE L'ADOSSE AU CODE.**
Une liste écrite à la main est **exactement ce qui a échoué**. `RECH-É T11` porte
les six sélecteurs hôtes et exige que leur nombre s'accorde au nombre d'appels de
`poserCouches` dans `src/ui/` — sept aujourd'hui, dont deux partagent une règle.
Un huitième point de pose fait tomber le test et oblige à nommer son hôte
(**falsification F13, elle mord**).

⚠⚠ **ET CETTE GARDE A LU MA PROPRE PROSE AU PREMIER JET — HUITIÈME FOIS DU
DÉPÔT.** Son premier état lisait le bloc CSS brut : retirer `position: relative`
de la règle laissait la suite **ENTIÈREMENT VERTE, 108 pass / 0 fail mesuré**,
parce que le commentaire qui explique la règle NOMME la déclaration pour raconter
le défaut. Elle décommente désormais, et un témoin prouve que le filtre ne mange
pas tout. **Une falsification qui ne mord pas se vérifie avant d'être crue.**

⚠ **ÉCART AU PÉRIMÈTRE, ASSUMÉ.** Le §8 du brief ne nomme pas ce défaut, ni pour
l'inclure ni pour l'exclure. Livrer l'écran de la Recherche en le sachant couvert
d'un sprite géant, après l'avoir VU, aurait été le contraire de « ne jamais
signaler un défaut connu au moment de livrer ». Une ligne de feuille, un test, et
c'est dit ici.

---

## 9. ⚠ UN SECOND FAIT MESURÉ, NON CORRIGÉ, ET DÉCLARÉ

Sur l'écran Recherche, `document.body.scrollWidth` vaut **382** pour un
`clientWidth` de **360** — 22 px de débordement horizontal, dû au rail des trois
panneaux. **Mesuré identique sur le livrable d'AVANT le lot** : ce n'est pas ce
lot-ci qui l'apporte. Le rapport du lot RECHERCHE annonçait pourtant
« `document.body.scrollWidth === clientWidth === 360 » le 30/08 ; quelque chose a
changé depuis, et ce n'est pas ce lot. **Le panneau lui-même ne déborde pas**
(`scrollWidth === clientWidth === 360`), avant comme après. Laissé en l'état, hors
périmètre, et écrit ici pour qu'un lot futur le reprenne.

---

## 10. Les tests

**1148 → 1159.** Onze tests entrent, tous dans `test/recherche.test.js` —
`RECH-É T1` à `T10` que le brief demande, plus `T11` pour le défaut du §8.
**Aucune assertion n'a été retirée ni assouplie.**

### PASS/KO, et le montage effectivement écrit

| test | verdict | montage |
|---|---|---|
| **RECH-É T1** | **PASS** | la valeur, `coutMilli` à 100 000n, la place (indice 3) et la croissance de toute la colonne |
| **RECH-É T2** | **PASS** | les trois autres nombres du Bélier, **plus la SOMME des quatre colonnes de l'arbre** — une valeur déplacée n'importe où la bouge |
| **RECH-É T3** | **PASS** | état à zéro point ; on compte d'abord les refus de points que le MOTEUR produit (≥ 20) pour prouver qu'il y a quelque chose à taire, puis on balaie les 62 raisons ; enfin, zéro `div.raison` vide à l'écran monté |
| **RECH-É T4** | **PASS** | le moteur rend encore le code ET le message, **par ses deux chemins** ; l'écran filtre sur le code ; l'écran ne CITE pas le message |
| **RECH-É T5** | **PASS** | la Garnison de l'Épervier, non câblée, sur une pièce gratuite donc acquise : le refus d'effet s'affiche seul, sans « il manque » |
| **RECH-É T6** | **PASS** | les trois cas dans UN état, prouvés par le moteur avant d'être comparés ; trois signatures `classe|bouton|disabled` deux à deux distinctes ; les trois classes ont une règle ; `:not(.arme)` exigé |
| **RECH-É T7** | **PASS** | Fusiliers acquis, Flashbang non : `acquise` sur la pièce, `bloquee` sur le module ; puis avec les points, le module passe `achetable` et la pièce ne bouge pas |
| **RECH-É T8** | **PASS** | ligne FORGÉE `module: null` → un cadre ; et le DOM compté contre `cadresDeLaLigne` sur les deux branches |
| **RECH-É T9** | **PASS** | Fusiliers et Voltigeurs, même châssis et même spécialité → même phrase ; les neuf ouvrages assertés SANS châssis ni spécialité ; le Merlon sans dégâts ; un identifiant inconnu lève |
| **RECH-É T10** | **PASS** | les 31 lignes portent une description non vide (**présence**, jamais `!== id`) ; et chaque cadre de pièce la porte à l'écran, égale à ce que la fonction rend |
| **RECH-É T11** | **PASS** | six sélecteurs hôtes, tous positionnés, comptés contre les sept appels de `poserCouches` |

### Les gardes existantes qui changent de cible

**Aucune n'est assouplie.** Cinq changent de cible, et chaque changement se
déclare :

1. **`T7` et `T8`** sondaient le facteur mille et l'exactitude BigInt sur « le
   Pionnier à 12 500 points », écrits en clair. Le prix se **demande** désormais à
   la table (`PRIX_BELIER`) ; **le ×1000 reste écrit**, c'est la propriété gardée.
   Un montage qui écrit un prix ne garde que lui-même — même leçon que « un
   montage qui écrit une coordonnée ».
2. **`T15 — les trois panneaux`** comptait 14 enfants par panneau. Il compte
   maintenant **14 pièces ET 14 modules ET 28 cadres** en offense, 17/17/34 en
   défense, **et l'alternance pièce/module** deux par deux. Il s'est RESSERRÉ.
3. **`T15 — ce qui est acquis se dit`** exigeait `/il manque/` sur la ligne de
   l'Albatros. Il exige maintenant **l'ABSENCE de toute raison** sur cette
   ligne — ce que le point 14 demande — et l'assertion sur l'espace fine
   insécable (U+202F) **déménage sur le PRIX du bouton**, seul endroit de la ligne
   où le nombre subsiste. Rien n'est perdu.
4. **`T15 — deux touchers`, `autre bouton`, `en-tête`** portaient le libellé
   « 12 500 ». Le montage passe par la table ; **seul le LIBELLÉ reste écrit**,
   à « 100 », pour qu'une re-tarification se dise d'une ligne au lieu de faire
   tomber le montage entier.
5. **`piecesDuPanneau`** rendait tous les enfants du panneau ; elle rend les
   cadres de PIÈCE, ce qui laisse juste tout indexage par `ids.indexOf(id)`, et
   deux helpers nomment le reste.

### ⚠ TREIZE FALSIFICATIONS, TREIZE CHUTES — et une qui a dû être refaite

Chacune appliquée sur l'arbre FINAL, mesurée, puis défaite.

| # | falsification | ce qui tombe |
|---|---|---|
| F1 | le Pionnier d'offense revient à 12 500 | `RECH-É T1`, `T2`, et trois `T15` |
| F2 | la ligne **défense** du Pionnier bouge aussi | **`RECH-É T2` seul** — le discriminant du brief |
| F3 | le filtre du manque est retiré de l'écran | `RECH-É T3`, `T4`, `T5`, `T15` |
| F4 | le **moteur** cesse de dire le manque | `RECH-É T4`, `T7`, `T9` |
| F5 | le filtre écarte TOUS les problèmes | `RECH-É T4`, `T5`, `T15` |
| F6 | `etatDuCadre` ne rend plus que deux états | `RECH-É T6`, `T7` |
| F6bis | la règle du bouton achetable disparaît | **`RECH-É T6` seul** |
| F6ter | la règle vise le bouton **sans** exclure l'armé | **`RECH-É T6` seul** |
| F7 | l'état de la PIÈCE est porté sur les deux cadres | **`RECH-É T7` seul** |
| F8 | `cadresDeLaLigne` rend toujours deux cadres | **`RECH-É T8` seul** |
| F9 | deux descriptions écrites à la main | **`RECH-É T9` seul** |
| F10 | le cadre de la pièce ne porte pas sa description | **`RECH-É T10` seul** |
| F11 | la vignette perd son `position: relative` | **`RECH-É T11` seul** |
| F12 | le module redevient imbriqué | quatre `RECH-É` et deux `T15` |
| F13 | un huitième point de pose entre sans hôte nommé | **`RECH-É T11` seul** |

⚠ **F11 N'A PAS MORDU AU PREMIER RELEVÉ** — voir le §8. La garde lisait le
commentaire qui explique la règle ; elle décommente désormais, et la
falsification a été **rejouée** avant d'être comptée.

---

## 11. Ce qui n'a PAS été touché

- **`src/sim/recherche.js`** : pas une ligne. Ni le message, ni les arrondis, ni
  les codes de problème. `RECH-É T4` le garde.
- **Les autres coûts de l'arbre** : seul `offense.belier.unite` change, et la
  somme des quatre colonnes le prouve.
- **L'onglet SPÉCIAL** : ses quatre lignes gardent leur forme, leur absence de
  bouton et leur mot. Elles ne portent **aucune** classe d'état — le §8 du brief
  les dit inchangées, et les trois codes d'Ethan parlent d'acquisition, qu'elles
  n'ont pas.
- **`RECHERCHE_EN_CHAINE`, `POINTS_RECHERCHE`, le prorata** : hors sujet.
- **La palette** : **aucune teinte n'entre**, et le lot n'en emploie que six, déjà
  toutes présentes sur cet écran ou dans la fiche.
- **`SAVE_VERSION`** : reste à **26**. Pas un champ n'entre dans l'état — un prix
  de table, une taille de police, une classe d'affichage et une phrase dérivée
  vivent tous hors de la sauvegarde.
- **`ARBRE-RECHERCHE.md`** : non touché. C'est un document de rang 5, le relevé du
  classeur, et ses nombres (38 k / 95 k pour le Pionnier) divergeaient déjà de la
  table avant ce lot ; aucune garde ne les croise. `src/data/recherche.js` fait foi.

---

## 12. Points laissés en suspens, pour Ethan

1. **Les trente et une descriptions de saveur** — §7. La dérivation tient la
   place ; elles restent à écrire de sa main s'il en veut.
2. **Le débordement de 22 px du rail** — §9. Antérieur au lot, non corrigé, à
   reprendre.
3. **Le prix du Pionnier en DÉFENSE reste à 940 000.** Ethan n'a arbitré que
   l'offense ; si l'intention était les deux, c'est une ligne.
4. **Le panneau Spécial ne porte pas les trois codes.** Ses quatre lignes n'ont
   pas de bouton d'acquisition ; leur donner une case assombrie serait cohérent,
   mais le brief les dit inchangées et je ne l'ai pas fait.
