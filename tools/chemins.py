"""Où les outils de la chaîne graphique écrivent leurs sprites.

⚠⚠ POURQUOI CE MODULE EXISTE. Chaque outil portait sa propre ligne
`DST = os.path.join(RACINE, 'art', 'sprites', …)`, si bien qu'aucun ne pouvait
être rejoué AILLEURS que sur les fichiers commités. Vérifier qu'un outil
reproduit ce qui est à côté de lui demandait donc de l'écraser d'abord — c'est
la contradiction que `tools/verifier.py` existe pour lever : il pointe
`FZ_SPRITES` sur un dossier temporaire, rejoue toute la chaîne, et compare.

⚠ SEULE LA DESTINATION SE REDIRIGE, JAMAIS LA SOURCE. Les planches d'`art/
sources/` se lisent toujours au même endroit. Rediriger les deux ferait tourner
le vérificateur sur un dossier vide, et il rendrait « tout va bien » sur rien —
un vérificateur qui se trompe est pire que pas de vérificateur.

⚠ `tools/atlas.py` NE PASSE PAS PAR ICI, délibérément. Il écrit aussi
`src/data/atlas.js`, qui n'est pas un sprite, et il porte déjà son propre
`--verifier` qui ne touche à rien. Lui ajouter `FZ_SPRITES` donnerait deux
mécanismes pour la même question.
"""
import os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def dossier_sprites(*sous):
    """Le dossier des sprites, éventuellement dérouté par `FZ_SPRITES`.

    Une variable vide est traitée comme absente : `FZ_SPRITES=` en tête de
    commande écrirait sinon à la racine du système de fichiers.
    """
    base = os.environ.get('FZ_SPRITES') or os.path.join(RACINE, 'art', 'sprites')
    return os.path.join(base, *sous)
