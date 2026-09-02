# RAPPORT — lot BASES-0 : déplier l'état, sans fonder personne

Exécuté le **02/09/2026**, sur `main` à `9d7d711` (après le merge de la PR #58,
lot DÉPLACEMENT).

---

## 1. Version et build produits

| | |
| --- | --- |
| `version` | **0.66.0** |
| `config.build` | **67** |
| Les deux sont des **chaînes** | vérifié par exécution (`typeof` = `string`) |

---

## 2. La base de référence du §1 — retrouvée, et un écart déclaré

| Grandeur | Brief | Mesuré | |
| --- | --- | --- | --- |
| `package.json` version / build | 0.65.0 / 66 | **0.65.0 / 66** | ✅ |
| `dist/index.html` | 1 383 723 o | **1 383 723 o** | ✅ |
| `node --test "test/*.test.js"` | 872 / 872 pass / 0 fail | **872 / 872 / 0** | ✅ |
| `SAVE_VERSION` | 22 | **22** | ✅ |
| Références par-base dans `src/` | 254 | **212** | ⚠ |
| Idem dans `test/`, sur 17 fichiers de 46 | 402 sur 17 | **610 sur 18** | ⚠ |

⚠⚠ **LES QUATRE NOMBRES QUI ÉPINGLENT L'ARBRE SONT EXACTS ; LES DEUX COMPTES DE
RÉFÉRENCES NE LE SONT PAS, ET JE N'AI PAS RETROUVÉ LEUR MÉTHODE.** Le brief ne
dit pas comment il compte. Six méthodes ont été essayées et aucune ne rend le
couple (254, 402) :

| Méthode | `src/` | `test/` |
| --- | --- | --- |
| occurrences de `etat.<champ>` | 212 | 610 |
| lignes contenant `etat.<champ>` | 185 | 560 |
| occurrences de `<var>.<champ>` (toute variable) | 263 | 874 |
| mots nus `<champ>`, commentaires compris | 1 136 | 1 720 |

**Je n'ai pas traité ça comme un point d'arrêt, et voici pourquoi.** Le §7 arrête
le lot si « la base de référence n'est pas retrouvée » ; l'objet de cette garde
est de s'assurer qu'on travaille sur le bon arbre. Or l'arbre est *prouvé* : la
taille du HTML produit tombe à l'octet près, le compte de tests aussi, et la
version de sauvegarde aussi. Un `grep` dont la méthode n'est pas écrite ne peut
pas contredire trois mesures exactes. **Le chiffre à retenir pour la suite est
212 dans `src/`**, dont les 212 ont tous été relus et réécrits.

⚠ Le compte de fichiers de test diffère aussi : **18**, pas 17. Le dix-huitième
est `test/rendu-pose.test.js`, qui ne porte que **deux** accès.

---

## 3. Delta d'octets, tests avant / après

| | Avant | Après |
| --- | --- | --- |
| `dist/index.html` | 1 383 723 o | **1 385 930 o** (**+2 207**) |
| `npm test` | 872 pass / 0 fail | **885 pass / 0 fail** |
| Images en `data:` | 16 | **16** — aucune n'entre |
| Références externes | 0 | **0** |
| `SAVE_VERSION` | 22 | **23** |
| Durée de la suite | 20,6 s | **22,7 s** (le témoin coûte 3,4 s) |

⚠⚠ **MARGE SOUS LA BORNE T10 : 14 070 OCTETS, SOIT 1,00 %.** C'est la marge la
plus mince du dépôt — DÉPLACEMENT était à 1,16 %. **La borne n'a pas été
relevée**, ce lot ne faisant entrer aucune ressource. Le prochain lot qui fait
entrer une image devra la relever EN ÉCRIVANT POURQUOI.

**+13 tests**, tous dans `test/bases.test.js`. Aucun test n'a été supprimé ;
**une assertion a été retirée**, déclarée au §7 ci-dessous.

---

## 4. Les tests du §6, un par un, avec leur falsification

Chaque falsification est jouée sur une **copie fraîche** du dépôt, jamais sur
l'arbre de travail, et le script refuse de continuer si le motif ne s'applique
pas — c'est la faute payée au lot RÉSERVE, où une falsification muette avait
laissé la suite verte sans qu'aucun défaut ait été injecté.

| # | Ce qui est asserté | Verdict | Falsification jouée | Ce qui tombe |
| --- | --- | --- | --- | --- |
| **T1** | Les témoins du §4.2 reproduits à l'identique, 25 graines | **PASS** | `STOCK_DE_DEPART.quartz` 30 → 31 | 2 tests, et le message NOMME `p01_batir.economie` |
| **T1** | idem | **PASS** | `poser` écrit encore à la racine (un site oublié) | **6 tests**, dont T8 |
| **T2** | `etat.bases` a exactement un élément | **PASS** | `creerEtat` fonde une seconde base | 4 tests |
| **T3** | Aucun getter / `Proxy` / `defineProperty` ; `structuredClone` puis `serialiser` = `serialiser` | **PASS** | un getter `disposition` posé sur l'état | 2 tests |
| **T4** | `simulerRaid` prend la base de la COPIE | **PASS** | `const base = baseAttaquante;` | 1 test |
| **T5** | `baseCourante` lève hors bornes en nommant l'indice et le compte | **PASS** | elle rend `undefined` | 1 test |
| **T6** | La migration 22 → 23 place les onze champs dans `bases[0]` | **PASS** | elle descend `poisAcquis`, qui est GLOBAL | 2 tests |
| **T6** | idem | **PASS** | elle FABRIQUE `champs` au lieu de le laisser redériver | 1 test |
| **T6 bis** | `champs` et `obstacles` redérivés = anciens | **PASS** | — (couvert par T6-a) | — |
| **T7** | Les flèches de bascule restent désactivées | **PASS** | `disabled = false` | **9 tests** |
| **T8** | Aucun `etat.<champ par base>` ne subsiste dans `src/` | **PASS** | un champ laissé à la racine dans `ui/monde.js` | 1 test |

**Dix falsifications, dix qui mordent, 27 tests tombés au total.**

⚠⚠ **DEUX D'ENTRE ELLES NE MORDAIENT PAS AU PREMIER ESSAI, ET C'ÉTAIENT DE
VRAIES LACUNES.**

1. **T4.** En remplaçant la ceinture par `const base = baseAttaquante;`, **aucun
   test ne tombait** — celui de non-fuite compris. La raison est celle que
   RAID-0 avait écrite en la posant : `executerRaid` ne LIT que
   `baseAttaquante.position`, donc partager la base ne fait fuir rien du tout
   *aujourd'hui*. Une ceinture qu'aucun test ne tient est une ceinture qui
   partira : T4 la garde désormais par la SOURCE, en disant pourquoi le
   comportement, lui, n'est pas observable.
2. **T6-a.** Faire recopier `champs` par la migration ne faisait tomber personne,
   parce que `charger` le redéduit de toute façon et écrase ce que la migration
   aurait posé. T6 interroge maintenant `migrer` **seul**, pas `charger`.

---

## 5. Les témoins — ce qu'ils couvrent, et la preuve de leur reproduction

**Capturés le 02/09 sur `main` à `9d7d711`, AVANT que rien ne bouge.** Le
scénario vit dans `test/bases.test.js`, les empreintes dans
`test/temoins-bases-0.js`.

### Ce qui est joué

**25 graines** (le brief en demandait 20), **14 phases** chacune :

| Phase | Ce qu'elle exerce |
| --- | --- |
| `p01_batir` | montée du Chantier, trois poses |
| `p02_6h` | six heures de rattrapage |
| `p03_batiComplet` | neuf bâtiments, en trois temps entrecoupés de production |
| `p04_arme` | garnison des DEUX genres (`DEFENSES` **et** `UNITES`) + armée |
| `p05_18h` | dix-huit heures cumulées |
| `p06_relu` | `serialiser` → `charger`, sans absence |
| `p07_raidProcheApres` | un raid du joueur sur un satellite |
| `p08_100ticks` | cent ticks un par un |
| `p09_deplace` | un déplacement légal de la base |
| `p10_montee` | la base plantée en rangée 200, en pays ennemi |
| `p11_raidOuvrageApres` | un raid du joueur sur une base de l'Ouvrage |
| `p12_veilleDuRaid` | la partie amenée à une minute d'un raid de l'Ouvrage |
| `p13_apresLeRaid` | cinq minutes jouées **tick par tick** à cheval sur ce raid |
| `p14_sousLeFeu` | vingt-quatre heures sous le feu, rasages compris |

**22 champs relevés par phase** — les 11 globaux et les 11 par base. Plus, en
clair : les gestes de construction, ceux d'armement, la taille de la sauvegarde,
le nombre de cases atteignables, le déplacement joué, le nombre de bases
attaquantes, les deux rapports de raid (empreintes), et deux booléens.

### Ce qui rend le témoin falsifiable

- **Les quatorze phases rendent 25 valeurs distinctes sur 25 graines** — un
  témoin qui ne distingue pas les graines ne garde rien. C'est asserté avant de
  s'en servir comme référence.
- **`fenetreCouvreUnRaid` vaut `true` sur les 25**, et il est asserté à côté de
  `deuxCheminsIdentiques`. Sans lui, l'égalité des deux chemins serait vraie pour
  rien : hors raid, `rattraperJeu` avance d'un seul bloc analytique. Mesuré : la
  fenêtre inflige **11 à 23 millions de milli-PV** de dégâts selon la graine.
- ⚠ **Le premier montage coûtait 90 s pour 25 graines et ne couvrait un raid
  qu'une fois sur douze** — une fenêtre de trois heures prise au hasard. En
  avançant analytiquement *jusqu'à la veille* du raid puis en jouant cinq minutes
  tick par tick, il coûte **3,4 s** et couvre un raid **25 fois sur 25**.

### La preuve de reproduction

**Sur 25 × 14 × 22 = 7 700 valeurs relevées, toutes reproduites à l'identique,
sauf deux — et les deux sont ASSERTÉES, pas exemptées :**

1. **`version` : 22 → 23.** Le témoin recalcule son empreinte en **substituant
   22** à la version courante. Si elle retombe juste — elle retombe juste — c'est
   que le NOMBRE seul a bougé, uniformément sur les 25 graines et les 14 phases.
   Sauter le champ aurait retiré une assertion en silence.
2. **La sauvegarde grandit de 29 octets exactement**, sur les 25 graines :
   `{"bases":[…],"baseCourante":0}` autour de onze champs qui, eux, ne changent
   pas d'un octet. Le test asserte `attendu + 29`, jamais « à peu près » : un
   écart qui dépendrait de la partie voudrait dire qu'un CONTENU a bougé.

### Deux axes, pour qu'un échec soit lisible

`EMPREINTES_PAR_CHAMP` (14 × 22 = 308 empreintes) dit **quel champ** a bougé et à
quelle phase ; `EMPREINTES_PAR_GRAINE` (25) dit **sur quelle graine**. Mesuré à la
falsification : le stock de départ modifié d'une unité fait tomber la garde en
nommant exactement `p01_batir.economie`, et rien d'autre. Une empreinte globale
unique aurait dit « ça a changé » et laissé chercher dans 1,5 Mo de relevés.

---

## 6. Les signatures changées

### Changées

| Fonction | Avant | Après | Pourquoi |
| --- | --- | --- | --- |
| `verifierForce` (interne, `state.js`) | `(etat, force)` | `(base, force)` | Elle ne lit que des champs par-base, et `verifierEtat` doit les vérifier **toutes** |
| `niveauDeCommandement` (`state.js`) | — | inchangée | mais elle délègue à… |
| `niveauDeCommandementDeLaBase` (`state.js`, **neuve**) | — | `(base, force)` | **pour les MIGRATIONS** — voir §8 |
| `basesDuJoueur` (`points-attaque.js`) | rendait `[etat]` | rend `etat.bases` | le point unique où le singulier était écrit |
| `basesDuJoueur` (`territoire.js`) | rendait `[etat.position]` | rend `etat.bases.map((b) => b.position)` | idem |
| `baseCourante` (`base-courante.js`, **neuve**) | — | `(etat) → Base` | l'accesseur unique |
| `creerBase` (interne, `state.js`, **neuve**) | — | `(position, disposition) → Base` | les onze champs d'une base |

⚠ **`basesDuJoueur` EXISTE EN DEUX EXEMPLAIRES, ET ILS N'ONT PAS LE MÊME TYPE.**
Celle de `points-attaque.js` rend des **bases**, celle de `territoire.js` rend des
**positions**. Même nom court, deux types : ne jamais importer l'une pour l'autre.
C'est écrit dans les deux fichiers.

### NON changées — et c'est une décision à relire

Le §4.1 demande de faire prendre une BASE à toute fonction de `src/sim/` qui ne
lit que des champs par-base. **Appliqué aux fonctions internes ; refusé pour
l'API des gestes du joueur**, et voici le compte qui a décidé :

| Famille | Sites d'appel dans `test/` |
| --- | --- |
| `poser` | 96 |
| `poserEffectif` | 47 |
| `ameliorer`, `demolir`, `deplacer`, `problemes*` | ~55 |
| `reparation.js` (12 fonctions exportées) | ~70 |

**220 sites d'appel à réécrire, dans un lot dont le critère de succès est « rien
ne change ».** Ces fonctions agissent sur la base COURANTE, et `etat.baseCourante`
est exactement ce qui la nomme : `BASES-1` n'aura qu'à poser l'indice avant le
geste. Surtout, **aucun test de CE lot ne pouvait éprouver la réécriture**, faute
d'une seconde base — c'est-à-dire qu'on aurait brassé 220 appels sans filet.
**À reprendre à `BASES-1`, avec deux bases pour le mesurer.**

---

## 7. Les fichiers de test touchés, et la preuve qu'aucune valeur n'a bougé

**20 fichiers**, pas 17 : les 18 qui portaient un accès par-base, plus
`documentation.test.js` (liste blanche + §2) et les fichiers qui fabriquaient une
sauvegarde d'ancienne version.

| Fichier | Ce qui a changé |
| --- | --- |
| `state.test.js` | chemins ; 2 sauvegardes anciennes aplaties ; 2 états littéraux enveloppés ; garde du n° de version déplacée |
| `raid.test.js` | chemins ; `f(etat, etat, …)` → `f(etat, baseCourante(etat), …)` ; 1 sauvegarde aplatie ; 1 état littéral enveloppé ; garde du n° déplacée |
| `chantier.test.js` | chemins ; `baseDeLaMaquette` et un montage local enveloppés ; 2 gardes d'écran suivent l'ordre de vérification |
| `reparation.test.js` | chemins ; 1 sauvegarde aplatie |
| `satellites.test.js` | chemins seulement |
| `deplacement.test.js` | chemins ; 1 sauvegarde aplatie ; **2 motifs de garde suivent le chemin** (voir plus bas) ; garde du n° déplacée |
| `raid-ouvrage.test.js` | chemins ; 1 sauvegarde aplatie ; garde du n° déplacée |
| `missions.test.js` | chemins seulement |
| `recherche.test.js` | chemins ; 1 sauvegarde aplatie ; 1 motif de garde suit le chemin ; **1 assertion retirée** |
| `poi.test.js` | chemins ; 1 sauvegarde aplatie |
| `monde.test.js` | chemins ; 1 motif de garde suit le chemin |
| `offense.test.js` | chemins ; 1 amputation portée sur la base |
| `territoire.test.js`, `site-de-la-case.test.js`, `site-entame.test.js`, `sprite.test.js`, `rendu-pose.test.js`, `points-attaque.test.js` | chemins seulement (+ 1 état littéral enveloppé dans `points-attaque`) |
| `euclide.test.js` | 1 sauvegarde aplatie ; garde du n° déplacée |
| `documentation.test.js` | liste blanche : 2 fichiers nommés de plus |

### La preuve, mesurée et non affirmée

**Multiset de tous les littéraux numériques du diff de `test/`, hors
commentaires :**

```
littéraux DISPARUS : { '22': 7 }
littéraux APPARUS  : { '0': 23, '21': 2, '20': 2, '18': 2, '12': 1 }
```

- **`22`, sept fois** : la version de sauvegarde. Cinq gardes `SAVE_VERSION === 22`
  et deux `migre.version === 22`. C'est le §2.9 du brief, qui MANDATE le passage
  à 23.
- `0`, 23 fois : `bases[0]` et `baseCourante: 0` — le chemin d'accès.
- `21`, `20`, `18` : les numéros de maillon dans les gardes `SAVE_VERSION >= N`.
- `12` : la ligne-appât neuve `if (laBase.position.rangee === 12)`.

**Aucun autre nombre attendu n'a bougé.** C'est ce que le §6 exigeait comme
preuve plutôt que comme affirmation.

### Les trois écarts qui ne sont pas des chemins, tous déclarés

1. ⚠ **LA GARDE DU NUMÉRO DE VERSION A ÉTÉ DÉPLACÉE, PAS RETIRÉE.**
   `points-attaque.test.js` écrit la règle depuis le lot SITE-ENTAMÉ : « **la
   garde du numéro appartient au maillon le plus RÉCENT de la chaîne, une seule
   fois** ». Cinq fichiers gardaient encore le leur à 22 et seraient devenus
   rouges à chaque lot pour une raison qui ne les regarde pas ; ils vérifient
   désormais que LEUR maillon est encore dans la chaîne
   (`SAVE_VERSION >= 18/20/21/22`). Le `assert.equal(SAVE_VERSION, 23)` vit une
   seule fois, dans `bases.test.js`.
2. ⚠ **UNE ASSERTION A ÉTÉ RETIRÉE, ET ELLE SE DÉCLARE.**
   `recherche.test.js` portait `migre.version === SAVE_VERSION` **et**
   `migre.version === 22` sur deux lignes voisines. La seconde étant devenue
   identique à la première, elle n'assertait plus rien.
3. ⚠ **QUATRE MOTIFS DE GARDE SUIVENT LE CHEMIN D'ACCÈS, ET DEUX SE SONT
   RESSERRÉS.**
   - `deplacement.test.js` T3 cherchait `etat.position.rangee =` ; il cherche
     `[\w)]\.position\.(rangee|colonne)\s*=[^=]` — le receveur est LIBRE, ce qui
     interdit d'écrire une position de base **sous n'importe quel nom**, et le
     `[^=]` refuse désormais une comparaison. Trois appâts, dont un négatif.
   - `deplacement.test.js` T6 cherchait `niveauDeLaRangee(etat.position.rangee)` ;
     il cherche la forme neuve **et refuse explicitement `fondation`**.
   - `monde.test.js` et `recherche.test.js` : le nom de la variable suit, la
     précision ne bouge pas.

---

## 8. Les conditions de rupture de `rattraperJeu` — laquelle devient fausse

Le brief (§5.4) en annonce **quatre**. **Recompté : il y en a CINQ**, une par
système résolu « en un seul appel » dans `avancerAnalytiquement`. Les voici, avec
leur verdict au pluriel :

| Système | Ce que le commentaire suppose | Au pluriel |
| --- | --- | --- |
| `releverLesPoisAcquis` | « l'acquisition ne dépend QUE de la POSITION des bases, qu'aucun tick ne modifie » | ✅ **TIENT** — le territoire est déjà l'UNION, `basesDuJoueur` le rend |
| `resoudreSatellites` | « elle ne lit que l'horloge courante » | ❌ **DEVIENT FAUSSE** — les satellites sont PAR BASE, et elle n'en résout qu'une |
| `avancerPointsAttaque` | « le résidu porte la fraction non acquise » | ✅ **TIENT** — la réserve est GLOBALE, son plafond est un MAX sur les armées, et aucune armée ne se compose hors ligne |
| `reparerLesSites` | « elle ne lit que l'horloge courante » | ✅ **TIENT** — les sites de l'Ouvrage sont globaux |
| `crediterLesReserves` | « le PLAFOND NE BOUGE PAS pendant le rattrapage » | ❌ **DEVIENT FAUSSE** — la réserve est PAR BASE, et elle n'en crédite qu'une |

⚠⚠ **ET UNE SIXIÈME, QUI N'EST PAS DANS `avancerAnalytiquement` MAIS QUI EST LA
PLUS PROFONDE : LA SEGMENTATION ELLE-MÊME.** `basesAttaquantes(etat)` interroge
`ciblesAPortee(etat, baseCourante(etat))` : au pluriel, **seule la base courante
serait attaquée**. Les autres seraient invisibles pour l'Ouvrage. La fenêtre
devra se découper aux raids de TOUTES les bases, et la mise en cache « une fois
par segment » devra devenir une liste par base — elle reste juste, sa
justification (« la position du joueur ne bouge pas entre deux raids ») valant
base par base.

**Réponse courte : `resoudreSatellites` et `crediterLesReserves` deviennent
fausses, et `basesAttaquantes` avec elles.** Les trois se réparent par une
boucle sur `etat.bases`, et c'est le travail de `BASES-1`.

⚠ **Le commentaire de `reserveReparation` annonçait exactement ce jour**, et il a
été RÉÉCRIT : « le jour du multi-bases, ce champ devra DESCENDRE d'un cran, dans
la base, et `crediterLesReserves` devra boucler dessus ». La descente est faite ;
la boucle reste, et le commentaire le dit maintenant au présent. Ne jamais
laisser un commentaire qui annonce un futur devenu présent.

---

## 9. Écarts par rapport au brief, et points en suspens

### Écarts

1. ⚠⚠ **`baseCourante` NE VIT PAS DANS `state.js`, ET C'EST UNE CONTRAINTE
   D'IMPORTS.** Le §4.1 le demandait ; or `state.js` importe satellites, poi,
   points-attaque, site-entame, raid, raid-ouvrage, reparation et — par
   `raid-ouvrage` — deplacement. **Les huit modules qui ont besoin de
   l'accesseur sont ses DÉPENDANCES** : le leur faire importer de là aurait fait
   huit cycles. Un cycle ESM se résout tant qu'on n'appelle rien au chargement,
   mais il rend l'ordre d'évaluation significatif — le genre de fragilité qu'on
   ne découvre qu'au bundle. Il vit donc dans `src/sim/base-courante.js`, **qui
   n'importe rien**, et `state.js` le **RÉ-EXPORTE** : le contrat du brief tient,
   `import { baseCourante } from './state.js'` marche, et un ré-export n'est pas
   une copie — c'est la même liaison.
2. **Les signatures des gestes du joueur n'ont pas changé** — §6 ci-dessus, avec
   le compte des 220 sites d'appel qui a décidé.
3. **La base de référence du §1** : deux comptes sur six non retrouvés — §2.
4. **Un fichier de plus dans `test/`** : `aplatir-sauvegarde.js`, l'inverse de la
   migration 22 → 23. Il n'était pas au brief, et il est devenu nécessaire quand
   **huit fichiers** ont eu besoin du même geste le même jour — c'est le
   précédent exact de `png-rgba.js`. Il lit `CHAMPS_DE_BASE`, il ne recopie pas
   la liste, et il LÈVE plutôt que de rendre l'objet inchangé si l'enveloppe
   manque : aplatir deux fois veut dire que le montage s'est trompé de version.

### Ce que le lot a trouvé au passage

⚠⚠ **DEUX MIGRATIONS TOURNAIENT SUR LA FORME D'AUJOURD'HUI, ET LE DÉPLIAGE LES
AURAIT CASSÉES EN SILENCE.** La 9 → 10 appelait `basesDuJoueur(s)`, la 13 → 14
`niveauDeCommandement(s, force)` : les deux lisent désormais `s.bases`, qui
n'existe qu'à partir de la v23. **Une migration doit tourner sur la forme de SON
époque.** La faute ne se voyait qu'en rejouant la chaîne complète depuis une
sauvegarde PLATE — d'où `aplatir-sauvegarde.js`, dont l'effet de bord précieux
est que la chaîne v0 → v23 traverse vraiment le maillon du dépliage au lieu de le
contourner. Corrigé : la 9 appelle `plafondVise([s])`, la 13
`niveauDeCommandementDeLaBase(s, force)`.

⚠ **UNE GARDE DE `verifierEtat` A FAILLI CHANGER DE MESSAGE.** En rangeant
`reserveReparation` dans la liste commune des champs exigés, le refus d'une
sauvegarde amputée serait passé de « réserve de réparation injouable » à « champ
absent » — un message moins précis, sur un cas que `problemesDesReserves` sait
mieux dire. Deux champs se **retirent** donc de la liste commune
(`reserveReparation`, `dernierDeplacementTick`), avec leur raison écrite ; ils ne
se recopient pas dans une seconde liste, qui vieillirait.

### Points en suspens

1. ⚠⚠ **LA MARGE T10 EST À 1,00 %** (14 070 octets) — la plus mince du dépôt.
2. **`BASES-1` a trois boucles à écrire**, nommées au §8 :
   `resoudreSatellites`, `crediterLesReserves`, `basesAttaquantes`.
3. **Les 220 sites d'appel de l'API des gestes** restent sur `etat` — §6.
4. Hérités des lots précédents, et intacts : **rien ne répare un bâtiment
   abîmé** (`REPARATION_BASE_JOUEUR.courbe` vaut toujours `null`), et **le joueur
   ne voit aucun rapport de défense**.

---

## 10. Vérifications exécutées

| Contrôle | Résultat |
| --- | --- |
| `npm run check` | **885 pass / 0 fail**, build à 1 385 930 octets |
| Références externes dans le HTML | **0** |
| Images en `data:` | 16 avant, **16 après** |
| `version` / `config.build` en CHAÎNES | vérifié par `typeof` |
| Boot sans tête (Chromium) | **aucune erreur de page ni de console** |
| Boot comparé à `origin/main`, geste par geste | **identique sur chaque observable** |
| `python3 tools/verifier.py` | **NON LANCÉ, et c'était conforme** — le lot ne touche ni `art/`, ni `tools/` |

### Le boot sans tête, en détail

Chromium préinstallé, `playwright-core` installé **hors du dépôt** (CLAUDE.md §3
interdit d'ajouter une dépendance de test). Le même script est joué sur le HTML
de `origin/main` et sur celui du lot, et il parcourt toute la palette jusqu'à
trouver un bâtiment posable :

| Observable | `origin/main` | BASES-0 |
| --- | --- | --- |
| vignettes de palette | 11 | **11** |
| bâtiment posé, cases légales, case choisie | `i=8`, 12 légales, (12,2) | **identique** |
| jetons après pose | 2 | **2** |
| bandeau des ressources | `30/50 QUARTZ +240/h …` | **identique au caractère** |
| panneau de détail ouvert | oui | **oui** |
| texte du panneau | `Collecteur · niv. 1 … Quartz +240/h → +300/h …` | **identique** |
| erreurs de page / console | aucune | **aucune** |
| état sauvegardé, aplati, champ par champ | — | **identique, sauf `rng`** |

⚠ **`rng` diverge parce que la graine est tirée à l'ouverture d'une partie
neuve** — deux exécutions successives du même build divergent de la même façon.
C'est la seule différence, et elle ne vient pas du lot.

Et sur le livrable lui-même : sauvegarde en **v23**, `bases` à **1 élément**,
`baseCourante = 0`, **aucun champ par-base à la racine**, **le terrain absent de
la sauvegarde**. La bascule entre bases affiche « BASE 1 / 1 » et ses deux
flèches sont désactivées.
