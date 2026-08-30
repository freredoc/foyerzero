# RAPPORT — lot 2, tourelles des blindés

**29/08/2026.** 480 fichiers dans `art/sprites/tourelle-unite/{128,64,32}` :
5 blindés × 2 camps × 16 orientations. Aucun fichier de `src/` ni `test/` touché.

---

## 1. Ce qui a été produit

| Grille | Fichiers | Occupation moyenne | Minimum |
|---|---:|---:|---:|
| 128 | 160 | 24,57 % | 11,99 % |
| 64 | 160 | 24,31 % | 11,72 % |
| 32 | 160 | 23,66 % | **10,45 %** |

Zéro couleur hors palette sur les 480. Le contraste avec le lot 1 est net :
les tourelles de défense de l'Ouvrage tombaient à 0,10 % d'occupation en 32,
celles des blindés tiennent à 10,45 % au pire. **Le 32 passe pour ce lot.**

Par camp, en 32 : joueur 26,80 % de moyenne et 17,58 % au pire, Ouvrage
20,51 % et 10,45 %. L'écart existe mais reste dans une plage utilisable.

## 2. L'ordre des orientations — d'où il vient

Les tourelles de défense avaient une planche par orientation, nommée. Celles-ci
ont huit orientations par planche, sans étiquette, deux planches par tourelle,
et une grille qui change de camp : 4 × 2 côté joueur, 2 × 4 côté Ouvrage.

**L'ordre a été donné par Ethan le 29/08** : lecture normale, de gauche à droite
puis de haut en bas, dans les deux camps.

```
principales     N · NE · E · SE · S · SO · O · NO
intermédiaires  NNE · ENE · ESE · SSE · SSO · OSO · ONO · NNO
```

⚠ **Je n'ai pas su le retrouver par la mesure, et je le dis parce que ça change
le statut de ce lot.** Trois tentatives :

1. **Estimateur de direction de canon** — pivot par disque inscrit, puis
   direction du champ lointain. Calibré sur les planches `T`, dont l'orientation
   est écrite dans le nom : il retrouve l'ordre exact de `T01` à `T08` sur
   **6 tourelles sur 6**, écart max 7 à 27°. Appliqué ici, il s'effondre :
   écarts de **60 à 174°** pour 22,5° d'espacement. Ces tourelles sont plates,
   à canon court, sur un socle octogonal dont les coins sont plus éloignés du
   pivot que le canon lui-même.
2. **Structure miroir** — ne tranche pas : 0,886 pour l'ordre annoncé contre
   0,953 pour l'hypothèse concurrente sur le ratisseur joueur, mais 0,932 contre
   0,892 sur le pilon. Deux planches pour, deux contre, marges minces.
3. **Lecture par colonnes pour les planches Ouvrage en 2 × 4** — testée parce
   qu'une grille à 2 colonnes se lit souvent de haut en bas. Elle **perd 4 fois
   sur 5** au contrôle de fluidité. L'ordre annoncé tient dans les deux camps.

La seule chose que la mesure ait pu faire, c'est **éliminer une alternative**,
pas confirmer la bonne. L'ordre repose sur la parole d'Ethan et sur le contrôle
visuel du §3.

## 3. Contrôle de fluidité

Une rotation correcte donne des IoU consécutifs élevés **et réguliers** ; un
ordre faux fait chuter une ou deux transitions sans toucher aux autres. C'est le
creux qu'on cherche, pas la moyenne.

| Camp | IoU moyen | IoU minimum | Transition la plus basse |
|---|---:|---:|---|
| Joueur, 5 blindés | 0,766 à 0,907 | 0,668 à 0,875 | — |
| Ouvrage, 5 blindés | 0,539 à 0,815 | **0,190** à 0,671 | `o broyeur` : ese → se |

Côté joueur, aucun creux : la rotation est régulière sur les cinq. Côté Ouvrage,
`broyeur` chute à 0,190 sur une seule transition et `fendeur` à 0,359. Ce n'est
pas forcément un ordre faux — l'art de l'Ouvrage est moins constant d'une
génération à l'autre, comme le lot 1 l'avait déjà montré — mais **ces deux
transitions sont à regarder à l'œil avant de considérer le lot clos.**

La bande de rotation en 64 a été regardée : le socle reste immobile, seul le
canon tourne, et les repères cardinaux tombent juste — canon vers le haut en N,
horizontal en E et en O, vers le bas en S.

## 4. ⚠ Un point de composition à confirmer

Répartition par famille de palette, mesurée sur les seize orientations :

| Sprite | Famille A | Kaki | Rouge |
|---|---:|---:|---:|
| `off_j_ratisseur` | 0 % | 83–88 % | 0 % |
| `off_o_ratisseur` | 55–61 % | **27–34 %** | 0 % |
| `off_o_broyeur` | 55–63 % | 0–2 % | **37–43 %** |

Deux choses inattendues, stables sur les seize orientations donc pas du bruit :

- La tourelle du ratisseur Ouvrage porte **un tiers de kaki**, qui est la famille
  du joueur. Volontaire ou dérive de génération ?
- Celle du broyeur Ouvrage est à **37–43 % de rouge**. Chez les unités, le rouge
  est l'accent anti-véhicule et plafonne vers 25 %. À 40 % ce n'est plus un
  accent, c'est la couleur du corps.

L'amplitude entre orientations est faible partout — 4,6 points côté joueur, 6 à
8 côté Ouvrage — donc **la palette est stable**, c'est sa composition qui
interroge, pas son bruit.

## 5. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **480**, comptés sur disque |
| Dimensions | 128×128, 64×64, 32×32, une seule par dossier |
| Couleurs hors palette | **0** sur 480 |
| Sprites sous 5 % d'occupation | **0** |
| Ancrage | pivot commun aux 16, toile unique par tourelle |
| Bande de rotation regardée | ✔ joueur conforme, Ouvrage à revoir sur 2 transitions |
| Ordre par colonnes (Ouvrage) | réfuté, 4 fois sur 5 |

## 6. Reste ouvert

1. **Les deux transitions basses de l'Ouvrage** (§3) — `broyeur` ese→se à 0,190,
   `fendeur` nno→n à 0,359.
2. **La composition de `off_o_ratisseur` et `off_o_broyeur`** (§4).
3. **Les châssis sans tourelle** — `P3.3`, `P3.4` et les cinq
   `off_j_*_chassis_face_profil` restent non traités. `off_j_fendeur_chassis_face_profil`
   est en grille 4 × 1 quand ses quatre frères sont en 2 × 1 : cette planche
   contient autre chose que les autres.
