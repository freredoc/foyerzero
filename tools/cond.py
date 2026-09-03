# Port fidele du noyau de tools/conditionneur.html (v1)
from PIL import Image
import numpy as np, os, json
from scipy import ndimage

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

MAGENTA=(255,0,255)
VERT=(0,255,0)

def cle_de_fond(rgb):
    """Magenta ou vert, LU sur les quatre coins de l'image.

    ⚠ DÉTECTION, PAS PARAMÈTRE. Le violet de l'Ouvrage frôle le magenta —
    distance minimale mesurée 140,0, pile sur le seuil —, d'où des sources qui
    arriveront sur fond vert `#00FF00`. Les deux clés vont coexister pendant des
    mois : un drapeau à passer serait un drapeau à oublier sur une planche.

    Les quatre coins votent par somme des distances au carré : un coin mangé par
    le sujet ne peut pas décider seul.
    """
    h,w,_=rgb.shape
    coins=np.array([rgb[0,0],rgb[0,w-1],rgb[h-1,0],rgb[h-1,w-1]],dtype=np.int32)
    d=lambda c: int((((coins-np.array(c,dtype=np.int32))**2).sum()))
    return VERT if d(VERT)<d(MAGENTA) else MAGENTA

def est_fond_sujet(rgb, seuil=140):
    """Le fond D'UN SUJET déjà découpé — la seconde porte bornée à l'extérieur.

    ⚠⚠ ELLE NE REMPLACE PAS `est_fond`, ET NE DOIT PAS. `est_fond` sert aussi à
    DÉCOUPER les planches — les gouttières d'`emblemes.cellules`, les `bandes`,
    le `pivot` de `tourelles.py`. La toucher déplacerait les cellules elles-mêmes.
    Celle-ci n'est appelée que par `final128.conditionner`, sur une cellule déjà
    isolée, où la seule question est « quel pixel est du fond ».

    ⚠⚠ LA SECONDE PORTE MANGEAIT L'INTÉRIEUR DU SUJET. `c2` attrape le violet
    clair de l'Ouvrage, y compris au milieu d'une base, et `eroder` transforme
    chaque pixel pris en losange de 25. Mesuré sur socles + emblèmes de
    l'Ouvrage, trous enfermés : `c1|c2` 9 280 px, `c1` seule 51 px,
    `c1 | (c2 ∩ extérieur)` 40 px. On la garde donc, bornée à la composante de
    fond qui TOUCHE LE BORD : elle nettoie encore la frange, elle ne perce plus.
    """
    r=rgb[...,0].astype(np.int32); g=rgb[...,1].astype(np.int32); b=rgb[...,2].astype(np.int32)
    cle=cle_de_fond(rgb)
    if cle is VERT:
        d=r**2+(g-255)**2+b**2
        c1=d<seuil*seuil
        c2=(g>140)&(g>np.maximum(r,b)*1.4)
    else:
        d=(r-255)**2+g**2+(b-255)**2
        c1=d<seuil*seuil
        c2=(r>140)&(b>140)&(g<np.minimum(r,b)*0.7)
    if not c2.any():
        return c1
    brut=c1|c2
    etiquettes,n=ndimage.label(brut)
    if n==0:
        return c1
    bord=np.concatenate([etiquettes[0,:],etiquettes[-1,:],etiquettes[:,0],etiquettes[:,-1]])
    dehors=np.zeros(n+1,dtype=bool)
    dehors[np.unique(bord)]=True
    dehors[0]=False
    return c1|(c2&dehors[etiquettes])

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

def reduire(idx,N,TR):
    """Le vote de bloc, avec la SENTINELLE de transparence donnée par l'appelant.

    ⚠⚠ ELLE VALAIT `len(PAL)` EN DUR, ET C'ÉTAIT FAUX POUR L'OUVRAGE. La palette
    de l'Ouvrage compte DIX-NEUF teintes — les quatorze de base plus les cinq
    ardoises — et son index 14 est « A contour » `#0D0B12`. Transparent et
    contour partageaient donc la même case du vote : un bloc majoritairement
    contour sortait TRANSPARENT. Mesuré sur `base_o_3x3` en 128 avant le lot
    PIXELS : 9 336 blocs transparents sans contenir un seul pixel transparent.

    ⚠ NE PAS DÉDUIRE `TR` DE `idx.max()` : ça marche par accident tant que
    l'index le plus haut est présent dans l'image, et ment le jour où il manque.
    L'appelant connaît sa palette, il est le seul à pouvoir répondre.
    """
    H,W=idx.shape
    out=np.full((N,N),-1,dtype=np.int16)
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
    return reduire(idx,N,len(PAL))

def rendre(g, scale=4):
    N=g.shape[0]
    out=np.zeros((N,N,4),dtype=np.uint8)
    for i,(n,h,c) in enumerate(PAL):
        m=(g==i); out[m,0]=c[0]; out[m,1]=c[1]; out[m,2]=c[2]; out[m,3]=255
    im=Image.fromarray(out,'RGBA')
    return im.resize((N*scale,N*scale),Image.NEAREST)


# ---------------------------------------------------------------------------
# ⚠⚠ `baver` A DÉMÉNAGÉ ICI AU LOT TERRITOIRE (03/09), DEPUIS `tools/bords.py`.
# Elle y était née au lot MURS, quand un seul outil en avait besoin ; les
# limites de territoire sont le second, et pour la même raison exactement — un
# sprite presque tout transparent, encodé en WebP avec perte sur le RVB, et
# dessiné réduit. Une seconde copie aurait été la première à ne pas recevoir la
# correction suivante.
#
# ⚠ ET LE DÉMÉNAGEMENT SE PROUVE : `python3 tools/verifier.py` rejoue `bords.py`
# et compare les seize fichiers de `bord/` À L'OCTET. S'il en sort un seul
# « différent », c'est que la fonction n'est pas arrivée intacte.
# ---------------------------------------------------------------------------


def baver(rgba, passes=4):
    """La couleur du bord DÉBORDE dans le transparent — et il le faut.

    ⚠⚠ CE N'EST PAS DE LA COQUETTERIE, C'EST LE CAS NORMAL. Un mur fait 512
    pixels pour quatre cases ; à la case par défaut de 46 px il est affiché en
    184, donc RÉDUIT par le navigateur — le plafond du zoom, 128 px par case,
    est le seul endroit où il tombe au 1:1. Toute réduction mélange les pixels
    voisins, transparents COMPRIS : si leur RVB vaut zéro, le mur ressort ourlé
    de noir sur toute sa longueur.

    ⚠ ET L'ENCODAGE EN RAJOUTE. WebP avec perte stocke le RVB même là où l'alpha
    est nul et le lisse par blocs : mesuré avant ce geste, les transparents du
    bord haut de `mur_1` portaient (65, 0, 0) — du rouge sombre bavé depuis le
    noir. Vu à l'œil sur un rendu de contrôle, pas à la relecture.

    On étend donc la couleur opaque dans le transparent, quelques pixels : ce
    qui bave alors, c'est la couleur du mur. **L'alpha, lui, ne bouge pas** —
    c'est ce qui distingue ce geste d'un épaississement du sprite.
    """
    out = rgba.copy()
    plein = out[..., 3] == 255
    for _ in range(passes):
        if plein.all():
            break
        somme = np.zeros((*plein.shape, 3), np.float64)
        poids = np.zeros(plein.shape, np.float64)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            v = np.roll(np.roll(plein, dy, 0), dx, 1)
            c = np.roll(np.roll(out[..., :3], dy, 0), dx, 1)
            somme[v] += c[v]
            poids[v] += 1
        frange = (~plein) & (poids > 0)
        if not frange.any():
            break
        out[frange, 0:3] = np.rint(somme[frange] / poids[frange][..., None]).astype(np.uint8)
        plein = plein | frange
    return out
