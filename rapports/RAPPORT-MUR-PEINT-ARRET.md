# RAPPORT — lot MUR-PEINT : ARRÊT AVANT MODIFICATION

**Rien n'a été écrit, rien n'a été poussé.** L'arbre est intact — `git status`
vide, HEAD sur `0c05f07`, le commit d'Ethan qui apporte les huit sources.

Deux conditions d'arrêt du brief sont tombées. La première est réelle et
demande un mot d'Ethan ; la seconde s'explique entièrement et se referme au
premier geste du lot.

---

## 1. LES HUIT SHA-256 DIVERGENT — LES HUIT, PAS UN

C'est la première condition d'arrêt du brief : « une source absente ou de
SHA-256 divergent ». Les huit fichiers sont **présents**, correctement nommés,
**1080 × 2160 RGB** comme le brief l'annonce. Aucun des huit ne porte
l'empreinte attendue.

| fichier | brief | dépôt | octets |
|---|---|---|---|
| `base_fond_joueur_01.png` | `831a4e46a17138ce` | `30fb9a13d3b95ca6` | 3 084 361 |
| `base_fond_joueur_02.png` | `c0abbfc75c39fc43` | `c76fd11f721a1ea5` | 3 767 404 |
| `base_fond_joueur_03.png` | `61075a2d212d766e` | `02049c6d0b85e942` | 3 784 902 |
| `base_fond_joueur_04.png` | `70b33ba069124624` | `5b6ec1596a119794` | 3 622 669 |
| `base_fond_ouvrage_austere.png` | `ba166383cda1cbe1` | `c0a85f28f7cfda38` | 3 447 854 |
| `base_fond_ouvrage_hostile.png` | `c22679427c2a931d` | `c5670b3c6c0335a0` | 4 106 581 |
| `base_fond_ouvrage_menacante.png` | `d60bfd3e8fb24056` | `c85d2e3cf4783bc3` | 3 779 891 |
| `base_fond_ouvrage_oppressante.png` | `763c0461eda44e6e` | `eebe43943522e396` | 3 694 010 |

⚠ **CE N'EST NI UN FILTRE GIT NI UNE CORRUPTION, ET C'EST MESURÉ.** Le dépôt
n'a pas de `.gitattributes` ; le contenu du blob git hache exactement comme le
fichier du disque (vérifié sur deux des huit) ; les huit s'ouvrent, se
décodent, et rendent 1080 × 2160 RGB. Ce que le dépôt porte n'est donc pas une
version abîmée de ce que le brief a mesuré — **c'est un autre fichier**.

⚠ **LA PREMIÈRE MESURE A ÉTÉ FAITE SUR UN ARBRE PÉRIMÉ, ET ELLE A ÉTÉ
REFAITE.** Au premier passage les huit sortaient « ABSENTES » : `main` avait
avancé de `0aa237c` à `0c05f07` sans que l'arbre suive. Rapporter cet
« absentes » aurait été déclarer un arrêt sur un dépôt qui précédait le commit
d'Ethan. Les sources sont là.

---

## 2. `npm run check` EST ROUGE SUR L'ARBRE INTACT — ET C'EST LA GARDE D'ENTRÉES

Deuxième condition d'arrêt du brief. Baseline relevée :

**976 tests, 975 pass, 1 fail, 0 suites, 17,57 s** (`npm test`), `npm ci` vert.

Le seul rouge est le test 861 de `test/sprite.test.js:1162` :

> `entrées — tout fichier d'art/sources/ est CLASSÉ, consommé ou dormant`

Il nomme les huit fichiers d'Ethan. **La garde du lot ENTRÉES fait exactement
ce pour quoi elle a été écrite** : huit images sont entrées dans
`art/sources/` sans être classées dans `art/sources-declarees.json`.

⚠ **CE ROUGE N'EST PAS UN OBSTACLE AU LOT, C'EST SON PREMIER GESTE.** Le § LE
TRAVAIL du brief demande de « déclarer les huit sources dans
`art/sources-declarees.json` » : le test repasse au vert par le lot lui-même.
Il est signalé parce que CLAUDE.md §0 l'exige — « un lot qui démarre sur une
base rouge sans le savoir est un lot perdu » —, pas parce qu'il bloque.
**`main` est rouge en ce moment**, et il le restera jusqu'à ce que le lot entre.

---

## 3. CE QUI A DÉJÀ ÉTÉ MESURÉ — CONFRONTÉ AU DÉPÔT, ET TOUT TIENT

Le brief demande de confronter ces affirmations plutôt que de les croire.
**Aucune ne tombe.** C'est ce qui rend le §1 curieux, et il faut le dire dans
ce sens-là.

**Géométrie du fond — TIENT.** Repère magenta posé à x = 54 sur les huit :
il longe la face intérieure du parapet peint, à quelques pixels près, sur les
quatre jets joueur — la population que le brief nomme — et le repère
symétrique tombe sur x = 1026. Vérifié à l'œil sur un agrandissement ×3, après
qu'une première métrique inventée pour l'occasion se soit révélée incapable de
distinguer le mur de la texture du sol. `54 + 9 × 108 + 54 = 1080` : case 108,
mur 54, image 10 cases.

**Alignement des bandes — TIENT.** Repère à `y = 54 + 8 × 108 = 918` : la
transition béton → terre peinte y tombe, **dans la demi-case** que le brief
pose comme seuil. Sur `joueur_04` et `oppressante` le béton se rompt en bord
déchiqueté et la transition s'étale sur environ un tiers de case sous le
repère ; elle commence au repère. ⚠ Un premier relevé automatique — « la plus
forte rupture horizontale » — donnait des écarts allant jusqu'à six cases : il
attrapait une corniche ou une ombre, pas la transition. **Une métrique qui ne
mesure pas ce qu'elle prétend se jette, elle ne se rapporte pas.**

**Débord — TIENT.** `54 + 18 × 108 = 1998` sur 2160 : 162 px, 1,5 case, et le
terrain continue sous le repère sur les huit.

**Flancs qui meurent — TIENT.** Les flancs peints s'arrêtent aux alentours de
57 % de la hauteur, soit la rangée 11 sur 18 (`54 + 11 × 108 = 1242`,
1242 / 2160 = 57,5 %). Conforme à l'arbitrage.

**Anneau, écran de raid — TIENT.** `src/ui/raid.js:309` :
`calculerProjection(largeur, hauteur, 1)`. `src/ui/banc.js:368` n'en passe
aucun.

**Anneau, mécanique — TIENT.** `src/render/projection.js:47` porte
`contour = 0` par défaut et lève en `RangeError` hors de 0 et 1 (l. 52-53) ;
`listeDuContour` de `src/render/scene.js:302` rend `[]` quand
`projection.contour` est faux.

**Anneau, écran de base — TIENT.** `src/ui/chantier.js` importe
`BANDE_DU_CONTOUR`, `tuilesDuContour` et `nomsDuContour` de
`render/contour.js` (l. 614-615 et 622), les ré-exporte, et paie l'anneau en
variables CSS (l. 655) et en `padding` de grille (l. 707).

**Sol actuel — TIENT.** `tile_sol_{j,o}_{a,b,c,d}` — quatre tuiles par camp —
sont présents aux **trois** grilles 32, 64 et 128, et `src/data/atlas.js`
(l. 62-69) les coud.

**Précédent d'image entière — TIENT.** `tools/build.js:203` porte
`{ marqueur: '%FOND_OFFENSE%', chemin: [art, sprites, fond, fond_offense.webp] }`
et `src/index.src.html:1339` l'emploie. `art/sprites/fond/` ne contient que ce
fichier.

**Types de site — TIENT.** `src/data/sites.js` porte `camp`, `avantPoste` et
`base`.

---

## 4. CE QUE ÇA VEUT DIRE, ET CE QUE ÇA NE PROUVE PAS

Toute la géométrie sur laquelle le lot repose — case 108, mur 54, largeur
10 cases, bande de bâtiments finissant à 918, débord de 162 px, flancs morts à
la rangée 11 — **est vérifiée sur les fichiers qui sont au dépôt**. L'art
qu'Ethan a commité est, de composition et de grille, exactement celui que le
brief décrit.

L'explication de loin la plus probable est donc un **ré-export** : mêmes
images, autre passe d'encodage PNG, donc autres octets et autres empreintes.

⚠ **MAIS CE N'EST PAS PROUVÉ, ET C'EST POURQUOI ON S'ARRÊTE.** Le brief ne
donne que des empreintes de FICHIER, pas de PIXELS : il n'existe au dépôt
aucune référence contre laquelle établir que les pixels sont les mêmes. Huit
divergences sur huit ne se distinguent pas, par la seule mesure disponible ici,
d'une passe d'art plus récente dont le détail fin — l'endroit exact où le béton
se rompt, l'épaisseur du parapet au pixel — nourrirait des mesures que ce lot
doit écrire dans ses tests. Le lot entre **d'un seul commit**, réécrit
`test/contour.test.js` en entier et touche les mesures pixel de deux fichiers
de test de 238 ko : le bâtir sur des sources dont la provenance n'est pas
établie est exactement ce que cette condition d'arrêt existe pour empêcher.

Le brief interdit par ailleurs de « régénérer ni "corriger" une source » : leur
intégrité est traitée comme sacrée, et ce n'est pas à moi de la déclarer
acquise.

---

## 5. CE QU'IL FAUT D'ETHAN — UN MOT

**Si les huit PNG de `0c05f07` sont bien les fonds voulus**, il suffit de le
dire : le lot part, la table d'empreintes du brief est remplacée par celle
mesurée au §1, et le rapport final le consignera comme un écart déclaré.

**Si le brief visait d'autres fichiers**, ce sont eux qu'il faut commiter — et
`art/sources/` ne s'ampute jamais, donc les huit d'aujourd'hui y restent et
passeront `dormantes`.

Rien d'autre n'est en attente : la baseline est relevée, les onze affirmations
du brief sont confrontées, et aucune ne tombe.
