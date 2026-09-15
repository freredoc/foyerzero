from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parents[1]
SORTIE = Path(__file__).with_name("maquette-quinconce-360.png")
W, H = 360, 640
img = Image.new("RGB", (W, H), "#11140f")
d = ImageDraw.Draw(img)
font = ImageFont.load_default()

d.rectangle((8, 12, 352, 67), fill="#343a2c", outline="#4e5742")
d.text((18, 23), "OFFENSE - QUINCONCE", fill="#f5f3e8", font=font)
d.text((18, 43), "ANDROID 360 PX - 4 VAGUES X 9", fill="#aab38e", font=font)

sprites = [
    ("chassis/64/off_j_belier_chassis.png", "tourelle-unite/64/off_j_belier_tourelle.png"),
    ("chassis/64/off_j_broyeur_chassis.png", "tourelle-unite/64/off_j_broyeur_tourelle.png"),
    ("chassis/64/off_j_fendeur_chassis.png", "tourelle-unite/64/off_j_fendeur_tourelle.png"),
    ("unite/64/off_j_enclume.png", None),
    ("unite/64/off_j_busard.png", None),
]
sprite_root = RACINE / "art" / "sprites"
cell_w = 36
cell_h = 43
row_x = 9

for vague in range(4):
    top = 82 + vague * 112
    d.rectangle((8, top, 352, top + 99), fill="#1e2124", outline="#3e454c")
    d.text((15, top + 7), f"VAGUE D'ATTAQUE {vague + 1}", fill="#aab38e", font=font)
    offset = cell_w // 2 if vague % 2 else 0
    y = top + 30
    for col in range(9):
        x = row_x + offset + col * cell_w
        d.rectangle((x, y, x + cell_w - 1, y + cell_h - 1), fill="#252a22", outline="#4e5742")
        chassis, tourelle = sprites[(col + vague + 1) % len(sprites)]
        layers = [chassis] + ([tourelle] if tourelle else [])
        taille = int(cell_w * .96)
        for layer in layers:
            part = Image.open(sprite_root / layer).convert("RGBA")
            part.thumbnail((taille, taille), Image.Resampling.NEAREST)
            px = x + (cell_w - part.width) // 2
            py = y + (cell_h - part.height) // 2 - 2
            img.paste(part, (px, py), part)
        niv = str(40 + ((col + vague + 1) % 11))
        d.rectangle((x + cell_w - 15, y + cell_h - 13, x + cell_w - 2, y + cell_h - 2),
                    fill="#161914", outline="#928e80")
        d.text((x + cell_w - 13, y + cell_h - 12), niv, fill="#fff4bb", font=font)

d.rectangle((8, 540, 352, 624), fill="#1e2124", outline="#f5b636", width=2)
d.text((18, 552), "96 % MAXIMUM", fill="#f5b636", font=font)
d.multiline_text((18, 573), "Partie utile 80 % x grossissement 1,2.\n"
                 "Aucun sprite ni niveau rogne.\n"
                 "Une demi-case de decalage un rang sur deux.",
                 fill="#cdd4ba", font=font, spacing=5)
img.save(SORTIE)
print(SORTIE)
