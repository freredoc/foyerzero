# PLAN-PRODUCTION-SPRITES.md — Foyer Zéro

> **C'est le fichier de suivi.** ChatGPT n'a pas de mémoire d'une conversation à
> l'autre, et une session sur deux commencera sur une page blanche. La mémoire du
> chantier, c'est ce fichier : on coche, on commite, la session suivante reprend
> à la première case vide.
>
> À lire avec `BRIEF-SPRITES-IA.md` (comment demander) et `INVENTAIRE-SPRITES.md`
> (ce qu'il faut). Ce document-ci dit **dans quel ordre, groupé comment, et où on
> en est**.

---

## 0. Le protocole d'une session

1. Ouvrir une **conversation neuve** dans ChatGPT. Une par session de ce plan.
2. Coller le **contrat du §2 du brief**, en entier, sans le résumer.
3. Enchaîner les générations de la session, une par ligne du tableau.
4. **Recoller le contrat toutes les dix images.** Il dérive, c'est mesuré.
5. Passer tout le lot dans `tools/conditionneur.html`, avec les réglages notés
   dans la colonne *Réglages*.
6. Juger sur les vignettes à 40 px, pas sur les images en 1024.
7. Cocher ici, commiter les PNG et ce fichier ensemble.

**Ne jamais demander à ChatGPT de se souvenir du projet.** Il ne le peut pas
entre deux conversations, et à l'intérieur d'une seule il oubliera la moitié du
contrat au bout de vingt messages. Tout ce qui doit tenir est dans le contrat
recollé.

**Ne jamais faire corriger une image.** Une retouche renvoie une image
régénérée, donc hors palette. On corrige le prompt et on relance.

---

## 1. Vue d'ensemble

**141 sprites en 60 générations**, réparties en dix sessions, plus le jet
d'essai. En un-par-un ce serait 148 générations : la planche divise par 2,5.

> **[27/08, nuit — S1 close.]** Le lot 1 a coûté **11 générations pour 18
> fichiers**, pas 5 : la planche a échoué et le lot a été fini **une image par
> fichier, avec des prompts de quatre lignes**. Le rendement par génération est
> deux fois pire, le taux de rebut est bien meilleur, et le résultat est le
> premier lot passé du premier coup. Cette leçon vaut pour les sessions
> suivantes : ce tableau est probablement optimiste partout.

> **[REFONDU 27/08 au soir — v4.]** Le lot 1 a changé d'objet : il ne décrit plus
> le terrain de la carte du monde mais **le sol du champ de bataille et ce qu'on
> pose dessus**. Trois conséquences sur ce tableau, toutes issues du §2 de
> l'inventaire v5, lui-même mesuré sur `src/data/` :
>
> - **S1 passe de 28 sprites en 7 générations à 18 en 5.** Les sept matières et
>   leurs quatre variantes n'existent plus : `ressourceDeLaCase` de
>   `sim/champs.js` rend une ressource **ou `null`** — le champ de bataille n'a
>   que deux états de terrain, nu ou champ.
> - **S9 disparaît.** Les six obstacles sont dans S1 : même sol, même palette,
>   même correctif de contrat. Les produire ailleurs, c'est les produire deux
>   fois.
> - **Les identifiants de session ne bougent toujours pas** — le journal du §13
>   resterait faux. C'est l'ORDRE DES LIGNES qui fait foi, et S10 reste juste
>   après S7.

| # | Session | Sprites | Générations | Dépend de |
|---|---|---|---|---|
| **S0** | Jet d'essai | 0 | 7 | — |
| **S1** | **Sol de base et éléments posés** | **18** | **11** | S0 |
| S2 | Unités joueur | 14 | 6 | S0 |
| S3 | Unités Ouvrage | 14 | 6 | S0 (rampe validée) |
| S4 | Défenses joueur | 9 | 4 | S2 |
| S5 | Défenses Ouvrage | 9 | 4 | S3 |
| S6 | Bâtiments joueur | 11 | 4 | S2 |
| S7 | Bâtiments Ouvrage | 5 | 3 | S3 |
| **S10** | **Carte** | **13** | **4** | **S6, S7** |
| S8 | États de réparation | 7 | 3 | S6, S7 |
| ~~S9~~ | *Obstacles — absorbée dans S1* | — | — | — |
| S11 | Interface | 41 | 8 | tout le reste |
| | **Total** | **141** | **60** | |

Les 8 masques `tile_bord_*` ne sont pas là, et cette fois **ce n'est pas parce
qu'ils seraient procéduraux** : ils n'existent plus du tout. Sur un sol unique il
n'y a rien à raccorder — le sous-problème s'évapore (§2 de l'inventaire v5).
`tile_horschamp` non plus, supprimée le 27/08. `bat_o_foyer_zero.png` non plus :
reporté (§5.3). Le **fond de la carte monde** non plus : procédural au canvas,
zéro fichier, tranché le 27/08 (§2.4 de l'inventaire).

**Règle de groupement**, celle qui a produit toutes les planches ci-dessous :
*une planche ne regroupe que des sprites qui doivent déjà se ressembler.* Jamais
deux coûts différents, jamais deux camps, jamais deux régimes d'inclinaison.

---

## 2. S0 — Jet d'essai (7 générations, une par une)

Aucune planche : on y compare deux rampes, et le modèle harmonise ce qu'il met
côte à côte. Détail au §6 du brief.

- [x] Pylône Ouvrage, **rampe A** — régime C · validé 27/08 · `art/ouvrage/ref_pylone.png`
- [x] Pylône Ouvrage, **rampe B** — régime C · écarté 27/08
- [x] Marcheur `off_o_fendeur`, **rampe A** — régime B · validé 27/08 · `art/ouvrage/ref_marcheur.png`
- [x] Marcheur `off_o_fendeur`, **rampe B** — régime B · écarté 27/08
- [x] Dard générique, **rampe A** — régime B · validé 27/08 · `art/ouvrage/ref_dard.png`
- [x] `off_j_meute` — 3 figures, casques blancs pleins — régime B · validé 27/08 · `art/joueur/ref_meute.png`
- [x] `def_j_creneau` — tourelle, socle dégagé — régime C · validé 26/08 en S4

**S0 EST CLOSE — 7 sur 7, le 27/08.** Trois sorties, toutes acquises :

1. **La rampe de l'Ouvrage** est l'ardoise violacée, écrite dans
   `FICHE-STYLE.md` §3. S3, S5 et S7 sont débloqués.
2. **La forme du Dard** est arrêtée, dette 2 close (§5.2 du brief). Les quatre
   aéronefs de S3 s'en déclinent au compteur de pièces.
3. **Quatre sprites de référence** au dépôt, un par famille :
   `art/ouvrage/ref_pylone.png` (structure), `art/ouvrage/ref_marcheur.png`
   (blindé Ouvrage), `art/ouvrage/ref_dard.png` (aéronef Ouvrage),
   `art/joueur/ref_meute.png` (escouade joueur), plus
   `art/def_j_creneau_source.png` (tourelle joueur) validé en S4.

⚠ **`def_j_creneau` ne se régénère plus.** Un cinquième jet a été produit le
27/08 et écarté : accent 33 %, métal 0,9 %, châssis 59 % contre 18,9 / 24,6 /
24,8 pour le sprite validé — socle disparu, tube absent, plus un second accent
jaune parasite sur une tourelle anti-véhicule. C'est le quatrième échec de la
famille par le même mécanisme, les pièges 11 et 12. **La suite de P4.3 passe par
la référence jointe, pas par une relance.**

---

## 3. S1 — Sol de base et éléments posés (18 sprites) — **CLOSE le 27/08**

> **Les cinq prompts sont écrits mot pour mot dans `PROMPTS-sol-de-base.md`.**
> Ce §-ci dit l'ordre et l'état, il ne duplique pas les prompts : en cas de
> divergence entre les deux, c'est le fichier de prompts qui fait foi.

Ce que ce lot habille : les **162 cases** de `GRILLE` (9 × 18, `data/combat.js`),
et rien d'autre. Un sol quasi uni sur toute la surface, un par camp, et
par-dessus des sprites plus petits — **12 cases de champ** dans la bande des
bâtiments (rangées 11–18), **10 obstacles** dispersés dans la bande de défense
(rangées 3–10). Rien de ce lot ne s'affiche sur la carte du monde.

⚠ **Le lot commence par un correctif de contrat** — §0 de
`PROMPTS-sol-de-base.md`, à coller AVANT le premier prompt. Il remplace la
palette, la clause de vue et la clause d'orientation du §2 du brief. Sans lui le
modèle emprunte les tons d'entité : c'est exactement ce qui a coûté 32 fichiers
au premier jet du terrain.

| # | Fichiers | Régime | Découpe | État |
|---|---|---|---|---|
| P1.1 | `tile_sol_j_a…d` | Tuile | — | **[x] LIVRÉE 27/08** — `art/sprites/terrain/` |
| P1.2 | `tile_sol_o_a…d` | Tuile | — | **[x] LIVRÉE 27/08** — recolorisation de P1.1, zéro génération |
| P1.3 | `champ_quartz_a`·`_b` · `champ_scorie_a`·`_b` | Entité | — | **[x] LIVRÉE 27/08** — 2 jets libres, variantes par retournement |
| P1.4 | `obs_infanterie_a`·`_b` · `obs_vehicule_a`·`_b` | Entité | — | **[x] LIVRÉE 27/08** — 4 jets libres |
| P1.5 | `obs_les_deux_a`·`_b` | Entité | — | **[x] LIVRÉE 27/08** — 2 jets libres |

⚠ **Les deux planches de sol ne sortent pas des prompts.** Elles viennent d'un
jet libre, recolorisé sur la rampe puis conditionné en Python. Le prompt de sol
demandait « presque uni, 80 % d'un ton » et produisait une plaque plate ; la
tuile gardée n'a **aucun ton dominant**. Les §1 et §2 de `PROMPTS-sol-de-base.md`
sont corrigés en conséquence, et `RAPPORT-lotSOL-recolorisation.md` porte les
mesures. **Le lot passe de 5 générations à 3.**

Palette du conditionneur : **Sol** pour les cinq planches, rognage 3 px, seuil
magenta 140. ⚠ La palette *Sol* n'existe pas encore dans l'outil — tourner en
palette *aucune* et faire vérifier les tons à la main, comme pour le premier jet.

Les **huit** tuiles de sol sont livrées dans `art/sprites/terrain/`, en 128 × 128,
grille 32, cinq couleurs exactement, gros pixel de 4 px — vérifié fichier par
fichier. Le contrôle décisif du §7 des prompts, les deux camps posés sur les deux
sols, est passé : `essai/quatre-combinaisons.png`.

Trois règles de raccord, qui ne valent que dans ce lot et qui se contredisent
entre elles — c'est voulu, elles ne portent pas sur les mêmes fichiers :

1. **P1.1 et P1.2 n'ont pas de marge.** Tuiles jointives, 32 × 32 gros pixels
   bord à bord, aucun magenta. **L'anneau extérieur de 2 gros pixels est
   entièrement du ton de sol nu** — c'est la seule chose qui empêche la couture,
   et c'est ce qui a fait passer 56570 là où sa jumelle, bordure décorative
   visible, a été jetée.
2. ~~**P1.3 est l'exception inverse.**~~ ⚠ **ANNULÉ le 27/08 au soir.** Les
   champs ne se raccordent plus : ce sont des sujets isolés, marge normale, et un
   bloc de 2 ou 3 cases montre autant de gisements distincts. Décision d'Ethan,
   prise sur pièce. Toute mention de « milieu des quatre bords » ailleurs dans ce
   plan ou dans les prompts est périmée.
3. **P1.4 et P1.5 gardent la marge normale** du contrat : 2 gros pixels vides sur
   les quatre bords. Un obstacle est isolé sur sa case, il ne se raccorde à rien.

Deux interdits qui valent pour les cinq planches :

- **Aucun vert, nulle part.** Le vert est la couleur des unités du joueur : une
  végétation verte rendrait une escouade invisible sur sa propre base. La
  végétation de ce décor est sèche et morte.
- **Aucune couleur d'accent sur un obstacle** — il ne tue rien.

⚠ **Les 29 tuiles de l'ancienne S1 ne se commitent pas.** Elles décrivaient un
écran qui n'existe pas. `RAPPORT-S1-terrain.md` reste au dépôt comme trace, pas
comme instruction : son §5, son §6 et sa dernière ligne (« S1 close ») portent
tous sur le lot périmé.

---

## 4. S2 — Unités du joueur (14 sprites, 6 générations)

Régime **B** (face de 1 à 2 gros pixels), régime conditionneur *Entité*,
palette *Joueur seul*. Groupé par châssis **et par coût** : mettre deux coûts
dans une planche, c'est demander au modèle d'aligner leurs tailles.

- [ ] P2.1 — **2 × 1** — `off_j_meute`, `off_j_perceurs` — escouade 5 pts, **3 figures**, 18 × 18
- [ ] P2.2 — **3 × 1** — `off_j_guetteur`, `off_j_fouisseurs`, `off_j_carapace` — escouade 10 pts, **5 figures**, 24 × 24
- [ ] P2.3 — **3 × 1** — `off_j_ratisseur`, `off_j_fendeur`, `off_j_belier` — blindé 10 pts, **1 tube**, 24 × 24
- [ ] P2.4 — **2 × 1** — `off_j_broyeur`, `off_j_pilon` — blindé 15 pts, **2 tubes**, 28 × 28
- [ ] P2.5 — **3 × 1** — `off_j_crecelle`, `off_j_busard`, `off_j_frappeur` — aéronef 10 pts, **3 modules**, 24 × 24
- [ ] P2.6 — **1 × 1** — `off_j_enclume` — aéronef 15 pts, **5 modules**, 28 × 28

À l'intérieur d'une planche, **seul l'accent change** — blanc, rouge ou jaune —
et c'est exactement ce qu'on veut : même châssis, même taille, même nombre de
pièces, une seule variable. Le rappeler dans le prompt.

---

## 5. S3 — Unités de l'Ouvrage (14 sprites, 6 générations)

Même découpe que S2, palette *+ rampe A* ou *B* selon S0. La traduction de
grammaire est dans le §7 du brief : escouade → essaim, blindé → marcheur,
aéronef → Dard.

- [ ] P3.1 — **2 × 1** — `off_o_meute`, `off_o_perceurs`
- [ ] P3.2 — **3 × 1** — `off_o_guetteur`, `off_o_fouisseurs`, `off_o_carapace`
- [ ] P3.3 — **3 × 1** — `off_o_ratisseur`, `off_o_fendeur`, `off_o_belier`
- [ ] P3.4 — **2 × 1** — `off_o_broyeur`, `off_o_pilon`
- [ ] P3.5 — **3 × 1** — `off_o_crecelle`, `off_o_busard`, `off_o_frappeur`
- [ ] P3.6 — **1 × 1** — `off_o_enclume`

---

## 6. S4 et S5 — Les dix-huit défenses (4 générations chacune)

Régime **C** (face de 4 à 7 gros pixels) : elles sont ancrées, rien ne les
transforme. Monolithiques (A5), le tube n'est plus un fichier séparé.

**S4, joueur** — palette *Joueur seul*
- [ ] P4.1 — **1 × 1** — `def_j_merlon` — mur, **aucun tube, aucun accent**
- [ ] P4.2 — **2 × 1** — `def_j_ronce` (blanc), `def_j_herse` (rouge) — barrières, aucun tube
- [~] P4.3 — **3 × 1** — `def_j_casemate`, `def_j_creneau`, `def_j_batterie` — tourelles ai/av/aa
      · **`def_j_creneau` VALIDÉ** (26/08) — c'est **le sprite de référence de toute
        la famille tourelle**, source 1024 à conserver. Mesuré : accent 18,9 %,
        métal 24,7 %, châssis 24,8 %, emprise 23 × 28 gp, 10 couleurs.
      · reste `casemate` (blanc, deux canons fins) et `batterie` (jaune, canon fin
        incliné), à produire en planche 2 × 1 avec la référence jointe.
- [ ] P4.4 — **3 × 1** — `def_j_faucheuse`, `def_j_mortier`, `def_j_harpon` — artilleries, **châssis véhicule**, tube rallongé de moitié

**S5, Ouvrage** — palette *+ rampe*
- [ ] P5.1 — **1 × 1** — `def_o_merlon`
- [ ] P5.2 — **2 × 1** — `def_o_ronce`, `def_o_herse`
- [ ] P5.3 — **3 × 1** — `def_o_casemate`, `def_o_creneau`, `def_o_batterie`
- [ ] P5.4 — **3 × 1** — `def_o_faucheuse`, `def_o_mortier`, `def_o_harpon`

⚠ Les trois artilleries sont des **véhicules de forme, défenses de fonction** :
châssis véhicule, régime C. Seul endroit du projet où les deux axes divergent.

---

## 7. S6 et S7 — Bâtiments (4 + 3 générations)

Régime **C**, le plus généreux : ce sont les seules entités du jeu qui ont une
vraie hauteur. Groupé **par PV**, parce que les PV donnent l'empreinte.

**S6, joueur — 11 sprites**
- [ ] P6.1 — **1 × 1** — `bat_j_chantier_de_construction` — 5 500 PV, le plus gros, sa chute rase la base
- [ ] P6.2 — **2 × 1** — `bat_j_centre_de_commandement`, `bat_j_qg_de_defense` — 3 000, les deux QG
- [ ] P6.3 — **2 × 2** — `bat_j_caserne`, `bat_j_usine`, `bat_j_aerodrome`, `bat_j_complexe_de_defense` — 2 500 · les trois premiers **portent le châssis qu'ils sortent**
- [ ] P6.4 — **2 × 2** — `bat_j_centrale`, `bat_j_accumulateur`, `bat_j_collecteur`, `bat_j_raffinerie` — les **deux couples réciproques**, à lire comme des paires

**S7, Ouvrage — 5 sprites**
- [ ] P7.1 — **1 × 1** — `bat_o_souche` — 5 500, sa destruction rase le site
- [ ] P7.2 — **1 × 1** — `bat_o_etai` — 2 500, sa chute bloque la réparation
- [ ] P7.3 — **3 × 1** — `bat_o_noeud`, `bat_o_gangue`, `bat_o_terril` — **gangue et terril partagent la forme**, seule la matière les distingue

P6.4 et P7.3 sont les deux planches où le regroupement fait le travail : ce sont
précisément les sprites qui doivent se ressembler, et les mettre dans la même
image produit la ressemblance au lieu de l'espérer.

---

## 8. S8 — États de réparation (7 sprites, 3 générations)

Se juge **sur les bâtiments finis**, jamais dans le vide : d'où la position
après S6 et S7.

- [ ] P8.1 — **3 × 1** — `dmg_1_abime`, `dmg_2_tres_abime`, `dmg_3_partiel` — **régime A**, calques plats, neutres, moitié de la surface vide
- [ ] P8.2 — **2 × 1** — `dmg_4_ruine_j_a`, `dmg_4_ruine_j_b` — régime C
- [ ] P8.3 — **2 × 1** — `dmg_4_ruine_o_a`, `dmg_4_ruine_o_b` — régime C

Contrôle décisif : poser les trois surcouches sur le même bâtiment et vérifier
que 2 et 3 ne se confondent pas à 40 px. Si elles se confondent, la surcouche a
raté son seul travail.

---

## 9. S9 — Obstacles — **ABSORBÉE DANS S1 le 27/08**

Les six fichiers `obs_*` sortent de P1.4 et P1.5 (§3) : même sol, même palette,
même correctif de contrat. Ce numéro n'est gardé que pour que le journal du §13
reste lisible — **il n'y a rien à générer ici.**

⚠ Si une conversation ressort « S9, six obstacles, palette *Joueur seul*, régime
A » : c'est la v3 de ce plan. Les obstacles se font en palette *Sol*, avec le
correctif du §0 des prompts.

---

## 10. S10 — Carte (13 sprites, 4 générations)

> **Se produit après S7, pas en avant-dernier** (§1). Depuis le 27/08 ces treize
> fichiers sont **tout le visuel de la carte** : le fond, les frontières, les
> niveaux et les halos sont procéduraux, il ne reste qu'eux et du texte.

Régime **C** : la carte est la même vue que le combat.

Trois règles propres à cette session, et à elle seule :

1. **Se juge à 47 et à 100 px CSS**, les deux bouts mesurés du zoom (§2.4 de
   l'inventaire), pas à la vignette de 40 px du §6 du brief.
2. **L'emblème porte la signature de son terrain** — un camp sur de la scorie se
   lit comme tel sans clic. La ressource se dessine DANS l'emblème, jamais à
   côté sous forme d'un champ séparé.
3. **La grille n'est pas tranchée.** Générer P10.1 en 32/128 ET en 64/256, les
   comparer aux deux tailles de rendu, et trancher là — dette 3 bis du §8 de
   l'inventaire. Les trois planches suivantes attendent ce verdict.

- [ ] P10.1 — **3 × 1** — `poi_camp`, `poi_avant_poste`, `poi_base_ouvrage` — ⚠ la base doit **dire qu'elle attaque**
- [ ] P10.2 — **3 × 1** — `poi_base_joueur`, `poi_avant_poste_joueur`, `poi_base_terminale`
- [ ] P10.3 — **3 × 1** — `poi_veine_quartz`, `poi_coulee_scorie`, `poi_reacteur`
- [ ] P10.4 — **2 × 2** — `poi_cantonnement` (blanc), `poi_parc_roulant` (rouge), `poi_plot_aerien` (jaune), `poi_redoute` (aucun accent)

---

## 11. S11 — Interface (41 sprites, 8 générations)

**Pas de vue de dessus** : ce sont des pictogrammes, la clause de régime saute et
il faut le dire dans chaque prompt (§7 du brief). En dernier, parce qu'une icône
de module se dessine d'après le module fini.

- [ ] P11.1 — **3 × 1** — `ui_quartz`, `ui_scorie`, `ui_electricite`
- [ ] P11.2 — **2 × 2** — `ui_point_attaque`, `ui_point_armee_offense`, `ui_point_armee_defense`, `ui_point_recherche` — ⚠ les deux points d'armée sont **non fongibles**, ils ne doivent pas se ressembler
- [ ] P11.3 — **3 × 2** — `ui_cible_ai/av/aa` + `ui_chassis_escouade/blinde/aeronef`
- [ ] P11.4 — **2 × 2** — `ui_categorie_mur/barriere/tourelle/artillerie`
- [ ] P11.5 — **4 × 2** — modules 1–8 : `fumigene`, `camouflage`, `emp`, `munition_speciale`, `tir_de_barrage`, `vol_de_vie`, `booster`, `pv_plus_vingt`
- [ ] P11.6 — **3 × 2** — modules 9–14 : `garnison`, `rayon_mini_moins_un`, `ecraseur`, `rayon_plus_un`, `auto_reparation`, `bouclier`
- [ ] P11.7 — **3 × 2** — `ui_pv`, `ui_degats`, `ui_butin`, `ui_reparation`, `ui_temps`, `ui_niveau`
- [ ] P11.8 — **2 × 2** — `ui_verrou`, `ui_emplacement`, `ui_vague`, `ui_budget`

⚠ Une icône de module doit dire **l'effet, jamais le porteur** : un même module
peut équiper une unité du joueur et une défense de l'Ouvrage.

---

## 12. Aucune planche d'animation

Le §8 de `FICHE-STYLE.md` tient : **un sprite par entité, tout le mouvement par
transformation** — oscillation à la marche, décalage de texture des chenilles,
recul au tir, rotation et fondu à la mort, sinusoïde en vol. Rien dans ce plan ne
produit de frame, et le moteur n'en consomme aucune.

Si une planche devient nécessaire un jour, l'invariant d'Archipel s'applique :
**frame 0 pixel-pour-pixel identique au sprite statique** — et c'est précisément
ce qu'un modèle d'image ne sait pas garantir. La question se rouvre après S2,
sur pièce, pas avant.

---

## 13. Journal

Une ligne par session terminée. C'est ce tableau qui répond à « où on en est »
quand la session suivante commence sur une page blanche.

| Session | Date | Générations | Refusées | Notes |
|---|---|---|---|---|
| S0 | 27/08 | 5 | 1 | 5 cases sur 7. **Deux générations pour quatre fichiers** : la rampe B est la substitution ton pour ton de la A, 0 pixel d'écart hors rampe. Rampe A retenue sur les trois critères. Dard et `off_j_meute` validés au premier jet dans la foulée : **S0 close 7/7**. Le seul refus est un cinquième `def_j_creneau`, écarté au profit de celui du 26/08. Trois écarts au brief acceptés par Ethan — double accent sur le pylône, régime sans face mesurable, aucun module répété : voir `RAPPORT-S0-rampe-ouvrage.md` §4, ils deviennent la norme de la famille. |
| S1 | 27/08 | 8 + 3 | 7 | ⚠ **Deux lots différents sous le même nom.** L'ANCIENNE S1 a livré 29 tuiles de terrain en 8 générations, 0 régénération — lot périmé le soir même, **ne pas commiter** (`RAPPORT-S1-terrain.md`). La S1 REFONDUE a une planche sur cinq : `tile_sol_j_a…d`, génération 56570, validée au premier pavage — 9 × 18 cases posées au hasard avec rotation, **aucune couture**, une première dans ce projet. Une planche jumelle écartée, et la raison est reprenable telle quelle : bordure décorative visible au lieu de l'anneau uni de 2 gros pixels. Puis les six jets conformes au prompt de sol ont tous donné la même plaque plate : le lot a été fermé autrement, par recolorisation d'un jet libre — **8 fichiers de sol livrés, 2 planches économisées, la clause « 80 % d'un ton » retirée du prompt**. Puis les six jets conformes au prompt de sol ont tous donné la même plaque plate : le lot a été fermé autrement, par recolorisation d'un jet libre — **8 fichiers de sol livrés, la clause « 80 % d'un ton » retirée du prompt**. Les dix éléments posés ont suivi le même chemin, **une image par fichier, prompt de quatre lignes**, palette et grille rattrapées au conditionnement : 10 jets retenus, 4 écartés (versions « compactes » sans raccord), 4 sprites de validation antérieurs abandonnés. **S1 close, 18 fichiers, aucun défaut ouvert.** |
| S2 | | | | |
| S3 | | | | |
| S4 | 26/08 | 4 | 3 | `def_j_creneau` validé au 1er jet, prompt libre. Les 3 relances ont toutes échoué : prompt coté → socle mangé (métal 1,2 %), correction chiffrée → accent à 42 %. C'est de là que sortent le §3 ter et les pièges 11-12 du brief. |
| S5 | | | | |
| S6 | | | | |
| S7 | | | | |
| S8 | | | | |
| ~~S9~~ | — | — | — | **Absorbée dans S1** le 27/08, voir §9. |
| S10 | | | | |
| S11 | | | | |

**Quand un jet est refusé** : noter ici ce qui a été changé dans le prompt, pas
seulement le refus. Le même défaut reviendra deux sessions plus tard, et sans la
note on refera l'aller-retour.

---

*v6 — 27/08/2026, nuit. **S1 close** : les dix éléments posés livrés, prompts
courts et un sujet par image, conditionnement en Python. Le raccord des champs
est obtenu par surdimension mesurée, pas par le prompt. Total 141/60. Voir
`RAPPORT-lotP1.3-P1.5.md`.*

*v5 — 27/08/2026, nuit. Grille **32** retenue pour le sol, sur pièce. Les huit
tuiles de sol livrées sans passer par une génération de planche : recolorisation
d'un jet libre, rampe de l'Ouvrage réalignée en clarté sur celle du joueur. S1
passe à 3 générations restantes, total 141/52. Voir
`RAPPORT-lotSOL-recolorisation.md`.*

*v4 — 27/08/2026, soir. Lot 1 refondu : S1 n'est plus le terrain de la carte
mais le sol du champ de bataille et les éléments posés — 18 fichiers en 5
planches, prompts dans `PROMPTS-sol-de-base.md`. S9 absorbée dans S1. Masques de
transition supprimés, pas rendus procéduraux. Total 141/54. Voir
`PASSATION-2026-08-27-soir.md` §3 et l'inventaire v5 §2.*

*v3 — 27/08/2026. Modèle de carte corrigé : S1 28/7, S10 remontée après S7,
total 157/59, `tile_horschamp` supprimée, fond de carte procédural. Voir
`RAPPORT-lotEMBLEME-carte-monde.md`.*

*v2 — 26/08/2026. `def_j_creneau` validé, méthode du sprite de référence ajoutée
au §0. v1 — 158 sprites, 60 générations, 11 sessions. Découpe en planches
établie sur la règle du §3 bis du brief : une planche ne regroupe que des sprites
qui doivent déjà se ressembler.*
