"""Les trois portes de la quantification, et les poids de sa distance.

⚠⚠ POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'IMPORTE RIEN. Ces nombres sont
la règle qui décide si un pixel a le droit de tomber sur un accent — jaune,
rouge ou blanc — plutôt que sur le kaki d'à côté. Ils vivaient dans
`final128.quant`, qui est le seul endroit qui devait les connaître ; depuis le
lot PIXELS, le côté JS en a besoin aussi : `test/accent.test.js` ne peut plus
mesurer l'accent par ÉGALITÉ de teinte — la réduction par filtre n'en laisse
aucune exacte — et le classe donc au plus proche, sous les mêmes portes.

⚠⚠ ET ILS NE SE RETAPENT PAS EN JS, ILS SE GÉNÈRENT. `tools/atlas.py` les écrit
dans `art/sprites/atlas-empreintes.json`, que le test lit ; le JS ne porte que
la FORME des trois conditions, jamais un seul de leurs nombres. C'est le motif
déjà en place pour `art/sprites/ancres-chassis.json` — un outil mesure, un
fichier porte, un test confronte —, et c'est ce qui empêche la dérive
silencieuse qu'une seconde table écrite à la main garantirait.

⚠ AUCUN IMPORT, ET C'EST LA MOITIÉ QUI COMPTE. `tools/atlas.py` ne dépend que de
Pillow ; le faire passer par `final128` lui ferait traîner `cond`, donc `scipy`,
pour lire quatre nombres. Un module sans dépendance peut être importé des deux
côtés de la chaîne sans rien coûter à personne.
"""

# Les poids de la distance de quantification, canal par canal. Le vert pèse
# double parce que l'œil y voit le plus de nuances ; ils sont au dépôt depuis
# le premier conditionneur et ce lot ne les touche pas.
POIDS = (2, 4, 3)

# Les trois portes. Chacune dit à quelle condition un pixel a le DROIT d'être
# apparié à une rampe d'accent ; sans elles, le kaki éclairé dérive vers le
# jaune et le brun vers le rouge — mesuré au premier jet des murs de contour,
# où le rouge réservé à ce qui attaque le joueur ressortait sur une brique.
#
# `max` est la composante la plus forte du pixel, `min` la plus faible.
PORTES = {
    'jaune': {'bleuSurMax': 0.25, 'vertSurMax': 0.55},
    'rouge': {'vertSurMax': 0.55, 'bleuSurMax': 0.55, 'rougeMin': 90},
    'blanc': {'ecartSurMax': 0.22, 'maxMin': 175},
}
