# RAPPORT — lot AMORCE-ET-SIGNATURE

Session du 27/08/2026, nuit. Deux sujets sans rapport l'un avec l'autre, réunis
parce qu'ils bloquent tous deux la même chose : qu'Ethan puisse jouer.

---

## 1. Ce qui a été produit, mesuré

| | Avant | Après |
|---|---|---|
| version · build | 0.18.0 · 18 | **0.18.1 · 19** |
| `npm run check` | 304 pass / 0 fail | **306 pass / 0 fail** |
| `dist/index.html` | 134 019 o | **134 118 o** |
| SHA-256 | `0bdc2913…` | `560fdc03be20c6b1509b14ee…` |
| `audit-maquette.mjs` | vert | **vert** |
| `SAVE_VERSION` | 6 | **6, inchangé** |

`SAVE_VERSION` ne bouge pas : l'amorce ne change aucune forme d'état, elle pose
une valeur dans un champ qui existait déjà. Une sauvegarde v6 se relit sans
migration — et §3.2 montre que c'est vérifié, pas supposé.

---

## 2. L'amorce — 30 quartz, 30 scorie, 20 électricité

`STOCK_DE_DEPART` dans `src/sim/economie-base.js`, servie par `creerEtat`.

**Pourquoi elle existe.** Une base neuve ne produit rien : ni collecteur, ni
centrale. À zéro, le joueur ouvre le jeu sur un écran où aucune action n'est
payable. Le premier collecteur coûte 3 de quartz, la première centrale 3.

**Elle tient sous le plafond** — 50 · 50 · 40, la poche du Chantier au niveau 1.
Un stock initial au-dessus naîtrait **gelé** : le moteur immobilise un excédent
au lieu de le rabattre (arbitré le 26/08), et le joueur verrait un compteur
bloqué dès la première image sans comprendre pourquoi. Un test le vérifie
plutôt que de faire confiance aux trois nombres.

---

## 3. Le défaut que le lot a produit, et comment il s'est vu

### 3.1 L'amorce a d'abord été posée au mauvais endroit

Premier jet : `creerEtatEconomie`. **Huit tests sont tombés**, dont deux sur les
migrations.

`creerEtatEconomie` construit la **forme** d'une économie. Les migrations
repassent par elle. Le joueur aurait donc touché 30 · 30 · 20 **à chaque montée
de version** — une v0 qu'on monte en v6 traverse plusieurs migrations.

Ce n'est pas une attente à repeindre, c'est une erreur de conception. L'amorce
appartient à la **partie neuve**, donc à `creerEtat`, et à elle seule. Déplacée,
il n'est plus resté que trois échecs, tous légitimes.

⚠ **Le réflexe à ne pas avoir** : huit tests rouges après un changement de
trois lignes ressemble à huit attentes à mettre à jour. C'était un seul défaut,
et les deux tests de migration étaient les seuls à le dire.

### 3.2 Les trois attentes restantes ont été RENFORCÉES, pas assouplies

| Test | Ce qu'il disait | Ce qu'il dit maintenant |
|---|---|---|
| une partie neuve ouvre sur la base | stocks à **zéro** | stocks à **30 · 30 · 20**, + l'amorce tient **sous le plafond** |
| une horloge qui RECULE ne produit rien | stocks à **zéro** | stocks **identiques à l'état d'avant** |
| migration 5 → 6, aucune absence | stocks à **zéro** | stocks **identiques à l'état d'avant** |

Les deux derniers comparaient à zéro pour dire « rien n'a bougé ». Zéro n'était
qu'un raccourci qui marchait tant que le jeu commençait à vide. Comparer à
l'état d'avant dit ce que le test voulait dire depuis le début, et le dit mieux :
il tombe maintenant si un rechargement **retire** quelque chose, ce que la
version en zéro ne voyait pas.

---

## 4. Les deux tests ajoutés

| Test | Montage | Résultat |
|---|---|---|
| l'amorce est servie une fois, jamais reservie | partie neuve, rechargement, partie **dépensée** rechargée, `creerEtatEconomie` seule | **PASS** |
| l'amorce paie de quoi démarrer | pose d'un collecteur puis `ameliorer` sur les **prix réels** | **PASS** |

**Ce que le second garde vraiment.** Il ne vérifie pas les nombres 30 · 30 · 20 :
il vérifie qu'une partie neuve peut **payer sa première action**. Si un prix
montait, c'est là que ça se verrait — pas dans une partie livrée injouable.

**Ce que le premier interdit** : le retour du défaut du §3.1 par les deux
chemins qui pourraient le ramener. Une partie dépensée puis rechargée doit
garder ses poches vides ; `creerEtatEconomie` appelée seule doit rendre zéro.

### Falsification — quatre défauts injectés, zéro passé

| Défaut injecté | Tests tombés |
|---|---|
| amorce remise à `{0,0,0}` | 3 |
| amorce portée à 999 (au-dessus du plafond) | 2 |
| amorce servie **aussi** par `creerEtatEconomie` | 6 |
| `ameliorer` ne débite plus | 1 |

Chiffres relevés à l'exécution. Copie restaurée entre deux injections depuis une
archive et **non depuis git** : le HEAD ne porte pas ce lot.

---

## 5. La signature de l'APK

**Le défaut.** `android/app/build.gradle.kts` ne posait de `signingConfig` que
si les secrets `FOYERZERO_KEYSTORE_*` existaient. Sans eux, l'APK release sort
**non signé**, et Android refuse de l'installer. Le job CI passait au vert,
l'artefact arrivait, l'installation échouait — et rien nulle part ne disait
pourquoi.

**Deux remèdes, posés ensemble :**

1. **Repli sur la clé debug.** Sans secrets, `release` est signé avec la clé de
   debug du SDK. Ça ne fait pas un binaire publiable, ça fait un binaire
   **installable**, ce qu'un APK de test doit être.
2. **Le CI refuse un APK non signé.** Un pas qui échoue si le fichier produit
   s'appelle `*unsigned*.apk`, avec un `::error::` explicite. Le job ne peut
   plus livrer un artefact inutilisable en étant vert.

⚠ **LES DEUX CLÉS SONT INCOMPATIBLES.** Passer d'un APK signé debug à un APK
signé release — ou l'inverse — exige de **désinstaller d'abord**. Android
refuse une mise à jour dont la signature a changé, et son message ne dit pas
pourquoi. À retenir le jour où les vrais secrets seront posés.

⚠ **Ce repli ne dispense pas du keystore de release.** Un APK signé debug ne
va pas sur le Play Store. Les quatre secrets restent à créer avant publication.

**Ce qui n'a PAS été vérifié ici, et doit l'être au prochain run :** je n'ai ni
Gradle ni le SDK Android dans ce conteneur. Le gradle a été relu, le YAML validé
par analyseur, mais **le build Android n'a pas été exécuté**. La preuve viendra
du CI ; si le pas « Refuser un APK non signé » échoue, c'est que le repli n'a
pas pris et il faudra créer le keystore.

---

## 6. Fichiers touchés

| Fichier | Ce qui change |
|---|---|
| `src/sim/economie-base.js` | `STOCK_DE_DEPART` |
| `src/sim/state.js` | `creerEtat` sert l'amorce |
| `test/state.test.js` | +2 tests, 3 attentes renforcées |
| `android/app/build.gradle.kts` | repli de signature debug |
| `.github/workflows/ci.yml` | pas de refus d'un APK non signé |
| `CLAUDE.md` | §0 : 306 tests, 134 118 octets ; en-tête 0.18.1 · 19 |
| `package.json` | bump |
| `BRIEF-lotECRAN-ACTIONS.md` | **neuf** — le lot d'écran |

---

## 7. Retour sur les vérifications appareil

**Test 12 — le KO vient probablement de mon protocole, pas du moteur.**

Mesuré : `avancer(état, 5 min)` sur une base neuve avec un collecteur rend
**3 000 ticks et +20 exactement**. Le moteur est bon.

Le plafond d'une base neuve est **50** — la poche du Chantier, le collecteur ne
stocke pas. Or la série imposée dans `TESTS-APPAREIL.md` demande
**12 + 12 + 20 + 20 = 64 unités cumulées**. Le stock sature avant le troisième
test, et un stock saturé se lit exactement comme un rattrapage cassé.

⚠ **Défaut du protocole, à corriger** : effacer les données entre chaque test
économique. Le §3 avertit de ne pas dépasser douze minutes d'attente, mais pas
que la SOMME des quatre tests dépasse la poche.

**À reprendre après ce lot :**

- test 11 — **jamais exécuté**, le plus important des dix, il attend un APK
  installable ;
- test 12 — à refaire depuis un stock bas ;
- tests 18 et 20 — l'élément qu'ils lisent disparaît avec la barre de gauche
  (voir le brief §5), ils sont à réécrire.

---

## 8. Ce qui reste ouvert

1. **Le lot d'écran n'est pas fait** — `BRIEF-lotECRAN-ACTIONS.md` le décrit :
   boutons armés, désélection après pose, barre de gauche retirée, UI centrée,
   toast de saturation, cases distinguées pour le collecteur seul.
2. **RÉPARER n'a pas de moteur.** `REPARATION_BASE_JOUEUR` est une table ;
   aucun bâtiment ne porte de dégâts. Tranché dans le brief §7, pas ici.
3. **Le keystore de release reste à créer**, avec ses quatre secrets.
4. **Rien ne plafonne le niveau d'un bâtiment par celui du Chantier** — reporté
   du lot précédent, toujours non arbitré.
5. **`CLAUDE.md` §5 prescrit encore `LISEZ-MOI-DEPOT.md`** — troisième session
   que ça traîne.
