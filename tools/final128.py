import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import ImageFile as _IF; _IF.LOAD_TRUNCATED_IMAGES=True
from cond import est_fond, eroder, reduire, boite
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
    a=np.array(im.convert('RGBA')); rgb=a[...,:3]; al=a[...,3]
    m=(~est_fond(rgb))&(al>=128); m=eroder(m,erosion)
    idx=np.full(m.shape,-1,dtype=np.int16)
    idx[m]=quant(rgb[m].astype(np.int32),P)
    return reduire(idx,N)

def ecrire(g,P,path):
    N=g.shape[0]; out=np.zeros((N,N,4),np.uint8)
    for i,(n,h,c) in enumerate(P):
        k=(g==i); out[k,0],out[k,1],out[k,2],out[k,3]=c[0],c[1],c[2],255
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
            g=conditionner(recadrer(im.crop((i*cw,0,(i+1)*cw,H)), emp*4, 128), P, 128)
            b=boite(g); ecrire(g,P,f'{R}/unites/128/off_j_{cle}.png')
            print(f'  off_j_{cle:12s} {b["l"]:3d}x{b["h"]:<3d} / {emp*4} vise   {len(set(int(v) for v in g.ravel() if v>=0)):3d} couleurs')
    print('== BATIMENTS, grille 128 ==')
    for fn,nx,ny,gr in B:
        im=Image.open('/home/claude/in3/'+fn); W,H=im.size; cw,ch=W//nx,H//ny
        for j in range(ny):
            for i in range(nx):
                cle=gr[j][i]; ouv=cle in OUV; P=pal(ouv); pref='bat_o_' if ouv else 'bat_j_'
                g=conditionner(recadrer(im.crop((i*cw,j*ch,(i+1)*cw,(j+1)*ch)), cible(PV[cle])*4, 128), P, 128)
                b=boite(g); ecrire(g,P,f'{R}/batiments/128/{pref}{cle}.png')
                print(f'  {pref+cle:32s} {b["l"]:3d}x{b["h"]:<3d} / {cible(PV[cle])*4} vise   {len(set(int(v) for v in g.ravel() if v>=0)):3d} couleurs')
