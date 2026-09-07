# RAPPORT — lot SATELLITES : le journal entre dans l'état

Exécuté le 29/08/2026, à la suite du lot OBSTACLES. **Simulation pure — aucun
écran.**

Tous les nombres de ce rapport ont été obtenus **par exécution**, jamais estimés.

---

## 1. Départ et arrivée, mesurés

| | Avant | Après |
|---|---|---|
| Version | 0.28.0 · build 29 | **0.29.0 · build 30** |
| `npm test` | 415 pass / 0 fail | **427 pass / 0 fail** (+12) |
| `dist/index.html` | 183 645 octets | **188 451 octets** (+4 806) |
| Marge sous la borne T10 | 8,2 % | **5,8 %** |
| `SAVE_VERSION` | 7 | **8** |

---

## 2. Ce que le lot livre

`src/sim/satellites.js` — les deux camps et l'avant-poste qui suivent la base du
joueur : programmés à la fondation et à chaque déplacement, parus cinq minutes
plus tard, tirés dans leur anneau, et **reprogrammés à la destruction**.

`etat.satellites` — la première chose du dépôt qui porte de l'**histoire**
plutôt qu'un état instantané, et donc la première qui se sauvegarde vraiment.
`sim/peuplement.js` recalcule les bases de l'Ouvrage à partir de la graine ; les
satellites, eux, dépendent de ce que le joueur a fait.

Et la migration **7 → 8**, qui **programme** les trois apparitions au lieu de les
poser — sinon une sauvegarde v7 verrait trois sites surgir à l'instant du
chargement, en sautant les cinq minutes arbitrées.

---

## 3. Le numéro d'instance est tout le journal

Ton arbitrage du 29/08 — « deux camps successifs sur la même case ont les mêmes
champs et une autre disposition de bâtiments » — se range dans **un entier**. Le
terrain se dérive de la CASE, les bâtiments de la case ET de l'instance. Stocker
les bâtiments serait ranger ce qu'on sait recalculer.

Le compteur ne se remet jamais à zéro, pas même à un déménagement, et un test
refuse un satellite dont l'instance dépasse le compteur — c'est la forme que
prendrait exactement cette faute.

---

## 4. La falsification a démoli trois de mes quatre tests

C'est le fait marquant du lot, et il vaut mieux que tous les autres nombres.

| Défaut injecté | Premier essai | Après correction |
|---|---|---|
| le tirage passe par `etat.rng` | **VERT** | 1 test |
| une attente non satisfaite est jetée | **VERT** | 1 test |
| un satellite peut se poser sur une base de l'Ouvrage | **VERT** | 1 test |
| le compteur d'instances est remis à 1 | 3 tests | 3 tests |

**Pourquoi le premier passait.** J'avais écrit — dans le module et dans le test —
qu'un tirage consommant `etat.rng` ferait diverger les deux chemins
d'avancement. C'est **faux aujourd'hui** : rien d'autre ne consomme le flux
pendant un tick, l'économie étant analytique, donc les deux chemins le consomment
identiquement et l'égalité tient même sur du code fautif. La justification était
jolie et elle ne mesurait rien. Un test dédié compare maintenant l'état du flux
avant et après une apparition.

**Pourquoi le deuxième passait.** Le cas d'un anneau saturé n'arrive jamais
naturellement. Il fallait le fabriquer : vingt-quatre occupants factices dans
l'anneau des camps, puis une attente.

**Pourquoi le troisième passait, et c'est le plus intéressant.** L'exclusion des
bases de l'Ouvrage est **inerte au départ** : la garde du peuplement vide quinze
cases autour de la fondation, et les anneaux vont au plus à cinq. Ils tiennent
donc entièrement dans le vide. La règle ne mord que lorsque le joueur s'est
**rapproché** — ce que le test simule maintenant, sur une position dont l'anneau
porte dix bases.

Les trois commentaires qui affirmaient le contraire ont été réécrits.

---

## 5. Ce que j'ai décidé faute d'arbitrage

Trois choses, toutes signalées dans le code, toutes réversibles en une ligne :

1. **Le délai d'un respawn** — retenu : le même que l'apparition, cinq minutes.
2. **La case d'un respawn** — retenu : un nouveau tirage dans l'anneau, c'est-à-
   dire le même mécanisme rejoué.
3. **Les anciens satellites disparaissent au déménagement.** Lecture de la spec
   §10, qui indexe l'avant-poste sur « le rayon et la **présence** du joueur ».

---

## 6. Ce qui reste ouvert

1. **Rien ne détruit un satellite.** `detruireSatellite` existe et est testée,
   mais aucun raid ne l'appelle : le raid n'existe pas. C'est la fonction qui
   attend, pas le mécanisme.
2. **Aucun écran ne montre tout ça.** La carte reste à faire, et c'est elle qui
   rendra les satellites visibles.
3. **La marge sous la borne T10 est à 5,8 %.** Trois lots de simulation pure ont
   mangé 7 000 octets ; l'écran de la carte en mangera bien davantage. La
   décision — relever la borne ou sortir les sprites du HTML — ne peut plus
   attendre beaucoup.
4. **Le raid à 4 645 ticks** signalé au lot CARTE n'a toujours pas été regardé.

---

## 7. Vérification appareil — NON EXÉCUTÉE

Rien de ce lot ne se voit. La seule chose observable serait indirecte : ouvrir
une partie, attendre cinq minutes, et constater qu'aucun plantage ne survient au
moment où les trois apparitions se résolvent.
