"""Toutes les pièces de l'Ouvrage à LEUR taille les unes par rapport aux autres.

Les planches de contrôle précédentes calaient chaque pièce sur 40 px : elles
disent si un sprite est lisible, jamais s'il est trop gros. Celle-ci applique
les deux règles d'échelle du dépôt et ne recadre rien.

RÈGLE 1 — LES UNITÉS, PAR LE COÛT. `FICHE-STYLE.md` §7 : 5 points → empreinte
logique 18, 10 points → 24, 15 points → 28, dans une case de 32. Sur une case de
40 px à l'écran, cela fait 22,5 · 30 · 35. Les points sont lus dans
`src/data/combat.js`, jamais recopiés ici.

RÈGLE 2 — LES DÉFENSES, PAR LA CASE. Une défense occupe sa case quel que soit
son prix : 90 % pour les murs, barrières et socles carrés, 85 % pour les trois
coques d'artillerie (PASSATION-SPRITES-V2 §5). L'emprise s'applique AU SOCLE ;
la tourelle déborde par-dessus, c'est son rôle.

⚠ LES DEUX RÈGLES NE SE COMPARENT PAS ENTRE ELLES, et la planche le montre : le
Merlon vaut 5 points et sort plus gros que le Broyeur qui en vaut 15. C'est
voulu — une défense est un bâtiment posé sur sa case, une unité est une figurine
qui la traverse — mais ça se regarde une fois.
"""
import numpy as np, sys, os, json
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cond
import importlib.util as _u
_sp = _u.spec_from_file_location('ancres', os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                        'ancres-blindes-ouvrage.py'))
ancres = _u.module_from_spec(_sp); _sp.loader.exec_module(ancres)

CASE = 40
SLOT_L, SLOT_H, ZOOM = 50, 62, 6
# ⚠ LES EMPRISES SE LISENT DANS `tools/joueur_v2.py`, PAS DANS LE §7 DE LA FICHE.
# Le lot joueur mergé les a arbitrées le 05/09 par CHÂSSIS et par points, et
# elles ne suivent plus les trois paliers de la fiche : un blindé à 10 points
# vaut 20 et non 24, un à 15 vaut 31 et non 28. Le plafond A7 à 28 est donc déjà
# dépassé dans le dépôt, par le blindé lourd et par l'aéronef lourd.
EMPRISE_UNITE = {'escouade': {5: 18, 10: 24},
                 'blinde': {10: 20, 15: 31},
                 'aeronef': {10: 25, 15: 32}}
EMPRISE_90, EMPRISE_85 = 29, 27      # entiers du dépôt, pas 28,8 et 27,2

# AJUSTEMENTS PAR PIÈCE — vidée le 07/09. Les ±10 % précédents avaient été
# décidés en regardant une planche calculée sur les paliers du §7, alors que le
# dépôt mergé porte d'autres emprises : appliquer les deux revenait à corriger
# deux fois. Seul le Frappeur garde le sien, jugé bon à l'écran.
AJUSTEMENTS = {'frappeur': 0.90,
               'faucheuse': 1.10, 'mortier': 1.10, 'harpon': 1.10}

# Ancres mesurées aux lots blindés et défenses.
LOGEMENTS = {'socle_def_o_casemate': (627, 390), 'socle_def_o_creneau': (625, 390),
             'socle_def_o_batterie': (625, 390), 'socle_def_o_faucheuse': (510, 206),
             'socle_def_o_mortier': (510, 206), 'socle_def_o_harpon': (510, 206)}


def rgba(chemin):
    rgb = np.asarray(Image.open(chemin).convert('RGB'))
    fond = cond.est_fond_sujet(rgb)
    return Image.fromarray(np.dstack([rgb, np.where(fond, 0, 255).astype(np.uint8)]))


def boite(im):
    a = np.asarray(im)
    ys, xs = np.nonzero(a[..., 3] > 0)
    return xs.min(), ys.min(), xs.max(), ys.max()


def rogner(im):
    x0, y0, x1, y1 = boite(im)
    return im.crop((x0, y0, x1 + 1, y1 + 1))


def assembler(dossier, base, tourelle, logement, pivot, echelle=1.0):
    """Rend (image rognée, plus grande dimension DU SOCLE dans cette image)."""
    f = rgba(os.path.join(dossier, base + '.png'))
    t = rgba(os.path.join(dossier, tourelle + '.png'))
    px, py = pivot['x'], pivot['y']
    if echelle != 1.0:
        t = t.resize((round(t.size[0] * echelle), round(t.size[1] * echelle)), Image.LANCZOS)
        px, py = px * echelle, py * echelle
    g = Image.new('RGBA', (f.size[0] * 2, f.size[1] * 2))
    ox, oy = f.size[0] // 2, f.size[1] // 2
    g.alpha_composite(f, (ox, oy))
    g.alpha_composite(t, (ox + int(logement[0] - px), oy + int(logement[1] - py)))
    x0, y0, x1, y1 = boite(f)
    socle = max(x1 - x0 + 1, y1 - y0 + 1)
    gx0, gy0, gx1, gy1 = boite(g)
    return g.crop((gx0, gy0, gx1 + 1, gy1 + 1)), socle


def reduire(im, f):
    a = np.asarray(im).astype(float)
    al = a[..., 3:4] / 255.0
    pre = np.dstack([a[..., :3] * al, a[..., 3]]).astype(np.uint8)
    w, h = im.size
    p = Image.fromarray(pre).resize((max(1, round(w * f)), max(1, round(h * f))), Image.LANCZOS)
    b = np.asarray(p).astype(float)
    al2 = np.clip(b[..., 3:4] / 255.0, 1e-6, None)
    return Image.fromarray(np.dstack([np.clip(b[..., :3] / al2, 0, 255), b[..., 3]]).astype(np.uint8))


if __name__ == '__main__':
    dossier, tuiles, combat, sortie = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    src = open(combat, encoding='utf-8').read()
    import re
    # ⚠ On lit la donnée, on ne la recopie pas — et on borne la lecture aux DEUX
    # blocs. Un balayage du fichier entier ramasse les commentaires ajoutés au
    # lot du 06/09, dont certains portent une accolade en colonne 2 : la lecture
    # rendait alors zéro unité, et le KeyError n'arrivait que trois écrans plus
    # loin.
    points, chassis = {}, {}
    for tete in ('export const UNITES = {', 'export const DEFENSES = {'):
        i = src.index(tete)
        corps = src[i:src.index('\n};', i)]
        for cle, contenu in re.findall(r'\n  (\w+): \{(.*?)(?=\n  \w+: \{|\Z)', corps, re.S):
            p_ = re.search(r'points: (\d+)', contenu)
            c_ = re.search(r"chassis: '(\w+)'", contenu)
            if p_:
                points[cle] = int(p_.group(1))
            if c_:
                chassis[cle] = c_.group(1)
    assert len(points) == 23, f'{len(points)} pièces lues, 23 attendues'
    anc = json.load(open(os.path.join(dossier, 'ancres-blindes-ouvrage.json')))

    lignes = []
    lignes.append([('unite', c) for c in ['meute', 'guetteur', 'perceurs', 'fouisseurs', 'carapace']])
    lignes.append([('unite', c) for c in ['crecelle', 'busard', 'frappeur', 'enclume']])
    lignes.append([('blinde', c) for c in ['ratisseur', 'fendeur', 'broyeur', 'belier', 'pilon']])
    lignes.append([('defense', c) for c in ['casemate', 'creneau', 'batterie']]
                  + [('mono', c) for c in ['merlon', 'ronce', 'herse']])
    lignes.append([('defense', c) for c in ['faucheuse', 'mortier', 'harpon']])

    cols = max(len(l) for l in lignes)
    L, H = SLOT_L * cols, SLOT_H * len(lignes)
    tuile = Image.open(os.path.join(tuiles, 'tile_sol_o_a.png')).convert('RGB').resize((CASE, CASE), Image.LANCZOS)
    fond = Image.new('RGB', (L, H))
    for y in range(0, H, CASE):
        for x in range(0, L, CASE):
            fond.paste(tuile, (x, y))
    planche = fond.convert('RGBA')

    for j, ligne in enumerate(lignes):
        for i, (genre, cle) in enumerate(ligne):
            pts = points[cle]
            if genre in ('unite', 'blinde'):
                base = EMPRISE_UNITE[chassis[cle]][pts]
            if genre == 'unite':
                im = rogner(rgba(os.path.join(dossier, f'off_o_{cle}.png')))
                cible = base / 32 * CASE * AJUSTEMENTS.get(cle, 1.0)
                f = cible / max(im.size)
            elif genre == 'blinde':
                im, socle = assembler(dossier, f'off_o_{cle}_chassis', f'off_o_{cle}_tourelle',
                                      (anc['logements'][f'off_o_{cle}_chassis']['x'],
                                       anc['logements'][f'off_o_{cle}_chassis']['y']),
                                      anc['pivots'][f'off_o_{cle}_tourelle'],
                                      anc['pivots'][f'off_o_{cle}_tourelle'].get('echelle', 1.0))
                cible = base / 32 * CASE * AJUSTEMENTS.get(cle, 1.0)
                f = cible / socle
            elif genre == 'defense':
                base = f'socle_def_o_{cle}'
                # ⚠ Le pivot des tourelles de défense se MESURE, avec la même
                # fonction que les blindés. Une valeur écrite à la main ici
                # poserait la tourelle au petit bonheur et la planche d'échelles
                # mentirait sur la hauteur des artilleries.
                piv = ancres.pivot(os.path.join(dossier, f'def_o_{cle}.png'))
                im, socle = assembler(dossier, base, f'def_o_{cle}', LOGEMENTS[base], piv)
                emp = EMPRISE_85 if cle in ('faucheuse', 'mortier', 'harpon') else EMPRISE_90
                f = emp / 32 * CASE * AJUSTEMENTS.get(cle, 1.0) / socle
            else:
                im = rogner(rgba(os.path.join(dossier, f'def_o_{cle}.png')))
                f = EMPRISE_90 / 32 * CASE * AJUSTEMENTS.get(cle, 1.0) / max(im.size)
            v = reduire(im, f)
            planche.alpha_composite(v, (i * SLOT_L + (SLOT_L - v.size[0]) // 2,
                                        j * SLOT_H + (SLOT_H - v.size[1]) // 2))
            aj = AJUSTEMENTS.get(cle, 1.0)
            logique = max(v.size) / CASE * 32
            alerte = ''
            print(f'  {cle:12s} {pts:2d} pts ×{aj:.2f} → {v.size[0]:2d} × {v.size[1]:2d} px '
                  f'({logique:.1f} unités logiques){alerte}')
    planche.resize((L * ZOOM, H * ZOOM), Image.NEAREST).save(sortie)
