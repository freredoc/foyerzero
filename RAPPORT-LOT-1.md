# RAPPORT — Lot 1 : socle déterministe, build, enveloppe Android

Session du 2026-08-22. Livraison : lots **1A et 1B complets**, lot **1C non lancé**
(arrêt volontaire avant, conformément au brief — voir « Questions ouvertes »).

**Mise à jour post-audit** : deux défauts silencieux relevés à la relecture de la PR #1 ont
été corrigés — source unique pour ρ, et vecteur de référence figé du PRNG. Les deux
sabotages de contrôle sont reproduits au §3. Suite portée à **25 tests**.

---

## 1. Version et build produits

| Champ | Valeur |
|---|---|
| Version | **0.1.0** |
| Build | **1** |
| esbuild épinglé | **0.28.2** (dépendance exacte, sans `^`) |
| Node utilisé | 22.x (`node --test` natif, zéro framework de test) |

---

## 2. Arborescence réelle créée

```
art/etalon/                  assets de l'étalon DA (déplacés de la racine, cf. §6)
  joueur/ ennemi_pale/ ennemi_sombre/ generateur.py
.github/workflows/ci.yml     npm ci → build → tests → artefact HTML (sans APK, cf. §6)
src/
  sim/
    rng.js        PRNG mulberry32 à graine, état = 1 uint32 sérialisable, suite figée
    clock.js      horloge 10 Hz, temps réel injecté, jamais lu
    economy.js    courbes (flottants) + tick économique (entiers) + rattrapage
    state.js      état versionné, boucle tickJeu, rattraperJeu, migration
  data/
    params.js     TOUTES les valeurs de calibrage ; table RHO = source unique
  render/         vide (.gitkeep)
  ui/             vide (.gitkeep)
  index.src.html  page minimale : version, build, état du moteur
tools/
  build.js        esbuild → dist/index.html tout inliné, garde offline bloquante
test/
  rng.test.js     tests 1–2 + helpers + vecteur de référence figé
  clock.test.js   tests 3–4 + exactitude de l'horloge
  economy.test.js tests 5–10 + saturation du flux continu
  state.test.js   tests 11–12 + sérialisation en pleine partie   ← fichier ajouté, cf. §6
RAPPORT-LOT-1.md
.gitignore        posé AVANT le premier commit de code (node_modules/, dist/, *.apk, *.aab)
package.json      scripts build / test / check ; esbuild seule dépendance
```

`dist/` est produit par `npm run build` et par la CI, jamais commité.

---

## 3. Résultat de chaque test

Suite complète : **25 tests, 25 PASS, 0 KO** (`npm run check` : build puis tests).

| # | Test du brief | Verdict | Montage effectif |
|---|---|---|---|
| 1 | Reproductibilité du PRNG | **PASS** | Deux instances de graine 123456789 comparées tirage à tirage sur 10 000 tirages (égalité stricte + appartenance à [0,1)). Graines 1 et 2 : divergence exigée avant le 10ᵉ tirage |
| 2 | Sérialisation du PRNG | **PASS** | 500 tirages, aller-retour `JSON.stringify`/`parse` complet, puis 5 000 tirages comparés à une instance témoin jamais interrompue |
| 3 | Déterminisme de la boucle | **PASS** | Deux exécutions indépendantes de `creerEtat(424242)` + 10 000 `tickJeu` → JSON strictement égaux ; contre-épreuve : une graine différente produit un état différent. Variante « 3 bis » : clock + rng combinés, un tirage consommé par tick (la boucle économique du lot ne tire pas encore de nombres) |
| 4 | Absence de dépendance navigateur | **PASS** | Lecture de tous les `.js` de `src/sim/` ; motifs interdits : `window`, `document`, `localStorage`, `setTimeout`, `setInterval`, `requestAnimationFrame`, `XMLHttpRequest`, `fetch`, `navigator`, `Math.random`, `Date.now`, `performance.now`, `new Date`. Garde de montage : ≥ 4 fichiers trouvés, et les motifs détectent un appât volontairement fautif |
| 5 | Courbe de coût | **PASS** | `C(n)` recalculé par produit des ratios ; contrôle à 0,1 % près aux niveaux 10 et 15 + croissance stricte et décroissance du ratio vers sa limite sur 25 niveaux. Voir valeurs §4 |
| 6 | Facteur de temps de retour | **PASS** | Moyenne de `ratio_C(n)/ratio_P(n)` sur n = 1…25 ; chaque niveau individuel doit en outre dépasser 1 |
| 7 | Verrou croisé | **PASS** | `coutNiveau` au niveau 4, Foreuse (ρ 0,45, E 20) et Décapeuse (ρ 3,50, E 35), comparaison `deepEqual` sur les entiers arrondis |
| 8 | Plancher d'amorçage | **PASS** | Pour **les quatre** classes de ρ des paramètres : scorie = 0 et quartz > 0 aux niveaux 1–3, scorie > 0 au niveau 4 |
| 9 | Saturation des packages | **PASS** | Tick par tick : 0 colis à 4 min 59,9 s, 1 colis à 5 min pile, 2 après 10 min, **toujours 2 après 60 min**, chaîne figée (progrès à 0) |
| 10 | Adjacence constante | **PASS** | Au tick : supplément de 2 voisins identique aux niveaux 1 et 12 (20 milli-unités/tick). À la courbe : bonus plafonné à 2 voisins, poids relatif 50 % au niveau 1, ≈ 11 % au niveau 12. Voir §4 |
| 11 | Rattrapage analytique | **PASS** | Pour Δt = 1 h, 24 h, 72 h : état hétérogène (3 bâtiments, 2 ressources, colis en cours, stock proche saturation), simulation tick par tick réellement exécutée (jusqu'à 2 592 000 ticks) vs `rattraperJeu` → JSON **strictement égaux**. Garde de montage : la fenêtre traverse la saturation du stockage ET l'arrêt de chaîne des colis, et le quartz ne sature pas la première heure (les deux régimes sont couverts) |
| 12 | Migration de sauvegarde | **PASS** | Sauvegarde v0 fabriquée à la main (sans `version`, sans `residuMs`, sans `voisinsQualifiants`), chargée : version portée à 1, **tous** les champs d'origine intacts, valeurs par défaut sur les champs nouveaux, boucle fonctionnelle ensuite. Une sauvegarde plus récente que le jeu est refusée avec une erreur explicite |

### Falsifiabilité vérifiée par sabotage

Conformément au §9 du brief, deux mutations volontaires du rattrapage ont été
testées puis annulées :

- **erreur d'un tick sur le progrès des colis** → invisible aux fenêtres 1/24/72 h
  (les colis saturent à 2 et effacent la phase), mais **détectée** par le test
  « 11 bis » ajouté exprès : fenêtre non ronde de 7 min 33 s avec un colis en cours,
  vérification du progrès résiduel exact (1234 + 4530 − 3000 = 2764) ;
- **erreur d'une milli-unité sur les stocks** → détectée par les deux tests.

La garde offline du build a été éprouvée de la même façon : une feuille de style
réseau injectée dans la source fait échouer le build avec un message explicite
(code de sortie 1).

**Correctifs post-audit, sabotages reproduits dans les deux sens :**

| Défaut | Avant correctif | Après correctif |
|---|---|---|
| Table ρ recopiée par les bâtiments : passer `RHO.producteurQuartz` de 0,45 à 0,50 | **silencieux** — 25/25 PASS | `not ok 9 — test 7 (verrou croisé)` |
| Constante interne du PRNG : `t \| 61` → `t \| 63` dans `tirer()` | **silencieux** — 24/24 PASS | `not ok 20 — vecteur figé` |

Le second est le plus coûteux des deux : une graine est une promesse de
compatibilité (combat rejoué, sauvegarde reprise, batch de calibrage), et rien
ne signalait qu'elle était rompue. Si le test « vecteur figé » échoue un jour,
ce n'est pas un test à mettre à jour : c'est une rupture de compatibilité à
décider explicitement, avec migration.

---

## 4. Valeurs obtenues / attendues (tests 5, 6, 7, 10)

| Grandeur | Obtenu | Attendu | Écart |
|---|---|---|---|
| Coût relatif niveau 10 | 341,00615 | 341,0 | +0,002 % |
| Coût relatif niveau 15 | 5 744,8048 | 5 744,8 | +0,0001 % |
| Facteur de temps de retour moyen (25 niveaux) | 1,54222 | 1,543 ± 0,005 | −0,0008 |
| Foreuse niveau 4 (ρ 0,45, E 20) | 59 quartz / 131 scorie | 59 / 131 | exact |
| Décapeuse niveau 4 (ρ 3,50, E 35) | 259 quartz / 74 scorie | 259 / 74 | exact |
| Bonus d'adjacence au tick, niveaux 1 et 12 | 20 = 20 milli-unités/tick | constant | exact |
| Poids relatif de l'adjacence, niveau 1 (2 voisins) | 0,50000 | 50 % | exact |
| Poids relatif de l'adjacence, niveau 12 (2 voisins) | 0,11132 | ≈ 11 % | conforme |

---

## 5. Taille du HTML produit

**2 968 octets (2,9 Kio)** — `dist/index.html`, tout inliné, minifié, aucune
référence réseau (vérifié par la garde du build). La page affiche la version,
le build et une ligne d'état produite par le moteur réellement bundlé
(`creerEtat` + un `tickJeu`), vérifiée par smoke test.

---

## 6. Écarts par rapport au brief, avec justification

1. **`test/state.test.js` ajouté.** L'arborescence du §2 du brief ne listait que
   trois fichiers de test, mais son §6 demande « `sim/state.js` + tests 11 et
   12 » : ils ont reçu leur propre fichier plutôt que d'être casés dans
   `economy.test.js`.
2. **Test 5 validé contre les valeurs de contrôle du brief, pas contre le
   classeur.** `chantier-economie.xlsx` (et `MODELE-ECONOMIQUE.md`) ne sont pas
   dans le dépôt. Le brief étant auto-suffisant (formules + valeurs de
   contrôle), l'implémentation suit le brief ; le jour où le classeur entre au
   dépôt, il suffira d'étendre la table `CONTROLE` de `economy.test.js`.
3. **`node --test` sans argument** au lieu de `node --test test/` : la forme
   avec répertoire n'est pas acceptée par le Node utilisé ; la découverte
   automatique cible `test/` par convention et exécute exactement les mêmes
   fichiers.
4. **CI livrée sans construction d'APK.** Le workflow suit l'ordre du brief
   (`npm ci` → build → tests → artefact) mais s'arrête à l'artefact HTML :
   l'APK appartient au lot 1C, non lancé (voir §7).
5. **Test « 11 bis » ajouté** (fenêtre non ronde de 7 min 33 s) : le sabotage a
   prouvé que les fenêtres 1/24/72 h seules laissent passer une erreur de phase
   sur les colis. Renfort, pas remplacement.
6. **Capacité de stockage fixée à 10 000 000 milli-unités** dans `params.js` :
   le brief ne donne pas cette valeur ; celle-ci laisse coexister dans le test
   11 un stock qui sature et un stock qui ne sature pas. C'est un paramètre de
   calibrage libre, à régler quand le modèle de stockage sera spécifié.
7. **Économie par tick en arithmétique entière (milli-unités).** Choix
   d'implémentation non imposé par le brief : c'est ce qui rend le rattrapage
   analytique exact **au bit près** (l'exigence « identique » du test 11 est
   inatteignable en flottant accumulé sur 2,6 millions de ticks). L'arrondi
   flottant → entier se fait une seule fois, par couple (niveau, voisins).
8. **Contenu des colis non défini.** Le brief spécifie la cadence (5 min) et le
   plafond (2), pas le contenu ni la collecte — la collecte est un geste
   joueur, donc UI, donc hors lot. Seuls cadence et plafond sont implémentés.
9. **Entrée du bundle = le `<script type="module">` inline de
   `index.src.html`**, extrait puis réinjecté par `tools/build.js` : évite
   d'ajouter un `main.js` absent de l'arborescence prescrite.

10. **Table `RHO` exportée de `data/params.js`** (correctif d'audit) : les
    bâtiments référencent `RHO.producteurQuartz` au lieu de recopier `0.45`.
    Un objet littéral ne pouvant s'auto-référencer pendant sa construction, la
    table est sortie du littéral et réinjectée via `rho: RHO`. Une seule source
    de vérité, et le problème n'empire plus à chaque bâtiment ajouté.
11. **Assets de l'étalon déplacés sous `art/etalon/`** (hygiène) :
    `joueur/`, `ennemi_pale/`, `ennemi_sombre/`, `generateur.py` quittent la
    racine. Aucun effet sur le code — vérifié, aucune référence de chemin dans
    les sources, et `generateur.py` écrit vers un chemin absolu.

Écart de contexte signalé (non bloquant) : le dépôt réel ne contenait ni
`CLAUDE.md`, ni `MODELE-ECONOMIQUE.md`, ni le classeur — seulement les
documents de cadrage et les sprites. `art/etalon/generateur.py` a été lu, pas exécuté.

---

## 7. Questions ouvertes

1. **Voie de distribution A/B/C — décision demandée avant tout code du lot 1C.**
   Rappel : le dépôt privé rend `raw.githubusercontent.com` inutilisable sans
   jeton, et un jeton dans un APK est un jeton publié.
   - **A** — dépôt public `chantier-dist` (manifeste + HTML buildé, poussé par la
     CI du privé) : **recommandée par le brief, recommandation partagée** ;
   - **B** — GitHub Releases avec assets publics sur le dépôt privé : URL moins stable ;
   - **C** — pas d'auto-update, store seul : tue l'itération rapide sur device.
2. **Package Android** : `fr.freredoc.chantier` proposé, à confirmer.
3. **Contenu et collecte des colis** : quantité par colis, geste de collecte —
   à spécifier avec l'UI (lot suivant).
4. **Capacité de stockage réelle** et courbes de stockage par niveau (déjà
   identifiées comme trou A dans `SYNTHESE-ET-PLAN.md`).
5. Le classeur `chantier-economie.xlsx` gagnerait à entrer au dépôt pour
   élargir le test 5 au-delà des deux valeurs de contrôle.

---

## 8. Ce qui n'a PAS été fait

- **Lot 1C en entier** : shell Android (WebView, HTML embarqué, versionCode,
  `debuggable=false`), manifeste de mise à jour, allowlist de domaine,
  vérification SHA-256, écriture atomique, rollback, construction de l'APK en
  CI. Bloqué volontairement sur la décision A/B/C, comme demandé.
- Aucun combat, aucun rendu, aucune UI au-delà de la page de version — hors
  périmètre du lot.
- Pas de collecte des colis ni de dépense de ressources (construction/montée de
  niveau branchées sur `coutNiveau`, mais aucun flux de dépense dans la boucle).
- Pas de rattrapage branché sur un temps réel : `accumuler` convertit du temps
  injecté en ticks et `rattraperJeu` les consomme, mais aucune couche ne lit
  encore d'horloge système (elle appartient à `ui/`).

---

## 9. Relecture hostile — faite

- Chaque test peut échouer : prouvé par sabotage pour les plus critiques (11,
  garde offline, table ρ, suite du PRNG), par contre-épreuve interne pour les
  autres (appât du test 4, graine différente du test 3, garde de montage du
  test 11).
- Valeurs codées en dur hors `data/params.js` : aucune dans `src/` ; les tests
  portent leurs propres constantes de contrôle, ce qui est leur rôle.
- Références navigateur dans `src/sim/` : **zéro**, prouvé par le test 4 (qui
  échoue s'il trouve moins de quatre fichiers à inspecter).
