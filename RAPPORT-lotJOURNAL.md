# RAPPORT — lot JOURNAL

Retour d'Ethan du 07/09, point **14** : « **Défense et offense : rajouter un
bouton rapport, qui permet de voir les 10 dernières attaques et raids subis.** »

**Version produite : `0.99.28` · build `130`.** Les deux restent des **chaînes
JSON** — `android/app/build.gradle.kts` les lit `as String`.

---

## 0. Le compte, d'abord

| Grandeur | Avant | Après |
|---|---|---|
| `npm test` | **1 397 pass / 0 fail** | **1 408 pass / 0 fail** |
| `dist/index.html` | **8 352 389** octets | **8 356 534** octets |
| Références externes | 0 | 0 |
| Lignes `data:` | 297 | 297 |
| URI `data:` | 292 | 292 |
| `SAVE_VERSION` | 28 | **28** |
| version · build | 0.99.27 · 129 | **0.99.28 · 130** |

**Coût +4 145 octets**, mesuré poste par poste contre un livrable **rebâti dans
un `git worktree`** depuis le commit précédent (`b8fd1af`, lot FICHES-ENNEMIES) :

| Poste | Écart |
|---|---|
| JavaScript | **+2 105** |
| feuille | **+1 018** |
| balisage | **+1 022** |
| images | **+0** |
| audio | **+0** |
| **somme des cinq** | **+4 145** |

La somme des cinq postes tombe **exactement** sur le total. Borne T10 **inchangée
à 9 300 000**, marge **943 466 octets, 10,15 %**.

⚠ **LES 1 018 OCTETS DE FEUILLE SONT UNE SEULE RÈGLE ET SON COMMENTAIRE** — celle
des deux boutons, partagée par les deux écrans. **Les deux PANNEAUX n'en coûtent
aucun** : ils portent `panneau-detail`, qui existe depuis le lot
PANNEAU-ET-MARGES.

---

## 1. ⚠⚠ LES TROIS MESURES DU §2, FAITES AVANT D'ÉCRIRE UNE LIGNE

Le brief l'exige : « Le brief ne suppose aucune des trois. Les faire, les
consigner, puis coder. » Elles ont été faites **par exécution**, pas par lecture,
sur l'arbre du lot précédent.

### 1.1 — `subirUnRaid` range-t-il son rapport dans `etat.rapports` ? **OUI.**

```
base montée en rangée 200, disposition[0] au niveau 20, ATTAQUANTE de niveau 20
en (190, 16), subirUnRaid(etat, ATTAQUANTE, 5)

  etat.rapports.length  AVANT 0  →  APRÈS 1
  le rapport rangé est CELUI QUE LA FONCTION REND (même `sens`, même `verdict`)
  il porte son `tick` de jeu, posé par `garderLeRapport`
```

⚠⚠ **C'ÉTAIT LA CONDITION QUE LE BRIEF APPELAIT « LE CŒUR DU LOT » SI ELLE ÉTAIT
FAUSSE : elle est vraie, et depuis le lot RAID-B.** `src/sim/raid-ouvrage.js`
importe `garderLeRapport` de `src/sim/raid.js` et l'appelle **une seule fois**,
ligne 810. Il n'y avait donc rien à brancher — et **ce qui manquait était une
GARDE** : le raid MENÉ était tenu par `RAID-A T9` et `RAID-A T10` depuis le lot
RAID-A, le raid SUBI ne l'était par rien. `JRN T1` le tient désormais, et il
vérifie en plus qu'il n'existe **pas de second chemin** — un seul appel de
`garderLeRapport`, zéro `rapports.push(` à la main.

### 1.2 — Un rapport rangé dit-il de quel côté il vient ? **OUI, `sens`.**

```
même montage + un raid MENÉ dans le même journal

  etat.rapports.map(r => r.sens)  →  ['defense', 'offense']
  valeurs distinctes               →  2
```

`executerRaid` pose `sens: 'offense'`, `subirUnRaid` pose `sens: 'defense'`, tous
deux depuis le lot RAID-B, dont le commentaire écrit le motif : « ne déclarer que
les seconds obligerait tout lecteur à traiter l'absence du champ comme un cas ».
**Rien à ajouter.**

⚠ **ET LES DEUX RAPPORTS N'ONT PAS LES MÊMES CHAMPS**, ce qui est le fait qui
compte pour la vue :

| | rapport de raid **mené** | rapport de raid **subi** |
|---|---|---|
| adversaire | `cible` | `attaquant` |
| bilan | `butin` | `sanction` (`null` sauf rasage) |
| propres | `cout` `rechercheMilli` `unitesEngagees` `unitesAuPlancher` `pointsRestants` `restantSouche` `restantEtai` `reparationInduite` | `minute` `reserveVidee` `autoReparationMilli` `garnisonAuPlancher` `batimentsAuPlancher` |
| communs | `sens` `cause` `ticks` `rase` `restantDefense` `restantBatiments` `verdict` `tick` | idem |

### 1.3 — La borne de dix est-elle partagée ? **OUI, et elle est unique.**

`APRES_RAID.rapportsGardes` vaut **10**, dans `src/data/sites.js`, avec le
commentaire qui s'en inquiète : « un 10 écrit dans `ui/` ferait deux vérités le
jour où Ethan en veut vingt ». **Aucun autre dix ne compte des rapports** —
`garderLeRapport` est le seul à rogner, `verifierEtat` le seul à garder la
longueur au chargement, et la vue **ne rogne pas**. `JRN T11` le mesure en
BOUGEANT la borne à 3 dans un `try/finally` : le rangement ET la vue suivent.

### 1.4 — Une simulation entre-t-elle au journal ? **NON.** (§2 du brief)

```
partie jouable, un rapport déjà rangé, simulerRaid(etat, base, camp)

  etat.rapports.length  AVANT 0  →  APRÈS 0
  la simulation a bien RENDU un rapport (le montage mesure quelque chose)
```

`simulerRaid` travaille sur `structuredClone(etat)` : le journal de la COPIE
reçoit le rapport, celui de l'état réel n'est jamais touché. `RAID-A T9` le
gardait déjà sur l'ÉTAT ; `JRN T4` le garde sur la **VUE**, qui est ce que le
joueur lit.

---

## 2. Ce que le lot a donc réellement écrit

Le rangement, la file, la borne et le champ `sens` existaient tous. **Ce lot
n'ajoute pas une ligne à `src/sim/`.** Il ajoute :

1. **`vueDuJournal`** dans `src/ui/chantier.js` — une fonction PURE qui prend
   `etat.rapports` et le tick courant, et rend une vue au format du rendu
   partagé ;
2. **un bouton et un panneau** sur chacun des deux écrans, dans le balisage ;
3. **une règle de feuille**, à deux sélecteurs, pour les deux boutons ;
4. **le déménagement de `LIBELLE_VERDICT`** et sa quatrième entrée.

---

## 3. ⚠⚠ LE RENDU EST LE RENDU PARTAGÉ, QUATRIÈME LECTEUR

```
$ grep -rn "peindreVueDuPanneau(" src/ --include=*.js | grep -v "export function"
src/ui/raid.js:1392:    peindreVueDuPanneau(doc, elementsFiche, …   ← la fiche d'une cible
src/ui/chantier.js:5101:    peindreVueDuPanneau(doc, {                ← la fiche d'un bâtiment
src/ui/chantier.js:5158:    peindreVueDuPanneau(                      ← le journal des raids
src/ui/offense.js:1115:    peindreVueDuPanneau(                      ← le journal des raids
src/ui/offense.js:1149:    peindreVueDuPanneau(doc, {                ← la fiche d'une unité
```

**Cinq appels, une seule définition.** `FE T6` compte désormais 3 / 2 / 1 par
fichier — la déclaration plus deux appels dans `chantier.js`, deux dans
`offense.js`, un dans `raid.js` — et `ERGO T7 ter` exige deux appels par écran ET
nomme ce que le second peint.

⚠⚠ **LE COMMENTAIRE DU RENDU ANNONÇAIT UN FUTUR DEVENU PRÉSENT, ET CE LOT LE
RÉÉCRIT.** Il disait encore, après FICHES-ENNEMIES : « la troisième n'est pas
encore écrite ». Elle l'était depuis la veille. Il nomme maintenant les QUATRE
lecteurs. C'est le mensonge que §6 de `CLAUDE.md` raconte trois fois, commis par
mon propre lot précédent et corrigé ici.

⚠ **ZÉRO LIGNE DE MISE EN PAGE.** `vueDuJournal` rend des `sections` et des
paires ; le DOM est écrit ailleurs. Une section = un rapport, quatre paires =
deux rangées de deux.

---

## 4. Ce que chaque ligne dit — et le champ qui manque

Rendu réel, relevé par exécution :

```
Journal des raids

  Raid mené · il y a 1.0 h
    Cible              Camp · niv. 12
    Position           r 250 · c 10
    Issue              Victoire
    Butin              12,5k q · 3 400 s

  Raid subi · il y a 2.0 h
    Assaillant         Base de l'Ouvrage · niv. 20
    Position           r 190 · c 16
    Issue              Défaite
    Perdu au rasage    —
```

Les cinq choses que le §4 du brief demande, et d'où elles viennent :

| Ce que le brief demande | Où c'est | Recalculé ? |
|---|---|---|
| subi ou mené | `sens`, en tête de section | non |
| quand | `tick`, en « il y a … » | non — seul le tick COURANT s'ajoute |
| contre qui | `cible` / `attaquant` | non |
| l'issue | `verdict` | non |
| le butin | `butin` / `sanction.perdu` | non |

⚠⚠ **LE CHAMP QUI MANQUE, ET IL EST SIGNALÉ PLUTÔT QUE RECONSTITUÉ : UN RAID SUBI
N'A PAS DE BUTIN, ET SON MIROIR N'EXISTE QUE SI LA BASE A ÉTÉ RASÉE.** Le rapport
de défense ne porte aucun total de ressources perdues ; ce qu'il porte est
`sanction`, qui vaut **`null` tant que la base tient** et qui, au rasage, donne
`{ rangeeAvant, rangeeApres, cases, perdu }`. Une attaque repoussée n'a donc
**aucun chiffre de perte à annoncer**, et la ligne dit « — ». Composer un total
depuis l'état d'aujourd'hui serait très exactement le recalcul que le §4 du brief
interdit — et il serait faux, l'économie ayant tourné depuis.

⚠ **CE QUE LA LIGNE POURRAIT DIRE À LA PLACE, SI ETHAN LE VEUT** : le rapport de
défense porte `restantBatiments` et `restantDefense`, deux pourcentages de ce qui
est resté debout. **Ce n'est pas ce que le brief demande** — il demande « le butin
s'il y en a eu » — donc ils ne sont pas affichés. Une ligne à ajouter, pas une
ligne à corriger.

⚠ **LE NOM DE L'ADVERSAIRE VIENT D'`EMBLEMES_CARTE`**, la table que l'étiquette de
la carte et le titre du panneau de site lisent déjà. En écrire une seconde aurait
donné trois noms au même camp.

---

## 5. ⚠⚠ LA FILE SE LIT À L'ENDROIT, LA VUE S'AFFICHE À L'ENVERS — SUR UNE COPIE

`garderLeRapport` **pousse en queue et jette la tête** : c'est une FILE. Le joueur
veut le plus récent en premier, donc la vue inverse — **`[...liste].reverse()`,
jamais `liste.reverse()`**. Un retournement en place casserait à la fois l'ordre
de la file et la borne.

⚠⚠ **ET `JRN T6` A DÛ ÊTRE CORRIGÉ AVANT D'ÊTRE CRU, LA FALSIFICATION L'A DIT.**
Son premier jet appelait la vue **DEUX fois** avant de comparer : `reverse()` en
place laissait alors le test **entièrement vert — 11 pass / 0 fail mesuré**, parce
que deux retournements s'annulent et rendent la liste dans son ordre d'origine.
**Un nombre IMPAIR d'appels est la seule façon de voir la mutation.** Le test en
fait un, compare, en fait un second, et compare encore.

⚠ **ET LA VUE NE ROGNE PAS.** Elle rend ce que l'état porte ; `garderLeRapport`
borne à l'écriture. Une seconde troncature aurait mis un second dix dans le
dépôt — `JRN T11` refuse tout `slice(` et tout `10` littéral dans le corps de la
vue.

---

## 6. Le bouton, et pourquoi il est posé sur le champ

⚠⚠ **AUCUNE SEPTIÈME BARRE FIXE.** La consigne permanente d'Ethan — « tu
compresses tout dans l'UI » — et sa garde, qui somme les hauteurs fixes des six
barres à **288 px** et refuse au-delà de 320. Le bouton est en `position:
absolute` sur le champ, donc il ne coûte **pas un pixel de hauteur** : c'est le
chemin de `#chantier-bascule-bande`, au coin OPPOSÉ, sous une règle jumelle —
40 px de côté, `#343A2C` sur `#161914`, **aucune teinte neuve**.

⚠ **UNE RÈGLE, DEUX SÉLECTEURS.** `#chantier-journal, #offense-journal` : l'écrire
deux fois aurait donné deux définitions dont une seule aurait suivi le premier
réglage — la faute qu'`ÉD T12` garde déjà pour le pointillé des emplacements.
`JRN T8` exige la règle partagée et refuse toute règle propre à l'un des deux.

⚠ **ET IL COUVRE UNE CASE — RELEVÉ, PAS IGNORÉ.** Comme la bascule en couvre une
autre depuis le lot ÉCRAN-DÉFENSE. C'est le prix d'un contrôle posé sur le champ,
et il est le même des deux côtés.

⚠⚠ **OUVRIR LE JOURNAL FERME LA FICHE, ET C'EST OBLIGATOIRE.** Les deux sont des
`panneau-detail` — même position, même `z-index`, même endroit. Les laisser tous
les deux ouverts en superposerait un sur l'autre, et le second avalerait les
touchers du premier : c'est la faute du lot TUTORIEL, et celle qu'`ÉD T5 bis`
garde déjà pour la ligne d'avis. La falsification qui retire `fermerPanneau()`
fait tomber `JRN T8`.

---

## 7. `LIBELLE_VERDICT` déménage, et gagne son quatrième mot

Il vivait dans `src/ui/raid.js`, où un seul écran lisait un verdict. Le journal en
lit sur **deux écrans qui ne peuvent pas importer `ui/raid.js`** — c'est LUI qui
importe `ui/chantier.js`, donc l'inverse ferait un **cycle**. Il monte donc dans
`ui/chantier.js`, et `ui/raid.js` le prend là. **Pas une ligne de son corps n'a
changé.**

⚠⚠ **ET SON PROPRE COMMENTAIRE ANNONÇAIT LA QUATRIÈME ENTRÉE.** Il écrivait :
« « DÉFAITE » TOUT COURT N'EXISTE PAS ICI : il est réservé à la défense, que ce
lot n'ouvre pas ». Ce lot-ci l'ouvre — `verdictDeLaDefense` de
`sim/raid-ouvrage.js` rend exactement ce mot quand des bâtiments ont été entamés
sans que la base soit rasée. Sans la ligne, le joueur aurait lu **`defaite`**, la
clé interne.

⚠⚠ **ET LA GARDE QUI L'INTERDISAIT SE RESSERRE PLUTÔT QUE DE S'ÉLARGIR.**
`RAID-A T8` exigeait TROIS clés et refusait la valeur « Défaite ». Ce qu'elle
défendait vraiment, c'est qu'un raid **MENÉ** ne rende jamais ce verdict — et elle
le déduisait de l'ABSENCE d'une entrée de table, ce qui est un proxy. Elle le
mesure désormais **sur les trois raids que ce test monte pour de bon**, ce qui
reste vrai quelle que soit la table d'affichage.

---

## 8. ⚠⚠ LE SENS SE LIT DANS UNE TABLE, JAMAIS PAR UN `=== 'defense'`

`SENS_DU_RAPPORT` porte, pour chacun des deux sens : le titre de sa section, le
libellé de l'adversaire, **le CHAMP du rapport qui le contient**, et la fonction
qui compose son bilan. Un sens inconnu **LÈVE**.

⚠⚠ **CE N'EST PAS UNE COQUETTERIE : LA GARDE EXISTANTE A REFUSÉ LE PREMIER JET.**
`chantier.test.js` porte, depuis le lot GARNISON-ET-ARMÉE, `assert.ok(!/===
'defense'/.test(source))` sur TOUT le fichier — « un cas particulier serait le
premier à diverger ». Mon premier jet écrivait `rapport.sens === 'defense'` et
elle est tombée dessus. **Elle avait raison** : le sens du rapport a exactement la
même forme de problème que le terrain d'une bande — deux moitiés du moteur qui
écrivent deux mots — donc il se lit de la même façon.

⚠ **ET CONTOURNER LA GARDE ÉTAIT POSSIBLE ET A ÉTÉ ÉCARTÉ.** Une constante
`const SENS_SUBI = 'defense'` aurait fait taire l'expression sans changer le
code : c'est « passer sous un garde-fou en silence », ce que §6 interdit
nommément pour les hex à trois chiffres et l'espace de noms SVG.

---

## 9. Les tests — PASS/KO et le montage effectivement écrit

**Onze tests entrent, et le compte passe de 1 397 à 1 408.** Ils vivent dans
**`test/journal-raids.test.js`**.

⚠⚠ **CE FICHIER NE S'APPELLE PAS `journal.test.js`, ET LA RAISON A COÛTÉ CHER.**
Ce nom est PRIS depuis le lot JOURNAL-DE-COMBAT : `test/journal.test.js` garde le
journal de TICK, ce que `sim/combat.js` publie pendant un combat. **Ma première
écriture s'appelait `journal.test.js` et a effacé les dix `JOURNAL T*`.** Repéré
en comparant les comptes de tests entre `HEAD` et l'arbre de travail — le total
descendait de dix sans qu'aucun test ne tombe —, restauré au `git checkout`, et
le fichier renommé. **C'est la leçon des homonymes du 27/08, payée une seconde
fois**, et l'en-tête du fichier la porte pour la prochaine fois.

| Code | Verdict | Montage effectivement écrit |
|---|---|---|
| **JRN T1** | **PASS** | Base en rangée 200, Chantier au niveau 20, `subirUnRaid` avec l'attaquante de `raid-ouvrage.test.js`. Le journal passe de 0 à 1 ; le rangé est celui que la fonction rend ; il porte son `tick` ; le combat a bien tourné (`ticks > 0`). **Plus deux assertions de source** : `garderLeRapport` est appelée exactement une fois dans `raid-ouvrage.js`, et rien n'y pousse dans `rapports` à la main. |
| **JRN T2** | **PASS** | Un subi et un mené dans le MÊME journal — un montage à un seul rapport ne prouverait rien. Deux `sens` distincts ; la vue dit « Raid subi » et « Raid mené », « Assaillant » et « Cible », « Butin » et « Perdu au rasage ». **Plus deux assertions écrites après falsification** : la VALEUR de l'adversaire vient du bon champ (« Base de l'Ouvrage · niv. 20 » contre « Camp · niv. 20 », et les deux diffèrent), et un troisième `sens` LÈVE. |
| **JRN T3** | **PASS** | Onze rapports d'âges connus rangés ; il en reste `APRES_RAID.rapportsGardes` ; **c'est le PLUS ANCIEN qui est parti** — une PILE en garderait dix aussi et jetterait le plus récent, donc c'est l'identité de ce qui reste qui discrimine. La file est croissante, et la vue en montre exactement dix. |
| **JRN T4** | **PASS** | Partie jouable, un rapport déjà rangé, `simulerRaid` : le journal ne bouge pas ET **la vue est identique au caractère**. Le montage prouve d'abord que la simulation a rendu quelque chose. Falsifiable en sens inverse : un vrai raid, lui, s'y voit. |
| **JRN T5** | **PASS** | Trois rapports poussés aux ticks 0, 36 000 et 72 000. La vue rend les niveaux `[3, 2, 1]` — le plus récent d'abord — et les âges « il y a 0 s », « 1.0 h », « 2.0 h ». **Plus un quatrième âge écrit après falsification** : 595 ticks font 59,5 s, « 59 s » vers le bas et « 60 s » vers le haut ; les trois premiers tombaient RONDS et ne mesuraient pas l'arrondi. |
| **JRN T6** | **PASS** | Quatre rapports, sérialisation avant, **UN** appel de la vue, comparaison, un second appel, comparaison encore. Puis sept rangements de plus : la file tombe encore juste. Le nombre impair d'appels est ce qui rend un `reverse()` en place visible. |
| **JRN T7** | **PASS** | `vueDuJournal([], 0)` rend exactement UNE section, dont le titre EST la phrase, avec zéro ligne. La phrase est une phrase — plus de vingt caractères, un point final —, pas un tiret. Et `undefined` vaut la liste vide : une sauvegarde d'avant le champ ne fait pas tomber l'écran. |
| **JRN T8** | **PASS** | Une déclaration, deux appels, **déclaration retirée avant le comptage** (la leçon d'`ERGO T7 ter`) ; l'Offense IMPORTE la vue et ne la recopie pas ; les deux peignent par le rendu partagé ; les deux **ferment la fiche** avant d'ouvrir ; le balisage porte les dix identifiants ; **une règle à deux sélecteurs** et **aucune règle propre** à un bouton ou à un panneau. |
| **JRN T9** | **PASS** | Un VRAI raid rangé, puis l'état change de tout ce qui pourrait servir à le recomposer — Chantier au niveau 40, quartz à 999 999, scorie à 1, points d'attaque à 1 — et la vue est **identique au caractère**. Le montage prouve d'abord qu'il porte un butin non nul, sans quoi « le nombre n'a pas bougé » serait vrai de deux zéros. |
| **JRN T10** | **PASS** | `SAVE_VERSION === 28`. Un journal à deux entrées, `serialiser` puis `charger` : il ressort entier, avec ses deux `sens`, et **la vue relue est la même**. Plus une assertion de forme : les clés d'un état neuf n'ont pas changé. |
| **JRN T11** | **PASS** | La borne est BOUGÉE à 3 dans un `try/finally`, et le rangement comme la vue suivent ; la borne est rendue à la fin, et le test le vérifie. Plus : le corps de la vue ne porte ni `slice(` ni `10`, et le vocabulaire des verdicts est celui du moteur. |

**Aucune assertion n'a été retirée ni assouplie.** **Quatre gardes changent de
cible et les QUATRE se RESSERRENT** — `ERGO T7 ter` (un appel → deux appels
NOMMÉS), `FE T6` (les comptes par fichier se détaillent), `RAID-A T8` (trois
verdicts déduits → quatre verdicts et la propriété mesurée sur les raids réels),
et la liste d'identifiants du faux document de `offense.test.js`, qui gagne les
cinq du journal.

---

## 10. ⚠⚠ VINGT FALSIFICATIONS, VINGT CHUTES — ET TROIS ONT FAIT ÉCRIRE DU TEST

Chacune appliquée sur l'arbre FINAL, la suite relancée sur cinq fichiers, puis
l'arbre restauré.

| # | Falsification | Ce qui tombe |
|---|---|---|
| J1 | le raid subi ne range plus son rapport | `JRN T1`, `JRN T2`, `JRN T10` |
| J2 | le raid subi se déclare « offense » | `JRN T2`, `JRN T10` |
| J3 | le journal devient une PILE (`unshift`) | **six tests** |
| J4 | la simulation range dans l'état réel | **quatre fichiers** |
| J5 | la vue n'inverse plus | `JRN T5` |
| J6 | la vue retourne la liste EN PLACE | `JRN T6` **(après correction du test)** |
| J7 | un journal vide rend une vue blanche | `JRN T7` |
| J8 | la vue est recopiée dans l'Offense | **cinq tests** |
| J9 | le butin ne se dit plus | `JRN T9` |
| J10 | `SAVE_VERSION` bouge | **quatre tests** |
| J11 | la borne est écrite en dur dans le rangement | `JRN T11` |
| J12 | la table perd son quatrième verdict | `JRN T11`, `RAID-A T8` |
| J13 | un sens inconnu passe en silence | `JRN T2` **(après correction du test)** |
| J14 | le journal n'est branché QUE sur le Chantier | `JRN T8`, `ERGO T7 ter`, `FE T6` |
| J15 | les deux boutons ont chacun leur règle | `JRN T8` |
| J16 | le panneau du journal gagne sa propre règle | `JRN T8` |
| J17 | ouvrir le journal ne ferme plus la fiche | `JRN T8` |
| J18 | l'âge s'arrondit vers le haut | `JRN T5` **(après correction du test)** |
| J19 | la vue rogne une seconde fois à dix | `JRN T11` |
| J20 | l'adversaire se lit toujours dans `cible` | `JRN T2` **(après correction du test)** |

⚠⚠ **TROIS N'ONT PAS MORDU AU PREMIER RELEVÉ — J6, J18 ET J20 — ET LES TROIS ONT
FAIT CORRIGER UN MONTAGE APRÈS LA MESURE.**

- **J6** : la vue appelée DEUX fois, deux retournements s'annulent. **Le montage
  faisait exactement ça.** Corrigé en un nombre impair d'appels.
- **J18** : les trois âges du montage tombaient RONDS — 0 s, 1 h, 2 h — où
  `Math.floor` et `Math.ceil` rendent le même mot. **Un montage qui tombe rond ne
  mesure pas un arrondi**, quatrième fois du dépôt. Un quatrième âge à 59,5 s
  entre.
- **J20** : le LIBELLÉ vient de la table, donc « Assaillant » s'affichait
  toujours — au-dessus d'un « — · niv. 0 », le champ `cible` n'existant pas sur
  un rapport de défense. **C'est la VALEUR qui discrimine**, et elle est mesurée
  désormais.

J13 avait été anticipée : l'assertion de levée a été écrite en même temps que la
garde, parce que rien d'autre ne mesurait un `sens` inconnu.

---

## 11. Ce que le lot ne touche pas — vérifié plutôt que cru

⚠ **`src/sim/` N'A PAS UNE LIGNE DE CHANGÉE.** `git diff --stat -- src/sim/` rend
le vide. Le rangement, la file, la borne et le champ `sens` étaient tous là.

⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 28 — VÉRIFIÉ AU DIFF.** Le brief
prévenait : « si le lot se surprend à vouloir une migration, c'est qu'il ajoute un
champ dont il faut d'abord justifier l'absence d'alternative ». Aucun champ
n'entre : la vue est une lecture, et `JRN T10` fait le tour du disque pour le
prouver.

⚠ **`verifierEtat` N'A PAS UNE LIGNE DE CHANGÉE**, et il ne gagne aucune
vérification de contenu — l'interdit du §6 du brief.

⚠ **`APRES_RAID.rapportsGardes` VAUT TOUJOURS 10.**

⚠ **LE PANNEAU DE FIN DE RAID NE CHANGE PAS.** `lignesDuResultat` n'a qu'un
changement : l'import de `LIBELLE_VERDICT`, qui vient d'ailleurs.

⚠ **AUCUNE TEINTE NEUVE.** La palette reste à quarante-et-une.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne.

---

## 12. Écarts au brief, déclarés

⚠⚠ **LA BASE ANNONCÉE PAR LE BRIEF N'ÉTAIT PLUS LÀ, ET L'ÉCART EST DE MON FAIT.**
Il pose **1 340 pass, 8 256 764 octets, 0.99.23 · build 124** ; mesuré au départ,
**1 397 pass, 8 352 389 octets, 0.99.27 · build 129**. Les quatre briefs ont été
livrés ensemble et exécutés dans l'ordre : **DÉPLACEMENT-ÉCLAIRÉ, RETOUCHES et
FICHES-ENNEMIES sont passés avant celui-ci, sur la même branche.** Les faits dont
ce lot dépend ont été vérifiés un par un et étaient intacts : `garderLeRapport` et
sa file, `APRES_RAID.rapportsGardes`, le champ `sens` des deux côtés,
`simulerRaid` sur copie, et le rendu partagé.

⚠⚠ **`vueDuJournal` N'EST PAS DANS UN MODULE À ELLE — ÉCART DÉCLARÉ, ET IL EST
MESURÉ.** Un `src/ui/journal.js` était le premier réflexe. Il aurait eu besoin de
`formaterEntier`, `direLaDuree` et du rendu partagé : les trois vivent dans
`ui/chantier.js`, qui devrait alors importer le module en retour — **un cycle**.
L'éviter demandait de déménager `formaterEntier`, `grouperLesChiffres` et
`SEPARATEUR_MILLIERS` vers `render/nombre.js`, soit six sites d'import touchés
pour un bouton. La fonction vit donc là où vivent déjà le rendu partagé et les
formateurs, et `JRN T8` garde ce qui compte : **une seule vue, deux appelants**.

⚠ **`test/journal-raids.test.js` PLUTÔT QUE `journal.test.js`** — voir le §9. Le
nom est pris.

⚠ **LE POINT DÉCIMAL DE L'ÂGE EST UN POINT, PAS UNE VIRGULE** — « il y a 1.0 h ».
`direLaDuree` écrit `toFixed(1)`, et elle est PARTAGÉE avec la réserve de
réparation : le lot FICHE-JUSTE a déjà déclaré ce point-là, et le corriger dans le
journal seul ferait diverger deux affichages de la même grandeur. **Relevé, non
corrigé**, et le test l'écrit noir sur blanc.

---

## 13. Points en suspens — Ethan tranche

⚠⚠ **LE JOURNAL N'EST PAS SUR L'ÉCRAN DE LA CARTE NI SUR CELUI DU RAID.** Ethan a
nommé « Défense et offense », et c'est là qu'il est. La carte est pourtant
l'endroit d'où l'on décide d'attaquer, et le journal y aurait sa place. **Deux
lignes par écran.**

⚠ **LE BOUTON EST UN GLYPHE, PAS UN MOT.** « ▤ » dans un carré de 40 px, avec
`title` et `aria-label`. Un mot — « Rapports » — demanderait un bouton plus large,
donc plus de champ couvert. **À changer si le glyphe ne se lit pas.**

⚠ **LE JOURNAL NE SE REPEINT PAS PENDANT QU'IL EST OUVERT**, et c'est exact
aujourd'hui : un rapport n'entre qu'à la RÉSOLUTION d'un raid, et les deux chemins
qui en résolvent un — le bouton Attaquer et le rattrapage au retour — passent par
un autre écran. Le jour où un raid pourra se résoudre pendant qu'on regarde le
Chantier, il faudra le rafraîchir.

⚠ **UN RAID SUBI NON RASANT NE DIT AUCUN CHIFFRE DE PERTE** — voir le §4. Les deux
pourcentages du rapport (`restantBatiments`, `restantDefense`) sont disponibles et
non affichés, le brief demandant « le butin ».

⚠ **LE RENDU N'A PAS ÉTÉ VU SUR APPAREIL, ET SE DÉCLARE NON EXÉCUTÉ.** Il a été
relevé dans Chromium (§14) ; ce n'est pas le téléphone d'Ethan (`CLAUDE.md` §3).

---

## 14. ⚠⚠ RELEVÉ DANS CHROMIUM, GÉOMÉTRIE DU S25 FE, SUR UNE VRAIE PARTIE

Livrable servi en `http://localhost` — le `localStorage` demande une origine —,
viewport 360 × 780, `deviceScaleFactor` 3, contacts dispatchés par CDP
`Input.dispatchTouchEvent`. **Parcours joué** : partie chargée → journal du
Chantier ouvert **vide** → fermé → carte → camp attaqué pour de bon → retour à
l'armée → journal de l'**Offense** → retour à la Base → journal du **Chantier**.

**Le bouton**, identique des deux côtés :

| | Chantier | Offense |
|---|---|---|
| boîte | **314, 116, 40 × 40** | **314, 154, 40 × 40** |
| glyphe | **▤** | **▤** |
| fond | `rgb(52, 58, 44)` = **`#343A2C`** | idem |
| `elementFromPoint` en son centre | **`BUTTON#chantier-journal`** | **`BUTTON#offense-journal`** |

La dernière ligne est celle qui compte : le bouton **reçoit** le toucher, il n'est
pas couvert par la grille ni par un calque.

**Le journal VIDE**, au premier chargement : panneau **360 × 67**, titre « Journal
des raids », **une section dont le titre EST la phrase** — « Aucun raid mené ni
subi pour l'instant. » — et **zéro ligne**. « Fermer » referme pour de bon
(`hidden` repasse à vrai).

**Le journal PLEIN**, après un vrai raid mené sur le camp :

```
  Journal des raids                       panneau 360 × 97
  Raid mené · il y a 4 s
    Cible            Camp · niv. 20
    Position         r 294 · c 15
    Issue            Défaite totale
    Butin            —
```

— **une `.paires`, quatre lignes sur DEUX rangées** (le couple libellé/valeur
côte à côte du lot ÉCRAN-DÉFENSE), **zéro flèche**, **un seul bouton, « Fermer »**,
**débordement horizontal 0** dans le panneau **et** sur la page entière, **zéro
erreur de page** sur tout le trajet.

⚠⚠ **ET LES DEUX ÉCRANS RENDENT LE MÊME JOURNAL, MESURÉ À L'ÉCRAN** : les quatre
mêmes lignes, le même titre de section, à la seconde d'âge près — « il y a 3 s »
sur l'Offense, « il y a 4 s » sur le Chantier une seconde plus tard. C'est la
preuve, au runtime, de ce que `JRN T8` mesure dans la source.
