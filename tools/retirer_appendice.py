"""Retire le bloc detache a gauche de l'Accumulateur et de la Raffinerie,
puis recentre le corps restant dans sa tuile. Aucun pixel n'est peint :
on efface une composante connexe et on translate le reste."""
from PIL import Image
import numpy as np
from scipy import ndimage
import os, sys

def corriger(src, dst):
    a=np.array(Image.open(src).convert('RGBA'))
    N=a.shape[0]
    m=a[...,3]>128
    lab,n=ndimage.label(m)
    assert n==2, f'{src}: {n} composantes, attendu 2'
    tailles=[int((lab==i).sum()) for i in range(1,n+1)]
    petit=int(np.argmin(tailles))+1
    retire=tailles[petit-1]
    a[lab==petit]=0                       # efface l'appendice
    m=a[...,3]>128
    ys,xs=np.where(m)
    dx=(N-1-xs.max()-xs.min())//2         # recentre horizontalement
    dy=(N-1-ys.max()-ys.min())//2
    out=np.zeros_like(a)
    out[max(0,dy):N+min(0,dy), max(0,dx):N+min(0,dx)] = a[max(0,-dy):N-max(0,dy), max(0,-dx):N-max(0,dx)]
    Image.fromarray(out,'RGBA').save(dst)
    m2=out[...,3]>128; ys,xs=np.where(m2)
    return retire, (int(xs.max()-xs.min()+1), int(ys.max()-ys.min()+1)), int(ndimage.label(m2)[1]), (dx,dy)

if __name__=='__main__':
    R='/home/claude/work/LIVRAISON/batiments'
    D='/home/claude/work/CORRIGES'
    for t in (32,128):
        os.makedirs(f'{D}/{t}',exist_ok=True)
    print(f"{'fichier':24s} {'grille':>6s} {'px retires':>10s} {'boite':>9s} {'blocs':>5s} {'decalage':>10s}")
    for t in (32,128):
        for k in ('bat_j_accumulateur','bat_j_raffinerie'):
            r,b,nb,d=corriger(f'{R}/{t}/{k}.png', f'{D}/{t}/{k}.png')
            print(f'{k:24s} {t:6d} {r:10d} {b[0]:4d}x{b[1]:<4d} {nb:5d} {str(d):>10s}')
