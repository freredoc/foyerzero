# RAPPORT — lot RECHERCHE-AU-PRORATA — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.36.0 · build 37 | **0.37.0 · build 38** |
| `npm run check` | 521 pass / 0 fail | **523 pass / 0 fail** |
| `dist/index.html` | 528 838 octets | **528 895 octets** (+57) |
| `SAVE_VERSION` | 11 | **11, inchangé** |

---

## 1. ⚠ Une correction, d'abord : mon rapport d'hier disait faux

Le rapport BUTIN-SOLDÉ affirmait que `pointsRecherche` versait « un barème par
défense endommagée, **à plat** », donc un **double** comptage. **C'est faux.** Le
barème est proportionnel à la fraction de PV détruits depuis le lot RECHERCHE du
25/08 : le calcul multiplie bien par `pvPerdusMilli / pvMaxMilli`.

L'erreur vient d'une lecture du **commentaire** — « barème par défense
détruite » — et du filtre `pvPerdusMilli === 0`, au lieu du calcul qui suit trois
lignes plus bas. C'est exactement la faute que `CLAUDE.md` nomme : justifier une
propriété par un mécanisme qu'on n'a pas ouvert. Le rapport d'hier est corrigé
dans le dépôt, avec la raison, pour qu'une session future ne relise pas la
fausse version.

L'excès réel était donc d'**une demi-part**, pas d'une part entière : 50 % à la
première passe, 100 % à la seconde, soit 150 % pour une cible qui n'a qu'une vie.

## 2. Ce qu'Ethan a tranché, et ce que ça change

« Tu tapes une défense à qui il reste cinquante pour cent, tu l'achèves, tu n'es
pas censé avoir le double : tu as cinquante plus cinquante. **Sauf si elle est
réparée.** »

C'est mot pour mot la règle du butin, appliquée aux points de recherche :

```
avant :  points = barème × facteurÉco × module × (pvMax − pvFinal) / pvMax
après :  points = barème × facteurÉco × module × (pvInitial − pvFinal) / pvMax
```

`pvInitialMilli` existait déjà — le lot BUTIN-SOLDÉ l'avait posé sur l'entité.
Le lot tient donc en une ligne de calcul, et **aucune migration** : sur un site
intact les deux quantités coïncident, donc tous les raids de référence rendent
exactement les mêmes nombres.

Et la réparation remarque, sans une ligne de plus : l'Étai debout rend leurs PV
aux défenses survivantes en une heure, donc leurs PV de départ reviennent au
plein, donc les casser est un travail à nouveau. C'est la seconde moitié de ta
phrase, et elle sort du mécanisme au lieu d'être écrite.

## 3. ⚠ Deux tests de référence mesuraient l'ancienne règle

Les deux T13 — `combat.test.js` et `generateur.test.js` — montaient leur cible
**déjà entamée** (`pvMilli` réduit dans le montage) pour signifier « détruite à
50 % ». Sous la nouvelle règle, ça ne veut plus dire la même chose : une cible
montée à moitié et laissée tranquille **rapporte zéro**, puisqu'elle a été payée
à la passe précédente. Les deux tests devenaient rouges en disant vrai.

Ils ont été **réécrits pour dire la même chose autrement** : la cible se monte
pleine, et c'est la ligne de résultat qu'on abaisse — ce que le moteur aurait
fait pendant la passe. **Les nombres mesurés n'ont pas bougé d'une unité** :
1 585 milli-points pour le Merlon de niveau 3, 24 377 381 190 pour le Broyeur de
niveau 50, et le produit intermédiaire toujours hors de l'entier sûr, ce qui
reste la seule chose que le second tient vraiment.

C'est le genre de modification qu'il faut regarder deux fois : un test de
référence qu'on réécrit pour qu'il passe est presque toujours une faute. Ici
l'intention du test — « le barème dépend du niveau et de la fraction détruite »
— est intacte, et c'est la définition de « détruite » qui a changé sous lui. Le
commentaire de chaque test le dit, avec la date.

## 4. Mesuré

Sur la garnison de l'avant-poste de la graine 2026 :

| | Points de recherche |
|---|---|
| Tout détruit en **une** passe | référence |
| Moitié, puis achevé — **règle d'avant** | ≈ 1,5 × la référence |
| Moitié, puis achevé — **règle d'Ethan** | **= la référence**, à la troncature près |

La troncature est celle de la division BigInt, une par cible et par passe : deux
moitiés peuvent rendre un milli-point de moins que le tout. Le test encadre des
deux côtés — jamais au-dessus, jamais 1 % en dessous.

Falsification : remettre `pvPerdusMilli` à la place de la perte de la passe fait
tomber les deux tests neufs.

## 5. Ton intuition sur les avant-postes : mesurée, et elle ne tient pas ENCORE

Tu as écrit qu'en jeu on ne rase pas les bases de l'Ouvrage parce que les
avant-postes sont plus intéressants. Mesuré, à niveau ÉGAL, graine 2026 :

| Niveau | Site | Bâtiments | Force | Butin total | Butin / point de défense |
|---|---|---|---|---|---|
| 10 | avant-poste | 13 | 61 | 71 526 | 1 173 |
| 10 | **base** | 14 | 60 | **78 679** | **1 311** |
| 30 | avant-poste | 31 | 319 | 43 634 464 | 136 785 |
| 30 | **base** | 34 | 290 | **47 550 377** | **163 967** |
| 50 | avant-poste | 35 | 447 | 12 696 860 377 | 28 404 609 |
| 50 | **base** | 39 | 413 | **14 139 685 421** | **34 236 526** |

**Aujourd'hui, à niveau égal, la base est meilleure** — de 10 à 20 % de butin par
point de défense —, parce qu'elle porte 10 % de bâtiments en plus et que rien ne
compense côté avant-poste.

Ce qui manque est exactement la dette signalée au lot SITE-D'UNE-CASE :
**`TYPES_SITE.avantPoste.multiplicateurButin: 3.25` n'est lu par personne.**
Applique-le et l'avant-poste passe à ~3 fois le butin d'une base de même niveau
— et ta phrase devient vraie. Ton intuition décrit donc le jeu **tel qu'il est
conçu**, pas tel qu'il tourne.

Deux nuances qui jouent dans ton sens même sans le multiplicateur :
- un avant-poste près de ta base est de niveau **rayon ±1**, donc bien plus bas
  qu'une base plus haut sur la carte : moins cher en points d'attaque, à ta
  portée, et il **respawne** ;
- une base ne se prend que d'un coup — si la Souche ne tombe pas dans la
  fenêtre, tout ce que tu as cassé revient en une heure.

## 6. Fichiers livrés

| Fichier | État |
|---|---|
| `src/sim/combat.js` | `pointsRecherche` compte la perte de CETTE passe |
| `test/site-entame.test.js` | deux tests neufs : 50 + 50, et la cible réparée |
| `test/combat.test.js`, `test/generateur.test.js` | les deux T13 réécrits (§3) |
| `SPEC-FOYER-ZERO.md` | §9 porte la règle et la phrase d'Ethan |
| `RAPPORT-lotBUTIN-SOLDE.md` | **la fausse affirmation d'hier, corrigée** (§1) |
| `CLAUDE.md`, `package.json` | comptes, 0.37.0 · build 38 |

## 7. Ce qui reste

1. **Le multiplicateur de butin de l'avant-poste** (§5) — c'est le lot qui rend
   ta phrase vraie, et il touche l'équilibre économique du raid.
2. **L'acte de raid** : débiter les points d'attaque, composer l'assaut depuis
   ton armée, verser le butin dans l'économie, ramener les unités abîmées.
3. **Les 4 645 ticks d'un raid** contre le plafond de combat. Toujours jamais
   regardé, et l'acte de raid ne pourra plus l'éviter.
4. Les blocages d'1 h et 24 h, le rayon du territoire, les deux niveaux
   adjacents d'une base.
