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

**157 sprites en 59 générations**, réparties en 11 sessions, plus le jet d'essai.
En un-par-un ce serait 164 générations : la planche divise par 2,8.

> **[CORRIGÉ 27/08.]** Deux changements, tous deux issus de la réécriture du §2.4
> de l'inventaire : `tile_horschamp` disparaît (S1 passe de 29/8 à **28/7**), et
> **S10 remonte juste après S7**. Les identifiants de session ne bougent pas —
> le journal du §13 resterait faux — c'est l'ORDRE DES LIGNES qui fait foi.

| # | Session | Sprites | Générations | Dépend de |
|---|---|---|---|---|
| **S0** | Jet d'essai | 0 | 7 | — |
| S1 | Terrain | 28 | 7 | S0 |
| S2 | Unités joueur | 14 | 6 | S0 |
| S3 | Unités Ouvrage | 14 | 6 | S0 (rampe validée) |
| S4 | Défenses joueur | 9 | 4 | S2 |
| S5 | Défenses Ouvrage | 9 | 4 | S3 |
| S6 | Bâtiments joueur | 11 | 4 | S2 |
| S7 | Bâtiments Ouvrage | 5 | 3 | S3 |
| **S10** | **Carte** | **13** | **4** | **S6, S7** |
| S8 | États de réparation | 7 | 3 | S6, S7 |
| S9 | Obstacles | 6 | 3 | S1 |
| S11 | Interface | 41 | 8 | tout le reste |
| | **Total** | **157** | **59** | |

Les 8 masques `tile_bord_*` ne sont pas là : ce sont des masques alpha,
procéduraux au rendu (§2.3 de l'inventaire). `bat_o_foyer_zero.png` non plus :
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

## 3. S1 — Terrain (28 sprites, 7 générations)

Réglages du conditionneur : régime **Tuile**, planche **2 × 2**, palette
*Joueur seul*.

Le lot idéal pour la planche : quatre variantes du même terrain n'ont aucune
échelle à tenir entre elles, elles doivent se ressembler par construction.
Chaque planche fait 2048 × 2048 et donne `_a`, `_b`, `_c`, `_d`.

- [ ] P1.1 — `tile_sterile_a…d` — vide, le fond de tout
- [ ] P1.2 — `tile_affleurement_a…d` — quartz, cristallin blanc-gris
- [ ] P1.3 — `tile_croute_a…d` — scorie, vitrifié sombre · **jamais un cristal vert**
- [ ] P1.4 — `tile_futaie_a…d` — bois
- [ ] P1.5 — `tile_friche_a…d` — broussaille
- [ ] P1.6 — `tile_suintement_a…d` — pétrole
- [ ] P1.7 — `tile_vasiere_a…d` — marais

⚠ **P1.8 — `tile_horschamp` — SUPPRIMÉE le 27/08.** Elle ne bordait que le
couloir de la carte monde, qui ne pave plus de tuiles. Le hors-couloir est
devenu un traitement du fond procédural. Ne pas la régénérer si elle
réapparaît dans une conversation.

⚠ Le terrain échappe à deux règles : pas de marge (bord à bord) et **régime A**,
aucune face visible. Une tuile inclinée ne se raccorde plus à sa voisine.

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

## 9. S9 — Obstacles (6 sprites, 3 générations)

Régime **A**, plats. Palette *Joueur seul*.

- [ ] P9.1 — **2 × 1** — `obs_infanterie_a`, `obs_infanterie_b`
- [ ] P9.2 — **2 × 1** — `obs_vehicule_a`, `obs_vehicule_b`
- [ ] P9.3 — **2 × 1** — `obs_les_deux_a`, `obs_les_deux_b`

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
| S1 | | | | |
| S2 | | | | |
| S3 | | | | |
| S4 | 26/08 | 4 | 3 | `def_j_creneau` validé au 1er jet, prompt libre. Les 3 relances ont toutes échoué : prompt coté → socle mangé (métal 1,2 %), correction chiffrée → accent à 42 %. C'est de là que sortent le §3 ter et les pièges 11-12 du brief. |
| S5 | | | | |
| S6 | | | | |
| S7 | | | | |
| S8 | | | | |
| S9 | | | | |
| S10 | | | | |
| S11 | | | | |

**Quand un jet est refusé** : noter ici ce qui a été changé dans le prompt, pas
seulement le refus. Le même défaut reviendra deux sessions plus tard, et sans la
note on refera l'aller-retour.

---

*v3 — 27/08/2026. Modèle de carte corrigé : S1 28/7, S10 remontée après S7,
total 157/59, `tile_horschamp` supprimée, fond de carte procédural. Voir
`RAPPORT-lotEMBLEME-carte-monde.md`.*

*v2 — 26/08/2026. `def_j_creneau` validé, méthode du sprite de référence ajoutée
au §0. v1 — 158 sprites, 60 générations, 11 sessions. Découpe en planches
établie sur la règle du §3 bis du brief : une planche ne regroupe que des sprites
qui doivent déjà se ressembler.*
