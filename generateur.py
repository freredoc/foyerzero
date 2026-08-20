#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generateur v4.

Corrections de pipeline :
  - l'ombre n'est PLUS cuite dans le sprite (elle sera tracee au rendu, en primitive)
  - les sprites joueur sont exportes EN COUCHES : corps + arme separes
    (indispensable pour le recul de tir, et 3 corps + 3 armes = 9 defenses)

Nouveau : etalon ennemi "industriel autonome", dans les deux palettes candidates.
  Grammaire inverse du joueur : symetrie radiale, pattes, accent EMIS, modules identiques.
"""
from PIL import Image, ImageDraw
import os, math

L, SCALE = 32, 4
BASE = "/home/claude/work/out/sprites"
for sub in ("joueur", "ennemi_pale", "ennemi_sombre"):
    os.makedirs(os.path.join(BASE, sub), exist_ok=True)

# PALETTES --------------------------------------------------------------
# Joueur : kaki chaud desature
J0 = (22, 25, 20, 255); J1 = (52, 58, 44, 255); J2 = (78, 87, 66, 255)
J3 = (106, 118, 88, 255); J4 = (140, 154, 114, 255)

M0 = (30, 33, 36, 255); M1 = (62, 69, 76, 255); M2 = (104, 114, 126, 255)

# Ennemi A : ceramique pale et froide
PA = [(42, 44, 46, 255), (74, 78, 82, 255), (110, 115, 120, 255),
      (148, 154, 160, 255), (194, 199, 203, 255)]
# Ennemi B : anodise sombre, structure claire
SO = [(20, 21, 24, 255), (34, 38, 43, 255), (51, 57, 64, 255),
      (69, 77, 87, 255), (140, 150, 162, 255)]

AI_D = (146, 142, 128, 255); AI_L = (245, 243, 232, 255)
AV_D = (138, 30, 23, 255);   AV_L = (228, 62, 50, 255)
AA_D = (166, 112, 24, 255);  AA_L = (245, 182, 54, 255)
ACCENT = {"ai": (AI_D, AI_L), "av": (AV_D, AV_L), "aa": (AA_D, AA_L)}
GLOW = {"ai": (255, 255, 246, 255), "av": (255, 140, 120, 255), "aa": (255, 226, 150, 255)}

NONE = (0, 0, 0, 0)

# ancrage de l'arme sur chaque chassis joueur (le sprite arme a son culot en y=16)
ANCHOR = {"tourelle": 8, "vehicule": 15, "infanterie": None}


def new():
    return Image.new("RGBA", (L, L), NONE)


def R(d, x0, y0, x1, y1, f, o=None):
    d.rectangle([x0, y0, x1, y1], fill=f, outline=o)


def E(d, x0, y0, x1, y1, f, o=None):
    d.ellipse([x0, y0, x1, y1], fill=f, outline=o)


def poly(d, pts, f, o=None):
    d.polygon(pts, fill=f, outline=o)


def hexagon(cx, cy, r, rot=0):
    return [(cx + r * math.cos(math.radians(a + rot)),
             cy + r * math.sin(math.radians(a + rot))) for a in range(0, 360, 60)]


# ============================================================ JOUEUR : CORPS
def j_tourelle():
    img = new(); d = ImageDraw.Draw(img)
    R(d, 2, 3, 29, 29, M1, J0)
    R(d, 3, 4, 28, 5, M2)
    R(d, 3, 25, 28, 27, J1); R(d, 3, 28, 28, 28, J0)
    R(d, 5, 26, 6, 26, M0); R(d, 25, 26, 26, 26, M0)
    E(d, 6, 4, 25, 21, J2, J0)
    E(d, 8, 6, 23, 19, J3)
    E(d, 10, 5, 21, 12, J4)
    return img


def j_vehicule():
    img = new(); d = ImageDraw.Draw(img)
    for x0 in (3, 23):
        R(d, x0, 3, x0 + 5, 28, M1, J0)
        for y in range(5, 28, 3):
            R(d, x0 + 1, y, x0 + 4, y, M2)
    R(d, 10, 2, 21, 29, J2, J0)
    R(d, 11, 3, 20, 7, J4)
    R(d, 11, 8, 20, 10, J3)
    R(d, 11, 25, 20, 27, J1); R(d, 11, 28, 20, 28, J0)
    R(d, 13, 26, 14, 26, M0); R(d, 17, 26, 18, 26, M0)
    E(d, 11, 14, 20, 23, J3, J0)
    E(d, 13, 15, 18, 19, J4)
    return img


def j_infanterie():
    img = new(); d = ImageDraw.Draw(img)
    for (cx, cy) in [(16, 9), (8, 20), (24, 20)]:
        R(d, cx - 4, cy - 1, cx + 3, cy + 6, J2, J0)
        R(d, cx - 3, cy, cx + 2, cy + 1, J4)
        R(d, cx - 3, cy + 4, cx + 2, cy + 5, J1)
        E(d, cx - 3, cy - 6, cx + 2, cy - 1, J2, J0)   # casque neutre : l'accent
        E(d, cx - 2, cy - 5, cx + 0, cy - 3, J3)       # est porte par la couche arme
    return img


J_CORPS = {"tourelle": j_tourelle, "vehicule": j_vehicule, "infanterie": j_infanterie}


# ============================================================ JOUEUR : ARMES
def j_arme(cible):
    """Couche independante. Culot en y=16, pointe vers le haut."""
    img = new(); d = ImageDraw.Draw(img)
    dk, lt = ACCENT[cible]
    if cible == "ai":
        for dx in (-3, 1):
            R(d, 16 + dx, 13, 16 + dx + 1, 17, M2)
            R(d, 16 + dx, 13, 16 + dx + 1, 13, lt)
    elif cible == "av":
        R(d, 15, 11, 17, 17, M2)
        R(d, 15, 11, 17, 12, lt)
    else:
        R(d, 15, 12, 17, 17, M2)
        R(d, 15, 12, 17, 12, lt)
        R(d, 14, 14, 18, 14, dk)
    R(d, 13, 16, 18, 17, M0)
    return img


# ============================================================ ENNEMI
def e_pylone(P, cible):
    """Miroir de la tourelle. Hexagone, coeur suspendu, AUCUNE direction."""
    img = new(); d = ImageDraw.Draw(img)
    dk, lt = ACCENT[cible]; gl = GLOW[cible]
    poly(d, hexagon(16, 16, 14.5), P[1], P[0])
    poly(d, hexagon(16, 16, 11.5), P[2])
    poly(d, hexagon(16, 16, 11.5, 30), P[3])
    for a in range(0, 360, 60):                       # entretoises radiales
        x = 16 + 10 * math.cos(math.radians(a)); y = 16 + 10 * math.sin(math.radians(a))
        d.line([(16, 16), (x, y)], fill=P[4], width=1)
    poly(d, hexagon(16, 16, 6.5), P[0], P[4])         # puits
    E(d, 12, 12, 19, 19, dk)                          # coeur EMISSIF
    E(d, 13, 13, 18, 18, lt)
    E(d, 14, 14, 17, 17, gl)
    return img


def e_marcheur(P, cible):
    """Miroir du vehicule. Quadrupede, chassis suspendu, radial."""
    img = new(); d = ImageDraw.Draw(img)
    dk, lt = ACCENT[cible]; gl = GLOW[cible]
    for (dx, dy) in ((-1, -1), (1, -1), (-1, 1), (1, 1)):   # 4 pattes articulees
        kx, ky = 16 + dx * 7, 16 + dy * 7
        fx, fy = 16 + dx * 13, 16 + dy * 12
        d.line([(16, 16), (kx, ky)], fill=P[2], width=2)
        d.line([(kx, ky), (fx, fy)], fill=P[1], width=2)
        R(d, kx - 1, ky - 1, kx + 1, ky + 1, P[4])          # genou
        R(d, int(fx) - 1, int(fy) - 1, int(fx) + 1, int(fy), P[0])   # pied
    poly(d, hexagon(16, 15, 9.5, 30), P[2], P[0])           # caisson suspendu
    poly(d, hexagon(16, 15, 6.5, 30), P[3])
    R(d, 8, 14, 24, 15, P[4])                               # ligne de structure
    E(d, 13, 12, 18, 18, dk)
    E(d, 14, 13, 17, 17, lt)
    E(d, 15, 14, 16, 16, gl)
    return img


def e_essaim(P, cible):
    """Miroir de l'infanterie. 5 modules IDENTIQUES en anneau, aucune figure."""
    img = new(); d = ImageDraw.Draw(img)
    dk, lt = ACCENT[cible]; gl = GLOW[cible]
    poses = [(16, 16)] + [(16 + 9.5 * math.cos(math.radians(a)),
                           16 + 9.5 * math.sin(math.radians(a))) for a in (270, 342, 54, 126, 198)][:4]
    for (cx, cy) in poses:
        cx, cy = int(round(cx)), int(round(cy))
        poly(d, hexagon(cx, cy, 4.2), P[2], P[0])
        poly(d, hexagon(cx, cy, 2.6), P[3])
        R(d, cx, cy, cx, cy, lt)
        R(d, cx, cy - 1, cx, cy - 1, gl)
    return img


E_CH = {"pylone": e_pylone, "marcheur": e_marcheur, "essaim": e_essaim}


# ============================================================ EXPORT
def save(img, path):
    img.resize((L * SCALE, L * SCALE), Image.NEAREST).save(path)


def main():
    for k, fn in J_CORPS.items():
        save(fn(), f"{BASE}/joueur/def_{k}_corps.png")
    for c in ("ai", "av", "aa"):
        save(j_arme(c), f"{BASE}/joueur/arme_{c}.png")
    for name, P in (("ennemi_pale", PA), ("ennemi_sombre", SO)):
        for k, fn in E_CH.items():
            save(fn(P, "av"), f"{BASE}/{name}/enn_{k}.png")
    print("joueur : 3 corps + 3 armes  |  ennemi : 3 chassis x 2 palettes")


if __name__ == "__main__":
    main()
