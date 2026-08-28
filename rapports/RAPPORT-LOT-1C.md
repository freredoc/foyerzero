# RAPPORT — Lot 1C : enveloppe Android et mise à jour

Session du 2026-08-22. Prérequis vérifié : PR #1 mergée dans `main`.
Package Android confirmé par Ethan avant la session : **`fr.freredoc.foyerzero`**.

---

## 1. Version, build, versionCode, versionName

| Champ | Valeur | Source |
|---|---|---|
| Version du jeu | **0.2.0** | `package.json` (source unique) |
| Build | **2** | `package.json` → `config.build` |
| `versionCode` | **2** | lu de `package.json` par Gradle — jamais saisi deux fois |
| `versionName` | **0.2.0** | idem |
| `applicationId` | `fr.freredoc.foyerzero` | confirmé |
| minSdk / targetSdk / compileSdk | 26 / 35 / 35 | minSdk 26 permet une icône 100 % XML (adaptive), zéro binaire |

---

## 2. L'URL Pages réelle — lue, pas devinée

Le dépôt a bien été **renommé** : l'API GitHub (liste des dépôts du compte) donne
**`freredoc/foyerzero`**, public. Le brief §1 affirmait « le dépôt garde son
codename » — c'est le dépôt qui fait autorité, et c'est exactement le piège que
la règle 0.2 visait : une URL construite sur `chantier` aurait cassé la mise à
jour en silence. Le remote git local, antérieur au renommage, pointe encore sur
`chantier` (GitHub redirige) ; la CI, elle, lit `GITHUB_REPOSITORY` — jamais un
nom en dur.

| Objet | URL |
|---|---|
| Racine Pages | `https://freredoc.github.io/foyerzero/` |
| HTML | `https://freredoc.github.io/foyerzero/index.html` |
| Manifeste | `https://freredoc.github.io/foyerzero/manifest.json` |

Allowlist en dur dans le client (exigence du brief) : schéma `https` seul,
hôte `freredoc.github.io` en **égalité exacte**, chemin normalisé sous
`/foyerzero/`. ⚠ Un futur re-renommage du dépôt exigera de faire suivre
l'allowlist ET l'URL du manifeste dans le code.

---

## 3. Résultat de chaque test

Deux suites : **22 tests Kotlin JVM** (module `:maj`, `gradle :maj:test`, sans
émulateur) et **25 tests Node** (socle du lot 1, inchangés, toujours verts).

| # | Test du brief | Verdict | Montage effectif |
|---|---|---|---|
| 1 | Allowlist — hôte exact | **PASS** | `https://freredoc.github.io/foyerzero/…` accepté ; variantes casse et `:443` acceptées aussi |
| 2 | Allowlist — suffixe trompeur | **PASS** | `https://freredoc.github.io.evil.com/…` et `…-cdn.evil.com` rejetés |
| 3 | Allowlist — préfixe trompeur | **PASS** | `https://evil.com/freredoc.github.io/…` rejeté, y compris l'URL complète enfouie dans le chemin |
| 4 | Allowlist — schéma | **PASS** | `http://`, `ftp://`, `file://` rejetés |
| 5 | Allowlist — userinfo | **PASS** | `https://freredoc.github.io@evil.com/…` rejeté (avec et sans mot de passe) |
| 6 | Allowlist — chemin | **PASS** | Hors préfixe rejeté ; `..` textuel rejeté (normalisation) ; `%2e%2e` rejeté (garde sur le chemin décodé) ; dépôt jumeau `/foyerzero-evil/` rejeté ; un `..` qui RESTE dans le préfixe est licite |
| 7 | Empreinte | **PASS** | Un octet modifié → refus ; contenu tronqué → refus ; vecteurs FIPS (chaîne vide, « abc ») vérifient le calcul lui-même, pas seulement la comparaison |
| 8 | Atomicité | **PASS** | Écriture en deux étapes observables : temporaire posé **dans le même répertoire**, « interruption » (pas de bascule) → ancienne version intacte octet pour octet ; bascule → nouvelle version, temporaire disparu |
| 9 | Anti-retour | **PASS** | build inférieur refusé, build **égal** refusé, build supérieur accepté |
| 10 | Rollback | **PASS** | Version installée qui ne démarre jamais : lancements 1 et 2 la servent (compteur 1 puis 2), lancement 3 restaure la copie embarquée, écarte la fautive, redescend le build à celui de l'APK ; contre-épreuve : des échecs **non consécutifs** (succès intercalé) ne déclenchent rien |
| 11 | Premier lancement hors ligne | **PASS** | Répertoire vierge, fournisseur d'asset injecté : la copie embarquée est servie ; le gestionnaire n'a structurellement **aucune notion de réseau** — le hors-ligne n'est pas un cas géré, c'est le seul monde qu'il connaît |

S'y ajoutent : parseur de manifeste strict (13 déviations refusées, champs
inconnus scalaires tolérés pour l'évolutivité), cycle complet
(manifeste → contenu) avec les trois motifs de refus, persistance du build
installé (sans elle, la même version se réinstallerait en boucle).

### Le sabotage exigé (§4 du brief) — deux formes, résultats exacts

La comparaison structurée a été remplacée par chacune des deux formes
interdites, suite relancée à chaque fois, puis restaurée (25 tests web +
22 tests JVM re-vérifiés verts après restauration) :

| Sabotage | Tests d'allowlist qui échouent | Qui passent encore |
|---|---|---|
| `brute.startsWith("https://freredoc.github.io")` | **1**, **2**, **5**, **6**, divers | 3, 4 |
| `brute.contains("freredoc.github.io")` | **tous** (1 à 6 + divers) | aucun |

Lecture : le `startsWith` laisse passer suffixe trompeur, userinfo, chemins
hors préfixe et port non standard — et casse même le cas nominal (test 1, la
variante en casse différente est rejetée à tort). Les tests 3 et 4 ne le
détectent pas (il les rejette par accident) : c'est le `contains` qui les fait
tomber. Chaque test 2 à 5 échoue sous au moins une des deux formes — le couple
prouve qu'aucune comparaison de chaîne ne peut se substituer au parsing.

### Un échec de test réel pendant le développement, et ce qu'il a changé

Le test 10 a échoué à sa première exécution : l'API séparait « annoncer la
tentative » et « lire le HTML », et l'ordre d'appel changeait le comportement
(rollback un lancement trop tôt). Plutôt que réordonner le test, l'API a été
fusionnée : `htmlAuDemarrage()` est l'**unique point d'entrée** du lancement —
décision de rollback, comptage de la tentative, contenu, dans cet ordre. Un
appelant ne peut plus se tromper de séquence.

---

## 4. Le shell WebView

- **`Activity` de la plateforme, zéro dépendance androidx** : l'APK n'embarque
  que le module `:maj` et la stdlib Kotlin.
- Le HTML est **chargé** (contenu fourni via `loadDataWithBaseURL`), jamais
  **visité** (aucun `loadUrl` nulle part) ni **injecté** (aucun
  `evaluateJavascript`, aucune interface JS native — vérifié par grep).
- Le `WebViewClient` **bloque toute navigation** (`shouldOverrideUrlLoading`
  → true) et **intercepte toute sous-requête** (réponse vide) : le HTML étant
  autonome par construction (garde offline du build du lot 1), rien de
  légitime n'a besoin de sortir.
- Réglages posés explicitement, tous ceux du brief : `allowFileAccess`,
  `allowFileAccessFromFileURLs`, `allowUniversalAccessFromFileURLs`,
  `allowContentAccess` à false, `mixedContentMode = NEVER_ALLOW`,
  géolocalisation désactivée. JS et DOM storage activés (le jeu est une
  application JS avec sauvegarde locale).
- **Origine stable** `https://appassets.androidplatform.net/` (domaine réservé
  par Android au contenu local ; aucune requête n'y part jamais). Décision
  structurante : c'est l'origine de `localStorage`, donc des futures
  sauvegardes — en changer les perdrait. Documenté en dur dans le code.
- `isDebuggable = false` en release, posé explicitement — l'arbitrage resté
  ouvert sur Archipel est fermé ici.
- La mise à jour validée est servie **au prochain lancement** : jamais de
  remplacement à chaud du jeu en cours.
- Transport : redirections HTTP **non suivies** (`instanceFollowRedirects =
  false` — une 302 pourrait sortir de l'allowlist), timeouts, lecture
  plafonnée à 16 Mo qui jette sans finir de lire.

---

## 5. CI

Un workflow, trois jobs :

1. **web** — `npm ci` → build → tests Node → artefact HTML.
2. **android** — HTML rebuildé **dans le job** (jamais repris d'un commit),
   tests JVM de `:maj`, `assembleRelease`. **Signé si les quatre secrets
   existent** (`FOYERZERO_KEYSTORE_BASE64`, `_KEYSTORE_PASSWORD`, `_KEY_ALIAS`,
   `_KEY_PASSWORD`), **non signé sinon, sans échec** — un contributeur sans
   secrets vérifie que tout compile. Le keystore n'existe que dans les secrets,
   décodé vers le répertoire temporaire du runner ; `.gitignore` refuse
   `*.jks`/`*.keystore` par défense en profondeur.
3. **pages** — sur push `main` uniquement, après web et android verts : HTML
   rebuildé et testé **dans ce job**, manifeste généré **à partir de ce HTML**
   (sha256sum), publiés **ensemble** sur GitHub Pages. Le nom du dépôt vient de
   `GITHUB_REPOSITORY`, l'URL du manifeste n'est jamais écrite en dur.

---

## 6. Tailles

| Objet | Taille |
|---|---|
| HTML embarqué (`dist/index.html`, v0.2.0) | **2 974 octets** |
| APK (release, non signé) | **≈ 613 Kio** (627 561 octets, artefact `foyerzero-apk` du run CI n° 7 — sans androidx, l'enveloppe reste mince) |

---

## 7. Ce qui n'a pas été fait, et pourquoi

- **Compiler `:app` localement.** Le proxy réseau de l'environnement bloque
  `dl.google.com` (CONNECT 403) : ni le plugin Android Gradle ni le SDK ne sont
  téléchargeables ici. Le module `:maj` — toute la logique — est compilé et
  testé localement ; `:app` est écrit avec des API plateforme minimales et
  stables, et sera compilé par la CI (le SDK est préinstallé sur ses runners).
  `settings.gradle.kts` exclut `:app` quand le SDK manque, avec un message
  clair, pour que les tests JVM restent exécutables partout. Résolu depuis :
  la CI de la PR a compilé `:app` et produit l'APK du premier coup (run n° 7,
  vert), après un correctif de workflow — le contexte `secrets` n'est pas
  admis dans le `if` d'un step (« Unrecognized named-value »), un échec AU
  PARSING qui ne produit ni job ni événement ; seul un contrôle actif de la
  CI l'a détecté. Les secrets passent désormais par l'env du job.
- **AAB.** APK seul pour l'itération sur device ; le format store viendra avec
  la publication.
- **Cadence de mise à jour.** Une vérification par lancement, en arrière-plan.
  Pas de planification périodique (WorkManager aurait ajouté androidx) — à
  revoir si l'usage le réclame.
- **Écran d'erreur / UI du shell.** Hors périmètre : le shell est muet, le jeu
  occupe tout.

---

## 8. Questions ouvertes

1. **Activer GitHub Pages** sur `freredoc/foyerzero` (source : GitHub Actions).
   Le workflow tente l'activation (`enablement: true`) au premier passage sur
   `main` ; si l'API la refuse, l'activer à la main dans Settings → Pages.
2. **Créer les quatre secrets de signature** quand un keystore existera —
   jamais le keystore dans le dépôt, l'historique Git n'oublie rien.
3. **Si le dépôt est encore renommé** : faire suivre `Allowlist.kt`
   (préfixe de chemin) et `MiseAJour.kt` (URL du manifeste). La CI, elle,
   suivra seule.
4. Icône : un vecteur minimal honnête (creuset + anneau + rais, palette de la
   fiche de style) — la vraie identité visuelle appartient à la phase art.

---

## 9. Relecture hostile — les quatre questions du brief

- **Un test peut-il échouer ?** Prouvé trois fois : les deux sabotages
  d'allowlist (tableau §3), et l'échec réel du test 10 qui a reconfiguré l'API.
- **L'URL Pages a-t-elle été lue ou supposée ?** Lue — API GitHub, dépôt
  `freredoc/foyerzero`, en contradiction avec ce que le brief lui-même
  supposait (§2 de ce rapport).
- **Reste-t-il un startsWith/contains là où une comparaison d'hôte est
  attendue ?** Non — grep sur `Allowlist.kt` : l'hôte est en `equals` ;
  `startsWith` n'apparaît que sur le **chemin normalisé et décodé**, ce qui
  est sa place légitime, avec la garde `..` en plus.
- **La WebView peut-elle charger une URL distante ?** Aucun chemin : pas de
  `loadUrl`, navigation bloquée, sous-requêtes interceptées, pas de pont JS,
  pas d'`evaluateJavascript` (grep). Un fichier téléchargé ne peut pas être
  servi sans empreinte : l'unique appel à `installerNouvelleVersion` est
  précédé de `evaluerContenu` — et l'installation n'est servie qu'au
  lancement suivant, après quoi le rollback veille.
