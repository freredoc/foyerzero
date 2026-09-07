# RAPPORT — lot COMPLEXE

**Le Complexe de défense commande enfin quelque chose.** Il se construisait, se
montait, se payait — et `complexeDeDefense` n'apparaissait dans **aucun** module
de `src/sim/`. Une garnison abîmée le restait pour toujours, sauf pour les pièces
qui portent le module `autoReparation`. Ce lot lui donne la garnison entière,
gratuitement, à l'échéance.

---

## 1. Version, build, sauvegarde

| | |
|---|---|
| `GAME_VERSION` | **0.99.1** (avant : 0.99.0) |
| `GAME_BUILD` | **102** (avant : 101) |
| `SAVE_VERSION` | **26** (avant : 25) |

⚠ **LE BUMP DE VERSION EST UN PATCH, PAS UN MINEUR, ET C'EST DÉLIBÉRÉ.** La
convention du dépôt est un mineur par lot ; 0.99.0 + 1 mineur donne **1.0.0**,
qui se lirait comme un jalon que ce lot ne prétend pas franchir. Le numéro de
build, lui, est le seul que le manifeste de Pages et l'enveloppe Android
comparent, et il avance normalement. **C'est Ethan qui décide quand le jeu passe
en 1.0.**

⚠ **LES DEUX RESTENT DES CHAÎNES DANS `package.json`.**
`android/app/build.gradle.kts` les lit `as String` ; un nombre y ferait tomber le
job Android à la CONFIGURATION, avant le moindre test. La garde de
`donnees.test.js` le vérifie.

---

## 2. `npm run check`, avant et après

| | avant (`origin/main`) | après |
|---|---|---|
| `npm test` | **1 117 pass / 0 fail** | **1 129 pass / 0 fail** |
| `dist/index.html` | **7 982 366 octets** | **7 985 488 octets** |
| références externes | 0 | 0 |
| `data:` inlinés | 296 | 296 |
| borne T10 | 9 300 000 | 9 300 000 (**inchangée**) |
| marge | 1 317 634 o · 14,17 % | **1 314 512 o · 14,13 %** |

**Coût : +3 122 octets**, mesurés poste par poste contre un livrable **rebâti
depuis `origin/main`** dans un `git worktree`, et non estimés :

| poste | avant | après | delta |
|---|---:|---:|---:|
| JavaScript | 344 300 | 347 046 | **+2 746** |
| feuille | 3 177 774 | 3 178 090 | **+316** |
| balisage et reste | 4 457 996 | 4 458 048 | **+52** |
| images | — | — | **+0** |
| audio | — | — | **+0** |

⚠ **AUCUNE IMAGE, AUCUN SON N'ENTRE** — 296 `data:` des deux côtés, comptés sur
les deux livrables.

⚠ **LA BASE DE DÉPART N'ÉTAIT PAS CELLE DU LOT PRÉCÉDENT, ET C'EST BÉNIN.** La
branche a été **repartie de `origin/main`** comme la règle l'exige après un merge
(PR #89 mergée, puis #90 et #91). `main` était donc à **1 117 pass / 7 982 366
octets / 0.99.0 · build 101**, et non aux nombres du rapport RÉSERVE-BASE. **Les
six faits dont ce lot dépend étaient intacts** — voir §3.

---

## 3. Les six faits du §0, vérifiés un par un

| # | Fait | Verdict |
|---|---|---|
| 1 | `complexeDeDefense` n'apparaît dans AUCUN module de `src/sim/` | **INTACT** — `grep -rn` rend zéro occurrence ; il n'est cité que dans `data/base.js`, `data/missions.js`, `data/sites.js` et `ui/chantier.js` |
| 2 | `reparerLaGarnison` de `sim/raid.js` est le module `autoReparation` d'une PIÈCE | **INTACT** — elle filtre sur `nomDuModule('defense', piece.id) !== 'autoReparation'` et rend `AUTO_REPARATION_PCT` des dégâts sur-le-champ |
| 3 | `sim/site-entame.js` porte `reparerLesSites`, `TICKS_REPARATION_BASE`, `TICKS_REPARATION_DEFENSES` | **INTACT** — c'est l'idiome suivi |
| 4 | `facteurMilli` refuse un niveau non entier et au-delà de `NIVEAU.plafond` | **INTACT** — `!Number.isInteger(niveau) \|\| niveau < 1 \|\| niveau > NIVEAU.plafond` |
| 5 | `niveauDeLaDefense` rend une moyenne en dixièmes | **INTACT** — et ce lot ne l'emploie pas |
| 6 | `subirUnRaid` écrit `degatsMilli` sur `laBase.garnison` | **INTACT** — par `reporterSurLesPieces(laBase.garnison, …)` |

---

## 4. La règle, telle qu'elle est codée

```
dépassement = max(0, niveau de la pièce − niveau du Complexe)
santé       = PV restants du Complexe / ses PV maximaux, borné à [0, 1]
durée       = heuresDeBase × facteurMilli(1 + dépassement)/1000 × pénalité(santé)
pénalité(s) = 1 + (heuresAuPlancher / heuresDeBase − 1) × (1 − s)
```

`RETOUR_GARNISON` de `src/data/base.js` : `indexeeSur: 'complexeDeDefense'`,
`heuresDeBase: 1`, `heuresAuPlancher: 24`.

### 4.1 — La pénalité est LINÉAIRE, et c'est un arbitrage qui renverse le brief

Le brief proposait une forme **géométrique**, `(plancher/base) ** (1 − santé)`,
au motif que « tout l'est dans ce jeu » (1,09 · 1,10 · 1,15 · 1,32), et un
plancher à **72 h**. Ethan, 06/09 : **« la courbe choisie est géométrique. je
préfère linéaire. 24h, pas 72h »**.

⚠ **LES DEUX FORMES TOUCHENT EXACTEMENT LES DEUX POINTS ARBITRÉS** — 1 h à pleine
santé, le plancher à 1 PV — **et ne diffèrent qu'entre les deux.** À plancher égal
de 24 h, mesuré : **géométrique 4 h 54 à mi-vie, linéaire 12 h 30.** La linéaire
punit donc beaucoup plus tôt une avarie légère, ce qui est le sens de
l'arbitrage. `RETOUR T3` nomme les deux valeurs et refuse la géométrique de face.

### 4.2 — `facteurMilli` est appelée, pas recopiée

C'est littéralement « la même formule que la croissance des unités de défense ».
L'appeler fait suivre `deuxRegimes`, `niveauBascule` et `plafond` de
`data/niveaux.js` sans qu'une seconde pente existe nulle part.

⚠ **CE QUI DISCRIMINE EST L'ARRONDI AU MILLIÈME, ET IL FALLAIT LE MESURER POUR
POUVOIR L'ASSERTER.** `facteurMilli` rend `Math.round(1000 × pente^n)`, soit
**2 594** pour un dépassement de dix, quand `1,10^10` vaut **2,5937424601** :
**neuf ticks d'écart** sur 93 384. Un test « à 1 % près » n'aurait rien vu.
`RETOUR T2` nomme les deux valeurs ET bascule `NIVEAU.deuxRegimes` pour prouver
que la table commande.

### 4.3 — Par pièce, jamais en agrégat

`facteurMilli` REFUSE un niveau non entier, et `niveauDeLaDefense` rend une
moyenne en dixièmes. La règle est donc par pièce — ce qui est aussi la lecture
juste : c'est la pièce de haut niveau qui paie son dépassement, pas ses voisines.

### 4.4 — Une échéance, pas un débit

`MODELE-REPARATION-1.md` §6 point 5 décrit un débit qui s'accélère à mesure que
le Complexe se répare lui-même. On suit l'**échéance** de `sim/site-entame.js` :
elle ne lit que l'horloge courante, donc mille ticks d'un coup ramènent ce que
mille ticks un par un auraient ramené.

⚠ **CONSÉQUENCE ASSUMÉE ET ÉCRITE AU MODULE : le prorata se FIGE à l'instant du
raid.** Réparer le Complexe ensuite ne raccourcit pas l'attente en cours ; ça ne
sert que pour le raid suivant. C'est ce qui donne une raison de le garder entier
**avant** d'être attaqué. Le §6 point 5 du modèle porte désormais cet écart.

⚠ **ET LE RAID STAMPE SUR-LE-CHAMP, CE QUI N'EST PAS UNE PRÉCAUTION.**
`rattraperJeu` découpe sa fenêtre aux instants des raids et n'appelle
`ramenerLaGarnison` qu'aux **bornes** de ses segments : une pièce abîmée par un
raid y serait stampée au bout du segment **suivant**, des heures plus tard, là où
`tickJeu` la stampe au tick d'après. `subirUnRaid` appelle donc la fonction
lui-même — l'appel est idempotent, donc il ne coûte rien au chemin direct.

### 4.5 — Un second raid pendant l'attente ne remet pas le compteur à zéro

La règle est « on ne stampe que ce qui n'est PAS stampé ». Une pièce déjà en
attente garde son échéance et revient entière, dégâts neufs compris. L'autre
lecture — restamper à chaque raid — rallongerait l'attente à chaque passe et
rendrait la garnison indisponible pour toujours sous des raids rapprochés.
**Une ligne à changer si Ethan tranche autrement.**

---

## 5. Le tableau des durées — mesuré, et confronté au §2 du brief

Le §2 du brief donnait sa table sous la forme **géométrique et 72 h**. La voici
à côté de celle qui est codée, **linéaire et 24 h** :

| dépassement, Complexe entier | brief (géom. 72 h) | **codé** | | Complexe abîmé, dépassement nul | brief (géom. 72 h) | **codé** |
|---|---|---|---|---|---|---|
| +0 | 1 h | **1 h 00** | | 100 % | 1 h | **1 h 00** |
| +5 | 1 h 37 | **1 h 37** | | 75 % | 2 h 55 | **6 h 45** |
| +10 | 2 h 36 | **2 h 36** | | 50 % | 8 h 30 | **12 h 30** |
| +20 | 6 h 44 | **6 h 44** | | 25 % | 24 h 43 | **18 h 15** |
| +30 | 17 h 27 | **17 h 27** | | 1 PV | 72 h | **23 h 59** |

⚠ **LA COLONNE DU DÉPASSEMENT EST IDENTIQUE AU BRIEF, À LA MINUTE** — c'est
`facteurMilli`, que l'arbitrage n'a pas touchée. **Seule la colonne de santé
bouge**, et c'est exactement ce qu'Ethan a demandé.

⚠ **LE CAS MÊLÉ : le brief annonçait 22 h pour « +10 sur un Complexe à mi-vie » ;
mesuré sous la règle codée, c'est 32 h 26** — 2,594 × 12,5 h. Les deux facteurs se
multiplient, et `RETOUR T4` refuse les trois lectures voisines (le max, le
dépassement seul, la somme).

⚠ **ET LA DERNIÈRE LIGNE N'EST PAS 24 h TOUT ROND, PARCE QUE 1 PV N'EST PAS
ZÉRO.** Le plancher exact est atteint à santé nulle ; à 1 PV sur les 2 500 d'un
Complexe de niveau 1, la santé vaut 0,0004 et l'attente **23 h 59 min 27 s** —
trente-trois secondes sous les 24 h, donc « à la minute près » au sens de
`RETOUR T3`. L'écart se resserre à mesure que le Complexe monte de niveau.

### 5.1 — Le calibrage en fin de partie, mesuré

Complexe **entier**, pièce de garnison au niveau N :

| | pièce 10 | pièce 30 | pièce 50 |
|---|---|---|---|
| Complexe 10 | 1,00 h | 6,73 h | **45,26 h** |
| Complexe 20 | 1,00 h | 2,59 h | 17,45 h |
| Complexe 30 | 1,00 h | 1,00 h | 6,73 h |
| Complexe 50 | 1,00 h | 1,00 h | 1,00 h |

Complexe **à 1 PV**, les mêmes :

| | pièce 10 | pièce 30 | pièce 50 |
|---|---|---|---|
| Complexe 10 | 24,00 h | 161,42 h | **1 086,04 h** |
| Complexe 30 | 24,00 h | 24,00 h | 161,44 h |
| Complexe 50 | 24,00 h | 24,00 h | 24,00 h |

⚠ **LE LEVIER EST TRÈS RAIDE AU-DELÀ DE DIX NIVEAUX DE DÉPASSEMENT**, et c'est
tout l'arbitrage « puissance contre disponibilité » du modèle : le QG de défense
autorise des pièces au-dessus du Complexe, et on les paie en indisponibilité.
**Les deux nombres de `RETOUR_GARNISON` sont posés pour être joués et changés ;
rien n'a été compensé, et le calibrage revient à Ethan.**

---

## 6. Les douze tests — montage effectif et verdict

Onze entrent dans `test/reparation.test.js`, un dans `test/chantier.test.js`.
**Aucun fichier de test n'entre.**

| # | Nom | Montage effectif | Verdict |
|---|---|---|---|
| 1 | `RETOUR T1 — une pièce au niveau du Complexe revient en UNE HEURE, pas avant` | Complexe niv. 5 entier, Merlon niv. 5 abîmé de moitié. Un tick pour stamper ; l'échéance vaut exactement `TICKS_PAR_HEURE`. Une heure **moins un tick** : encore à terre. Le dernier pas se fait par `tickJeu` — voir §7. | **PASS** |
| 2 | `RETOUR T2 — le dépassement suit facteurMilli, jamais une pente écrite en dur` | Complexe niv. 1, pièce niv. 11 → 2 h 36. Écart de **9 ticks** avec `1,10^10` écrit en dur, nommé de face. Puis `NIVEAU.deuxRegimes` basculé et rétabli dans un `finally`. | **PASS** |
| 3 | `RETOUR T3 — la pénalité touche ses deux points arbitrés, et elle est LINÉAIRE` | Point 1 : santé pleine → `TICKS_PAR_HEURE` exactement. Point 2 : Complexe à 1 PV — la santé est **mesurée sur l'état**, pas écrite — → 24 h à moins d'une minute. Puis mi-vie → 12 h 30, et la géométrique (4 h 54) refusée. Trois-quarts et un quart vérifiés aussi. | **PASS** |
| 4 | `RETOUR T4 — les deux facteurs se MULTIPLIENT` | 2 h 36 · 12 h 30 · **32 h 26**, et trois refus : le max, le dépassement seul, la somme. | **PASS** |
| 5 | `RETOUR T5 — chaque pièce a SON échéance` | Garnison mêlée niv. 5 / 15 / 25 sous un Complexe niv. 5 : **trois échéances distinctes**, croissantes, et les trois retours joués un par un. | **PASS** |
| 6 | `RETOUR T6 — sans Complexe, la garnison ne revient JAMAIS` | Base sans Complexe, deux pièces abîmées, **100 h** d'avance : `degatsMilli` identique, aucune échéance posée. `retourDeLaPiece` rend `sans-retour`. Puis on POSE le Complexe : le tick suivant stampe. | **PASS** |
| 7 | `RETOUR T7 — le prorata se FIGE à l'instant du raid` | Complexe niv. 20 ramené à **mi-vie**, puis un vrai `subirUnRaid` (niveau 20, celui de `RÉSERVE-BASE T9` — il abîme sans raser). On répare le Complexe : **l'échéance ne bouge pas**. Une pièce abîmée APRÈS reçoit, elle, l'heure du Complexe entier. | **PASS** |
| 8 | `RETOUR T8 — les deux chemins, RAID COMPRIS` | Base montée en rangée 200, trois pièces de garnison, avance jusqu'à la veille du raid, puis 5 minutes par `rattraperJeu` d'un côté et `tickJeu` de l'autre. Garnison identique pièce par pièce, **et sérialisations identiques**. | **PASS** |
| 9 | `RETOUR T9 — le filet stampe ce qui n'est pas stampé` | On `delete` le `retourTick` d'une pièce abîmée : le tick suivant la retrouve. Et une pièce **intacte** ne reçoit rien. | **PASS** |
| 10 | `RETOUR T10 — la migration ne calcule AUCUNE échéance` | Une vraie v25 (champ absent, pièce abîmée) : après migration, `retourTick` est **toujours absent**. Puis on charge, on **change le niveau du Complexe**, on avance : l'échéance suit le Complexe d'aujourd'hui. Une échéance négative fait lever au chargement. Porte la garde `SAVE_VERSION === 26`. | **PASS** |
| 11 | `RETOUR T11 — 1 + dépassement ne sort jamais de NIVEAU` | Pièce au **plafond** (50), Complexe niv. 1 : aucune exception. Un dépassement fabriqué qui franchit la borne LÈVE, avec les deux niveaux dans le message. | **PASS** |
| 12 | `RETOUR T12 — l'avertissement paraît sans Complexe et part avec lui` | `etatDeLaGarnison` sans Complexe → `avertissement: true`, le texte nomme le bâtiment **lu dans la table** et dit « jamais ». On POSE le Complexe → l'avertissement part. Une pièce abîmée fait apparaître « 1 pièce en retour dans … », et `detailDeLaDefense` dit « sans retour » quand il n'y a pas de Complexe. | **PASS** |

⚠ **AUCUN DE CES DOUZE TESTS NE LIT UNE CONSTANTE POUR CONCLURE.** Ils passent
par l'**horloge** et par `degatsMilli` : ce qu'ils mesurent, c'est qu'une pièce
est debout ou à terre à un instant donné.

### 6.1 — Ce que « tomber sur le code précédent » veut dire ici

Les douze ne « tombent pas sur le code d'avant » au sens ordinaire : rejoués
dans un `git worktree` sur `origin/main`, **les deux fichiers refusent de se
charger** — `SyntaxError: The requested module '../src/data/base.js' does not
provide an export named 'RETOUR_GARNISON'`. Ce n'est **pas** la propriété qu'ils
mesurent, et il faut le dire. Ce qui la mesure, ce sont les quinze falsifications
ciblées ci-dessous, jouées sur l'arbre **final**.

---

## 7. Quinze falsifications, quinze chutes — et une qui n'a pas mordu

Chacune appliquée seule sur l'arbre final, puis défaite avant la suivante.

| # | Falsification | Tests tombés |
|---|---|---|
| F1 | la pièce revient tout de suite (`maintenant >= retourTick` → `>= 0`) | T1, T5, T7, T8 |
| F2 | la pente 1,10 écrite en dur au lieu de `facteurMilli` | T2, T4 |
| F3 | la pénalité redevient **géométrique** | T3, T4 |
| F4 | les deux facteurs pris en `max` au lieu du produit | T4 |
| F5 | une seule échéance pour toute la garnison (niveau de la première pièce) | T5 |
| F6 | sans Complexe, on stampe quand même avec un Complexe niv. 1 fictif | T6 |
| F7 | le prorata ne se fige plus : on restampe à chaque tick | T1, T5, T7 |
| F8 | `subirUnRaid` ne stampe plus sur-le-champ | T7, **T8** |
| F9 | le filet est retiré : plus rien n'est jamais stampé | T1, T5, T6, T7, T8, T9, T10, T11 |
| F9 bis | le filet stampe aussi les pièces **intactes** | T8, T9 |
| F10 | la migration pose une échéance (`retourTick = 0`) | T10 |
| F11 | la borne du dépassement n'est plus nommée | T11 |
| F12 | l'avertissement est affiché toujours | T12 |
| F13 | `ramenerLaGarnison` retirée du chemin **analytique** | T1, T5, T6, T7, T9, T10, T11 |
| F14 | `ramenerLaGarnison` retirée du chemin **direct** (`tickJeu`) | **T1** |

### 7.1 — F14 n'a pas mordu au premier relevé, quatorzième fois du dépôt

Retirer l'appel de `tickJeu` laissait la suite **entièrement verte — 43 pass /
0 fail, mesuré**. Deux raisons, et il fallait les deux :

- `RETOUR T1` avançait de bout en bout par `rattraperJeu`, donc ne touchait que
  le chemin analytique ;
- `RETOUR T8` compare les deux chemins sur **cinq minutes**, où **aucune échéance
  ne tombe jamais** — la plus courte vaut une heure. Le stampage, lui, restait
  identique des deux côtés puisque `subirUnRaid` s'en charge.

Le dernier pas de `T1` se fait donc par `tickJeu`, et la falsification mord. **Une
falsification qui ne mord pas se vérifie avant d'être crue.**

### 7.2 — F9 est large, et c'est normal

Retirer le filet retire **le seul site de stampage** du dépôt : plus aucune pièce
ne reçoit d'échéance, donc huit tests tombent. C'est pourquoi **F9 bis** existe :
elle isole la moitié que T9 garde en propre — une pièce intacte ne reçoit rien.

---

## 8. La preuve que `RETOUR T8` porte bien un raid dans sa fenêtre

Sans raid, ce test est vert sur n'importe quel code : hors raid, `rattraperJeu`
avance d'un seul bloc analytique et l'égalité est gratuite. **Deux assertions le
refusent avant de comparer**, et voici ce qu'elles mesurent, relevé sur le
montage exact du test :

```
bases attaquantes : 49 · prochain raid à la minute 6 (courante 5)
raids subis dans la fenêtre : 1 · ticks du combat : 343
garnison après la fenêtre :
  merlon   niv 20 · degatsMilli 11 201 646 · retourTick   398 059   (~10,9 h)
  casemate niv 25 · degatsMilli  7 711 691 · retourTick   639 074   (~17,7 h)
  ronce    niv 30 · degatsMilli 15 862 000 · retourTick 1 026 827   (~28,5 h)
identiques : true
```

⚠ **LA BASE MONTE EN RANGÉE 200, ET SANS ÇA LE TEST NE MESURE RIEN.** À la
rangée 295 — le départ — la garde du peuplement écarte toute base de l'Ouvrage de
quinze cases : `basesAttaquantes` rend une **liste vide** et aucun raid ne peut
tomber. C'est le geste que le témoin de BASES-0 fait déjà, pour la même raison.
La première écriture du test ne le faisait pas et **a échoué sur sa propre
assertion de montage** — elle a fait son travail.

---

## 9. L'état, la sauvegarde, la migration

`retourTick` entre sur chaque pièce de garnison, `null` ou absent quand elle est
intacte. `SAVE_VERSION` passe de 25 à **26**.

⚠ **LE VALIDATEUR N'EXIGE PAS DE CLÉS EXACTES SUR UNE PIÈCE — LU, PAS SUPPOSÉ.**
`problemesDeLEffectif` vérifie des champs nommés ; un champ de plus passe. Il
gagne néanmoins une garde de FORME : **l'absence est légale** — une v25, une pièce
fraîchement posée et une pièce d'armée n'en portent aucune — et ce qui est refusé
est une valeur **présente et malformée**, qui ferait revenir la pièce à un instant
qui n'existe pas.

⚠ **LA MIGRATION NE CALCULE RIEN, ET NE POSE MÊME PAS LE CHAMP.** Une sauvegarde
d'avant ne sait ni quand ses pièces ont été abîmées ni dans quel état était le
Complexe alors. C'est le **filet** qui s'en charge au premier tick, avec le
Complexe **d'aujourd'hui** — `RETOUR T10` le mesure en changeant le niveau du
Complexe entre le chargement et le tick.

⚠ **LA SAUVEGARDE NE GRANDIT QUE POUR CE QUI ATTEND : 22 octets par pièce en
retour**, mesuré (`,"retourTick":39002`), et **zéro** pour tout le reste.

⚠ **LE TÉMOIN DE BASES-0 NE BOUGE PAS D'UN OCTET, ET C'EST MESURÉ ET NON
SUPPOSÉ.** `tailleSauvegarde` s'y prend en phase 6, **avant le premier raid** :
aucune pièce n'y attend, donc aucun `retourTick` n'entre. **Aucun terme ne
s'ajoute à `test/temoins-bases-0.js`**, et les quatre existants sont intacts.

---

## 10. L'écran

**§5.1 — l'avertissement.** `#chantier-garnison`, sous la bande Défense et
**nulle part ailleurs**. Sans Complexe : « Sans Complexe de défense, les pièces
abîmées de la garnison ne reviennent jamais. » Avec : « Complexe de défense
niv. N — garnison intacte. » ou « … — 2 pièces en retour, la première dans
2 h 36. »

⚠ **CE N'EST PAS UN REFUS, C'EST UN ÉTAT** — ni `avis()`, ni `toast()`, ni le
rouge `#8A1E17` des refus : le ton est celui du registre `mode`, `#343A2C` sur
`#F5F3E8`, **deux teintes déjà dans la palette**. Rien n'est refusé, le joueur n'a
rien demandé.

⚠ **ET CE N'EST PAS UNE SEPTIÈME BARRE FIXE** : `flex: 0 0 auto` et `hidden` hors
de la bande Défense, comme `#chantier-reparation`. Le chrome fixe reste à 288 px
et la garde de `chantier.test.js` qui énumère les `flex: 0 0 Npx` ne le voit pas.

**§5.2 — le retour se voit.** `detailDeLaDefense` gagne « · retour dans 2 h 36 »
ou « · abîmée, sans retour ». ⚠ **Un manque s'arrondit vers le HAUT** — le défaut
de `direLaDuree` : annoncer « 2 h » pour 2 h 50 ferait revenir le joueur devant
une pièce encore à terre. C'est l'inverse de la réserve des bâtiments, qui est un
STOCK et s'arrondit vers le bas.

⚠ **LE MARQUEUR D'AVARIE EST L'EXISTANT.** `.abimee` marque déjà les pièces de
garnison depuis le lot RÉPARER-ÉCRAN — pas une ligne à ajouter, pas un second
langage visuel à inventer.

⚠⚠ **LA DÉCISION EST PURE ET EXPORTÉE, LE RENDU NE FAIT QUE RECOPIER.**
`etatDeLaGarnison(etat)` rend `{ avertissement, enAttente, texte }` ;
`ecrireLEtatDeLaGarnison` pose `hidden` et le texte. Sans cette séparation, le
lot n'aurait **aucune** moitié éprouvable — le dépôt n'a ni jsdom ni navigateur
(CLAUDE.md §3) — et `RETOUR T12` n'existerait pas.

⚠ **LE NOM DU BÂTIMENT EST LU, PAS ÉCRIT.** `RETOUR_GARNISON.indexeeSur` le nomme
et `BASE_BATIMENTS` porte son libellé ; `RETOUR T12` compare à la table plutôt
qu'à une chaîne, donc il tombe le jour d'un renommage d'un seul côté.

---

## 11. Ce qui a été corrigé en chemin, et qui n'était pas au brief

⚠⚠ **DEUX COMMENTAIRES DE `ui/chantier.js` MENTAIENT.**

1. Celui du `reparer: null` de la défense créditait `reparerLaGarnison` de
   `sim/raid.js` d'avoir « déjà fait » ce travail « après chaque raid ». Cette
   fonction-là est le module `autoReparation` d'une **pièce** : un pour-cent des
   dégâts, sur-le-champ, aux seules pièces qui le portent. Elle ne connaît pas le
   Complexe, et jusqu'à ce lot le Complexe ne commandait rien. **Le `null` avait
   raison pour une raison qui n'existait pas encore.**
2. Celui du marqueur `.abimee` affirmait que « la garnison se répare toute seule
   et son avarie ne dure qu'une heure ». Elle ne se réparait **pas du tout**, et
   l'heure est désormais le cas le plus **rapide**.

⚠ **`pvMaxDeLaPiece` DÉMÉNAGE DE `raid-ouvrage.js` VERS `reparation.js`.** Deux
fonctions interrogeaient `DEFENSES` puis `UNITES` pour le même nombre ; il n'en
reste qu'une, `pvMaxDeLaPieceDeGarnisonMilli`, et **pas une ligne de son corps
n'a changé**. `raid-ouvrage.js` perd du même geste son import `UNITES, DEFENSES`,
devenu inutile.

---

## 12. Écarts par rapport au brief

1. **La pénalité est linéaire et le plancher vaut 24 h** — arbitrage d'Ethan du
   06/09, qui renverse le §2 du brief. Écart voulu, et c'est le lot.
2. **Le bump de version est un patch (0.99.1), pas un mineur** — voir §1.
   Le brief ne proposait aucun numéro.
3. **Les onze tests moteur entrent dans `test/reparation.test.js`**, pas dans un
   fichier neuf : ils gardent `sim/reparation.js`, et le dépôt garde un fichier
   de test par module. §2 de `CLAUDE.md` n'a donc aucun nom à ajouter.
4. **`RETOUR T8` monte la base en rangée 200**, ce que le brief ne disait pas :
   sans ça, `basesAttaquantes` rend une liste vide et le test ne mesure rien.
5. **Le dernier pas de `RETOUR T1` se fait par `tickJeu`** et non par
   `rattraperJeu` — voir §7.1, c'est une falsification qui l'a exigé.
6. **Une quinzième falsification a été jouée** (F9 bis), le brief en demandant
   douze : F9 est trop large pour isoler T9.

---

## 13. Ce qui reste ouvert de `MODELE-REPARATION-1.md` §6, après ce lot

| # | Point | État |
|---|---|---|
| 1–4, 7 | PV, base du joueur, noms, réserve, barèmes | **clos** avant ce lot |
| 5 | Un Complexe endommagé répare-t-il moins ? | **clos le 24/08** — mais le code s'en écarte désormais **délibérément** : le modèle fait revenir le site entier parce que le débit s'accélère, l'échéance **fige** le prorata. L'écart est écrit au module et au §6 point 5. **À rouvrir si Ethan veut l'accélération.** |
| 6 | Formule du dépassement | **CLOS PAR CE LOT**, par arbitrage et non par mesure — aucune capture ne la montre. Le §6 est rayé et porte la formule. |
| 8 | Le plafond de la quatrième réserve | **toujours ouvert** — deux nombres recopiés de l'armée, sans mesure (lot RÉSERVE-BASE) |
| 9 | L'anomalie du Collecteur | **abandonnée** sur arbitrage du 05/09 |

**Et deux choses que ce lot laisse expressément dehors, nommées :**

- **Le côté Ouvrage.** `TICKS_REPARATION_DEFENSES` reste un seuil fixe. Le §3 du
  modèle dit « joueur comme Ouvrage » ; l'asymétrie est **délibérée et arbitrée
  par Ethan le 05/09**, parce que toucher au retour des défenses ennemies
  rejouerait l'économie du raid entière.
- **`reparerLaGarnison` et son module `autoReparation`** coexistent avec le
  Complexe : le module rend un pour-cent sur-le-champ, le Complexe rend tout à
  l'échéance. **Ils ne sont pas fusionnés**, et l'ordre des deux appels dans
  `subirUnRaid` est écrit à sa ligne — l'échéance se calcule sur les dégâts qui
  RESTENT après l'auto-réparation.

---

## 14. Ce qui n'a pas été lancé, et pourquoi

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/` — **pas un octet d'`art/sprites/` ne change**.

⚠ **AUCUN RELEVÉ SUR APPAREIL.** Le dépôt n'a ni jsdom ni navigateur de test
(CLAUDE.md §3), et un test appareil non exécuté **se déclare non exécuté**. Ce
que l'écran ajoute est une ligne de texte dans le flux, `flex: 0 0 auto`, sans
géométrie neuve — mais **`#chantier-garnison` n'a été vu par personne à l'écran**.
