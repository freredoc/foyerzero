"""Produit les 84 sources de bâtiment à partir des deux archives d'Ethan.

Chaîne, dans cet ordre et pas un autre :
  1. la fumée est opacifiée SUR LE MAGENTA (`opacifier_fumee`) ;
  2. les cinq bâtiments de l'Ouvrage passent au vert, les autres restent sur
     magenta comme tout l'art du joueur.

⚠ L'ORDRE COMPTE. L'inversion de la fumée s'appuie sur un canal vert propre ;
après passage au vert c'est ce canal qui porte le fond.

⚠ LE PASSAGE AU VERT PORTE DEUX CORRECTIONS PAR RAPPORT AU LOT DES UNITÉS, et
les deux ont été trouvées sur ces planches :
  · le magenta FRANC descend de 90 à 60. À 90, les demi-teintes du dôme de la
    Souche — 7 122 px en cellule 1, 11 562 sur l'intact — devenaient du fond.
  · la frange exige `|R − B| < 40`. Sans elle, le violet clair du dôme
    `(178, 48, 251)` déclenche « rouge et bleu hauts, vert bas » exactement comme
    un liseré magenta, et les trois passes de voisinage le rongent.
"""
import numpy as np, os, sys, json
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cond
from opacifier_fumee import opacifier

VERT = np.array([0, 255, 0], np.uint8)
ETATS = ['_abime', '_tres_abime', '_detruit']          # cellules 1, 2, 3
SEUIL_BASCULE = 10        # px de dessin percé au-delà desquels on essaie le vert

TABLE = [
    # (préfixe de fichier, camp, identifiant)
    ('01_caserne', 'j', 'caserne'),
    ('02_usine_vehicules', 'j', 'depot_de_vehicules'),
    ('03_aerodrome', 'j', 'aerodrome'),
    ('04_reacteur', 'j', 'centrale'),
    ('05_accumulateur', 'j', 'accumulateur'),
    ('06_collecteur_quartz', 'j', 'collecteur_quartz'),
    ('07_collecteur_scories', 'j', 'collecteur_scorie'),
    ('08_raffinerie', 'j', 'raffinerie'),
    ('09_artillerie_anti_infanterie', 'j', 'artillerie_anti_infanterie'),
    ('10_artillerie_anti_vehicule', 'j', 'artillerie_anti_vehicule'),
    ('11_artillerie_anti_aerien', 'j', 'artillerie_anti_aerien'),
    ('12_chantier', 'j', 'chantier_de_construction'),
    ('13_qg_defense', 'j', 'qg_de_defense'),
    ('14_complexe_defense', 'j', 'complexe_de_defense'),
    ('15_centre_commandement', 'j', 'centre_de_commandement'),
    ('17_gangue', 'o', 'gangue'),
    ('18_terril', 'o', 'terril'),
    ('19_noeud', 'o', 'noeud'),
    ('20_souche', 'o', 'souche'),
    ('21_etai', 'o', 'etai'),
]
NON_AFFECTES = ['16_collecteur_raffinerie', '22_collecteur_mixte_icone']


def passer_au_vert(a):
    brut = cond.est_fond(a)
    lab, k = ndimage.label(brut)
    bord = np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))
    dehors = np.zeros(k + 1, bool); dehors[bord] = True; dehors[0] = False
    fond = dehors[lab]
    d = np.sqrt((a[..., 0].astype(float) - 255) ** 2 + a[..., 1].astype(float) ** 2
                + (a[..., 2].astype(float) - 255) ** 2)
    fond = fond | (d < 60)
    r = a[..., 0].astype(int); v = a[..., 1].astype(int); b = a[..., 2].astype(int)
    frange = (r > 140) & (b > 140) & (v < np.minimum(r, b) * 0.85) & (np.abs(r - b) < 40)
    for _ in range(3):
        fond = fond | (ndimage.binary_dilation(fond) & frange)
    out = a.copy(); out[fond] = VERT
    return out


def controle(a):
    """Ce qui doit valoir zéro : du fond ENFERMÉ dans le sujet, c'est-à-dire du
    dessin percé par la clé. Les trous voulus, eux, sont du magenta franc et se
    comptent à part."""
    f = cond.est_fond_sujet(a)
    lab, k = ndimage.label(f)
    bord = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    enf = f & ~np.isin(lab, list(bord))
    d = np.sqrt((a[..., 0].astype(float) - 255) ** 2 + a[..., 1].astype(float) ** 2
                + (a[..., 2].astype(float) - 255) ** 2)
    # ⚠ LE « TROU VOULU » SE MESURE AVEC LA CLÉ DE L'IMAGE, PAS AVEC LE MAGENTA.
    # Après passage au vert, un trou est vert : mesuré au magenta, les 1 052 px
    # de trous du Nœud très abîmé étaient comptés comme du dessin percé, et cinq
    # pièces de l'Ouvrage sortaient marquées à tort.
    cle = np.array(cond.cle_de_fond(a), float)
    dc = np.sqrt(((a.astype(float) - cle) ** 2).sum(2))
    coeur = ndimage.binary_erosion(enf & (dc >= 60), iterations=2)
    return int(coeur.sum()), int((enf & (dc < 60)).sum())


def cellules(prefixe, dossier_deg, dossier_sel):
    """Rend les quatre états : l'intact vient de la SÉLECTION, les trois autres
    des cellules de la planche. ⚠ La cellule 1 n'est PAS l'intact — mesuré, les
    sprites de sélection portent zéro pixel de fumée et les trois cellules en
    portent toutes."""
    sel = [f for f in os.listdir(dossier_sel) if f.startswith(prefixe.split('_')[0] + '_')]
    deg = [f for f in os.listdir(dossier_deg) if f.startswith(prefixe.split('_')[0] + '_')]
    assert len(sel) == 1 and len(deg) == 1, (prefixe, sel, deg)
    intact = np.asarray(Image.open(os.path.join(dossier_sel, sel[0])).convert('RGB'))
    planche = np.asarray(Image.open(os.path.join(dossier_deg, deg[0])).convert('RGB'))
    yield '', intact
    for i, suffixe in enumerate(ETATS):
        yield suffixe, planche[:, i * 1024:(i + 1) * 1024]


if __name__ == '__main__':
    deg, sel, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(dst, exist_ok=True)
    total_fumee = 0
    bascules = []
    print(f"{'sprite':44s}{'fumée':>8}{'percé':>7}{'trous':>7}")
    for prefixe, camp, ident in TABLE:
        # ⚠⚠ LA CLÉ SE DÉCIDE PAR BÂTIMENT, PAS PAR CELLULE ET PAS PAR CAMP.
        # Par cellule, la Centrale sortait avec son état abîmé sur vert et les
        # trois autres sur magenta — quatre fichiers du même objet, deux clés.
        # Par camp, la Raffinerie du JOUEUR restait sur magenta alors que son
        # violet clair `(193, 94, 225)` lui coûtait 1 293 px en pose abîmée.
        # On mesure les quatre états, et le PIRE décide pour les quatre.
        etats = []
        for suffixe, cellule in cellules(prefixe, deg, sel):
            a, n = opacifier(cellule)
            total_fumee += n
            etats.append((suffixe, a, n))
        pire = max(controle(a)[0] for _, a, _ in etats)
        au_vert = camp == 'o' or pire > SEUIL_BASCULE
        if au_vert:
            candidats = [(s_, passer_au_vert(a), n) for s_, a, n in etats]
            if max(controle(a)[0] for _, a, _ in candidats) <= pire:
                etats = candidats
                bascules.append(f'bat_{camp}_{ident}')
            else:
                au_vert = False
        for suffixe, a, n in etats:
            perce, trous = controle(a)
            nom = f'bat_{camp}_{ident}{suffixe}'
            Image.fromarray(a).save(os.path.join(dst, nom + '.png'))
            drapeau = '  ⚠' if perce else ''
            print(f'{nom:44s}{n:8d}{perce:7d}{trous:7d}'
                  f'{"  vert" if au_vert else "":>7}{drapeau}')

    print(f'\n{len(TABLE) * 4} sprites écrits · {total_fumee} px de fumée opacifiés')
    print(f'{len(bascules)} bâtiments sur {len(TABLE)} passés au vert :')
    for b in bascules:
        print('   ', b)
