#!/usr/bin/env python3
"""Lot 6 — emblèmes de la carte du monde, POI et grosses bases de l'Ouvrage.

Cent dix-sept sprites : 36 emblèmes de site sains, 72 abîmés — fumée et feu —,
7 points d'intérêt, 2 grosses bases de l'Ouvrage. Deux grilles chacun.

LA COUPE se fait par gouttière, jamais en tiers. Le §1 du rapport du lot 4
rappelle pourquoi : sur les planches de connexions, la coupe régulière tombait
deux fois dans la matière et tronquait les douze cellules.

⚠⚠ ET SUR LES HUIT PLANCHES D'ABÎMÉS, IL N'Y A PAS DE GOUTTIÈRE HORIZONTALE À
TROUVER — mesuré, pas supposé. Le panache de fumée d'une rangée monte dans la
cellule du dessus : à la frontière du tiers, il reste de 115 à 434 pixels de
matière selon la planche, et les deux planches `base_ouvrage` n'ont AUCUNE ligne
vide entre leurs rangées. Une coupe en tiers couperait donc le haut de chaque
panache ET collerait un moignon du panache voisin en bas de la cellule du
dessus. La coupe se fait par COMPOSANTE CONNEXE, et la cellule rendue porte le
masque de sa composante — jamais un rectangle, qui reprendrait la voisine.

⚠ LES GOUTTIÈRES VERTICALES, ELLES, EXISTENT SUR LES HUIT, et elles servent :
c'est par elles qu'une composante se range dans sa COLONNE. Trier les neuf par
la seule ligne de sol mélange les colonnes — mesuré sur la planche saine du
joueur, dont la rangée 1 porte les bas 310, 311 et 311, si bien que la colonne 2
passe devant la colonne 1. On range par colonne, puis par ligne de sol.

DEUX PLANCHES SONT ÉCARTÉES, et c'est un arbitrage, pas un oubli :
  - `S10_base_ouvrage_64-256.png` (v1) perd contre `_v2`. Mesuré sur les neuf
    niveaux conditionnés : v1 se casse en **10,4 morceaux détachés par cellule**
    contre 2,8 pour v2, et sa progression du niveau 1 au 9 est de -4 % quand
    celle de v2 est de +21 %. Les trois autres planches d'emblème donnent un
    seul bloc.
  - `S10_base_joueur_32-128_comparaison.png` est un essai de grille.

LES GRILLES sont mesurées, pas supposées : 3 × 3 pour les quatre planches S10,
3 × 1 pour les POI de ressource, 2 × 2 pour les POI de bonus, 1 × 1 pour les
deux grosses bases.

⚠ NE PAS CONFONDRE LA GRILLE DE COUPE ET L'EMPRISE SUR LA CARTE. `nx × ny` dit
combien de cellules la PLANCHE contient ; `cases` dit combien de cases de carte
le sprite produit OCCUPE. Les deux grosses bases sont chacune une seule cellule
de planche — d'où `1, 1` — mais elles couvrent quatre et neuf cases de carte, et
sortent donc en `cases × N` pixels : 256 et 384 à la grille 128, 128 et 192 à la
64, 64 et 96 à la 32. Arbitré par Ethan le 30/08 : la 2 × 2 est un gros carré,
la 3 × 3 un hexagone.

⚠ L'ORDRE DES NEUF NIVEAUX est la lecture normale, de gauche à droite puis de
haut en bas. Il n'est pas vérifiable par la mesure : l'occupation croît de 38 %
sur la base du joueur et de 55 % sur les camps de quartz, ce qui va dans le bon
sens, mais elle est plate à -5 % sur les camps de scories, dont les neuf niveaux
ne diffèrent que par le tracé des veines.

⚠ Les noms des POI sont repris du nom de fichier, faute de mieux. Les sept
cellules ne sont pas identifiées une par une.

    python3 tools/emblemes.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites
from PIL import Image
import numpy as np
from scipy import ndimage
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('carte')
GRILLES = (128, 64)   # la 32 est sortie au lot PIXELS : ni le jeu ni les tests ne la lisaient
EMPRISE = 30          # gros pixels sur 32 : un emblème remplit sa case de carte

NIVEAUX = [f'n{i}' for i in range(1, 10)]

# ⚠⚠ LES QUATRE FAMILLES D'EMBLÈME SONT SORTIES DE `PLANCHES`, ET C'EST LA
# RÉFÉRENCE D'ÉCHELLE QUI L'A EXIGÉ. Une famille se conditionne d'un bloc : ses
# trois états partagent UNE échelle, donc ils ne peuvent pas se traiter planche
# par planche. `PLANCHES` garde ce qui n'a pas de famille — les POI, dont il
# n'existe qu'un dessin par type, et les deux grosses bases.
#
# fichier, nx, ny, ouvrage, préfixe, noms, cases occupées sur la carte
PLANCHES = [
    ('P10.3_poi_ressources_reacteur_64-256.png', 3, 1, False, 'poi',
     ['ressource_a', 'ressource_b', 'reacteur'], 1),
    ('P10.4_poi_bonus_64-256.png',              2, 2, False, 'poi_bonus',
     ['a', 'b', 'c', 'd'], 1),
    ('S10_base_ouvrage_2x2.png',                 1, 1, True, 'base_o_2x2', [''], 2),
    ('S10_base_ouvrage_3x3_finale.png',          1, 1, True, 'base_o_3x3', [''], 3),
]

# ⚠ L'EMPRISE S'ÉCRIT, ELLE NE SE DÉDUIT PAS. Un septième champ absent pourrait
# se compléter à 1 en silence ; il lèverait alors une base multi-cases ramenée à
# une case sans que rien ne le dise. Le tuple est donc de longueur fixe, et
# l'assertion tombe si une planche est ajoutée sans qu'on ait décidé.
for _p in PLANCHES:
    assert len(_p) == 7, f'{_p[0]} : emprise en cases manquante'


# ⚠⚠ L'ÉTAT S'ÉCRIT EN SUFFIXE, ET LE SAIN N'EN A PAS. `site_base_j_n5` reste
# `site_base_j_n5` : renommer les 36 sains aurait fait tomber `src/data/atlas.js`,
# `render/embleme.js` et leurs gardes pour un lot qui n'ajoute qu'un état.
ETATS = ['', '_fumee', '_feu']

# préfixe, ouvrage, (planche saine, planche fumée, planche en feu)
FAMILLES = [
    ('site_base_j', False, (
        'S10_base_joueur_64-256.png',
        'S10_base_joueur_degats_fumee_3x3_1024.png',
        'S10_base_joueur_en_feu_3x3_1024.png')),
    ('site_base_o', True, (
        'S10_base_ouvrage_64-256_v2.png',
        'S10_base_ouvrage_degats_fumee_3x3_1024.png',
        'S10_base_ouvrage_en_feu_3x3_1024.png')),
    ('site_quartz', False, (
        'S10_camps_avant-postes_quartz_64-256.png',
        'S10_camps_quartz_degats_fumee_3x3_1024.png',
        'S10_camps_quartz_en_feu_3x3_1024.png')),
    ('site_scorie', False, (
        'S10_camps_avant-postes_scories_64-256.png',
        'S10_camps_scories_degats_fumee_3x3_1024.png',
        'S10_camps_scories_en_feu_3x3_1024.png')),
]

for _f in FAMILLES:
    assert len(_f[2]) == len(ETATS), f'{_f[0]} : une planche par état attendue'

# ⚠ LE SEUIL SÉPARE DEUX POPULATIONS QUI NE SE TOUCHENT PAS, ET C'EST MESURÉ :
# sur les douze planches, la plus petite composante d'emblème fait 13 541 pixels
# et la plus grosse braise détachée 258. Un facteur cinquante-deux. Ce n'est donc
# pas un seuil calibré, c'est un fossé.
SEUIL_COMPOSANTE = 500


def composantes(masque):
    """Les composantes connexes du masque, grandes et petites séparées."""
    lab, nb = ndimage.label(masque, structure=np.ones((3, 3)))
    tailles = ndimage.sum(masque, lab, range(1, nb + 1))
    grandes = [i + 1 for i, t in enumerate(tailles) if t > SEUIL_COMPOSANTE]
    petites = [i + 1 for i, t in enumerate(tailles) if t <= SEUIL_COMPOSANTE]
    return lab, grandes, petites


def taille_la_plus_fine(masque, y0, y1):
    """Où couper une composante qui porte DEUX emblèmes : à sa taille.

    ⚠⚠ CE CAS EXISTE POUR DE BON, ET IL EST UNIQUE : sur
    `S10_camps_quartz_en_feu`, le panache de la rangée 3 touche le bâtiment de la
    rangée 2 dans la colonne du milieu, et les deux ne font plus qu'une
    composante de 253 × 620 — deux cellules de haut. Les sept autres planches
    rendent neuf composantes franches.

    ⚠ ON COUPE À LA LIGNE LA PLUS ÉTROITE DU TIERS CENTRAL, ET CE N'EST PAS UN
    SEUIL QUI MARCHERAIT PAR CHANCE : le profil de largeur descend de 245 pixels
    sous le bâtiment du haut à 20 au plus fin, puis remonte avec le panache. Le
    minimum tombe à y = 583 ; la planche SŒUR, où les deux composantes sont
    séparées, met la frontière de cette colonne à y = 582. **Un pixel d'écart sur
    1 024**, soit un huitième de pixel du sprite produit. Le tiers central borne
    la recherche pour qu'un panache effilé au sommet ou une base étroite au pied
    ne l'emporte pas sur la vraie taille.
    """
    largeurs = masque.sum(1)
    debut = y0 + (y1 - y0) // 3
    fin = y0 + 2 * (y1 - y0) // 3
    return min(range(debut, fin + 1), key=lambda y: largeurs[y])


def colonne_de(centre_x, centres):
    return min(range(len(centres)), key=lambda i: abs(centres[i] - centre_x))


def cellules_par_composante(chemin, nx, ny):
    """Les `nx × ny` cellules d'une planche d'emblème, en ordre de lecture.

    Chaque cellule est la planche MASQUÉE à sa composante : tout le reste est
    rabattu sur le magenta de fond, puis on recadre sur la boîte de la
    composante. C'est ce masque qui empêche le panache du voisin d'entrer, là où
    un rectangle le reprendrait forcément.
    """
    im = Image.open(chemin).convert('RGBA')
    rgb = np.array(im.convert('RGB')).astype(int)
    m = ~est_fond(rgb)
    lab, grandes, petites = composantes(m)

    bx = bandes(m.any(0))
    if len(bx) != nx:
        raise AssertionError(f'{os.path.basename(chemin)} : {len(bx)} colonnes au lieu de {nx}')
    centres = [(b[0] + b[1]) / 2 for b in bx]

    # une composante par emblème : masque, boîte, colonne
    masques = [lab == c for c in grandes]
    par_colonne = {i: [] for i in range(nx)}
    for msq in masques:
        ys, xs = np.where(msq)
        par_colonne[colonne_de((xs.min() + xs.max()) / 2, centres)].append(msq)

    # ⚠ UNE COLONNE QUI N'A PAS SES `ny` EMBLÈMES EN PORTE UN QUI EN VAUT DEUX.
    # On coupe le plus HAUT, à sa taille, et on recommence tant qu'il en manque :
    # la boucle est bornée par `ny`, donc elle ne peut pas tourner sans fin.
    coupes = []
    for i in range(nx):
        while len(par_colonne[i]) < ny:
            k = max(range(len(par_colonne[i])),
                    key=lambda j: np.ptp(np.where(par_colonne[i][j])[0]))
            msq = par_colonne[i].pop(k)
            ys, _ = np.where(msq)
            y = taille_la_plus_fine(msq, int(ys.min()), int(ys.max()))
            lignes = np.arange(msq.shape[0])[:, None]
            par_colonne[i].append(msq & (lignes <= y))
            par_colonne[i].append(msq & (lignes > y))
            coupes.append((os.path.basename(chemin), i, int(y)))
        if len(par_colonne[i]) != ny:
            raise AssertionError(
                f'{os.path.basename(chemin)} : colonne {i} porte '
                f'{len(par_colonne[i])} emblèmes au lieu de {ny}')

    # ⚠ LES BRAISES DÉTACHÉES REJOIGNENT LEUR EMBLÈME, ELLES NE SE PERDENT PAS.
    # Elles pèsent 0,08 % de la matière des douze planches — et ce sont les
    # étincelles d'un incendie : les jeter reviendrait à éteindre le feu. Chacune
    # va à la composante dont elle est la PLUS PROCHE, par transformée de
    # distance, et non à celle dont la boîte la contient : une braise qui monte
    # au-dessus d'un emblème sort de sa boîte.
    if petites:
        grand = np.zeros(m.shape, dtype=int)
        for k, msq in enumerate(
                [msq for i in range(nx) for msq in par_colonne[i]], start=1):
            grand[msq] = k
        _, (iy, ix) = ndimage.distance_transform_edt(grand == 0, return_indices=True)
        aplat = [msq for i in range(nx) for msq in par_colonne[i]]
        for c in petites:
            pts = np.where(lab == c)
            voisins = grand[iy[pts], ix[pts]]
            k = np.bincount(voisins).argmax()
            aplat[k - 1][pts] = True

    # ⚠ LE TRI SE FAIT PAR LA LIGNE DE SOL — le BAS de la composante, jamais le
    # haut, qui suit la hauteur du panache et non le palier.
    for i in range(nx):
        par_colonne[i].sort(key=lambda k: np.where(k)[0].max())

    # ⚠⚠ ON MASQUE SUR LA COMPOSANTE REMPLIE, JAMAIS SUR LA COMPOSANTE NUE, ET
    # C'EST LA SECONDE PORTE D'`est_fond` QUI L'EXIGE. Elle attrape le violet
    # clair de l'Ouvrage jusqu'au MILIEU d'une base — le défaut que le lot PIXELS
    # a mesuré et que `est_fond_sujet` borne, dans `conditionner`, à la
    # composante de fond qui TOUCHE LE BORD. Peindre en magenta tout ce
    # qu'`est_fond` rejette le rendrait ici, en amont, et l'aurait rendu
    # IRRATTRAPABLE en aval : mesuré, `site_base_o_n9` passait de 0 à 195 pixels
    # de trou, et les 525 pixels percés de sa source sont du `#8D5FA0`, c'est-à-
    # dire du sujet. `binary_fill_holes` ne bouche que ce qui est ENFERMÉ : une
    # arche ouverte sur le dehors reste ouverte.
    cells, releves = [], []
    for j in range(ny):
        for i in range(nx):
            msq = ndimage.binary_fill_holes(par_colonne[i][j])
            ys, xs = np.where(msq)
            plein = np.array(im)
            plein[~msq] = (255, 0, 255, 255)
            cells.append(Image.fromarray(
                plein[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'RGBA'))
            releves.append(dict(colonne=i, rangee=j,
                                l=int(xs.max() - xs.min() + 1),
                                h=int(ys.max() - ys.min() + 1),
                                sol=int(ys.max())))
    return cells, coupes, releves


def bandes(v, mini=30):
    o, d = [], None
    for i, x in enumerate(v):
        if x and d is None:
            d = i
        if not x and d is not None:
            o.append((d, i)); d = None
    if d is not None:
        o.append((d, len(v)))
    return [b for b in o if b[1] - b[0] > mini]


def cellules(chemin, nx, ny):
    """Coupe par gouttière, avec assertion sur la grille attendue."""
    im = Image.open(chemin).convert('RGBA')
    m = ~est_fond(np.array(im.convert('RGB')).astype(int))
    H, W = m.shape
    bx, by = bandes(m.any(0)), bandes(m.any(1))
    if (len(bx), len(by)) != (nx, ny):
        # une planche à sprite unique peut se lire en plusieurs bandes
        if nx == ny == 1:
            bx = by = [(0, W)]
        else:
            raise AssertionError(f'{os.path.basename(chemin)} : grille '
                                 f'{len(bx)}x{len(by)} au lieu de {nx}x{ny}')
    cx = [0] + [(bx[i][1] + bx[i + 1][0]) // 2 for i in range(len(bx) - 1)] + [W]
    cy = [0] + [(by[j][1] + by[j + 1][0]) // 2 for j in range(len(by) - 1)] + [H]
    return [im.crop((cx[i], cy[j], cx[i + 1], cy[j + 1]))
            for j in range(len(cy) - 1) for i in range(len(cx) - 1)]


def mesure(cell):
    """Largeur et hauteur de la matière d'une cellule, en pixels de planche."""
    a = np.array(cell.convert('RGBA'))
    m = (~est_fond(a[..., :3])) & (a[..., 3] >= 128)
    ys, xs = np.where(m)
    return int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)


# ⚠⚠ LE MANIFESTE EXISTE PARCE QUE NODE NE PEUT PAS LIRE LES PLANCHES. Elles
# font 1 024 et 1 254 pixels de côté, `test/png-rgba.js` sait décoder un PNG mais
# la suite ne va pas rouvrir douze planches à chaque `npm run check` — et surtout
# les mesures qui comptent (colonne, ligne de sol, référence d'échelle) sont des
# DÉCISIONS de cet outil-ci, pas des propriétés d'une image. Même motif que
# `bord-empreintes.json` et `atlas-empreintes.json` : ce que la suite ne peut
# plus mesurer elle-même, l'outil l'écrit, et un test le confronte au produit.
MESURES = {}

n = 0
toutes_les_coupes = []
for prefixe, ouv, fichiers in FAMILLES:
    P = pal(ouv)
    # Les trois états, découpés d'abord : la référence d'échelle les regarde
    # tous les vingt-sept avant qu'un seul sprite ne soit écrit.
    lots = []
    for fichier in fichiers:
        chemin = os.path.join(SRC, fichier)
        cells, coupes, releves = cellules_par_composante(chemin, 3, 3)
        toutes_les_coupes += coupes
        assert len(cells) == len(NIVEAUX), f'{fichier} : {len(cells)} cellules'
        cote_planche = Image.open(chemin).size[0] / 3
        lots.append((cells, cote_planche, releves, os.path.basename(fichier)))

    # ⚠⚠ LA RÉFÉRENCE EST RELATIVE À LA CELLULE DE PLANCHE, ET IL LE FAUT : les
    # quatre planches saines font 1 254 pixels de côté, les huit neuves 1 024.
    # Comparer des pixels bruts rétrécirait tout l'état abîmé de 18 %. Rapportées
    # à leur cellule, les largeurs des trois états d'un même palier coïncident à
    # moins de 1 % sur trois familles — c'est la mesure qui autorise à les mettre
    # à la même échelle.
    #
    # ⚠ ET C'EST `max(largeur, hauteur)` QUI BORNE, PAS LA SEULE LARGEUR : le
    # panache fait monter la hauteur jusqu'à 1,08 cellule, et une référence
    # prise sur la largeur laisserait le sommet du panache hors de la boîte.
    reference = max(max(mesure(c)) / cote
                    for cells, cote, _releves, _f in lots for c in cells)
    MESURES[prefixe] = dict(reference=reference, cellules={})
    for etat, (cells, cote_planche, releves, fichier) in zip(ETATS, lots):
        for cell, suffixe, releve in zip(cells, NIVEAUX, releves):
            nom = f'{prefixe}_{suffixe}{etat}'
            MESURES[prefixe]['cellules'][nom] = dict(
                planche=fichier, cotePlanche=cote_planche, **releve)
            for N in GRILLES:
                g, matiere = conditionner(
                    recadrer(cell, EMPRISE * (N // 32), N,
                             cote_ref=reference * cote_planche, ancrage='bas'),
                    P, N)
                d = os.path.join(DST, str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, P, os.path.join(d, f'{nom}.png'), matiere)
                n += 1

for fichier, nx, ny, ouv, prefixe, noms, cases in PLANCHES:
    P = pal(ouv)
    cells = cellules(os.path.join(SRC, fichier), nx, ny)
    assert len(cells) == len(noms), f'{fichier} : {len(cells)} cellules pour {len(noms)} noms'
    for cell, suffixe in zip(cells, noms):
        nom = f'{prefixe}_{suffixe}' if suffixe else prefixe
        for N in GRILLES:
            # Le sprite sort en `cases × N` pixels et son emprise croît d'autant :
            # sans quoi une grosse base tiendrait la place d'une seule case,
            # simplement dessinée plus gros.
            cote = cases * N
            g, matiere = conditionner(recadrer(cell, EMPRISE * cases * (N // 32), cote), P, cote)
            d = os.path.join(DST, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'{nom}.png'), matiere)
            n += 1
import json  # noqa: E402
MESURES['coupes'] = [dict(planche=f, colonne=c, y=y) for f, c, y in toutes_les_coupes]
with open(os.path.join(DST, 'emblemes-mesures.json'), 'w', encoding='utf-8') as fh:
    json.dump(MESURES, fh, indent=1, ensure_ascii=False, sort_keys=True)
    fh.write('\n')

for f, col, y in toutes_les_coupes:
    print(f'  coupe en hauteur : {f}, colonne {col}, y = {y}')
print(f'{n} fichiers écrits')
