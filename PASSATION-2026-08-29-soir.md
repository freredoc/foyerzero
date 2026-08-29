# PASSATION — 2026-08-29 au soir — Foyer Zéro / `freredoc/chantier`

Écrite en fin de session. À lire avec `CLAUDE.md` au démarrage de la suivante.
Elle **remplace** `PASSATION-2026-08-29.md`, qui décrit l'état du matin —
0.32.0, 476 tests — et dont tous les nombres sont désormais faux.

⚠ **CE DOCUMENT DÉCRIT CE QUI ÉTAIT VRAI LE 29/08 AU SOIR.** Le dépôt décrit ce
qui EST vrai. Premier geste : lire `CLAUDE.md`, lister la racine, `src/` et
`tools/`, et confronter les nombres ci-dessous à `npm run check`.

⚠ **`npm test` SEUL ÉCHOUE ONZE FOIS SUR UN CLONE NEUF** — onze tests lisent
`dist/index.html`, que le dépôt ne suit pas. C'est `npm run check` qui fait foi,
et lui seul.

---

## 1. Où en est le dépôt

| Grandeur | Valeur mesurée le 29/08 au soir |
|---|---|
| Version | **0.39.0 · build 40** |
| `npm run check` | **535 pass / 0 fail** |
| `dist/index.html` | **529 105 octets** |
| `SAVE_VERSION` | **12** |
| `src/sim/` | 18 fichiers |
| Onglet mort restant | **Recherche**, et lui seul |

**Sept lots livrés dans la journée**, tous en simulation pure, aucun écran :
POINTS-D'ATTAQUE, SITE-D'UNE-CASE, SITE-ENTAMÉ, BUTIN-SOLDÉ,
RECHERCHE-AU-PRORATA, MULTIPLICATEUR, ACTE-DE-RAID. Chacun a son
`RAPPORT-lot*.md` à la racine.

**La boucle du raid est refermée** : `executerRaid` paie, compose l'assaut depuis
l'armée posée, résout, verse le butin, range la recherche, marque le site et
ramène les unités abîmées.

---

## 2. Les six arbitrages rendus par Ethan aujourd'hui

1. **Points d'attaque** — plafond `100 + 10 × niveau d'ARMÉE` (en dixièmes, donc
   158 à 5,8), **à cliquet** : il ne redescend jamais. Régénération **20 % du
   plafond par heure** — dicté à 10 %, rétabli à 20 % le même soir en découvrant
   que la table d'origine disait déjà exactement ça. Plein au départ.
2. **Territoire** — rayon 2, inchangé, **union des zones de toutes les bases**
   du joueur ; distance mesurée depuis la base qui attaque, en Tchebychev.
   Coût `10 + 1 × d` chez soi, `10 + 3 × d` ailleurs.
3. **Butin** — « livre **ce qui reste à livrer** » : une passe ne paie que ce
   qu'elle casse, un rasage solde ce qui était debout en arrivant.
4. **Points de recherche** — même règle : « cinquante plus cinquante, pas le
   double ». Sauf si la cible est réparée.
5. **Multiplicateur d'avant-poste** — le ×3,25 de la table est enfin appliqué.
6. **Ordre de travail** — l'acte de raid, puis cette passation. Ensuite : les
   sprites et les écrans.

---

## 3. ⚠ CE QUI DOIT ÊTRE ARBITRÉ EN PREMIER À LA PROCHAINE SESSION

**Le calibrage du début de partie.** Mesuré : le premier raid d'une partie neuve
fait 1 370 de butin, en encaisse **40**, et en jette **1 330 — 97 %**. Les trois
courbes ne se parlent pas au démarrage :

| | Au niveau 1 | Au niveau 20 |
|---|---|---|
| Capacité de stockage | 50 | — |
| Butin d'un camp | 4 050 | 1 323 668 |
| Coût d'une amélioration | 3 | 707 867 |

Plus haut, tout se rejoint — deux améliorations par raid au niveau 20, ce qui est
sain. **C'est le début qui est décalé.** Trois leviers, un nombre chacun :
l'ancrage du butin (300 au niveau 1), la capacité de départ, ou le coût des
premiers paliers.

⚠ **ET LA SATURATION ELLE-MÊME N'EST PAS ARBITRÉE.** Le lot retient que le butin
sature — sinon les quatre bâtiments de stockage perdent leur raison d'être et le
premier raid saute huit niveaux —, et le rapport de raid **dit** ce qui est perdu.
L'autre lecture, « le butin entre en entier et le surplus gèle », tient en six
lignes dans `verser` de `sim/raid.js`.

---

## 4. Les cinq écritures d'un raid, et où elles vivent

| Écriture | Module |
|---|---|
| débit des points d'attaque | `sim/points-attaque.js` |
| butin dans l'économie, avec saturation | `sim/raid.js` (`verser`) |
| points de recherche, en **chaîne décimale** | `etat.recherche.pointsMilli` |
| dégâts du site | `sim/site-entame.js` |
| dégâts de l'armée, plancher à 1 PV | `sim/raid.js` (`reporterLesDegats`) |

⚠ **LA RECHERCHE SE RANGE EN CHAÎNE, PAS EN NOMBRE.** Le barème dépasse l'entier
sûr dès le niveau 39 ; le compteur est un BigInt, et `JSON.stringify` lève
dessus. Se relit par `BigInt(x)`, **jamais** par `Number(x)`.

---

## 5. Trois dettes REQUALIFIÉES aujourd'hui, à ne pas rouvrir bêtement

1. **Les 4 645 ticks.** Portés par `CLAUDE.md` et trois rapports comme « un autre
   régime ». Mesuré : **deux raids sur 72** dépassent le plafond de 90 s, et le
   plafond leur coûte **0 % du butin** et 2,6 % de la recherche. Le raid est
   économiquement fini au tick 900 ; la queue, ce sont deux attaquants
   survivants qui grignotent une défense. **Ce n'est pas un régime, c'est un cas
   de bord.** Le plafond peut rester à 90 s.
2. **Le double comptage de la recherche.** Le rapport BUTIN-SOLDÉ l'a décrit
   comme « un barème à plat » : **c'était faux**, le barème était déjà
   proportionnel. L'excès valait une demi-part, pas une part. Le rapport est
   corrigé dans le dépôt, avec la raison.
3. **« Les avant-postes sont plus intéressants que les bases. »** Vrai depuis le
   lot MULTIPLICATEUR, faux avant. À niveau égal, un avant-poste rend maintenant
   3,3 fois ce qu'une défense équivalente rapporte ailleurs — et **cinq fois** un
   camp, parce qu'il porte aussi une fois et demie ses bâtiments.

---

## 6. Ce qui reste ouvert, par ordre d'urgence

1. **Le calibrage du début de partie** (§3) — arbitrage, pas code.
2. **Les écrans, et les sprites avec eux.** Rien de la journée n'est visible :
   `ui/monde.js` dessine la carte mais ne connaît ni le coût d'un raid, ni le
   mini-onglet, ni le bouton d'attaque. La spec d'écran est dans
   `PASSATION-2026-08-29.md` §4 et reste valable — halo sur la base attaquante,
   premier toucher pour le mini-onglet, second pour entrer dans la cible.
   `resumeCourant` de `sim/site-entame.js` rend EXACTEMENT le contenu du
   mini-onglet.
3. **La réparation du joueur** — bâtiments, unités, défenses. Le raid abîme
   l'armée sans donner le moyen de la remettre sur pied.
   `MODELE-REPARATION-1.md` §3 et §4 portent tout le modèle, réserve de temps
   comprise. **Aucun arbitrage à demander avant de commencer.**
4. **L'arbre de recherche.** `FOYER-ZERO-RECHERCHE.xlsx` porte les coûts de
   déblocage ; **aucun n'est en code**. Son LISEZ-MOI dit que la cadence reste à
   caler, et `ARBRE-RECHERCHE.md` §4 pose six questions, dont « les modules
   ont-ils des niveaux », qui double la taille de l'arbre selon la réponse.
5. **Les blocages d'1 h et 24 h.** La spec §10 les range dans un tableau de
   géographie sans dire s'ils portent sur le site de l'Ouvrage ou sur la base du
   joueur qui vient d'être attaquée. Ils appartiennent à l'acte de raid, qui les
   ignore aujourd'hui.
6. **Le rayon du territoire.** Ethan a gardé 2 ; son exemple oral — « un camp à
   trois cases coûte 13 » — supposait 3 ou plus. À rayon 2, il coûte 19, et le
   tarif bon marché ne dépasse jamais 12.
7. **Deux niveaux adjacents dans une base de l'Ouvrage** : la spec le promet, le
   générateur donne un seul niveau. Mesuré.
8. **Les obstacles ne sont pas stables par case.** Ethan a arbitré que deux camps
   successifs gardent les mêmes ; la saveur l'est, les obstacles non — 2 cases
   communes sur 10, mesuré. `genererSite` les place en dernier, après les
   bâtiments : les tenir demande de les tirer en premier et d'apprendre à
   `placerDefenses` à les éviter, donc de déplacer chaque défense de chaque site
   déjà généré.

---

## 7. Trois leçons de méthode, payées aujourd'hui

**Une mesure, ce n'est pas un tirage.** J'ai affirmé qu'une base rapportait 10 à
20 % de plus qu'un avant-poste à niveau égal, sur **un seul** tirage de garnison,
alors que la composition varie de ±10 points. Sur 120 tirages, c'est l'inverse
qui est vrai — la base a 10 % de défense en PLUS, exactement le ×1,1 de
`DENSITE`. Ethan l'a corrigé de mémoire.

**Lire le calcul, pas le commentaire.** J'ai décrit les points de recherche comme
« un barème à plat » sur la foi d'un commentaire et d'un filtre, alors que le
calcul multipliait bien par la fraction de PV trois lignes plus bas. C'est la
faute que `CLAUDE.md` nomme déjà : justifier une propriété par un mécanisme qu'on
n'a pas ouvert.

**La garde d'un numéro de version appartient à UN fichier.** Trois fichiers de
test assertaient `SAVE_VERSION === N` ; chaque nouveau maillon en rendait un
rouge pour une raison qui ne le regardait pas. Elle vit désormais dans le test du
maillon le plus récent, et ailleurs on vérifie que la chaîne va jusqu'au bout.

⚠ **Et la règle ajoutée à `CLAUDE.md` §0 ce matin a servi tous les lots
suivants** : chercher la réponse dans `src/data/`, la spec et les relevés TA
**avant** de demander un arbitrage. Trois des quatre questions posées le matin
avaient déjà leur réponse dans le dépôt.
