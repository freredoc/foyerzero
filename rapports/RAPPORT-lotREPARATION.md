# RAPPORT — lot RÉPARATION — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.39.0 · build 40 | **0.40.0 · build 41** |
| `npm run check` | 535 pass / 0 fail | **548 pass / 0 fail** |
| `dist/index.html` | 529 105 octets | **530 268 octets** (+1 163) |
| `SAVE_VERSION` | 12 | **13** |
| `src/sim/` | 18 fichiers | 19 |

---

## 1. Tout était écrit, dans trois documents qui se recoupent

Presque rien de ce lot n'a été décidé aujourd'hui.

**`MODELE-ECONOMIQUE.md` §7** — « Quatre réservoirs — infanterie, véhicules,
aviation, base — qui réparent **en parallèle**. `coût_total = Σ coût(réservoir)`,
`temps_total = max(temps(réservoir))`. Concentrer ses pertes sur un réservoir
coûte pareil mais immobilise plus longtemps ; les répartir libère plus vite. »
C'est **exactement** ta phrase de ce soir, écrite il y a plusieurs jours.

**`RELEVE-TA-COURBES-2.md` §4** — la formule, vérifiée à 0,02 % sur sept points :

```
T(L, C) = base_unité × 1,15^(L−1) / D(C)
D(C)    = 1,09^(min(C,12)−1) × 1,12^max(C−12, 0)
```

Et **la base par unité était déjà dans `data/combat.js`**, champ `reparation`,
en secondes : 441 pour les Fusiliers, 972 pour le Ratisseur, 1 605 pour
l'Enclume. Elle n'est pas proportionnelle aux PV, c'est une donnée par unité.

**`MODELE-REPARATION-1.md` §3** — quel bâtiment commande quel châssis, et que le
coût se paie en scorie, indexé sur le niveau de l'unité.

⚠ **LA RUPTURE DU DIVISEUR EST AU NIVEAU 12, PAS AU 11.** Quatre autres systèmes
changent de régime au 11 — dégâts, coûts des bâtiments, coûts des unités — et
celui-ci fait exception. Un test le mesure des deux côtés ; l'aligner « pour
faire propre » déplacerait la série relevée.

## 2. Ce que ça donne, mesuré

Réparation **pleine** d'une unité de niveau 10, en minutes :

| Unité | Bâtiment 1 | 5 | 12 | 20 | 30 |
|---|---|---|---|---|---|
| Fusiliers | 25,9 | 18,3 | 10,0 | 4,0 | 1,3 |
| Ratisseur | 57,0 | 40,4 | 22,1 | 8,9 | 2,9 |
| Enclume | 94,1 | 66,7 | 36,5 | 14,7 | 4,7 |

Tes ordres de grandeur — 30 min d'infanterie, 20 de véhicule, 1 h d'aviation —
tombent pile dans cette table. La série Caserne du relevé (25 483 s au niveau 1
jusqu'à 133 s au niveau 50, unité figée au 30) est restituée à moins de 1 % par
un test.

## 3. Deux fautes de lecture attrapées par l'exécution

**Un châssis revient d'un bloc, pas pièce par pièce.** Mon premier jet donnait à
chaque unité SON propre temps, si bien qu'une petite pièce finissait avant une
grosse à l'intérieur du même châssis. C'est faux : « j'ai 30 minutes de répa
infanterie » est **un** nombre pour tout le châssis, la somme de ce que ses
pièces demandent, et le réservoir se vide d'un bloc. Le parallélisme joue
**entre** les châssis, jamais à l'intérieur. Un test le tient maintenant, et il
tombe si on revient en arrière.

**Un montage de test illégal qui ne se voyait que dans un seul test.** Mes trois
bâtiments réparateurs tombaient sur des champs et dépassaient les emplacements
d'un Chantier de niveau 1. Ça ne lève pas à la pose à la main — seulement au
CHARGEMENT, où `verifierEtat` fait son travail. Douze tests passaient, le
treizième disait la vérité.

## 4. Le seul nombre que je n'ai pas trouvé

`MODELE-REPARATION-1.md` §3 dit que le coût se paie en **scorie** et qu'il est
indexé sur **le niveau de l'unité**, « et rien d'autre » — sans donner d'ancre.

⚠ **RETENU, À ARBITRER : réparer une unité de fond en comble coûte ce que sa
dernière montée a coûté.** `REPARATION.partDuCoutDeMontee`, valeur 1, un seul
nombre à changer. Conséquences mesurées :
- une unité de **niveau 1 est gratuite** à réparer — elle n'a jamais été montée,
  ce qui est cohérent avec un premier niveau gratuit à poser ;
- un Fusilier de niveau 20 entièrement détruit coûte **530 903 de scorie**, quand
  un camp de même niveau en rapporte 1,3 M. Forcer un raid se paie cher, ce qui
  est la propriété que `MODELE-ECONOMIQUE.md` §7 réclame : « le joueur qui
  attaque bien ne paie rien, celui qui force paie cher. »

## 5. Le bonus ne se met pas en banque

« Les points de réparation bonus disparaissent si on refait un raid avec la même
armée. » `executerRaid` appelle donc `annulerLaReparation`, qui **avance
d'abord** puis abandonne : ce qui a déjà été rendu reste rendu, le temps restant
est perdu, et la scorie payée ne se rembourse pas. Sans le « avance d'abord », le
joueur verrait ses unités remonter dans le temps au moment de partir.

## 6. Les treize tests, et les quatre falsifications

| Faute injectée | Ce qui est tombé |
|---|---|
| le temps s'additionne au lieu de prendre le maximum | tests 3, 5 **et 9** |
| chaque pièce reprend son propre temps | test 6 |
| la rupture du diviseur disparaît | tests 1 **et 2** |
| un châssis sans bâtiment se répare quand même | test 4 |

Le test 5 **rejoue ta phrase** : trois châssis abîmés inégalement, on lance, et
au bout du temps des véhicules ils sont finis **et les deux autres ont avancé
d'exactement autant**. C'est ça, les minutes gratuites.

## 7. Fichiers livrés

| Fichier | État |
|---|---|
| `src/sim/reparation.js` | **neuf**, 300 lignes |
| `test/reparation.test.js` | **neuf**, 13 tests |
| `src/data/sites.js` | table `REPARATION` — les deux pentes, la rupture, l'ancre du coût |
| `src/sim/state.js` | champ `reparation`, `SAVE_VERSION` 13, maillon v12 → v13, les deux chemins |
| `src/sim/raid.js` | un raid abandonne la réparation en cours |
| `test/raid.test.js`, `test/state.test.js`, `test/chantier.test.js` | gardes de version et maquette |
| `CLAUDE.md`, `package.json` | arborescence, comptes, 0.40.0 · build 41 |

## 8. Ce qui reste

1. **`REPARATION.partDuCoutDeMontee`** (§4) — un nombre, à toi.
2. **Le calibrage du début de partie** — le premier raid jette 97 % de son butin
   faute de stockage. C'est le sujet ouvert le plus important, et il demande un
   arbitrage, pas du code.
3. **Les écrans et les sprites.** Rien de la journée n'est visible. `resumeCourant`
   rend exactement le contenu du mini-onglet, `devisDeLaReparation` exactement
   celui d'un bouton « réparer ».
4. **La réparation des bâtiments et de la défense.** Ce lot ne fait que l'armée ;
   `MODELE-REPARATION-1.md` §3 porte les deux autres régimes — le Chantier
   commande le temps des bâtiments, le Complexe de défense répare tout
   gratuitement en une heure, joueur comme Ouvrage.
