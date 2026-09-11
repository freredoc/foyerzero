# RAPPORT — lot RAPPORTS-ET-PLEIN

**11/09/2026.** Les deux demandes d'Ethan venues après le point 4 : **ouvrir un
rapport du journal pour voir ce qui s'est passé**, et **savoir, au toucher d'une
ressource, dans combien de temps le stock sera plein**.

S'applique sur `main` = **`f22b63a`** (« lot journal ecran »), vérifié avant de
commencer : les neuf fichiers de la livraison précédente y sont byte-identiques,
la suite y est verte.

⚠ **PAS DE BRIEF : la livraison est faite de fichiers du dépôt**, donc écrite et
vérifiée par exécution.

---

## 1. Version, build, verdict

**0.99.50 · build 152**, bumpés ensemble dans `package.json`, la ligne de
révision de `CLAUDE.md` suit.

| | avant | après |
|---|---|---|
| tests déclarés | 1577 | **1579** |
| mesuré | 1576 pass · 0 fail · 1 skipped | **1578 pass · 0 fail · 1 skipped** |
| `npm run check` | 0 | **0** |

`npm run build` → `dist/index.html`, **9 372 186 octets**, 0 référence externe.

---

## 2. Coût en octets, poste par poste

Contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de `main` =
`f22b63a` (**9 369 216 octets**).

| poste | avant | après | écart |
|---|---|---|---|
| JavaScript (`<script>`) | 410 376 | 413 046 | **+2 670** |
| feuille (`<style>`) | 3 945 990 | 3 946 290 | **+300** |
| balisage | 5 012 727 | 5 012 727 | **+0** |
| images / audio | — | — | **+0** |
| **total** | **9 369 216** | **9 372 186** | **+2 970** |

La somme des postes tombe exactement sur le total des DEUX côtés, et il y a
**307 URI `data:` de part et d'autre** : pas un octet d'image ni de son.
Borne T10 **inchangée à 9 600 000**, marge **227 814 octets, 2,37 %**.

---

## 3. Les rapports s'ouvrent

⚠⚠ **RIEN NE MANQUAIT DANS LA SAUVEGARDE, ET CE CONSTAT A ÉVITÉ UN
`SAVE_VERSION`.** Un rapport d'attaque porte **quinze** champs, un rapport de
défense **treize** ; le journal en montrait **quatre**. Aucun rejeu, aucune
migration : le détail se LIT dans l'entrée rangée au moment du raid. `JRN T9`
garde toujours qu'aucun chiffre n'est recomposé depuis l'état d'aujourd'hui.

**L'accordéon.** Un toucher sur une section la déplie, le même la replie, un seul
à la fois. Le détail **s'ajoute** aux quatre lignes du résumé — replier ne doit
pas effacer ce qu'on lisait, déplier ne doit pas faire relire autre chose. Le
titre porte un chevron (`▾` / `▴`), et le titre d'une section dépliable passe en
olive : deux marques pour un geste qui ne se devine pas.

⚠ **LA CLÉ DU DÉPLIANT N'EST PAS L'INDICE DANS LA LISTE.** Le journal est une
FILE de dix : à l'arrivée du onzième rapport, le plus ancien sort et tous les
indices glissent d'un cran. Un dépliant ouvert sur l'indice 3 se retrouverait
ouvert sur un autre raid **pendant que le joueur le regarde**. La clé est
`tick:sens`, et `JD T1` sature la file pour le mesurer.

**Le côté défense n'avait aucune vue à réemployer**, et c'était la moitié aveugle
du journal : un raid MENÉ finit sur un panneau qui rend ses quinze lignes, un
raid SUBI se produit pendant que le joueur fait autre chose et n'a jamais eu
d'écran. D'où `lignesDeLaDefense` : fin du combat, durée, défense et bâtiments
restants, garnison et bâtiments **au plancher**, réserve de réparation vidée ou
intacte, auto-réparation **quand elle a agi**, et le recul en cases quand la base
est rasée.

⚠ **« AU PLANCHER » N'EST PAS « DÉTRUIT »**, et le mot doit le dire : une pièce
au plancher se répare, et c'est justement à ça que sert la réserve. Écrire
« perdues » enverrait reconstruire ce qui se répare.

⚠ **L'AUTO-RÉPARATION NE SE DIT QUE QUAND ELLE A AGI.** À zéro, la ligne
apprendrait qu'un module existe sans dire qu'il n'est pas acquis — deux
informations différentes pour le même « 0 ».

---

## 4. `src/ui/rapport.js` est né d'un cycle d'imports

⚠⚠ **PAS D'UN GOÛT DE RANGEMENT.** Les quinze lignes d'un rapport d'attaque
étaient déjà écrites par `lignesDuResultat` — une fonction pure de `ui/raid.js`.
Or `ui/raid.js` **importe** `ui/chantier.js`, où le journal vivait : faire lire
l'une par l'autre fermait la boucle, et recopier aurait fait deux vues du même
rapport, ce que `JRN T8` refuse depuis le lot JOURNAL.

Arborescence : **`chantier.js` ← `rapport.js` ← `raid.js`**, et `session.js` lit
`rapport.js`. **Aucune flèche ne remonte** — `JRN T8`, réécrit, le mesure dans
les deux sens.

Ont déménagé, **sans être dupliqués** : `lignesDuResultat`, `formaterDuree`,
`pct`, `LIBELLE_CHASSIS` (de `ui/raid.js`), `vueDuJournal`, `sectionDuRapport`,
`SENS_DU_RAPPORT`, `TITRE_JOURNAL`, `JOURNAL_VIDE` et les deux lignes de bilan
(de `ui/chantier.js`). `LIBELLE_VERDICT` est resté où trois fichiers le lisent.

⚠ **LE RENDU PARTAGÉ NE SAIT RIEN DU JOURNAL.** `peindreVueDuPanneau` pose
seulement `data-cle` quand une section en porte une, sous un nom **générique** :
les trois autres fiches n'en posent pas, et rien ne change pour elles — pas
d'attribut, pas de classe, pas un octet.

---

## 5. Le bandeau bascule en « plein dans »

⚠⚠ **LE DÉLAI VIENT DU MOTEUR.** `ticksAvantLaSaturation` refait l'arithmétique
du tick — résidu par bâtiment, `floor((residu + n × debit) / TICKS_PAR_HEURE)` —
et résout l'inégalité par dichotomie sur une somme monotone. Un
`manque / débitTotal` écrit dans l'écran aurait été un second modèle de
l'économie. Trois réponses : un entier de ticks, **`0`** si le stock est déjà au
plafond, **`null`** si rien ne produit — « jamais à ce rythme », et une base neuve
est dans ce cas pour les trois ressources.

⚠⚠ **LA FORME DE LA BASCULE EST UNE MESURE, PAS UN GOÛT.** Relevé au S25 FE dans
la police réelle de la ligne (8 px) : une tuile fait **66,58 px** — elles sont
**cinq**, pas quatre — et « plein 12 min 34 s » en demande **69,31**. La durée ne
peut donc pas s'AJOUTER à la ligne du bas : elle doit la REMPLACER, et si une
tuile la remplace, les cinq doivent le faire, sinon le joueur compare des lignes
qui ne disent pas la même chose. C'est ce qui fait de ce point une BASCULE de
tout le bandeau plutôt qu'une info par tuile.

⚠ **LE PICTOGRAMME PART AUSSI** : 16,09 + 3 d'écart + 47,25 pour la durée la plus
large (« 59 min 59 s ») = **66,34 px** pour un cadre de 66,58. **0,24 px** de mou
n'est pas une marge, c'est une coïncidence — le premier arrondi de police la
mange. La durée seule en laisse **19,33**.

⚠ **LA TUILE D'ATTAQUE PARLE AUSSI, et il a fallu défaire une règle de ce matin.**
Son débit était caché hors de la carte parce qu'il ne tenait pas À CÔTÉ du
pictogramme et du mot ; basculée, la ligne ne porte plus que la durée, donc la
place est là. Les deux sélecteurs ont la **même spécificité** — un identifiant et
quatre classes de chaque côté —, c'est donc l'ORDRE qui tranche, et la règle
d'exception doit rester APRÈS. Le déplacer plus haut la rendrait inopérante sans
qu'aucun test de présence ne s'en aperçoive.

⚠ **LA TUILE DES EMPLACEMENTS NE BASCULE PAS** : elle n'a ni débit ni plafond qui
se remplisse, et lui faire dire « jamais » serait répondre à une question qu'elle
ne pose pas.

---

## 6. Les deux tests neufs, et ce qu'ils mesurent vraiment

**`PL T1` — `ticksAvantLaSaturation` tombe sur le tick où le moteur sature**
(`test/economie-base.test.js`). Montage : une base réelle à trois producteurs,
**1 234 ticks d'avance** pour que chacun ait son propre résidu et que le stock
soit en route. Mesure : le moteur EXÉCUTÉ tick par tick depuis cet état-là — au
tick annoncé le stock est au plafond, un tick plus tôt il n'y est pas.
**Falsification vérifiée** : en remplaçant la recherche par la division naïve,
`not ok`.

⚠⚠ **ET DEUX DE SES CLAUSES N'ONT RIEN MESURÉ AVANT D'ÊTRE RÉÉCRITES — C'EST LA
LEÇON DU LOT.** Je voulais prouver que la forme exacte diffère d'un
`manque / débitTotal`, puis que des résidus pleins avancent l'échéance. **Mesuré
deux fois : aucun écart, 17 188 ticks dans tous les cas.** Un collecteur verse
8,67 milli par tick, trois producteurs 26, et l'écart que les résidus peuvent
créer vaut quelques milli — donc **moins que le gain d'un seul tick**. La division
naïve n'est pas fausse sur ce jeu ; elle est fausse EN GÉNÉRAL, et c'est pour ça
que la forme exacte est gardée. Le lock de l'implantation est donc **synthétique
et déclaré tel** dans le test : deux producteurs hors plage du jeu, **9 999 contre
10 000**. Un test qui aurait prétendu le contraire aurait été vert à vide.

**`JD T1` — un rapport déplié montre son détail, et lui seul**
(`test/journal-raids.test.js`). Quatre lignes repliées, plus de quatre dépliées,
le résumé **identique** en tête, l'autre section restée fermée ; la file saturée
pour prouver que la clé n'est pas un indice ; les libellés du détail confrontés
aux champs du rapport ; l'auto-réparation absente à zéro ; **les quatre causes de
fin de combat grep dans `sim/combat.js`** et comparées aux clés de
`LIBELLE_CAUSE` — une cinquième cause ajoutée au moteur ferait afficher
« undefined ». **Falsification vérifiée deux fois** : clé par indice → `not ok` ;
détail qui remplace le résumé au lieu de s'y ajouter → `not ok`.

---

## 7. Cinq gardes existantes ont dû suivre

1. **La maquette du résumé** (`chantier.test.js`) : `resumeDeLaBase` porte un
   champ de plus. Le délai n'est pas retapé à la main — le confronter à un nombre
   écrit ici ferait de ce test une copie de l'implantation ; ce qui se garde est
   qu'il est **entier, fini et positif** sur une base qui produit.
2. **La garde des classes sans style** (`chantier.test.js`) : elle a attrapé
   `depliable`, basculée par le code sans aucune règle. « Une classe sans style se
   réécrit sans qu'on s'aperçoive qu'elle ne fait rien. » Elle en a donc une, et
   c'est une affordance réelle : le titre d'une section dépliable passe en olive.
3. **Les trois âges du journal** (`JRN T5`, `JRN T11`) : le chevron termine
   maintenant le titre, les ancres de fin de chaîne l'incluent.
4. **`RAID-A T7`** : le compte de `lignesDuResultat(` passe de 2 à 1 — et
   ⚠ **le 2 comptait la DÉCLARATION plus l'appel, pas deux appels**. Les deux
   panneaux passent par `remplirLignes`, qui appelle la vue une fois ; c'est le
   `deepEqual` juste au-dessus qui mesure le partage, pas ce compte. Une
   assertion s'ajoute : aucune copie de la vue dans l'écran de raid.
5. **`documentation.test.js`** : le nouveau fichier est déclaré dans §2.
   ⚠ **Ma note explicative coupait le parseur de l'arborescence** — il s'arrête à
   la première ligne qui n'est pas « deux espaces puis une minuscule », et sept
   fichiers disparaissaient de la liste lue. La note est passée APRÈS la liste.

---

## 8. Vérifications au banc, sur le livrable bâti

Chromium headless, servi en HTTP, viewport **360 × 780 à DPR 3**, touchers réels.

- **La bascule** : un toucher, les cinq lignes du bas passent en durée, la classe
  `en-plein` est posée, **aucun débordement** sur les cinq tuiles ; un second
  toucher rend le bandeau. Sur une partie neuve : « jamais » pour les trois
  ressources — rien ne produit — et « plein » pour l'attaque, qui démarre au
  plafond.
- **La pire durée**, écrite dans le vrai nœud : **47,25 px** de texte, **une seule
  ligne**, hauteur de ligne 9,2 px, aucun débordement.
- **Le journal** s'ouvre, rend sa section unique et ne pose **aucun** `data-cle`
  sur un journal vide — le texte de vide n'est pas un rapport.

⚠ **CE QUI N'A PAS ÉTÉ VÉRIFIÉ AU BANC** : le dépliant sur de **vrais** rapports,
et la durée sur une base qui produit. Les deux demandent de jouer — mener un
raid, poser un collecteur — et le banc ne sait pas atteindre une cible depuis une
partie neuve. Le mécanisme est tenu par `JD T1` et `PL T1`, qui tournent tous
deux sur des états réels du moteur ; **le rendu, lui, est à regarder sur
appareil.**

---

## 9. SHA-256 des fichiers livrés (16 premiers caractères)

| fichier | SHA-256 |
|---|---|
| `src/ui/rapport.js` *(nouveau)* | `08d50304faa1b4a1` |
| `CLAUDE.md` | `1d91dd6130dde5d0` |
| `package.json` | `4085df4e58ddda9c` |
| `src/index.src.html` | `03dcd94b2d865d60` |
| `src/sim/economie-base.js` | `b38f3daf362d6084` |
| `src/ui/chantier.js` | `b7a983176973f4fa` |
| `src/ui/raid.js` | `f097f77047cb40b8` |
| `src/ui/session.js` | `84f717a0bc9b1e64` |
| `test/chantier.test.js` | `ce5003644c7b1994` |
| `test/economie-base.test.js` | `40fc3749ea026f95` |
| `test/journal-raids.test.js` | `e3dd4c9b65528c38` |
| `test/raid.test.js` | `213780913260fef6` |
| `dist/index.html` (non livré, `.gitignore`) | `d0f2615c43e9a6c9` |

---

## 10. Ce qui n'est PAS dans ce lot

- **Aucun changement de sauvegarde** : `SAVE_VERSION` ne bouge pas, `src/sim/`
  n'est touché que par `economie-base.js`, et seulement d'une fonction NEUVE qui
  ne lit et n'écrit rien de l'état.
- **Aucun réglage d'équilibrage** : `src/data/` n'a pas une ligne de diff.
- **Le débordement de 2 px de la ligne du bas d'une tuile**, constaté en passant
  et **antérieur à ce lot** : « Quartz » plus son pictogramme demandent 69 px pour
  un cadre de 67, et la tuile est en `overflow: visible` — le mot empiète d'un
  cheveu sur sa voisine. Ethan n'en a pas parlé, et le corriger demanderait de
  rogner un libellé ou de baisser une police : **arbitrage produit, pas
  correctif.**
- **Les trois contrôles appareil hérités** : la flèche en jeu, le retour de raid
  sur la ruine, le journal avec de vrais rapports — auxquels s'ajoute désormais la
  durée de saturation sur une base qui produit.
