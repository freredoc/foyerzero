# NOTE — Carapace à deux figures, planche remise à plat

## Carapace

`off_o_carapace` et `off_o_carapace_def` passent de **cinq figures à deux**.
La formation n'est pas inventée : elle est lue sur `art/sources/off_j_carapace.png`
du dépôt mergé — deux figures côte à côte, écart **0,558 largeur**, aucun écart
vertical. Figure maîtresse recopiée au pixel près, **0 pixel recouvert**.

L'outil `recoupage-escouades-ouvrage.py` ne prend plus un nombre de figures en
paramètre : **il le lit sur la référence**. Cinq sur la Carapace de l'Ouvrage,
deux sur celle du joueur. Deux changements l'accompagnent :

- **Il symétrise.** Les quatre coins du quinconce sortaient à 0,647 · 0,647 ·
  0,664 · 0,663 de largeur — le tremblement du générateur. Reporté tel quel, il
  serait hérité par toutes les escouades recoupées. On garde le signe, on donne
  l'écart moyen.
- **Il détecte le fond avec `cond.est_fond_sujet`**, pas avec un test sur le
  vert : la référence de formation peut être une planche du joueur restée sur
  fond magenta.

Contrôle de non-régression : la Meute recomposée après ces deux changements est
**identique au pixel près** à celle du lot infanterie.

## Planche

Les ±10 % sont retirés, sauf le Frappeur. Les emprises sont désormais lues dans
`tools/joueur_v2.py` (escouade 18/24, blindé 20/31, aéronef 25/32, défenses 29
et 27) et non plus dans le §7 de la fiche, qui ne décrit plus le dépôt.
