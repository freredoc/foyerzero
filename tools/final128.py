import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import ImageFile as _IF; _IF.LOAD_TRUNCATED_IMAGES=True
from cond import est_fond, est_fond_sujet, eroder, reduire, boite
from PIL import Image
import numpy as np, os, math

def hexrgb(h): return (int(h[1:3],16),int(h[3:5],16),int(h[5:7],16))
BASE=[("kaki contour","#161914"),("kaki ombre","#343A2C"),("kaki corps","#4E5742"),
 ("kaki eclaire","#6A7658"),("kaki lumiere","#8C9A72"),
 ("metal sombre","#1E2124"),("metal moyen","#3E454C"),("metal clair","#68727E"),
 ("blanc sombre","#928E80"),("blanc clair","#F5F3E8"),
 ("rouge sombre","#8A1E17"),("rouge clair","#E43E32"),
 ("jaune sombre","#A67018"),("jaune clair","#F5B636")]
A=[("A contour","#0D0B12"),("A ombre","#231D2E"),("A corps","#382E47"),
   ("A eclaire","#4E4160"),("A lumiere","#6B5B80")]
def pal(ouv): return [(n,h,hexrgb(h)) for n,h in (BASE+(A if ouv else []))]

def quant(flat,P):
    PA=np.array([c for n,h,c in P],dtype=np.int32)
    d=(2*(flat[:,0:1]-PA[:,0])**2+4*(flat[:,1:2]-PA[:,1])**2+3*(flat[:,2:3]-PA[:,2])**2)
    R,G,B=flat[:,0].astype(float),flat[:,1].astype(float),flat[:,2].astype(float)
    mx=np.maximum(np.maximum(R,G),B); mn=np.minimum(np.minimum(R,G),B); mx=np.maximum(mx,1)
    pj=(B/mx<0.25)&(G/mx>0.55); pr=(G/mx<0.55)&(B/mx<0.55)&(R>=90); pb=((mx-mn)/mx<0.22)&(mx>=175)
    M=np.iinfo(np.int32).max
    for i,(n,_h,_c) in enumerate(P):
        if n.startswith('jaune'): d[~pj,i]=M
        elif n.startswith('rouge'): d[~pr,i]=M
        elif n.startswith('blanc'): d[~pb,i]=M
    return d.argmin(1)

def recadrer(cell,cible,N):
    a=np.array(cell.convert('RGBA')); m=(~est_fond(a[...,:3]))&(a[...,3]>=128)
    ys,xs=np.where(m)
    cote=max(xs.max()-xs.min(),ys.max()-ys.min())+1
    box=int(round(cote*N/cible))
    cx=(xs.min()+xs.max())//2; cy=(ys.min()+ys.max())//2
    out=Image.new('RGBA',(box,box),(255,0,255,255)); out.paste(cell.convert('RGBA'),(box//2-cx,box//2-cy))
    return out

def conditionner(im,P,N,erosion=3):
    """Le sujet, ramené à sa grille de gros pixels — ET LA MATIÈRE QU'IL RECOUVRE.

    ⚠⚠ IL REND DEUX CHOSES DEPUIS LE LOT COULEUR, ET LA SECONDE SE PASSE À
    `ecrire`. `g` dit QUELLE TEINTE DE LA FICHE chaque gros pixel a votée ; la
    matière dit la COULEUR RÉELLE du dessin sous ce gros pixel. Les deux sont
    nécessaires : le vote décide de la silhouette et du verrou d'accent, la
    matière décide de la couleur.

    ⚠ SIGNATURE EXPLICITE, PAS D'ÉTAT CACHÉ DANS LE MODULE. Ranger le couple dans
    une globale que `ecrire` irait relire marche tant que les appels s'enchaînent,
    et ment le jour où un outil intercale un traitement — `planches.produire`
    intercale déjà `aligner`.

    ⚠ `est_fond_sujet`, PAS `est_fond` : voir le commentaire de `cond.py`. C'est
    la porte du DÉTOURAGE, et elle est la seule à changer.
    """
    a=np.array(im.convert('RGBA')); rgb=a[...,:3]; al=a[...,3]
    m=(~est_fond_sujet(rgb))&(al>=128); m=eroder(m,erosion)
    idx=np.full(m.shape,-1,dtype=np.int16)
    idx[m]=quant(rgb[m].astype(np.int32),P)
    return reduire(idx,N,len(P)), (rgb.astype(np.int32), m)

# ⚠⚠ LES TROIS FAMILLES D'ACCENT, RECONNUES PAR LEUR NOM ET NON PAR LEUR HEX.
# Ce sont exactement les trois que `quant` RÉSERVE plus haut par `pj`, `pr` et
# `pb` : jaune, rouge, blanc. Écrire ici une liste de six `#RRGGBB` en ferait une
# seconde vérité, qui vieillirait au premier changement de fiche pendant que le
# gardien de `quant` continuerait de dire autre chose.
ACCENT = ('jaune', 'rouge', 'blanc')


def est_accent(nom):
    return nom.startswith(ACCENT)


def _medoide(bloc, poids):
    """Le pixel RÉEL du bloc le plus proche de sa moyenne.

    Pas la moyenne : le médoïde ne fabrique aucune teinte qui ne soit pas dans le
    dessin, et il garde les bords francs là où la moyenne les baverait.

    ⚠ LA DISTANCE EST CELLE DE `quant` — (2, 4, 3), pondérée vers le vert. Une
    seconde métrique dans le même fichier serait une seconde vérité sur ce que
    « proche » veut dire entre deux couleurs.
    """
    moy = bloc.mean(0)
    d = (poids * (bloc - moy) ** 2).sum(1)
    return bloc[int(d.argmin())]


def ecrire(g,P,path,matiere=None):
    """Le sprite écrit sur disque, palette fermée ou matière du dessin.

    Sans `matiere`, c'est le comportement d'avant le lot COULEUR : chaque gros
    pixel prend la teinte de la fiche que le vote lui a donnée. Avec, il prend la
    couleur RÉELLE du dessin — sauf pour l'accent.

    ⚠⚠ LE VERROU D'ACCENT. Un gros pixel dont le vote désigne une des six teintes
    d'accent reçoit **la teinte exacte de la fiche**, pas la matière. C'est ce qui
    fait ressortir le liseré blanc, rouge et jaune, et c'est aussi ce qui récupère
    le liseré orange du Dépôt de véhicules que la quantification libre perdait :
    la chaîne le classait déjà en accent, il suffit de ne pas le laisser se faire
    requantifier ensuite. `test/accent.test.js` mesure que les comptes de pixels
    d'accent ne bougent pas d'une unité.

    ⚠⚠ LES BORNES DE BLOC SONT EXACTEMENT CELLES DE `reduire`, ET C'EST
    OBLIGATOIRE. Un bloc décalé d'un pixel ne se verrait pas à l'œil et fausserait
    toute la colorisation. Elles sont recopiées ici parce que `reduire` travaille
    sur des INDICES et celle-ci sur des PIXELS — la formule est la même, à la
    ligne près.

    ⚠⚠ UN BLOC OPAQUE SANS UN SEUL PIXEL DE MATIÈRE PREND LA TEINTE DE LA FICHE,
    JAMAIS LA MOYENNE DU BLOC ENTIER. Le vote ne peut pas produire ce cas — un
    bloc sans pixel opaque sort transparent —, mais `planches.aligner` le produit :
    il PEINT les deux bandes de chenille des trois blindés à la grille 32, à des
    endroits où le sujet ne s'étend pas. La moyenne du bloc entier y rendrait le
    magenta du fond de recadrage. Ces gros pixels-là n'ont pas de matière parce
    qu'ils ont été inventés ; la fiche est leur seule source.
    """
    N=g.shape[0]; out=np.zeros((N,N,4),np.uint8)
    for i,(n,h,c) in enumerate(P):
        k=(g==i); out[k,0],out[k,1],out[k,2],out[k,3]=c[0],c[1],c[2],255
    if matiere is not None:
        rgb, m = matiere
        H,W = m.shape
        poids = np.array([2,4,3],dtype=np.int64)
        libre = [not est_accent(n) for n,h,c in P]
        for by in range(N):
            y0=by*H//N; y1=max(y0+1,(by+1)*H//N)
            for bx in range(N):
                i = int(g[by,bx])
                if i < 0 or not libre[i]:
                    continue
                x0=bx*W//N; x1=max(x0+1,(bx+1)*W//N)
                sous = m[y0:y1,x0:x1]
                if not sous.any():
                    continue
                out[by,bx,:3] = _medoide(rgb[y0:y1,x0:x1][sous].astype(np.int64), poids)
    Image.fromarray(out,'RGBA').save(path)

# ---------------- unites ----------------
U=[('P2_1_off_j_meute_off_j_perceurs.png',['meute','perceurs'],18),
   ('P2_2_off_j_guetteur_off_j_fouisseurs_off_j_carapace.png',['guetteur','fouisseurs','carapace'],24),
   ('P2_3_off_j_ratisseur_off_j_fendeur_off_j_belier.png',['ratisseur','fendeur','belier'],24),
   ('P2_4_off_j_broyeur_off_j_pilon.png',['broyeur','pilon'],28),
   ('P2_5_off_j_crecelle_off_j_busard_off_j_frappeur.png',['crecelle','busard','frappeur'],24),
   ('P2_6_off_j_enclume.png',['enclume'],28)]
# ---------------- batiments ----------------
PV={'chantier_de_construction':5500,'centre_de_commandement':3000,'qg_de_defense':3000,
 'complexe_de_defense':2500,'caserne':2500,'usine':2500,'aerodrome':2500,'centrale':2000,
 'collecteur':1500,'raffinerie':1000,'accumulateur':1000,
 'souche':5500,'etai':2500,'noeud':1500,'gangue':1000,'terril':1000}
def cible(pv): return round(16+(28-16)*(math.sqrt(pv)-math.sqrt(1000))/(math.sqrt(5500)-math.sqrt(1000)))
# Les seize bâtiments, sur les planches sources « 1024 » — bascule arbitrée par
# Ethan le 30/08/2026. La série précédente (P6_1…P6_4, P7_1…P7_3) reste au dépôt
# et n'est plus citée : `art/sources/` n'est jamais amputé, rien n'y est un
# produit, tout y est un original.
#
# Mesuré sur la grille 64, chaîne officielle des deux côtés : la V2 atteint
# l'emprise visée sur 16 sujets sur 16 — la V1 était sous la cible sur 8, jusqu'à
# 24 gros pixels pour 32 visés — et `gangue`/`terril` passent de 2 % à 45 %
# d'écart de silhouette, ce qui solde le défaut n° 4 du 27/08, « le même
# bâtiment ».
#
# ⚠ LE `-2` DE LA PLANCHE P3 N'EST PAS UNE COQUILLE : c'est le seul exemplaire
# présent au dépôt.
#
# ⚠ ET `usine` RESTE LA CLÉ D'INDEX, comme avant : elle devient
# `bat_j_depot_de_vehicules` au moment de l'écriture. C'est `PV` qui le dit, et
# `PV` n'est pas touchée par cette bascule.
B=[('P1_caserne_depot_aerodrome_1024.png',1,3,[['caserne'],['usine'],['aerodrome']]),
   ('P2_chantier_qg_complexe_centre_1024.png',2,2,
        [['chantier_de_construction','qg_de_defense'],
         ['complexe_de_defense','centre_de_commandement']]),
   ('P3_raffinerie_collecteur_centrale_accumulateur_1024-2.png',2,2,
        [['raffinerie','collecteur'],['centrale','accumulateur']]),
   ('P4_souche_etai_1024.png',1,2,[['souche'],['etai']]),
   ('P5_gangue_noeud_terril_1024.png',1,3,[['gangue'],['noeud'],['terril']])]
OUV={'souche','etai','noeud','gangue','terril'}

if __name__=='__main__':
    R='/home/claude/work/LIVRAISON'
    for d in ['unites/128','unites/32','batiments/128','batiments/32']:
        os.makedirs(f'{R}/{d}',exist_ok=True)
    print('== UNITES, grille 128 ==')
    for fn,cles,emp in U:
        im=Image.open('/home/claude/in2/'+fn); W,H=im.size; n=len(cles); cw=W//n
        for i,cle in enumerate(cles):
            P=pal(False)
            g,mat=conditionner(recadrer(im.crop((i*cw,0,(i+1)*cw,H)), emp*4, 128), P, 128)
            b=boite(g); ecrire(g,P,f'{R}/unites/128/off_j_{cle}.png',mat)
            print(f'  off_j_{cle:12s} {b["l"]:3d}x{b["h"]:<3d} / {emp*4} vise   {len(set(int(v) for v in g.ravel() if v>=0)):3d} couleurs')
    print('== BATIMENTS, grille 128 ==')
    for fn,nx,ny,gr in B:
        im=Image.open('/home/claude/in3/'+fn); W,H=im.size; cw,ch=W//nx,H//ny
        for j in range(ny):
            for i in range(nx):
                cle=gr[j][i]; ouv=cle in OUV; P=pal(ouv); pref='bat_o_' if ouv else 'bat_j_'
                g,mat=conditionner(recadrer(im.crop((i*cw,j*ch,(i+1)*cw,(j+1)*ch)), cible(PV[cle])*4, 128), P, 128)
                b=boite(g); ecrire(g,P,f'{R}/batiments/128/{pref}{cle}.png',mat)
                print(f'  {pref+cle:32s} {b["l"]:3d}x{b["h"]:<3d} / {cible(PV[cle])*4} vise   {len(set(int(v) for v in g.ravel() if v>=0)):3d} couleurs')
