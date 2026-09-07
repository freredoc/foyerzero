# PASSATION — Foyer Zéro, session du 27/08/2026 (nuit)

> **Le lot 1 est produit et clos.** Dix-huit fichiers dans
> `art/sprites/terrain/`, aucun défaut ouvert. La session a aussi retourné deux
> règles que les documents demandaient depuis la veille, et elle laisse la
> palette du projet à trente-trois teintes.
>
> À lire après `PASSATION-2026-08-27-soir.md`, dont elle contredit le §6 et une
> partie du §8. En parallèle, Claude Code a livré ÉCRAN-CHANTIER et
> ÉCRAN-NAVIGATION — ce document ne les couvre pas, leurs rapports sont au dépôt.

---

## 1. État mesuré à la clôture

Clone neuf, `npm ci && npm run check`, 27/08 au soir :

| | |
|---|---|
| Version | **0.15.0 · build 15** |
| Tests | **286 pass / 0 fail** |
| `dist/index.html` | **131 302 octets** |
| Palette fermée | **33 teintes** (28 avant cette session) |
| Sprites livrés | **18**, `art/sprites/terrain/` |

⚠ `CLAUDE.md` annonçait **130 488 octets**, faux de 814. Corrigé. `dist/` n'est
pas suivi par git : **aucun test ne confronte ce nombre**, c'est le seul chiffre
du fichier qu'aucune garde ne protège.

## 2. Les deux règles retournées

Ce sont les deux seules choses de cette session qu'il ne faut pas rouvrir.

**a) Le sol n'est pas « quasi uni ».** Les documents demandaient qu'un ton occupe
80 % de chaque tuile. Six jets l'ont appliqué, les six ont donné une plaque plate
avec des taches. La tuile retenue n'a **aucun ton dominant** — le plus présent
est à 35 %. La lisibilité ne vient pas de la propreté du fond mais d'un rapport :
le bruit interne du sol tient sur **20 points de L\***, l'écart qui le sépare des
entités en vaut **29 à 41**. Six fois plus. Tant que les cinq tons restent
au-dessus de L\* 58, une texture dense ne camoufle rien.

**b) Les champs ne se raccordent plus.** Les documents demandaient que la matière
touche le milieu des quatre bords pour qu'un bloc de trois cases se lise comme un
seul gisement. **Ethan l'a annulé sur pièce le 27 au soir** : sujets isolés,
bordure de 2 gros pixels comme les obstacles, une case un gisement. Conséquence
mécanique : les champs ne sont plus une exception à A7 ; **les deux sols le
restent, seuls.**

Les deux règles ont été retirées de `FICHE-STYLE.md`, `INVENTAIRE-SPRITES.md`,
`PLAN-PRODUCTION-SPRITES.md` et `PROMPTS-sol-de-base.md` — pas seulement
annotées : réécrites, avec la raison à côté.

## 3. La méthode qui a marché, et celle qui a échoué

**La planche a échoué. Le prompt de quatre lignes a gagné.**

Le lot 1 devait coûter 5 générations en planches 2 × 2. Il en a coûté **11, une
image par fichier** — deux fois moins rentable, et c'est le premier lot du projet
qui passe sans reprise.

Ce qui a changé : les prompts ne portent plus **ni palette, ni grille, ni format,
ni interdits**. Trois lignes — le sujet, la forme, l'isolement — et le reste se
rattrape au conditionnement, en Python. Le modèle échouait systématiquement sur
ce que les prompts longs ne disaient pas ; il ne rate plus rien quand on ne lui
demande qu'une forme.

Corollaire à assumer : **le tableau du §1 du plan est optimiste partout.** Il n'a
pas été refait, il sera corrigé session par session, sur mesure.

## 4. Ce que j'ai affirmé de faux pendant la session

- **« Ton commit a rougi la suite. »** Faux. J'avais copié mon `FICHE-STYLE.md`
  dans mon clone local sans le noter ; le rouge était chez moi, pas au dépôt. Le
  dépôt était vert. **La leçon est celle qui est déjà écrite au §3 de
  `CLAUDE.md` et que je n'ai pas appliquée : cloner neuf avant de conclure.**
- Le danger réel était l'inverse et il existait bien : les quatre `tile_sol_o_*`
  emploient cinq teintes qui **n'étaient dans aucun document**. `banc.test.js` ne
  balaie que du code, pas des PNG : la divergence serait restée verte
  indéfiniment. Elle est refermée dans ce commit — fiche, transcription et
  `CLAUDE.md` ensemble.

## 5. Deux dettes créées volontairement

1. **Les variantes `b` de `champ_quartz` et `champ_scorie` sont des
   retournements horizontaux** du fichier `a`, pas de vrais seconds jets. Un jet
   par sujet les remplace sans rien changer d'autre.
2. **Les quatre variantes de chaque sol viennent d'une seule tuile**, décalée
   toriquement. La voie propre ne coûte pas une génération : recoloriser les
   trois autres quadrants de la planche 56489, qui en contenait quatre.

## 6. Un point à surveiller au premier lot de combat

**`#F5B636` sur les braises de la scorie est la seule couleur d'accent du
décor.** Si le combat s'en sert pour le feu ou les chiffres de dégâts, les deux
se disputeront l'œil sur le même écran. Une version braises éteintes, corps
`#1E2124`, se substitue en une ligne — la décision se prendra quand les effets de
combat existeront, pas avant.

Deuxième réserve, sans effet aujourd'hui : **le quartz est à ΔE 7 de la poussière
du sol de l'Ouvrage.** Vérifié dans les sources — `champs.js` n'est importé que
par `state.js` et `disposition.js`, donc les champs ne se posent que dans la base
du joueur, sur terre cuite, où l'écart vaut ΔE 26. Le jour où un champ
apparaîtrait sur un sol d'Ouvrage, il lui faudrait un ton propre.

## 7. Ce qui part avec ce commit

| Fichier | Ce qui change |
|---|---|
| `FICHE-STYLE.md` | **v5** — rampe de sol Ouvrage (5 tons), tableau des matières refait sur les six éléments réels, règle de silhouette, les sept terrains retirés |
| `test/banc.test.js` | transcription portée à **33 teintes** |
| `CLAUDE.md` | palette 33, octets du `dist` corrigés |
| `INVENTAIRE-SPRITES.md` | lot 1 marqué produit, « quasi uni » retourné, raccord des champs annulé, chemin `art/sprites/terrain/` |
| `PLAN-PRODUCTION-SPRITES.md` | chemins corrigés |
| `PROMPTS-sol-de-base.md` | **v3** — clause des 80 % retournée, raccord annulé, pierre grise, règle de silhouette, planches marquées livrées |
| `RAPPORT-lotSOL-recolorisation.md` | **nouveau** — les mesures des huit tuiles de sol |
| `PASSATION-2026-08-27-nuit.md` | ce document |

`npm run check` après application : **286 pass / 0 fail**, `dist/index.html`
inchangé à 131 302 octets.

## 8. Ce qui reste ouvert

1. **S2 est à moitié faite sans que le plan le sache.** Six planches brutes sont
   au dépôt — `art/sources/P2.1` à `P2.6` — et couvrent les **quatorze unités du
   joueur**. Elles n'ont pas été conditionnées, pas mesurées, pas inscrites au
   plan. **C'est le premier travail de la prochaine session** : elles existent,
   elles ne coûtent aucune génération.
2. **La palette *Sol* du conditionneur n'existe toujours pas.** Les dix-huit
   tuiles ont été conditionnées en Python. Trois défauts de l'outil sont relevés
   depuis la veille et attendent un brief Claude Code.
3. **Amendement A9 — l'archivage des sources — est appliqué en fait**
   (`art/sources/` contient les jets bruts du lot 1 et de S2) **mais toujours pas
   écrit** dans l'inventaire.
4. **`LISEZ-MOI-DEPOT.md` a disparu du dépôt** entre le matin et le soir. Il
   décrivait où déposer les fichiers d'art ; l'arborescence a changé depuis —
   `art/sprites/` et non `sprites/` — donc sa perte n'est pas grave, mais rien ne
   documente plus la convention.
5. **Le fond procédural de la carte du monde** — tranché le 26, ni spécifié ni
   testé. C'est un lot de code, pas un lot d'art.
