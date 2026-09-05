import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import ImageFile as _IF; _IF.LOAD_TRUNCATED_IMAGES=True
from cond import est_fond, est_fond_sujet, eroder, reduire, boite
from portes import POIDS, PORTES
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
    """Apparie chaque pixel à une teinte de la palette, sous les trois portes.

    ⚠ LES NOMBRES VIENNENT DE `tools/portes.py`, ET DE LÀ SEULEMENT. Ils étaient
    écrits ici en littéraux ; `test/accent.test.js` en a besoin depuis le lot
    PIXELS, et deux tables auraient divergé au premier réglage. Voir l'en-tête
    de ce module-là pour la mécanique.
    """
    a,b,c=POIDS
    PA=np.array([c_ for n,h,c_ in P],dtype=np.int32)
    d=(a*(flat[:,0:1]-PA[:,0])**2+b*(flat[:,1:2]-PA[:,1])**2+c*(flat[:,2:3]-PA[:,2])**2)
    R,G,B=flat[:,0].astype(float),flat[:,1].astype(float),flat[:,2].astype(float)
    mx=np.maximum(np.maximum(R,G),B); mn=np.minimum(np.minimum(R,G),B); mx=np.maximum(mx,1)
    J,Rg,Bl=PORTES['jaune'],PORTES['rouge'],PORTES['blanc']
    pj=(B/mx<J['bleuSurMax'])&(G/mx>J['vertSurMax'])
    pr=(G/mx<Rg['vertSurMax'])&(B/mx<Rg['bleuSurMax'])&(R>=Rg['rougeMin'])
    pb=((mx-mn)/mx<Bl['ecartSurMax'])&(mx>=Bl['maxMin'])
    M=np.iinfo(np.int32).max
    for i,(n,_h,_c) in enumerate(P):
        if n.startswith('jaune'): d[~pj,i]=M
        elif n.startswith('rouge'): d[~pr,i]=M
        elif n.startswith('blanc'): d[~pb,i]=M
    return d.argmin(1)

def recadrer(cell,cible,N,cote_ref=None,ancrage='centre'):
    """Pose le contenu d'une cellule dans une boîte carrée, à l'échelle voulue.

    ⚠⚠ `cote_ref` EST L'ÉCHELLE, ET SANS ELLE CHAQUE CELLULE EST NORMALISÉE
    SÉPARÉMENT. C'est le défaut que le lot EMBLÈMES-ABÎMÉS a mesuré : `cote` est
    le côté du contenu DE CETTE CELLULE-LÀ, porté à `cible/N` de la boîte, si
    bien qu'une base de niveau 1 ressortait à la taille d'une base de niveau 50 —
    relevé sur `art/sprites/carte/128/`, largeurs 86 et 118 pour `site_base_j`,
    et 117 ou 118 sur SEPT des neuf paliers. Passer une référence COMMUNE à
    plusieurs cellules leur rend leur rapport de taille : celle qui vaut la
    référence atteint `cible`, les autres restent dessous d'autant.

    ⚠ LE DÉFAUT `None` REND LA FORMULE D'HIER AU CARACTÈRE PRÈS, et c'est ce qui
    laisse les quinze autres producteurs byte-identiques — le vérificateur le
    dit, pas la relecture.

    ⚠⚠ `ancrage='bas'` POSE LES CONTENUS SUR UNE LIGNE DE SOL COMMUNE, et il va
    avec la référence. Centrer des contenus de hauteurs différentes ferait
    FLOTTER les petits au milieu de leur case pendant que les grands touchent le
    sol ; sous une carte, des bâtiments qui ne reposent pas sur la même ligne se
    lisent comme un défaut de dessin. Le panache, lui, monte librement dans
    l'espace laissé au-dessus.

    ⚠ LA LIGNE DE SOL EST CELLE QUE LE CENTRAGE DONNAIT AU PLUS GRAND CONTENU —
    `box/2 + cote_ref/2` —, donc l'emprise ne change pas de valeur : le contenu
    de référence occupe toujours `cible` sur `N`, marge du haut et marge du bas
    identiques. Ce n'est pas un cadrage neuf, c'est le même vu depuis le bas.
    """
    a=np.array(cell.convert('RGBA')); m=(~est_fond(a[...,:3]))&(a[...,3]>=128)
    ys,xs=np.where(m)
    cote=max(xs.max()-xs.min(),ys.max()-ys.min())+1
    reference=cote if cote_ref is None else int(round(cote_ref))
    box=int(round(reference*N/cible))
    cx=(xs.min()+xs.max())//2; cy=(ys.min()+ys.max())//2
    if ancrage=='bas':
        oy=box//2+reference//2-int(ys.max())
    elif ancrage=='centre':
        oy=box//2-cy
    else:
        raise ValueError(f'recadrer : ancrage inconnu « {ancrage} »')
    out=Image.new('RGBA',(box,box),(255,0,255,255)); out.paste(cell.convert('RGBA'),(box//2-cx,oy))
    return out

def conditionner(im,P,N,erosion=3):
    """Rend la grille quantifiée ET la matière dont elle est tirée.

    ⚠⚠ DEUX SORTIES DEPUIS LE LOT PIXELS, ET LA SIGNATURE LE DIT. `g` reste ce
    qu'il était — les outils s'en servent ENTRE les deux appels : retrait
    d'appendice, alignement des chenilles, mesure d'ancre de tourelle. Ce qui
    entre, c'est `(a, fond)` : le tableau RGBA du recadré et son masque de fond,
    que `ecrire` réduit par filtre au lieu de peindre une palette.

    ⚠ PAS D'ÉTAT CACHÉ. Ranger la matière dans une globale que `ecrire` irait
    relire marcherait tant que les appels s'enchaînent, et mentirait le jour où
    un outil intercale un traitement entre les deux.
    """
    a=np.array(im.convert('RGBA')); rgb=a[...,:3]; al=a[...,3]
    m=(~est_fond_sujet(rgb))&(al>=128); m=eroder(m,erosion)
    idx=np.full(m.shape,-1,dtype=np.int16)
    idx[m]=quant(rgb[m].astype(np.int32),P)
    return reduire(idx,N,len(P)), (a,~m)

SEUIL_ALPHA=8

def ecrire(g,P,path,matiere=None):
    """Écrit le sprite : rendu palette sans matière, réduction par filtre avec.

    ⚠⚠ L'ORDRE DES CINQ GESTES COMPTE, ET LA PRÉMULTIPLICATION EST CELUI QU'ON
    OUBLIE. Sans elle, LANCZOS moyenne le magenta du fond avec le sujet et TOUS
    les bords ressortent roses — invisible à la vignette, flagrant au zoom.
    On met donc l'alpha à zéro sur le fond, on prémultiplie, on réduit, on
    dé-prémultiplie, et on coupe l'alpha sous SEUIL_ALPHA.

    ⚠ LE RGB EST REMIS À ZÉRO SOUS LE SEUIL. Un pixel transparent qui garde une
    couleur est une donnée que personne ne lit et que tout encodeur paie.
    """
    N=g.shape[0]
    if matiere is None:
        out=np.zeros((N,N,4),np.uint8)
        for i,(n,h,c) in enumerate(P):
            k=(g==i); out[k,0],out[k,1],out[k,2],out[k,3]=c[0],c[1],c[2],255
        Image.fromarray(out,'RGBA').save(path)
        return
    a,fond=matiere
    src=a.astype(np.float64).copy()
    src[fond,3]=0.0
    src[...,:3]*=src[...,3:4]/255.0
    petite=Image.fromarray(np.clip(np.rint(src),0,255).astype(np.uint8),'RGBA').resize((N,N),Image.LANCZOS)
    r=np.array(petite).astype(np.float64)
    al=r[...,3]
    vif=al>=SEUIL_ALPHA
    rgb=np.zeros((N,N,3))
    rgb[vif]=np.clip(r[...,:3][vif]*255.0/al[vif,None],0,255)
    out=np.zeros((N,N,4),np.uint8)
    out[...,:3]=np.rint(rgb).astype(np.uint8)
    out[...,3]=np.where(vif,np.rint(al),0).astype(np.uint8)
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
    for d in ['unites/128','batiments/128']:
        os.makedirs(f'{R}/{d}',exist_ok=True)
    print('== UNITES, grille 128 ==')
    for fn,cles,emp in U:
        im=Image.open('/home/claude/in2/'+fn); W,H=im.size; n=len(cles); cw=W//n
        for i,cle in enumerate(cles):
            P=pal(False)
            g,matiere=conditionner(recadrer(im.crop((i*cw,0,(i+1)*cw,H)), emp*4, 128), P, 128)
            b=boite(g); ecrire(g,P,f'{R}/unites/128/off_j_{cle}.png',matiere)
            print(f'  off_j_{cle:12s} {b["l"]:3d}x{b["h"]:<3d} / {emp*4} vise   {len(set(int(v) for v in g.ravel() if v>=0)):3d} couleurs')
    print('== BATIMENTS, grille 128 ==')
    for fn,nx,ny,gr in B:
        im=Image.open('/home/claude/in3/'+fn); W,H=im.size; cw,ch=W//nx,H//ny
        for j in range(ny):
            for i in range(nx):
                cle=gr[j][i]; ouv=cle in OUV; P=pal(ouv); pref='bat_o_' if ouv else 'bat_j_'
                g,matiere=conditionner(recadrer(im.crop((i*cw,j*ch,(i+1)*cw,(j+1)*ch)), cible(PV[cle])*4, 128), P, 128)
                b=boite(g); ecrire(g,P,f'{R}/batiments/128/{pref}{cle}.png',matiere)
                print(f'  {pref+cle:32s} {b["l"]:3d}x{b["h"]:<3d} / {cible(PV[cle])*4} vise   {len(set(int(v) for v in g.ravel() if v>=0)):3d} couleurs')
