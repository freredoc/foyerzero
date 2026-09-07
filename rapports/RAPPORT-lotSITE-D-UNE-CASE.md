# RAPPORT — lot SITE-D'UNE-CASE — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.33.0 · build 34 | **0.34.0 · build 35** |
| `npm run check` | 491 pass / 0 fail | **505 pass / 0 fail** |
| `dist/index.html` | 525 733 octets | **525 733 octets, inchangé** |
| `src/sim/` | 15 fichiers | 16 |
| `test/` | 31 fichiers | 32 |

⚠ **L'OCTETAGE N'A PAS BOUGÉ D'UN OCTET, ET C'EST NORMAL.** Aucun écran
n'appelle encore ce module : `esbuild` l'élague du paquet. Il coûtera sa taille
le jour où l'écran de la carte l'appellera, pas avant. Un lot de `sim/` pur dont
le consommateur n'existe pas encore ne pèse rien — c'est la première fois que ça
arrive dans ce dépôt, d'où la ligne.

---

## 1. Ce que le lot livre

`sim/generateur.js` savait peupler un site depuis `{ type, niveau, saveur,
graine }`. `sim/peuplement.js` savait où sont les bases de l'Ouvrage,
`sim/satellites.js` où sont les camps du joueur. **Rien ne traduisait une CASE en
ces quatre paramètres** : c'est le chaînon que ce lot pose.

- `graineDuTerrain(graine, rangée, colonne)` — ce qui ne dépend que de la case ;
- `graineDeLInstance(…, instance)` — ce qui dépend aussi du numéro d'instance ;
- `saveurDeLaCase(…)` — riche quartz ou riche scorie, `null` pour une base ;
- `siteDeLaCase(état, rangée, colonne)` — l'identité d'une cible, ou `null` ;
- `montageDuSite(graine, identité)` — le montage de combat, prêt pour `creerCombat` ;
- `resumeDuSite(graine, identité)` — **le mini-onglet** : type, niveau, saveur,
  nombre de bâtiments, nombre de défenseurs, butin si tout tombe, force de la
  défense ;
- `ciblesAPortee(état, baseAttaquante)` — ce que l'écran de la carte parcourra.

## 2. Aucun arbitrage nouveau — trois réponses trouvées dans le dépôt

La règle ajoutée à `CLAUDE.md` §0 ce matin a servi trois fois dans ce lot :

- **La saveur.** `SPEC-FOYER-ZERO.md` §8 : « deux variantes de camp et
  d'avant-poste : riche quartz (75/25) ou riche scorie. Les bases sont
  proportionnelles. » Donc **deux** saveurs tirables, pas trois — la clé `base`
  de `SAVEURS` vaut `null`, c'est l'absence d'inclinaison d'une base, pas une
  troisième saveur qu'un camp pourrait tirer.
- **Le hachage.** `hachageBrut` de `sim/peuplement.js` porte dans son en-tête :
  « il existe pour que personne n'en écrive un second ». Aucune famille de
  hachage neuve n'a été écrite ; les sels 0 et 1 sont au peuplement, 2 et 3 au
  pavage du fond de carte, **4 et 5 sont à ce lot**, et un test mesure sur 500
  cases qu'aucun des six ne rend la même valeur qu'un autre.
- **La force de la défense.** Le mot n'existait nulle part, mais l'unité si :
  `pointsEngages` de `sim/state.js` somme le champ `points` des pièces du joueur.
  La force d'une cible est **la même somme sur sa garnison**, donc le même
  nombre que le joueur lit déjà sur ses propres bandes — 240 contre 190 se
  compare sans conversion. Un test confronte les deux fonctions sur la même
  liste.

## 3. L'arbitrage du 29/08 sur les instances : une moitié tenue, une moitié due

« Deux camps qui apparaissent sur la même case l'un après l'autre auront les
mêmes dispositions quartz scories obstacles, mais des dispositions bâtiment
défense différentes. »

**Tenu — la saveur.** Au niveau d'un site, « quartz scories » c'est la saveur :
elle est tirée de la case seule, donc elle ne bouge pas d'une instance à
l'autre. Mesuré.

⚠ **NON TENU — LES OBSTACLES, ET LA RAISON N'EST PAS UNE GRAINE.**
`genererSite` place ses obstacles **en dernier**, dans les cases que les
bâtiments et les défenses ont laissées libres. Ils suivent donc la disposition,
donc l'instance, **quelle que soit la graine qu'on leur donnerait** — passer une
seconde graine au générateur ne réglerait rien. Mesuré sur la case (200, 10),
instances 1 et 2 : **2 cases d'obstacles communes sur 10**.

Le tenir demande de tirer les obstacles **en premier** et d'apprendre à
`placerDefenses` à les éviter. Ça déplace chaque défense de chaque site déjà
généré — dont les six raids de référence dont le butin est mesuré au champ
près. **Ce lot ne le fait pas**, et un test témoin, nommé comme tel, mesure
l'écart : le jour où le générateur changera, il devra être inversé.

## 4. Trois faits de jeu mesurés, pas déduits

**Une partie neuve n'a RIEN à attaquer.** La garde du peuplement fait quinze
cases autour du départ, le rayon d'attaque en fait dix : `ciblesAPortee` rend une
liste vide. Les trois premières cibles sont **les satellites du joueur
lui-même**, cinq minutes après la pose. C'est exactement le rôle « filet de
sécurité » que `TYPES_SITE.camp` annonce, et c'est la première chose que le
joueur pourra faire de ses cent points d'attaque.

**Ce que valent ces trois premières cibles**, graine 2026, base de départ :

| Cible | Niveau | Bâtiments | Défenseurs | Butin si tout tombe | Force |
|---|---|---|---|---|---|
| camp (275, 18) | 1 | 8 | 3 | 4 050 quartz / 1 350 scorie | 15 |
| camp (277, 15) | 1 | 8 | 3 | 1 350 / 4 050 | 15 |
| avant-poste (274, 11) | 6 | 11 | 6 | 18 504 / 6 168 | 30 |

L'avant-poste vaut **quatre fois** un camp, pour une défense deux fois plus
lourde. Le multiplicateur de butin de `TYPES_SITE.avantPoste` — 3,25 — n'y est
pour rien : il n'est **lu nulle part** dans le générateur. L'écart vient du seul
niveau (6 contre 1). ⚠ **C'est une dette ouverte** : le champ existe, il décrit
le rôle « revenu » de l'avant-poste, et personne ne l'applique.

**Une base de niveau 30**, pour l'ordre de grandeur de l'autre bout de la carte :
34 bâtiments, 34 défenseurs, force 290, et **25,2 millions de quartz** si tout
tombe.

## 5. Deux écarts entre la spec et le générateur, constatés en passant

1. **`GEOGRAPHIE.compositionBase` dit « deux niveaux adjacents, répartis pour
   atteindre la moyenne ».** Mesuré sur une base de niveau 30 : **tous les
   bâtiments et toutes les défenses sont au niveau 30**, un seul niveau. La règle
   n'est pas implémentée. Elle ne concerne que les bases de l'Ouvrage.
2. **`TYPES_SITE.avantPoste.multiplicateurButin: 3.25` n'est lu par personne**
   (§4). Deux lignes de table qui décrivent un jeu que le code ne joue pas encore.

Aucune des deux n'a été corrigée ici : toutes deux changent des sites déjà
générés, donc des tests de référence du combat. Elles méritent leur propre lot,
et un arbitrage sur l'ordre — le multiplicateur d'abord, parce qu'il change
l'équilibre économique du raid.

---

## 6. Fichiers livrés

| Fichier | État |
|---|---|
| `src/sim/site-de-la-case.js` | **neuf**, 300 lignes |
| `test/site-de-la-case.test.js` | **neuf**, 14 tests |
| `CLAUDE.md` | §0 (compte, version) et §2 (arborescence) |
| `package.json` | 0.34.0 · build 35 |

**Aucun fichier existant de `src/` n'a été modifié.** Le module se branche par
import, il ne s'insère nulle part : `state.js`, le générateur et les satellites
sont intacts. C'est ce qui rend le lot sûr — il ne peut rien casser de ce qui
tournait, et les 491 tests d'avant sont passés sans qu'aucun soit touché.

## 7. Les quatorze tests, et la falsification qui les a éprouvés

Tous PASS. **Quatre propriétés ont été falsifiées pour de bon** — le code cassé,
la suite relancée — parce qu'un test vert ne prouve rien tant qu'on n'a pas vu
ce qui le fait rougir :

| Faute injectée | Ce qui est tombé |
|---|---|
| la graine d'instance ignore l'instance | tests 1, 7 **et 8** |
| une seule saveur tirée | test 3 |
| la force compte les pièces au lieu de leurs points | test 11 |
| « si tout tombe » calculé sur un demi-raid | test 10 |

Les montages qui donnent du mordant aux autres :

- **les six sels** : mesurés sur 500 cases, pas sur une ; deux sels qui se
  marcheraient dessus feraient hériter le site du tirage du peuplement ;
- **la saveur** : les DEUX doivent sortir, entre 40 % et 60 % — un tirage bloqué
  passerait toutes les autres assertions ;
- **le niveau d'une base** : la fenêtre de mesure doit contenir plus de dix bases
  sur plus de cinq rangées, et rendre plus d'un niveau distinct ;
- **le butin selon la saveur** : la SOMME doit être la même des deux côtés — la
  saveur incline le partage, elle n'enrichit pas le site ;
- **« si tout tombe »** : comparé au butin d'un raid qui n'aurait détruit que la
  moitié de chaque bâtiment, et il doit valoir le double à l'arrondi près.

## 8. Ce qui vient après, dans l'ordre de dépendance

1. **L'état d'un site entamé** — le vrai morceau. « Un camp se rase en deux
   passes » suppose de ranger ce qui reste debout entre deux passes, soit une
   quarantaine de PV par site entamé et non rasé.
2. **L'écriture d'après-raid** : le butin entre dans l'économie — et sature ? —,
   les unités reviennent avec leurs dégâts, le site garde les siens, les points
   d'attaque se débitent.
3. **Un raid demande 4 645 ticks, soit 464 secondes**, cinq fois le plafond de
   combat. Jamais regardé, et ça tombe pile au moment de brancher la résolution.
4. Le rayon du territoire (lot précédent, §4), le multiplicateur de butin de
   l'avant-poste et les deux niveaux adjacents d'une base (§5).
