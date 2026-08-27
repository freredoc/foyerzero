# RAPPORT-S0-rampe-ouvrage.md — Foyer Zéro, 27/08/2026

Session S0, le jet d'essai. Objet : trancher la rampe de l'Ouvrage (dette 1 du
`BRIEF-SPRITES-IA.md` §5.1) et débloquer S3, S5 et S7.

**Résultat : la rampe A, ardoise violacée, est retenue.** Écrite dans
`FICHE-STYLE.md` §3, qui fait foi désormais.

---

## 1. Ce qui a été produit et mesuré

Quatre fichiers, conditionnés en 128 × 128 RGBA, palette *AB*, régime *entité*,
échantillonnage *majorité*, rognage 3 px, seuil magenta 140, découpe 1 × 1.

| Fichier | Sujet | Emprise | Couleurs | Bordure |
|---|---|---|---|---|
| `sprite_55800` | pylône, rampe A | 27 × 27 gp | 10 | vide (2 gp) |
| `sprite_55801` | pylône, rampe B | 27 × 27 gp | 10 | vide (2 gp) |
| `sprite_55802` | marcheur, rampe A | 23 × 23 gp | 10 | vide (2 gp) |
| `sprite_55803` | marcheur, rampe B | 23 × 23 gp | 10 | vide (2 gp) |

Points 1, 2 et 3 de la grille du §6 du brief : tenus sur les quatre. Aucun
liseré rose, 10 couleurs sur 19 possibles, bordure de 2 gros pixels vide sur les
quatre côtés.

## 2. Deux générations, pas quatre — et c'est mieux

`55801` est la substitution **ton pour ton exacte** de `55800` : chaque tone de
la rampe A remplacé par son homologue de rampe B, **0 pixel non expliqué par la
substitution, 0 pixel d'écart d'alpha**. Idem pour `55803` / `55802`. Vérifié par
comparaison pixel à pixel des quatre fichiers.

Le brief demandait quatre générations séparées « sinon il les harmonise ». La
méthode employée est plus juste : une seconde génération introduit du bruit de
silhouette qui se mélange à l'effet de la rampe, alors que c'est exactement la
variable qu'on veut isoler. Le §6 du brief est corrigé en ce sens.

## 3. L'arbitrage, sur les trois critères du §5.1

Jugé sur les vignettes à 40 px, fond clair et fond sombre, comme la grille
l'exige — pas sur le 128.

1. **Distinguer un marcheur ennemi d'un véhicule joueur en un dixième de
   seconde.** Les deux rampes passent : la silhouette à trois pattes radiales ne
   se confond pas avec la caisse à chenilles de `art/etalon/joueur/`. A passe
   plus franchement, l'ardoise n'ayant aucun voisin dans la palette joueur.
2. **L'accent rouge et l'accent jaune restent-ils lisibles.** **C'est là que ça
   se joue.** Sur l'ardoise, les deux tranchent. Sur la fonte, le jaune et le
   corps sont la même famille chaude : à 40 px la collerette du pylône se fond
   dans la masse et l'accent cesse de faire son travail. Le rouge du marcheur
   perd aussi, moins nettement.
3. **Est-ce que ça a l'air actif.** La fonte réalise le risque que le §5.1 lui
   prêtait à l'avance : elle lit « rouillé », donc abandonné — l'inverse exact de
   l'intention. L'ardoise lit « alimenté ».

Trois critères sur trois pour A. Aucune hésitation, et la conséquence annoncée
est acceptée : `tile_croute` tirera vers l'ardoise, jamais vers le brun.

## 4. Trois écarts au brief, signalés puis acceptés par Ethan

Ils sont notés ici parce qu'ils **deviennent la norme de la famille Ouvrage** :
les frères se généreront sur ces deux références, donc ils hériteront de ces
trois traits. C'est un choix, pas un oubli, et il ne se redécouvre pas.

- **Deux accents sur le pylône.** Jaune 18,6 % et rouge 3,6 % sur la même
  entité, plus un blanc parasite de 1,1 % au sommet du marcheur. Le §2 du
  contrat veut un accent unique désignant une seule classe de cible. La règle
  telle qu'elle est écrite ne couvre plus ce que montrent les références.
- **Le régime n'est pas tenu.** Cherchée par balayage des lignes de gros pixels
  depuis le bas : **aucune bande de face** sur l'un ni sur l'autre. Les tons
  sombres sont répartis en contour sur toute la silhouette. Le pylône a au mieux
  1 gros pixel de face là où le régime C en demande 4 à 7. L'inclinaison à 75°
  ne se manifeste nulle part — point 7 de la grille.
- **Aucun module répété.** La grammaire de l'Ouvrage (§7 du brief, piège 9) veut
  une pièce répétée, et une symétrie radiale sur le pylône. Les deux références
  sont des objets sculptés à symétrie bilatérale.

## 5. Le conditionneur employé était périmé

`CONTROLE.txt` ne porte pas la ligne de répartition des matières, ajoutée le
26/08 en même temps que le §3 ter. **Retélécharger `tools/conditionneur.html`
depuis `main` avant la session suivante.**

Répartition recalculée à la main, avec la définition de familles de l'outil :

| | accent | métal | châssis | non classé |
|---|---|---|---|---|
| pylône A | 22,2 % | 16,8 % | 59,0 % | 2,0 % |
| marcheur A | 20,4 % | 4,5 % | 72,8 % | 2,2 % |
| *fourchettes en vigueur* | *10–30* | *10–45* | *12–45* | |

⚠ **Correction d'une affirmation faite en séance.** J'ai d'abord annoncé « métal
4 % » sur le pylône. C'était l'application littérale du tableau `FAMILLES` de
l'outil, qui **ne compte pas `#1E2124` (métal sombre) dans la famille métal** —
il n'est dans aucune famille. En le comptant, le métal du pylône passe de 4,2 %
à **16,8 %, soit à l'intérieur de la fourchette**. Le marcheur reste à 4,5 % et
sort réellement.

## 6. Les deux dernières images — S0 close 7/7

Produites dans la foulée, validées au premier jet.

**Le Dard (`art/ouvrage/ref_dard.png`)** — accent 14 %, métal 26 %, châssis
43 %, emprise 23 × 21 gp, 9 couleurs. Tient la rotation à 90°, le demi-tour et
le miroir. C'est le §5.2 exécuté tel qu'il était écrit, et **le premier sprite
du projet où la grammaire de l'Ouvrage apparaît réellement** : une pièce
répétée, pas un objet sculpté. Le piège 9 se bat par la forme radiale à modules,
pas par un rappel dans le prompt. Dette 2 close.

⚠ Conséquence actée : **un Dard n'a pas d'avant**, donc le point 6 de la grille
ne s'applique pas à cette grammaire et ne se rattrapera sur aucun des quatre
aéronefs.

**`off_j_meute` (`art/joueur/ref_meute.png`)** — casques entièrement blancs,
dette 5 soldée. Figures mesurées à **8 gros pixels de haut**, exactement le
gabarit que le §7 exige pour que `guetteur` en tienne cinq dans 24 × 24.
Triangle pointe vers le haut, miroir propre — et la colonne rotation ne le
concerne pas, l'infanterie n'est que mise en miroir (A4). Deux alertes à un
point des bornes, métal 8 % et châssis 48 %, sur une escouade qui n'a par nature
ni socle ni caisse : non traitées.

## 7. Un cinquième `def_j_creneau`, écarté

Produit le 27/08, non retenu. Comparaison directe avec le sprite validé le
26/08, mesurée sur les deux fichiers :

| | accent | métal | châssis |
|---|---|---|---|
| créneau validé 26/08 | 18,9 % | 24,6 % | 24,8 % |
| créneau du 27/08 | **33,0 %** | **0,9 %** | **59,2 %** |

Le socle a disparu — c'est ce que dit le métal à 0,9 %. Sur le sprite du 26/08
les trois tons métal pèsent 45 % de la surface et le tube épais est présent ;
sur celui-ci il ne reste ni socle ni tube, plus 0,4 % de jaune, soit un second
accent sur une tourelle anti-véhicule.

**Quatrième échec de la famille par le même mécanisme** — pièges 11 et 12,
déjà consigné deux fois au journal S4. Le créneau du 26/08 reste la référence de
toute la famille tourelle et **ne se régénère plus**. La suite de P4.3
(`casemate`, `batterie`) passe par la référence jointe en planche 2 × 1 : c'est
la seule méthode du §3 ter qui n'ait pas encore été essayée sur cette famille.

## 8. Ce qui reste ouvert

1. **Les 1024 sources des références manquent au dépôt.** Le §3 ter les
   exige : c'est le PNG source qu'on joint aux frères comme moule. Seuls les 128
   conditionnés sont ici. À déposer en `art/ouvrage/ref_pylone_source.png` et
   `art/ouvrage/ref_marcheur_source.png`.
3. ~~**Les fourchettes de matières ne transfèrent pas à l'Ouvrage.**~~
   **RETIRÉ le 27/08 — cette affirmation était fausse.** Elle reposait sur deux
   échantillons, le pylône et le marcheur, à 59 % et 73 % de châssis. Le Dard est
   un sprite Ouvrage et il tombe au milieu des trois fourchettes du joueur —
   14 / 26 / 43. Ce ne sont donc pas les bornes qui sont mal calibrées pour la
   palette, ce sont ces deux références-là qui en sortent. Rien à changer dans
   l'outil de ce côté.

   ⚠ Faute de méthode, la même que celle du §4.4 de la passation du 26/08 :
   **un seuil ne se déduit pas de deux mesures.** Il en fallait un troisième pour
   voir que la variable n'était pas la palette.
4. **Trois défauts de `tools/conditionneur.html`.** Il touche au DOM, donc il ne
   se vérifie pas par exécution ici : il passera par un brief Claude Code.
   - une alerte hors fourchette (`t === "al"`) s'imprime quand même **`OK`** en
     tête de ligne dans `CONTROLE.txt`, puisque le préfixe ne teste que `"ko"` ;
   - `#1E2124` (métal sombre) et les deux tons de contour ne sont dans aucune
     famille — 14,6 % de la surface du pylône comptée nulle part (§5) ;
   - aucune fourchette propre à la palette Ouvrage.
5. **`CLAUDE.md` ne cite ni `PLAN-PRODUCTION-SPRITES.md`, ni
   `tools/conditionneur.html`, ni `art/`** au-delà de `art/etalon/`. Le fichier
   de rang 1 ignore le fichier de suivi du chantier sprite.

---

*Session S0 close, 7 cases sur 7. Rampe arrêtée, forme du Dard arrêtée, cinq
sprites de référence au dépôt. S1 à S11 sont tous démarrables.*
