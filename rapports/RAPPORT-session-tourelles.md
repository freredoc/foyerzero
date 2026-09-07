# RAPPORT — première famille produite, et ce qu'elle a appris

**26/08/2026 · session S4, tourelles du joueur**

---

## Livré

| Fichier | Emplacement | État |
|---|---|---|
| `def_j_creneau.png` | `art/sprites/` | **1 sprite validé** sur 158 |
| `def_j_creneau_source.png` | `art/reference/` | source 1024, à joindre aux frères |
| `conditionneur.html` | `tools/` | modifié — contrôle de répartition des matières |
| `BRIEF-SPRITES-IA.md` | racine | v4 — §3 ter, pièges 11 et 12, §4 complété |
| `PLAN-PRODUCTION-SPRITES.md` | racine | v2 — méthode de référence, P4.3 à l'état réel, journal S4 |
| `INVENTAIRE-SPRITES.md` | racine | inchangé, joint pour la cohérence du lot |

**Suite verte, 152/152** — rien dans `src/` ni `test/`.
Noyau du conditionneur : **60 assertions, 60 vertes** (34 + 11 + 7 + 8 nouvelles).

---

## Ce qui s'est passé, mesuré

Quatre jets de la même tourelle, part de chaque matière dans la surface opaque :

| Jet | accent | métal | châssis | Verdict |
|---|---|---|---|---|
| 1 — prompt libre | **18,9 %** | **24,7 %** | **24,8 %** | **validé** |
| 2 — prompt coté au gros pixel près | 26 % | **1,2 %** | 49 % | socle disparu |
| 3 — référence jointe | 15 % | 40 % | 20 % | rattrapé |
| 4 — « bande de 3 au lieu de 1 » | **42 %** | 14 % | 15 % | surcorrigé |

Le premier jet, le moins contraint, est le meilleur. Les trois relances ont
toutes dégradé le résultat, chacune dans une direction différente.

**Deux causes, séparables.** Le jet 2 montre qu'un prompt coté au gros pixel
près fait remplir les vides : le dôme a mangé le socle et le métal est tombé à
1,2 % de la surface. Le jet 4 montre qu'une consigne en « plus » produit le
défaut inverse : un facteur trois demandé sur une épaisseur a presque triplé la
part de surface. Les deux sont désormais les pièges 11 et 12 du brief.

---

## Le contrôle ajouté à l'outil

Une pastille de plus : **accent · métal · châssis en pourcentage**, avec alerte
hors fourchette. Fourchettes tirées du sprite validé (19 / 25 / 25) puis
élargies — accent 10–30 %, métal 10–45 %, châssis 12–45 %. Non appliqué aux
tuiles, qui n'ont ni accent ni châssis.

C'est le contrôle qui manquait : les quatre jets ci-dessus passaient tous les
contrôles existants (bordure vide, emprise correcte, palette respectée) et trois
sur quatre étaient à jeter. **Vérifié sur ces quatre jets réels** : la référence
et le jet 3 passent, les jets 2 et 4 alertent, chacun sur la bonne famille.

Concrètement, l'écart « c'est plus moche » se lit maintenant dans le
`CONTROLE.txt` sans avoir à envoyer le ZIP.

---

## La méthode, pour les 59 générations restantes

1. **Un sprite de référence par famille**, généré prompt libre, jusqu'à ce qu'il
   soit bon. Seul moment où l'on itère.
2. **Joindre son PNG source de 1024** à la planche des frères, en énonçant ce
   qui est interdit de changer AVANT ce qui change.
3. **Jamais de correction chiffrée** en plus ou en moins.
4. **Décrire la référence telle qu'elle est**, pas telle qu'on croit qu'elle
   est — l'interdit « aucune pastille autour du dôme » a failli partir alors que
   la référence en portait.

D'où le dossier `art/reference/` : les sources de 1024 se gardent, ce sont elles
qu'on joint. Les 128 conditionnés vont dans `art/sprites/`.

---

## Reste à faire sur P4.3

`def_j_casemate` (blanc, deux canons fins parallèles) et `def_j_batterie`
(jaune, canon fin incliné), en planche 2 × 1, référence jointe. Le prompt est
prêt et a été donné en conversation ; il est à rejouer tel quel.
