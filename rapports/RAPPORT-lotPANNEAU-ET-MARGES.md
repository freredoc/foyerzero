# RAPPORT — lot PANNEAU-ET-MARGES

Essai appareil du 28/08 rapporté par Ethan : huit points, dont un bloquant.

**Version produite : 0.20.0 · build 21.** `dist/index.html` : 137 225 → **151 187
octets** (+13 962), SHA‑256 `2e47dace49cecd7915776422b92f69d550762cb391ffe144d2ef5da078a42344`,
0 référence externe. `SAVE_VERSION` **inchangée à 6** — rien de ce lot ne touche
la forme de la sauvegarde.

**Suite : 311 → 321 pass / 0 fail** (dix tests ajoutés, deux réécrits, aucun
retiré). `node tools/audit-maquette.mjs` : **AUDIT VERT**.

---

## 0. Base de départ, mesurée avant de toucher à quoi que ce soit

`npm ci && npm run check` sur `origin/main` (`e1e4c74`) : **311 pass / 0 fail**,
`dist/index.html` **137 225 octets**, version 0.19.0 · build 20. Conforme à
`CLAUDE.md` §0. La branche `claude/new-session-gvy72t` étant entièrement fondue
dans `main` par la PR #15, elle a été **refondée sur `origin/main`** avant tout
travail.

---

## 1. Le point bloquant : les barres système d'Android

> « l'ui déborde sur les boutons android du haut et du bas. donc injouable »

**Cause trouvée, et ce n'était pas un oubli entier mais une moitié de
mécanisme.** `src/index.src.html` portait `viewport-fit=cover` **depuis le
premier jour** — c'est la déclaration qui DEMANDE explicitement de dessiner sous
les barres système — et le dépôt ne contenait **pas une seule** occurrence de
`env(safe-area-inset-*)` (mesuré : `grep` à zéro résultat). L'enveloppe vise
`targetSdk = 35`, où l'affichage bord à bord est imposé : la WebView occupe donc
toute la dalle, encoche et barre de navigation comprises.

La capture d'Ethan le montre de face : la rangée d'onglets passe sous l'horloge
du téléphone, et la palette sous les trois boutons de navigation. **Le défaut
n'est pas propre à l'APK** — la même capture est prise dans un navigateur en
plein écran.

**Correctif : quatre `padding` en `env(safe-area-inset-*)` sur `body`.**

Trois choix, tous délibérés :

- **Dans le HTML, pas dans l'enveloppe.** Le HTML se met à jour tout seul par
  Pages ; corriger côté Android demanderait de reconstruire et de réinstaller
  l'APK, et se battrait de toute façon contre `viewport-fit=cover`, qui reste la
  bonne déclaration.
- **Sur `body`, pas sur chaque écran.** Les trois écrans — Chantier, Offense,
  banc — sont ses enfants directs : une seule règle les met tous à l'abri, et un
  quatrième en héritera. `box-sizing: border-box` est déjà posé sur `*`, donc la
  hauteur de 100 % reste juste.
- **Les quatre côtés.** Le portrait est verrouillé, donc gauche et droite valent
  zéro aujourd'hui ; une encoche latérale ne coûte rien à prévoir.

**⚠ NON VÉRIFIÉ SUR APPAREIL.** Le dépôt n'a ni navigateur ni émulateur Android
(`CLAUDE.md` §3), et `env(safe-area-inset-*)` ne se mesure que sur une dalle
réelle. Ce qui est vérifié ici : que la balise `<meta>` demande bien le bord à
bord et que les quatre marges sont écrites dans des déclarations de remplissage
— pas que le résultat soit correct au pixel. **C'est la première chose à
regarder à l'essai.**

---

## 2. Le panneau de détail d'un bâtiment

> « quand on clique sur un bâtiment on doit ouvrir un onglet et voir sa
> production détaillée, sa production théorique en cas d'amélioration, un bouton
> amélioration avec les coûts induits »

Les trois y sont, plus deux que la demande impliquait.

Ce que le panneau du **Chantier d'une base neuve** affiche, mesuré :

```
Chantier de construction · niv. 1                    [Fermer]
STOCKAGE DE LA BASE
  Quartz                                     50  →  63
  Scorie                                     50  →  63
  Élec.                                      40  →  50
EMPLACEMENTS OUVERTS
  Bâtiments posables                          2  →  4
DÉMOLITION
  le Chantier de construction ne se démolit pas    —
             [ AMÉLIORER → NIV. 2 ]  8 quartz
```

Et celui d'un **Collecteur voisin d'une Raffinerie** :

```
Collecteur · niv. 1
PRODUCTION PAR HEURE
  Quartz                                 +312/h  →  +390/h
  · dont production propre               +240/h  →  +300/h
  · dont Raffinerie × 1 (+72/h chacun)    +72/h
STOCKAGE DE LA BASE
  Quartz                                  2 943  →  2 943
DÉMOLITION
  Rend                                     rien
             [ AMÉLIORER → NIV. 2 ]  3 quartz
```

**La projection se fait avec les fonctions du moteur, jamais avec une formule.**
`apercuDuBatiment` fabrique la disposition CANDIDATE — la même liste, ce bâtiment
monté d'un niveau — et la soumet à `debitDuBatiment`, `productionParRessource` et
`capacitesMilli`. Une projection écrite dans l'écran (« × 1,25 par niveau »)
serait une seconde lecture des règles, et elle aurait **déjà tort** : la poche du
Chantier, le voisinage et le stockage ne suivent pas la même pente, et
`capacitesMilli` somme des bâtiments dont un seul monte. Un test le prouve en
comparant l'« après » d'un niveau *n* à l'« avant » du même bâtiment réellement
monté au niveau *n+1*.

**Deux ajouts au-delà de la demande, tous deux réclamés par le dépôt lui-même :**

1. **L'apport unitaire d'un voisin s'affiche même à zéro voisin.** « Raffinerie
   × 0 » ne dit rien ; « Raffinerie × 0, +72/h chacun » dit au joueur ce qu'il
   gagnerait à en poser une à côté. C'est la seule place du jeu qui enseigne le
   voisinage. Il vient de `debitVoisinParHeure`, jamais d'une division de
   l'apport total — qui vaudrait `NaN` à zéro voisin.
2. **Ce qu'une démolition rend se dit avant le geste.** `src/data/base.js`
   l'écrivait noir sur blanc : « démolir un bâtiment de niveau 1 ne rend rien
   […] l'écran devra le dire avant le geste, sinon il se lira comme un bug ».
   C'est fait.

**Le coût est enfin nommé avec sa ressource**, ce que le lot ÉCRAN-ACTIONS ne
pouvait pas faire. Mesuré sur **11 bâtiments × 49 paliers** : la **scorie ne
coûte jamais rien** (0 sur 539) et l'**électricité coûte à partir du niveau 3**
(527 paliers). Le panneau lit `coutDeMontee`, qui est exactement ce
qu'`ameliorer` débite — un test compare le débit réel au coût annoncé, ressource
par ressource. Seules les ressources non nulles sont nommées : « 8 quartz · 0
scorie » enverrait chercher une dépense qui n'existe pas.

**Choix d'interface, à confirmer à l'essai :**

- **Il s'ouvre au toucher, pas à la sélection.** `peindre()` sélectionne le
  Chantier d'office à la première image ; ouvrir sur une sélection ferait
  reparaître le panneau après chaque pose et chaque amélioration, par-dessus la
  grille. Conséquence : au tout premier lancement, le panneau est fermé et il
  faut toucher le Chantier pour le voir. **Si tu préfères qu'il s'ouvre d'office
  sur une partie neuve, c'est une ligne.**
- **Son bouton agit directement, sans armer.** « Armer puis toucher » existe
  parce que les boutons du bandeau contextuel n'ont pas de cible ; celui-ci en a
  une, et lui demander de viser ensuite serait un geste pour rien.
- **Il reste vif quand l'amélioration est impossible** (fond métal, note ambre
  « il manque 8 de quartz »). « Un indice n'est pas une interdiction. »

---

## 3. Les modes armés se voient et se disent

> « le bouton améliorer n'est pas intuitif. Fix : lorsqu'on a appuyé dessus, pour
> ensuite cliquer sur un bâtiment, le laisser enfoncé ou montrer qu'il est
> activé. » / « Bouton demolir idem. » / « Rajouter un texte à la place des toast
> quand mode demolir et améliorer sont en fonctionnement. »

**Le défaut est plus bête que prévu, et il vient de mon lot précédent.**
`marquerBoutonsAction()` posait déjà `classList.toggle('arme', …)` sur les trois
boutons — **le JavaScript était juste** — et **aucune règle CSS ne peignait
`arme`**. Armer une action ne changeait donc strictement rien à l'écran, et le
modèle « armer puis toucher », qui était tout le lot ÉCRAN-ACTIONS, était
invisible au doigt.

- **Style de l'action armée** : fond ambre `#F5B636`, texte encre, liseré d'os en
  `inset`. L'ambre et pas l'olive : « Améliorer » porte déjà `up`, donc un fond
  olive ; un armement en olive plus clair ne se distinguerait pas du repos.
- **Ligne de mode permanente** : « Mode DÉMOLIR : touchez le bâtiment à démolir.
  Retouchez le bouton pour annuler. » Elle reste tant que le mode dure — c'est ce
  qui la distingue d'un toast — et elle porte le métal, pas le rouge : un mode
  n'est pas une panne.
- **Le mode de POSE en a une aussi** : « Mode POSE : touchez une case libre pour
  poser Collecteur (gratuit). »

**Au passage, un défaut voisin réparé.** `armer()` posait `avis('')`, ce qui
n'effaçait pas seulement le mode : ça effaçait aussi une **alerte de sauvegarde**
que personne n'avait lue. La ligne porte maintenant **trois registres** —
`session` > `toast` > `mode` — dans une fonction pure, `ligneAAfficher`. Le toast
passe devant le mode et non l'inverse : « il manque 8 de quartz » répond au doigt
qui vient de se poser.

---

## 4. La limite de bâtiments est de retour à l'écran

> « Il n'y a plus la limite de bâtiment. A rajouter. »

**La règle mordait toujours** — `poser()` lève « 3 bâtiments pour 2 emplacements »
et `choisirPosable` prévient au toucher d'une vignette. C'est le **compteur
permanent** qui avait disparu la veille avec la barre de gauche.

Il revient dans le bandeau des ressources, sous la forme « **Emplac. 1 / 2** »,
et vire au rouge à saturation. Il s'y range parce qu'un emplacement se lit
exactement comme un stock plafonné, et parce qu'une quatrième barre pour un seul
nombre coûterait la hauteur d'une rangée de grille.

**Et le message de saturation est devenu une ligne de MODE, pas un toast** —
corrigé à la relecture. Il décrit un état qui dure exactement aussi longtemps que
le mode de pose ; en toast, il s'effaçait au bout de quatre secondes et laissait
reparaître « touchez une case libre » alors qu'il n'y en a aucune.

---

## 5. « Aucun bâtiment ne produit » et « pas de calcul hors ligne » — même cause

> « Htlm : pas de calcul hors ligne. » / « Version htlm : en fait aucun bâtiment
> produit des ressources »

**Le moteur n'a rien de faux, et c'est mesuré sur le HTML livré**, en faisant
tourner la vraie session dans un bouchon DOM :

| Instant | Quartz |
|---|---|
| partie neuve | 30 / 50 |
| après pose d'un Collecteur | 30 / 50, **+240/h** |
| après **1 h** de jeu | **50 / 50** |
| après **8 h** hors ligne | **50 / 50** |

Une base neuve n'a pour tout stockage que la **poche du Chantier — 50 unités**.
Un Collecteur produit 240/h : le stock touche le plafond en **cinq minutes**,
puis ne bouge plus jamais. Les deux rapports sont le même plafond vu deux fois —
« ça ne monte pas » et « ça n'a pas monté pendant la nuit » sont la même phrase
quand on est saturé. Le rattrapage hors ligne, lui, s'exécute correctement : avec
une Raffinerie posée, huit heures rendent bien 2 943 (vérifié par
`charger(json, t0 + 8 h)`).

**Ce que le lot y fait — de l'interface, pas du moteur :**

1. **La capacité saturée porte le mot** : « / 50 **saturé** », en rouge. La
   couleur seule n'a pas suffi : c'était un chiffre gris de huit pixels.
2. **Le panneau du Chantier montre la sortie** : « emplacements 2 → 4, coût
   8 quartz », et l'amorce (30 quartz) la paie.

**Et `CLAUDE.md` §6 était périmé sur ce point.** Il affirmait « UNE BASE NEUVE NE
PEUT RIEN PRODUIRE, JAMAIS. BLOCAGE OUVERT » et « capacité 0 » ; les deux sont
faux depuis les lots AMORCE et la poche du Chantier. La chaîne complète, simulée
et non déduite, est maintenant dans le fichier :

| Geste | Stocks | Capacités | Emplac. |
|---|---|---|---|
| base neuve | 30 / 30 / 20 | 50 / 50 / 40 | 1 / 2 |
| Chantier → niv. 2 (8 quartz) | 22 / 30 / 20 | 63 / 63 / 50 | 1 / **4** |
| + Collecteur sur un champ | 22 / 30 / 20 | 63 / 63 / 50 | 2 / 4 |
| + Raffinerie voisine | 22 / 30 / 20 | **2 943** / 2 943 / 50 | 3 / 4 |
| après 1 h | **406** / 30 / 20 | 2 943 / … | 3 / 4 |

**La partie est startable.** Elle ne se lisait pas.

---

## 6. Ce que les tests couvrent — et ce qu'ils ne couvrent pas

**Dix tests ajoutés, deux réécrits, aucun retiré ni assoupli.**

| # | Test | Résultat |
|---|---|---|
| 1 | `marges — les barres système d'Android ne mordent plus sur l'écran` | PASS |
| 2 | `écran — toute classe que l'écran bascule existe dans la feuille de style` | PASS |
| 3 | `avis — trois registres, une seule ligne, et la priorité est écrite` | PASS |
| 4 | `aperçu — le « si j'améliorais » se calcule avec les MÊMES fonctions que le présent` | PASS |
| 5 | `aperçu — au plafond, tout le volet « après » vaut null, il ne vaut pas zéro` | PASS |
| 6 | `panneau — sur une base neuve, il dit ce qui débloque la partie` | PASS |
| 7 | `panneau — le coût annoncé est celui que le moteur débite, à l'unité près` | PASS |
| 8 | `panneau — la production détaillée explique le chiffre qu'elle affiche` | PASS |
| 9 | `panneau — ce qu'une démolition rend se dit AVANT le geste` | PASS |
| 10 | `écran — un stock saturé le DIT, il ne le laisse pas deviner à la couleur` | PASS |

Les deux réécrits :

- `actions — le compteur d'emplacements a quitté l'écran, pas le calcul` →
  `… est REVENU à l'écran, et le calcul n'a pas bougé`. Le titre affirmait un
  fait que ce lot renverse ; un test dont le nom ment est pire qu'un test absent.
  **Assertions : 6 → 10**, aucune retirée.
- `chantier — le HTML produit porte les sept bandeaux…` : cinq identifiants du
  panneau ajoutés à la liste de présence, et le commentaire sur le compteur
  corrigé pour distinguer le BANDEAU (toujours mort) du CHIFFRE (revenu).
  **Assertions : +5.**

### La garde n° 2 mérite un mot

Elle existe **à cause d'un défaut livré**. Une classe basculée par le JS et
ignorée par la feuille n'est pas du JavaScript faux — c'est du CSS absent — et le
dépôt n'a pas de navigateur pour le voir. Ce qui SE teste sans navigateur, c'est
la confrontation des deux sources : le test extrait les littéraux de
`classList.toggle(…)` / `.add(…)` de tout `src/ui/` et exige de chacun une règle
dans `index.src.html`. Elle ne dit pas que le style est bon, elle dit qu'il
**existe** — et c'est exactement ce qui manquait.

### Deux gardes se sont d'abord satisfaites de leur propre prose

Trouvé **par falsification**, pas par relecture :

- celle des marges cherchait `viewport-fit=cover` dans le HTML brut ; le
  paragraphe qui EXPLIQUE la règle contient les mêmes mots, si bien que retirer
  la balise `<meta>` laissait le test **vert** ;
- celle du mot « saturé » cherchait `MENTION_SATURE` dans `chantier.js` ; la
  **déclaration** de la constante suffisait à la satisfaire, donc retirer le mot
  de l'affichage laissait le test **vert**.

Les deux sont resserrées — balise `<meta>` réelle sur un HTML décommenté, et
usage dans un `textContent =`. Une troisième s'est fait avoir par un préfixe
(`.ressource.emplacements` acceptait `.ressource.emplacementsX`), bornée depuis.

### Falsification — treize mutations, une à la fois

Restauration **par copie**, jamais par `git checkout` : les fichiers de ce lot
sont suivis, mais la leçon du lot ÉCRAN-CHANTIER est que la restauration doit
être vérifiée. Les deux sources sont **byte-identiques** à leurs sauvegardes en
fin de campagne (SHA-256 confrontés).

| Mutation | Verdict |
|---|---|
| `viewport-fit=cover` retiré de la balise | ROUGE ✔ |
| marge du haut retirée | ROUGE ✔ |
| marge du bas retirée | ROUGE ✔ |
| les deux règles `.arme` retirées | ROUGE ✔ |
| style `#chantier-avis.mode` retiré | ROUGE ✔ |
| style du compteur renommé `.emplacementsX` | ROUGE ✔ |
| la disposition candidate ne monte pas de niveau | ROUGE ✔ |
| capacité projetée par une formule (× 1,25) | ROUGE ✔ |
| au plafond, des zéros au lieu de `null` | ROUGE ✔ |
| le mode passe devant le toast | ROUGE ✔ |
| `armer()` efface encore le registre de session | ROUGE ✔ |
| le mot « saturé » retiré de l'affichage | ROUGE ✔ (après resserrage) |
| le compteur d'emplacements n'est plus écrit | ROUGE ✔ |
| le coût du bouton redevient un nombre nu | ROUGE ✔ |
| le remboursement n'est plus annoncé | ROUGE ✔ |

### ⚠ Ce qui n'est PAS testé, et ne peut pas l'être ici

Le dépôt n'a **ni jsdom ni navigateur** (`CLAUDE.md` §3). Un bouchon DOM
d'une centaine de lignes a servi à faire tourner la vraie session hors
navigateur pendant le lot — il a servi à MESURER (c'est lui qui a produit les
tableaux des §2 et §5) et **il n'est pas commité** : ce n'est pas un test, c'est
un instrument.

**Vérifications appareil — NON EXÉCUTÉES, donc NON PASSÉES :**

1. **Les barres système.** Aucune partie de l'écran ne passe sous l'horloge ni
   sous les trois boutons de navigation, APK comme navigateur en plein écran.
   *C'est la vérification n° 1 : c'est elle qui rendait le jeu injouable.*
2. **Le panneau.** Toucher un bâtiment l'ouvre ; toucher une case vide le ferme ;
   le bouton Fermer le ferme ; il ne cache pas la case dont il parle.
3. **Le bouton du panneau.** « Améliorer → niv. 2 · 8 quartz » sur une partie
   neuve ; l'appui monte le Chantier, les emplacements passent de 2 à 4, le
   panneau se met à jour sans se refermer.
4. **L'état armé.** Toucher « Démolir » : le bouton devient ambre à liseré clair,
   et la ligne de mode apparaît et RESTE. Le retoucher désarme les deux.
5. **La saturation.** Poser un Collecteur seul sur une partie neuve, attendre
   cinq minutes : « 50 / 50 saturé » en rouge.
6. **Le compteur d'emplacements.** « Emplac. 1 / 2 » sur une partie neuve, et il
   ne fait pas déborder le bandeau des trois ressources sur un écran étroit.

---

## 7. Écarts, et un point que je n'explique pas

**Écart assumé n° 1 — le panneau ne s'ouvre pas au démarrage.** Voir §2. C'est un
choix, pas un oubli, et il se renverse en une ligne si tu préfères l'inverse.

**Écart assumé n° 2 — `CLAUDE.md` §2 annonçait « tools/ 3 fichiers ».** Il y en a
**sept** : quatre scripts Python de traitement de sprites s'y étaient ajoutés
sans que la §2 bouge. Corrigé au passage. Aucune garde ne compte ce dossier — le
test de §2 ne porte que sur les quatre dossiers de `src/` et sur `test/`.

**⚠ Un point de tes captures que je n'explique pas.** Entre la capture de 11 h 29
(partie neuve, 30 / 30 / 20) et celle de 11 h 30 (Chantier niv. 2, Collecteur
niv. 2, **0 scorie et 0 électricité**), la scorie passe de 30 à 0. Or **rien dans
le code ne dépense de la scorie** : mesuré sur 11 bâtiments × 49 paliers, elle
vaut 0 partout, et `demolir` en AJOUTE. L'électricité, elle, s'explique — elle
est un coût à partir du niveau 3. Deux hypothèses, aucune vérifiable d'ici : soit
les deux captures viennent de deux parties différentes (17 onglets ouverts dans
le navigateur), soit celle de 11 h 30 vient d'une sauvegarde antérieure au lot
AMORCE, qui ne portait donc pas les 30 de scorie. **Si tu revois une scorie qui
descend sans que tu aies rien fait, dis-le : ce serait un vrai défaut, et je n'ai
pas de chemin de code pour l'expliquer.**

---

## 8. Ce qui reste ouvert, et qui n'a pas bougé

- **La répartition quartz/scorie d'un coût.** Elle n'est plus un blocage
  d'affichage — le panneau nomme ce que le moteur débite — mais le fait mesuré
  reste : **la scorie ne coûte rien nulle part**. Le joueur en accumule sans
  jamais en dépenser. C'est un arbitrage d'équilibrage, pas un défaut.
- **Réparer n'a toujours pas de moteur.** Le bouton s'arme, se désarme et dit ce
  qui est vrai. Un test est fait pour tomber le jour où `sim/state.js` gagne une
  fonction qui répare.
- **Les obstacles de la bande de défense** : la bande est dessinée, sa règle de
  pose ne l'est pas.
- **Les trois teintes de terrain** de `FICHE-STYLE.md` v4 : l'écran et la
  maquette les ignorent tous les deux, délibérément, et se reprendront ensemble.
- **La composition d'armée** : l'écran Offense reste une coquille assumée.
