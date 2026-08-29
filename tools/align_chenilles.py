"""Aligne les chenilles des trois blindes a 10 points du joueur.
Les trois recoivent DEUX bandes identiques, aux memes coordonnees absolues,
meme largeur et meme rythme. Aucune forme inventee : kaki contour et kaki ombre
sont deja dans les trois sprites."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cond import *
import numpy as np, itertools

I={n:i for i,(n,h,c) in enumerate(PAL)}
CAISSE={I['kaki corps'],I['kaki eclaire'],I['kaki lumiere'],I['kaki ombre'],
        I['blanc sombre'],I['blanc clair'],I['rouge sombre'],I['rouge clair'],
        I['jaune sombre'],I['jaune clair'],I['metal moyen'],I['metal clair']}

# cadre commun, deduit de l'union des trois caisses mesurees
CX0,CX1 = 9,22      # caisse
CY0,CY1 = 7,23
LARG = 2            # largeur de chenille

def caisse_bbox(g):
    ys,xs=np.where(np.isin(g,list(CAISSE)))
    return int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max())

def aligner(g):
    g=g.copy()
    # 1. table rase de part et d'autre de la caisse commune
    g[:, :CX0]= -1
    g[:, CX1+1:]= -1
    # 2. combler le jeu entre la caisse reelle et le cadre commun
    x0,x1,y0,y1=caisse_bbox(g)
    for y in range(y0,y1+1):
        for x in range(CX0,x0):
            if g[y,x]<0: g[y,x]=I['kaki corps']
        for x in range(x1+1,CX1+1):
            if g[y,x]<0: g[y,x]=I['kaki corps']
    # 3. deux bandes identiques, memes colonnes, meme rythme ancre sur CY0
    for y in range(CY0,CY1+1):
        ton = I['kaki contour'] if (y-CY0)%2==0 else I['kaki ombre']
        if y in (CY0,CY1): ton=I['kaki contour']
        for dx in range(LARG):
            g[y, CX0-1-dx]=ton
            g[y, CX1+1+dx]=ton
    return g

if __name__=='__main__':
    cles=['ratisseur','fendeur','belier']
    G=np.load('tmp_blindes.npy')
    A=np.stack([aligner(G[i]) for i in range(3)])
    autor=set(range(len(PAL)))
    for i,k in enumerate(cles):
        g=A[i]; b=boite(g)
        assert set(int(v) for v in g.ravel() if v>=0) <= autor
        print(f'{k:10s} boite {b["l"]}x{b["h"]} bord2vide={bordure_vide(g)}')
        rendre(g).save(f'v3/off_j_{k}.png')
    mask=np.zeros((32,32),bool); mask[:,CX0-LARG:CX0]=True; mask[:,CX1+1:CX1+1+LARG]=True
    for a,b in itertools.combinations(range(3),2):
        d=int((A[a][mask]!=A[b][mask]).sum())
        print(f'chenilles {cles[a]} vs {cles[b]} : {d} gros pixels differents sur {int(mask.sum())}')
    np.save('tmp_blindes_alignes.npy',A)
