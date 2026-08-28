# RAPPORT — lot GARNISON-ET-ARMÉE

Exécuté le 28/08/2026. Branche `claude/arbitrage-ethan-construction-costs-b1kavh`.

Tous les nombres de ce rapport ont été obtenus **par exécution**, jamais estimés.

---

## 0. La base de départ ne correspondait pas au brief, et il a fallu le dire

Le §0 du brief donne quatre nombres et ordonne de **s'arrêter** s'ils ne se
retrouvent pas. Mesurés au démarrage, sur le dépôt tel qu'il était :

| Grandeur | Brief §0 | Mesuré | |
|---|---|---|---|
| `package.json` | 0.24.0 · build 25 | **0.25.0 · build 26** | ✗ |
| `npm test` | 338 pass | **349 pass / 0 fail** | ✗ |
| `dist/index.html` | 161 583 octets | **167 308 octets** | ✗ |
| `SAVE_VERSION` | 6 | **6** | ✓ |

La dérive est **purement additive** : c'est le lot TUTORIEL, arrivé après
l'écriture du brief. Les prémisses structurelles ont été vérifiées une par une
avant de reprendre — `garnison` et `armee` absents de `state.js`,
`niveau-de-base.js` à deux exports, `offense.js` encore coquille,
`CONTEXTES[x].chiffre`, `POINTS_ARMEE` nommant les deux bâtiments : toutes
intactes. L'écart a été signalé et Ethan a dit de continuer.

**Écart de périmètre décidé au même moment.** Le §2.4 du brief excluait « le coût
de construction d'une unité ou d'une défense », au motif « non arbitré ». Ethan
l'a arbitré le même jour, avant le début du lot — « bah je viens d'arbitrer,
intègre-les ». Il est donc **dans** ce lot.

---

## 1. Version et build réellement produits

| | |
|---|---|
| Version | **0.26.0** · `config.build` **27** |
| `npm test` | **398 pass / 0 fail** (349 au départ, **+49**) |
| `dist/index.html` | **179 913 octets** |
| Delta depuis les 161 583 du brief | **+18 330** |
| Delta depuis les 167 308 mesurés | **+12 605** |
| `SAVE_VERSION` | 6 → **7** |
| Marge sous la borne T10 (200 000) | **10 %** |

⚠ Les deux champs de `package.json` sont restés des **chaînes**. Ils ont été
édités textuellement, jamais par un sérialiseur JSON : c'est ce qui avait rendu
`"26"` en `26` le 28/08 et fait tomber le job Android à la configuration.

⚠ **La marge de T10 se resserre.** Elle était de 23 % au lot TUTORIEL, elle est
de 10 %. C'est le premier chiffre à regarder au prochain lot d'interface.

---

## 2. La forme finale des deux champs — telle qu'écrite

```
etat.garnison = [ { id, rangee, colonne, niveau, degatsMilli }, … ]
etat.armee    = [ { id, vague,  colonne, niveau, degatsMilli }, … ]
```

Conforme au §5 du brief, sans écart. Listes **creuses**, un objet par pièce
posée. `degatsMilli` et non `pvMilli`, pour les deux raisons du brief. Aucun
tableau parallèle : niveau et dégâts vivent **dans** la pièce.

Ce que le brief ne prévoyait pas et qui s'est imposé : **une table `FORCES`**
dans `sim/state.js`. Les deux forces diffèrent par leur clé de position
(`rangee` contre `vague`), leurs bornes et leur roster — et par rien d'autre.
Écrire deux familles de fonctions symétriques aurait fait douze fonctions
presque identiques ; la table en fait cinq, et un test asserte qu'elle couvre
exactement les deux forces.

---

## 3. Les tests du §9, un par un

| Attendu du brief | | Montage réel |
|---|---|---|
| un état neuf porte `garnison` et `armee`, vides | **PASS** | `creerEtat(7)` ; asserte aussi `hasOwnProperty` — vide n'est pas absent |
| `serialiser` puis `charger` rend une armée identique | **PASS** | quatre pièces, deux forces, niveaux distincts, dégâts à 690 000 |
| une v6 se migre en v7 sans perdre `disposition` ni `economie` | **PASS** | v7 réelle redescendue en v6, puis `migrer` ; comparaison champ à champ |
| `verifierEtat` lève si `armee` absent, accepte une `armee` vide | **PASS** | amputation des deux champs à tour de rôle, message asserté par nom |
| une pièce détruite reste dans la liste après un aller-retour | **PASS** | `degatsMilli` = 700 000 (PV lus dans la table, pas recopiés) |
| poser au-delà du budget est refusé **entier**, pas écrêté | **PASS** | remplissage jusqu'au refus, puis comparaison de la grille avant/après |
| le budget suit le niveau du QG posé, et retombe s'il est démoli | **PASS** | QG monté de 4 à 9, puis retiré → `null` ; l'autre force intacte |
| `niveauDeLArmee` et `niveauDeLaDefense` rendent des dixièmes entiers | **PASS** | `[3,4,4,9,12]` → 64 ; comparé terme à terme au jumeau des bâtiments |
| le compteur montre un nombre en défense et en offense, plus « — » | **PASS** | base avec les deux QG ; asserte que ce sont des POINTS, pas des pièces |
| déplacer une pièce ne réordonne pas la liste | **PASS** | **trois** pièces, la MÉDIANE déplacée (le piège du montage à deux) |
| l'écran Offense ne nomme aucune constante de grille en dur | **PASS** | source décommentée ; refuse `36` et `EMPLACEMENTS_ASSAUT` |

**Répartition des 49 tests ajoutés, comptée sur le disque :** 15 dans
`test/couts-militaires.test.js` (nouveau), 14 dans `state.test.js`, 4 dans
`niveau-de-base.test.js`, 7 dans `offense.test.js`, 9 dans `chantier.test.js`.
`base.test.js`, `donnees.test.js` et `documentation.test.js` n'en gagnent aucun :
leurs assertions ont changé de cible, pas leur nombre.

**Cinq gardes ont changé de cible sans s'assouplir**, parce que leurs littéraux
ont bougé : le grisé de la palette (`dejaPose` → `verrouille`), le mot
« gratuit » (passé dans `titreDeLaVignette`), le plafond (passé dans
`messageDuPlafond`), et l'assertion `RESSOURCE_DE_COUT.defense` (qui asserte
désormais l'**absence** de la clé). La cinquième a été **resserrée** — voir §4.

---

## 4. La falsification — sept défauts injectés, sept fois rouge

Sur une copie fraîche de l'arbre de travail, un défaut à la fois, suite complète
relancée à chaque fois, puis retour à l'original.

| Défaut injecté | Rouge |
|---|---|
| migration 6 → 7 : elle n'ajoute plus `armee` | 2 tests |
| `deplacerEffectif` réordonne la liste (`splice` puis `push`) | 1 test |
| `verifierEtat` n'exige plus « armee » | 1 test |
| `niveauDeLArmee` rend zéro au lieu de `null` sur une force vide | 4 tests |
| une SEULE table d'ancres pour les deux rôles (Fusilier à 2 des deux côtés) | 2 tests |
| le compteur d'offense retombe au tiret (`chiffre: false`) | 2 tests |
| une SECONDE implémentation du geste de pose, sous un autre nom | 1 test |

⚠⚠ **LA DERNIÈRE LIGNE EST PASSÉE VERTE AU PREMIER ESSAI, ET C'EST LA TROUVAILLE
DE LA SESSION.** La garde du §8.4 comptait les occurrences de
`function tenterLaPose(` : une copie déposée sous le nom `tenterLaPoseEnDefense`
passait au travers, et la suite restait **verte avec deux implémentations du même
geste dans le fichier** — c'est-à-dire exactement ce que le brief demandait
d'interdire. Compter des noms de fonction ne mesure rien : une seconde
implémentation qui pose vraiment doit **appeler le moteur**. La garde compte
maintenant les sites d'appel de `poserBatiment`, `poserEffectif`,
`retirerEffectif`, `deplacerEffectif` et des deux fonctions de refus — un seul
chacun, et il est dans la table des terrains. Le même appât la fait tomber.

Cette correction a fait apparaître une duplication dans mon propre code : les
deux gestes de la garnison étaient écrits deux fois dans `TERRAINS.defense`, une
fois pour le geste direct et une fois pour l'action armée. Ils sont nommés une
fois et référencés deux fois.

---

## 5. Ce que le lot livre, au-delà de la forme de l'état

**L'arbitrage des coûts** — `src/data/couts-militaires.js`. Trois pièges, tous
gardés par un test :
- la même unité ne coûte pas le même prix selon le rôle. **Mesuré : cinq unités
  sur huit changent de prix** (le Voltigeur vaut 5 en assaut, 2 en garnison),
  trois coïncident. Une table unique aurait paru marcher sur trois cas ;
- la défense se paie dans **deux ressources** : six ouvrages fixes en quartz,
  trois artilleries et huit unités en scorie. Écrit ligne par ligne ;
- le niveau 1 est gratuit des deux côtés — c'est `premierNiveauPayant`, pas une
  seconde constante.

La rampe de coût a quitté `data/base.js` pour `data/economie.js`, à côté de la
courbe qu'elle applique. `RESSOURCE_DE_COUT` a perdu sa clé `defense`, que
l'arbitrage falsifie pour six entités sur dix-sept.

**Les trois niveaux du joueur** sont enfin trois moyennes. Une seule divergence
assumée avec leur jumeau : la liste vide rend `null` au lieu de lever.

**Le compteur du bandeau** porte un nombre dans les trois contextes. C'est la
*capacité* qui disparaît sans bâtiment de commandement, pas la valeur.

**L'écran Offense** compose. **La bande Défense** aussi, avec le même geste,
partagé par la table `TERRAINS`.

---

## 6. Trois défauts trouvés en relecture et corrigés avant livraison

Le §12 du brief l'exige : corriger, pas signaler en livrant.

1. **La palette ne suivait pas la bande.** `bandeCourante` bouge à chaque
   évènement de défilement, mais la palette n'était repeinte que par trois
   autres chemins. Le joueur serait descendu sur la Défense avec les vignettes
   des onze bâtiments sous les yeux.
2. **L'explication du budget absent occupait le registre `session`** de l'écran
   Offense, qui est prioritaire dans `ligneAAfficher` : elle aurait masqué les
   refus de geste dans le cas exact où ils arrivent — une armée posée puis le QG
   démoli. Passée au registre `mode`, qui a aussi le bon ton.
3. **Le titre d'une vignette se décidait sur la FORME de l'objet**
   (`points === undefined`) et non sur le terrain. Le terrain est passé.

Et un quatrième, de conception : le cerclage des cases légales allait marquer
les soixante-douze cases de la bande de défense d'un coup. La règle du
Collecteur vaut des deux côtés — on ne cercle que quand le terrain décide.

---

## 7. Les écarts au brief, et leurs raisons

1. **§2.4 renversé** : les coûts de construction entrent dans le lot, sur
   instruction explicite d'Ethan (§0 de ce rapport).
2. **§8.4, le panneau de détail ne s'ouvre pas sur une pièce de garnison.** Il
   chiffre production, capacité, voisinage et coût d'amélioration — une pièce
   n'a rien de tout ça, et un panneau vide se lit comme un écran cassé. Le
   bandeau contextuel dit son nom, son niveau et ses points.
3. **§8.4, deux des quatre actions n'ont pas de moteur en défense.** Améliorer
   et Réparer répondent au lieu d'agir. Voir §8.
4. **L'électricité des améliorations militaires** suit `COUT_ELECTRICITE` — le
   quart, à partir du niveau 3. C'est ce que dit `RELEVE-TA-COURBES-2.md` §5
   (« l'électricité vaut systématiquement le quart de la monnaie principale »),
   et c'est **la seule lecture de ce lot qui va au-delà du message d'Ethan**.
   Elle tient en une ligne s'il en décide autrement.
5. **Le geste « en main »** de l'écran Offense — prendre une unité posée, la
   déplacer ou la retirer en retouchant sa case — n'était pas spécifié. Il évite
   un bouton de plus, ce que la consigne « tout doit tenir dans l'écran »
   interdisait : la barre du bas est pleine.

---

## 8. Ce qui reste ouvert

**Arbitrages du §4 du brief, non tranchés et non inventés :**

1. **Comment se choisit le niveau d'une pièce posée.** Les éditeurs portent UN
   niveau pour toute la grille et le recopient ; ce lot conserve ce
   comportement. Le niveau est rangé **par pièce** dans l'état, pour qu'aucune
   seconde migration ne soit nécessaire le jour de l'arbitrage.
2. **Ce que vaut le budget quand le QG n'est pas posé.** Défaut retenu : *pas de
   bâtiment, pas de budget* — `niveauDeCommandement` rend `null`, pas zéro.
   **Signalé comme non arbitré.** Il tient en une ligne chez l'appelant, exprès.
3. **Le devenir des deux forces quand la base est rasée.** Le rasage n'existe
   pas encore.

**Trous nouveaux, ouverts par ce lot :**

4. **Améliorer une pièce de garnison ou une unité d'assaut n'a pas de moteur.**
   Le COÛT existe depuis l'arbitrage du 28/08 — `coutDeMonteeDefense`,
   `coutDeMonteeOffense`, testés — mais rien dans `sim/` ne monte une pièce d'un
   niveau, et **ce que gagne une unité améliorée n'est pas arbitré**. C'est le
   prochain trou à combler, et il est petit : les deux fonctions attendent.
5. **Réparer n'a toujours pas de moteur, mais les dégâts existent enfin.**
   `degatsMilli` est écrit, sérialisé, migré. `MODELE-REPARATION-1.md` §6.4,
   §6.6 et §6.7 restent ouverts (taux d'accumulation de la réserve, formule de
   dépassement de l'heure, barèmes par niveau).
6. **Rien n'écrit encore `degatsMilli`.** Le moteur de combat ne touche pas à
   l'état du joueur : le champ traverse la sauvegarde et attend le raid.

**Vérification appareil : NON EXÉCUTÉE.** Le dépôt n'a ni jsdom ni navigateur.
Tout ce qui touche le DOM — les deux touchers sur la bande Défense, le fantôme,
la palette qui change avec la bande, la ligne d'avis de l'Offense — se vérifie à
la main sur appareil, et un test appareil non exécuté se déclare non exécuté.
Ce qui **a** été vérifié ici : les fonctions pures et le HTML produit.
