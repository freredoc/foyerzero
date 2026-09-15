from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parents[1]
SORTIE = Path(__file__).with_name("maquette-quinconce-360-appliquee.png")
W, H = 360, 450
img = Image.new("RGB", (W, H), "#11140f")
d = ImageDraw.Draw(img)
font = ImageFont.load_default()

d.rectangle((6, 10, 354, 57), fill="#343a2c", outline="#4e5742")
d.text((15, 19), "OFFENSE - QUINCONCE", fill="#f5f3e8", font=font)
d.text((15, 37), "ANDROID 360 PX - 4 VAGUES X 9 - 3 + 3 + 3", fill="#aab38e", font=font)

sprites = [
    ("chassis/64/off_j_belier_chassis.png", "tourelle-unite/64/off_j_belier_tourelle.png"),
    ("chassis/64/off_j_broyeur_chassis.png", "tourelle-unite/64/off_j_broyeur_tourelle.png"),
    ("chassis/64/off_j_fendeur_chassis.png", "tourelle-unite/64/off_j_fendeur_tourelle.png"),
    ("unite/64/off_j_enclume.png", None),
    ("unite/64/off_j_busard.png", None),
]
sprite_root = RACINE / "art" / "sprites"
gap = 3
row_x = 58
row_w = 244
cell_w = (row_w - 8 * gap) / 9

for vague in range(4):
    top = 65 + vague * 80
    d.text((124, top + 1), f"VAGUE D'ATTAQUE {vague + 1}", fill="#aab38e", font=font)
    for col in range(9):
        x = round(row_x + col * (cell_w + gap))
        y = round(top + (col // 3) * cell_w / 2)
        d.rectangle((x, y, round(x + cell_w - 1), round(y + cell_w - 1)), fill="#252a22", outline="#4e5742")
        chassis, tourelle = sprites[(col + vague + 1) % len(sprites)]
        layers = [chassis] + ([tourelle] if tourelle else [])
        taille = round(cell_w * .96)
        for layer in layers:
            part = Image.open(sprite_root / layer).convert("RGBA")
            part.thumbnail((taille, taille), Image.Resampling.NEAREST)
            px = round(x + (cell_w - part.width) / 2)
            py = round(y + (cell_w - part.height) / 2)
            img.paste(part, (px, py), part)
        niv = str(40 + ((col + vague + 1) % 11))
        d.text((round(x + cell_w - 12), round(y + cell_w - 10)), niv, fill="#fff4bb", font=font,
               stroke_width=1, stroke_fill="#161914")

d.rectangle((6, 388, 354, 439), fill="#1e2124", outline="#f5b636", width=2)
d.text((15, 397), "96 % MAXIMUM - 80 % X 1,2", fill="#f5b636", font=font)
d.multiline_text((15, 414), "3 EN HAUT, 3 AU CENTRE, 3 EN BAS.\n4 VAGUES VISIBLES - AUCUN ROGNAGE.",
                 fill="#cdd4ba", font=font, spacing=5)
img.save(SORTIE)
print(SORTIE)
