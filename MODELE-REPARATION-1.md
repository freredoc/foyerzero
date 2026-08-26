# Foyer Zéro — plancher de PV et modèle de réparation

Dicté par Ethan le 24/08/2026. Ce document **remplace** le plancher de 1 % et la réparation
gratuite de 70 % de `SPEC-FOYER-ZERO.md` §1, §2 et §10. À replier dans la spec.

---

## 1. Le plancher est à 1 PV, pas à 1 %

Le plat est meilleur que le pourcentage, et pour une raison mécanique : les dégâts sont
proportionnels aux PV restants. Une Casemate à 1 PV sur 350 tire à
`floor(15 × 1000 × 1000 / 350000) = 42` milli-PV par tir, soit 0,42 PV par seconde. À 1 % elle
en ferait cinq fois plus. À 1 PV, c'est un sac à points de vie, littéralement.

---

## 2. Qui plancher, qui meurt

Le plancher sépare **le renouvelable du définitif**. C'est lui qui décide de la géographie
économique du jeu.

| Objet | Plancher | Meurt vraiment |
|---|---|---|
| Bâtiments de la base du joueur, **sauf le central** | 1 PV | non |
| **Chantier de construction** — central du joueur | aucun | **oui** |
| Défenses du joueur | 1 PV | non |
| **Unités offensives du joueur** | 1 PV | non |
| Bâtiments d'une **base** de l'Ouvrage, **sauf la Souche** | 1 PV | non |
| **Souche** — central ennemi | aucun | **oui** |
| Défenses d'une **base** de l'Ouvrage | 1 PV | non |
| **Tout**, dans un camp ou un avant-poste | **aucun** | **oui, définitif** |

**Le central est la seule exception, et il faut qu'il le soit** : si tout planchait, le Chantier
ne tomberait jamais, la sanction la plus lourde du jeu ne se déclencherait pas ; et la Souche ne
tomberait jamais non plus, donc aucune base ne se raserait, donc la carte ne s'ouvrirait plus.

Chantier détruit → la base du joueur est rasée : tout est détruit définitivement, les ressources
stockées sont pillées, redéploiement 20 cases vers le bas.

**Camps et avant-postes ne planchent rien.** Ce qui y tombe est perdu pour toujours. Et si l'Étai
tombe pendant l'attaque, même les défenses survivantes et abîmées ne seront plus jamais réparées.
D'où l'arbitrage : abattre l'Étai à la première passe rend la seconde peu coûteuse.
**Objectif de calibrage : un camp ou un avant-poste se rase en deux passes.**

---

## 3. Réparation — trois régimes disjoints

| Ce qu'on répare | Ce qui commande le **temps** | Ce qui commande le **coût** | Ressource |
|---|---|---|---|
| Bâtiments de la base | niveau du **Chantier de construction** — plus haut, plus court | **niveau du bâtiment réparé**, et rien d'autre | quartz |
| Unités offensives | niveau de la **Caserne**, du **Dépôt de véhicules** ou de l'**Aérodrome**, selon le châssis | **niveau de l'unité**, et rien d'autre | scorie |
| Défenses | niveau du **Complexe de défense** | **gratuit** | — |

Le découpage des ressources tombe juste avec la spec §1 : le quartz répare les bâtiments, la
scorie répare les unités offensives, la défense n'est financée par rien.

Correspondance châssis → bâtiment de réparation : Escouade → Caserne · Blindé → **Dépôt de
véhicules** · Aéronef → Aérodrome. (Les clés sont `caserne`, `depotDeVehicules` et `aerodrome`
dans `src/data/base.js`.)

### Les bâtiments de l'Ouvrage se réparent seuls, en une heure

Sur une **base** ennemie, quoi qu'il arrive, tout est revenu au bout d'une heure. C'est pénalisant
pour le joueur : il a dépensé des raids, et s'il ne fait pas tomber la Souche dans la fenêtre,
**tout ce qu'il a cassé est perdu**. Une base se prend d'un coup ou pas du tout.

Le joueur, lui, n'a droit à aucun remboursement automatique : il paie ses réparations.
L'asymétrie est voulue.

### La défense, cas à part

Le Complexe de défense répare **tout**, **gratuitement**, **en une heure** — joueur comme Ouvrage.
Ce n'est plus 70 % des PV perdus : c'est la totalité.

Le temps ne descend **jamais sous une heure**, mais il peut être **supérieur** si le niveau des
unités en défense dépasse celui du Complexe.

C'est ce qui rend le Complexe intéressant. Le **QG de défense** fixe le plafond de niveau des
défenses ; rien n'empêche donc de monter des défenses au-delà du niveau du Complexe. On y gagne
en puissance, on y perd en disponibilité. Deux bâtiments, deux leviers, un vrai arbitrage.

---

## 4. La réserve de temps de réparation

Le temps de réparation est une **grandeur qui s'accumule**, à la manière d'un idle, et que toute
réparation consomme. Les bâtiments de la base et les unités offensives **puisent dans la même
réserve** : on ne peut pas mener 24 h de réparation de base et 24 h de réparation d'offense.

Le joueur qui fait n'importe quoi est donc puni deux fois : il attend bêtement, **et** ça lui
coûte deux ressources.

La défense est hors réserve — gratuite, sur son horloge propre.

---

## 5. Ce que ça remplace

| Endroit | Ancien | Nouveau |
|---|---|---|
| SPEC §1 | « seule joue la réparation gratuite de 70 % assurée par le complexe » | 100 %, en une heure |
| SPEC §2 | constante « Réparation gratuite après raid : 70 % des PV perdus, au prorata des PV du complexe » | supprimée |
| SPEC §2 | constante « Plancher de PV des défenseurs : 1 % » | plancher à **1 PV**, et seulement sur base et joueur |
| SPEC §10 | « Bâtiment détruit : réparé en 1 h » (base) | inchangé, mais gratuit **pour l'Ouvrage seulement** |

Rappel : rien de tout ça n'entre dans le moteur de combat. Le lot 2A détruit à 0 et rapporte les
PV bruts. Planchers et réparations sont une **écriture d'après-raid**, lot 2B.

---

## 6. Ce qui reste ouvert

1. ~~Les PV ne montent pas avec le niveau.~~ **Clos le 24/08** : PV et dégâts suivent la même
   courbe que tout le reste, ×1,32 par niveau. Voir `COURBE-DE-NIVEAU-2.md`.
2. ~~**La base du joueur** : sept bâtiments nommés, onze attendus.~~ **Clos le 25/08** :
   `src/data/base.js` porte les onze, Chantier de construction compris. ⚠ `BASE-DU-JOUEUR-1.md`
   est resté à l'état du 24/08 et annonce encore sept sur onze : c'est `base.js` qui fait foi.
3. ~~**Deux bâtiments sans nom Foyer Zéro**.~~ **Clos le 26/08** : le central est le **Chantier
   de construction** (Souche côté Ouvrage) et le bâtiment des blindés le **Dépôt de véhicules**,
   clé `depotDeVehicules`. Ce document disait « atelier » — corrigé au §3 le même jour.
4. **La réserve de temps** : quatrième grandeur au même rang que quartz et scorie, ou compteur
   interne ? Taux d'accumulation ? Plafond ?
5. ~~Un Complexe endommagé répare-t-il moins ?~~ **Clos le 24/08** : oui, au prorata de ses PV —
   mais **il se répare lui-même**, donc son débit s'accélère au fil de l'heure et le site revient
   entier malgré tout. C'est une récupération auto-entretenue, pas un taux fixe : la condition
   « tout est revenu au bout d'une heure » est la borne qui en fixera la constante. Seul le joueur
   est réellement pénalisé, puisque lui paie ses bâtiments et ses unités.
6. **Formule du dépassement** : de combien le temps de réparation dépasse-t-il l'heure quand les
   défenses sont au-dessus du Complexe ?
7. **Barèmes** : coût et temps de réparation par niveau, pour les bâtiments comme pour les unités.
