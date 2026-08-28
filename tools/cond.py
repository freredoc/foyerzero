# Port fidele du noyau de tools/conditionneur.html (v1)
from PIL import Image
import numpy as np, os, json

BASE = [("kaki contour","#161914"),("kaki ombre","#343A2C"),("kaki corps","#4E5742"),
 ("kaki eclaire","#6A7658"),("kaki lumiere","#8C9A72"),
 ("metal sombre","#1E2124"),("metal moyen","#3E454C"),("metal clair","#68727E"),
 ("blanc sombre","#928E80"),("blanc clair","#F5F3E8"),
 ("rouge sombre","#8A1E17"),("rouge clair","#E43E32"),
 ("jaune sombre","#A67018"),("jaune clair","#F5B636")]

def hexrgb(h): return (int(h[1:3],16),int(h[3:5],16),int(h[5:7],16))
PAL=[(n,h,hexrgb(h)) for n,h in BASE]
PALARR=np.array([p[2] for p in PAL],dtype=np.int32)

def est_fond(rgb, seuil=140):
    r=rgb[...,0].astype(np.int32); g=rgb[...,1].astype(np.int32); b=rgb[...,2].astype(np.int32)
    d=(r-255)**2+g**2+(b-255)**2
    c1 = d < seuil*seuil
    c2 = (r>140)&(b>140)&(g < np.minimum(r,b)*0.7)
    return c1|c2

def eroder(m,n):
    for _ in range(n):
        c=m.copy()
        up=np.ones_like(c); dn=np.ones_like(c); lf=np.ones_like(c); rt=np.ones_like(c)
        lf[:,1:]=c[:,:-1]; rt[:,:-1]=c[:,1:]; up[1:,:]=c[:-1,:]; dn[:-1,:]=c[1:,:]
        m = c & lf & rt & up & dn
    return m

def quantifier(rgb, mask):
    h,w,_=rgb.shape
    flat=rgb.reshape(-1,3).astype(np.int32)
    d = (2*(flat[:,0:1]-PALARR[:,0])**2 + 4*(flat[:,1:2]-PALARR[:,1])**2 + 3*(flat[:,2:3]-PALARR[:,2])**2)
    idx = d.argmin(1).astype(np.int16).reshape(h,w)
    idx[~mask]=-1
    return idx

def reduire(idx,N):
    H,W=idx.shape
    out=np.full((N,N),-1,dtype=np.int16)
    TR=len(PAL)
    for by in range(N):
        y0=by*H//N; y1=max(y0+1,(by+1)*H//N)
        for bx in range(N):
            x0=bx*W//N; x1=max(x0+1,(bx+1)*W//N)
            blk=idx[y0:y1,x0:x1].ravel()
            v=np.where(blk<0,TR,blk)
            cnt=np.bincount(v,minlength=TR+1)
            best=int(cnt.argmax())
            out[by,bx]= -1 if best==TR else best
    return out

def boite(g):
    ys,xs=np.where(g>=0)
    if len(xs)==0: return None
    return dict(x0=int(xs.min()),x1=int(xs.max()),y0=int(ys.min()),y1=int(ys.max()),
                l=int(xs.max()-xs.min()+1),h=int(ys.max()-ys.min()+1))

def bordure_vide(g,marge=2):
    N=g.shape[0]
    return bool((g[:marge,:]<0).all() and (g[N-marge:,:]<0).all() and (g[:,:marge]<0).all() and (g[:,N-marge:]<0).all())

def conditionner(im, N=32, erosion=3, seuil=140):
    rgb=np.array(im.convert('RGB'))
    mask=~est_fond(rgb,seuil)
    if erosion: mask=eroder(mask,erosion)
    idx=quantifier(rgb,mask)
    return reduire(idx,N)

def rendre(g, scale=4):
    N=g.shape[0]
    out=np.zeros((N,N,4),dtype=np.uint8)
    for i,(n,h,c) in enumerate(PAL):
        m=(g==i); out[m,0]=c[0]; out[m,1]=c[1]; out[m,2]=c[2]; out[m,3]=255
    im=Image.fromarray(out,'RGBA')
    return im.resize((N*scale,N*scale),Image.NEAREST)
