# AMENDEMENT — lot RUINES-DÉFENSE

Répond au blocage consigné dans `RAPPORT-lotRUINES-DEFENSE.md` §7.3 (commit
`5ed957b`). Deux points : le diagnostic de la clé, et la question de méthode du §5.

---

## 1. Le taux de clé pure n'est pas un défaut de transport

Le rapport conclut que les fichiers reçus sont « un second transcodage, pas les
originaux », sur trois indices : en-tête `VP8 `, profil ICC de 456 octets, et
0,00 % de clé `#FF00FF` pure pour 55,50 % à 68,79 % de quasi-clé.

**Les deux premiers indices sont justes** : ce qui a été reçu était un collage
image, ré-encodé en WebP avec perte par le transport. La demande d'un fichier
joint est donc fondée, et c'est ce que livre ce ZIP.

**Le troisième ne l'est pas, et il faut le corriger avant qu'il ne serve de
critère.** Mesuré sur les PNG d'origine, avant toute mise en conversation :

| source d'origine | clé `#FF00FF` pure | couleur de fond dominante |
|---|---|---|
| `ruine defense joueur (1).png` | **0,00 %** | (252, 3, 250) à 13,0 % |
| `ruine defense joueur (3).png` | **0,00 %** | (252, 3, 250) à 13,6 % |
| `ruine defense joueur (4).png` | **0,01 %** | (251, 3, 249) à 10,3 % |
| `ruine defense joueur (5).png` | **0,00 %** | (252, 3, 250) à 12,1 % |
| `defense_ouvrage_ruine_variante_01..04` | **0,00 %** | (251, 2, 250) à 8,7–10,9 % |

Les chiffres relevés après transport sont donc **ceux des fichiers d'origine**.
Le transport n'a rien dégradé sur cet axe : le fond de ces sources n'a jamais
été une clé plate. C'est un fond bruité, légèrement dégradé — la signature d'une
génération par modèle d'image, pas d'un ré-encodage.

**Et ce n'est pas propre à ce lot.** Contre-exemple dans le dépôt, à mesurer
pour s'en convaincre :

| source déjà commitée dans `art/sources/` | clé pure | fond dominant |
|---|---|---|
| `M3_socles_o_tourelles_3_v2.png` | **0,00 %** | (248, 4, 250) à 12,6 % |
| `M1_socles_j_tourelles_3.png` | 82,39 % | (255, 0, 255) à 82,5 % |

Le seuil « 22,1 % de clé pure au minimum sur 152 planches » ne décrit donc pas
la plage réelle du dossier : au moins une planche du dépôt est à 0,00 %.
⚠ **Re-mesurer l'échantillon avant de réutiliser ce seuil comme garde-fou** — il
a probablement exclu les planches récentes, qui sont justement celles que ce lot
prolonge.

**Le critère du dépôt n'est pas la pureté de la clé, c'est `cond.est_fond`**, qui
teste une distance de 140. Un fond à (252, 3, 250) est à **5,9** du magenta :
très largement dans le seuil. Ces fichiers découpent correctement, et c'est
vérifiable en une ligne.

### Ce que ce ZIP livre en plus

Les huit PNG ont été **aplatis** : tout pixel déjà classé fond par
`cond.est_fond` est réécrit à `#FF00FF` exact. Opération neutre par
construction — elle ne touche aucun pixel du sujet — et le contrôle le vérifie :

| fichier | clé pure avant | après | masque `est_fond` | dmin sujet↔clé |
|---|---|---|---|---|
| `ruine_def_j_variante_01` | 0,00 % | 69,10 % | identique | 150,1 |
| `ruine_def_j_variante_02` | 0,00 % | 66,67 % | identique | 149,9 |
| `ruine_def_j_variante_03` | 0,01 % | 65,85 % | identique | 150,0 |
| `ruine_def_j_variante_04` | 0,00 % | 69,01 % | identique | 150,2 |
| `ruine_def_o_variante_01` | 0,00 % | 60,31 % | identique | 150,0 |
| `ruine_def_o_variante_02` | 0,00 % | 67,13 % | identique | 150,0 |
| `ruine_def_o_variante_03` | 0,00 % | 59,13 % | identique | 150,1 |
| `ruine_def_o_variante_04` | 0,00 % | 56,10 % | identique | 150,0 |

Le `dmin` à 150 est l'écartement de clé décrit dans `NOTE-LOT-ZENITHAL.md` : les
pixels du sujet qui passaient à moins de 150 de la clé ont été repoussés
radialement à 150, écart de couleur maximal 10 niveaux. Sans lui, cinq fichiers
du lot zénithal étaient à 140,0 pile, soit le seuil exact de `est_fond`.

⚠ **Les 24 autres fichiers du lot zénithal ont le même fond bruité** et ont reçu
le même aplatissement. Ils ne concernent pas ce lot-ci mais le lot ANCRES-ZÉNITH.

---

## 2. §5 — oui, ce lot prend le conditionnement et l'entrée dans l'atlas

La remarque est juste et le brief avait tort. Le §5 écrivait « le
conditionnement en 64/128 et l'entrée dans les atlas, **si ce n'est pas déjà
fait au moment de l'exécution** » : c'était une clause d'échappement, pas une
décision, et elle rendait le lot inexécutable.

**`nombreDeVariantes` compte les noms dans l'atlas.** Sans les huit sprites
cousus, elle lève, `nomDeVariante` ne rend rien, et ni T1 ni T2 ne peuvent
tourner. Couper là produirait un lot qui ne se teste pas, suivi d'un lot
trivial. Le conditionnement est d'ailleurs outillé — `tools/final128.py`,
`tools/atlas.py` — c'est de l'exécution, pas de la conception.

**Le §5 du brief est donc amendé** : la ligne « Le conditionnement en 64/128 et
l'entrée dans les atlas des huit sources » quitte la liste de ce qui n'est PAS
dans le lot. Tout le reste du §5 tient — les ruines de bâtiment restent à
`'planche'`, les ruines d'unité à `'rien'`, aucune retouche d'art, et les ancres
restent au lot ANCRES-ZÉNITH.

### Trois conséquences à porter au rapport

1. **Le choix de famille du §3.1 n'est plus théorique, il devient bloquant.** Si
   les ruines entrent dans la famille `batiment`, `nombreDeVariantes` doit lire
   `ATLAS.batiment` ; si elles ont une famille neuve, `tools/atlas.py` doit la
   connaître. Mesurer l'impact sur le poids du livrable avant de trancher, et
   écrire la raison.

2. **Le diff grossit de fichiers générés commités** — les `.webp` d'atlas et
   `atlas-empreintes.json`. C'est attendu ; ne pas chercher à l'éviter.

3. **La collision avec le lot ANCRES-ZÉNITH s'élargit.** Aux compteurs de
   `documentation.test.js` et à la ligne version/build de `CLAUDE.md` s'ajoutent
   désormais les fichiers d'atlas. ⚠ **Les deux lots ne peuvent plus courir en
   parallèle sur l'atlas** : soit ce lot passe en premier et ANCRES-ZÉNITH
   rebase, soit l'inverse, mais pas les deux à la fois. Arbitrage à demander à
   Ethan si les deux sont en vol.

---

## 3. Ce qui reste ouvert

Les sources `ruine_def_{j,o}_variante_01..04.png` de ce ZIP sont les originaux
aplatis, en PNG, 1254 × 1254 pour le joueur et 1024 × 1024 pour l'Ouvrage. Elles
n'ont pas encore été déclarées : `tools/entrees.py --declarer` reste à passer, et
c'est la première étape du lot.
