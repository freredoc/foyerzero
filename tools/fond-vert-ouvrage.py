"""Passe les sources de l'Ouvrage du fond magenta au fond vert `#00FF00`.

⚠ CE FICHIER REMPLACE `tools/fond-vert-aeronefs-ouvrage.py` livré au lot
aéronefs, qui n'est pas encore mergé. Même noyau, une table par lot.

POURQUOI. `tools/cond.py:cle_de_fond` choisit la clé sur les quatre coins, et
`est_fond_sujet` applique la porte large `c2` — « rouge et bleu hauts, vert
bas ». L'ardoise violacée de l'Ouvrage EST rouge et bleu hauts, vert bas : sur
fond magenta la porte mange le corps. C'est pour ça que la double clé existe
(voir la ligne 30 de `cond.py`, distance mesurée 140,0, pile sur le seuil).

TROIS RÈGLES, ET ELLES NE SONT PAS INTERCHANGEABLES.
1. La porte large `c2` reste bornée à la composante qui TOUCHE LE BORD : sinon
   elle perce l'ardoise au milieu du sujet.
2. Le magenta FRANC (distance < 90) est du fond où qu'il soit, même enfermé.
   Sans cette règle, les fentes voulues du Frappeur restaient roses et se
   voyaient à 40 px comme deux pastilles fluo.
3. La frange d'anticrénelage est reprise par voisinage, avec un test STRICT
   (`R > 140 et B > 140 et V < 0,85·min(R,B)`) que l'ardoise ne déclenche
   jamais — le test large `R−V > 20 et B−V > 20`, lui, est vrai sur tout le
   violet et rognait le contour.
"""
import numpy as np, sys, os
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cond

PASSES_FRANGE = 3
VERT = np.array([0, 255, 0], np.uint8)

TABLES = {
    'aeronefs': [('72945', 'off_o_crecelle'), ('72946', 'off_o_busard'),
                 ('72977', 'off_o_frappeur'), ('72978', 'off_o_enclume')],
    'defenses': [('67054', 'socle_def_o_casemate'), ('67056', 'socle_def_o_creneau'),
                 ('socle_batterie_brut', 'socle_def_o_batterie'),
                 ('66955', 'socle_def_o_faucheuse'), ('66967', 'socle_def_o_mortier'),
                 ('66962', 'socle_def_o_harpon'),
                 ('66959', 'def_o_casemate'), ('66971', 'def_o_creneau'),
                 ('66963', 'def_o_batterie'), ('66970', 'def_o_faucheuse'),
                 ('66960', 'def_o_mortier'), ('66964', 'def_o_harpon'),
                 ('67057', 'def_o_merlon'), ('66956', 'def_o_ronce'),
                 ('66975', 'def_o_herse')],
    'infanterie': [('77942', 'off_o_meute'), ('74018', 'off_o_meute_def'),
                   ('77940', 'off_o_guetteur'), ('77941', 'off_o_guetteur_def'),
                   ('74019', 'off_o_perceurs'), ('74020', 'off_o_perceurs_def'),
                   ('77939', 'off_o_fouisseurs'),
                   ('74021', 'off_o_carapace'), ('74022', 'off_o_carapace_def')],
}


def passer_au_vert(entree, sortie):
    rgb = np.asarray(Image.open(entree).convert('RGB'))
    brut = cond.est_fond(rgb)
    etiquettes, n = ndimage.label(brut)
    bord = np.unique(np.concatenate([etiquettes[0, :], etiquettes[-1, :],
                                     etiquettes[:, 0], etiquettes[:, -1]]))
    dehors = np.zeros(n + 1, bool); dehors[bord] = True; dehors[0] = False
    fond = dehors[etiquettes]

    d = np.sqrt((rgb[..., 0].astype(float) - 255) ** 2 + rgb[..., 1].astype(float) ** 2
                + (rgb[..., 2].astype(float) - 255) ** 2)
    fond = fond | (d < 90)

    r = rgb[..., 0].astype(int); v = rgb[..., 1].astype(int); b = rgb[..., 2].astype(int)
    frange = (r > 140) & (b > 140) & (v < np.minimum(r, b) * 0.85)
    for _ in range(PASSES_FRANGE):
        fond = fond | (ndimage.binary_dilation(fond) & frange)

    out = rgb.copy(); out[fond] = VERT

    # 4. Un résidu magenta ENFERMÉ dans le sujet et PAS FRANC (90 ≤ d < 140) est
    #    un artefact de compression, pas du fond : le laisser donnerait un point
    #    rose dans le sprite, et le compter comme fond y ferait un trou. On le
    #    remplace par la médiane de son voisinage sain. Mesuré sur la Meute :
    #    une tache de 8 px, recopiée cinq fois par le recoupage.
    d2 = np.sqrt((out[..., 0].astype(float) - 255) ** 2 + out[..., 1].astype(float) ** 2
                 + (out[..., 2].astype(float) - 255) ** 2)
    sales = (~fond) & (d2 < 140)
    n_sales = int(sales.sum())
    if n_sales:
        sain = out.copy().astype(float)
        sain[sales] = np.nan
        for c in range(3):
            canal = sain[..., c]
            rempli = ndimage.generic_filter(np.where(np.isnan(canal), 0, canal), np.mean, size=9)
            poids = ndimage.uniform_filter((~sales).astype(float), size=9)
            out[..., c][sales] = np.clip(rempli[sales] / np.maximum(poids[sales], 1e-6), 0, 255)

    Image.fromarray(out).save(sortie)
    return int(fond.sum()), int((~fond).sum())


def controle(chemin):
    rgb = np.asarray(Image.open(chemin).convert('RGB'))
    cle = cond.cle_de_fond(rgb)
    fond = cond.est_fond_sujet(rgb)
    d = np.sqrt((rgb[..., 0].astype(float) - 255) ** 2 + rgb[..., 1].astype(float) ** 2
                + (rgb[..., 2].astype(float) - 255) ** 2)
    return cle, int((~fond & (d < 140)).sum())


if __name__ == '__main__':
    lot, src_dir, dst_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    for jet, nom in TABLES[lot]:
        f, s = passer_au_vert(os.path.join(src_dir, jet + '.png'),
                              os.path.join(dst_dir, nom + '.png'))
        cle, reste = controle(os.path.join(dst_dir, nom + '.png'))
        etat = 'vert' if cle == (0, 255, 0) else f'⚠ {cle}'
        print(f'{nom:26s} ← {jet:20s} fond {f:7d} sujet {s:7d} | clé {etat} | magenta restant {reste}')
