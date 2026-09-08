from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "twitch-panels"
HEADLINE_FONT = Path(r"C:\Windows\Fonts\ariblk.ttf")
UTILITY_FONT = Path(r"C:\Windows\Fonts\arialbd.ttf")

PANELS = [
    ("start-here.png", "START HERE", "#ff2d46", "hype.png"),
    ("join-the-tent.png", "JOIN THE TENT", "#9146ff", "love.webp"),
    ("control-chaos.png", "MESS WITH ME", "#ffc928", "chaos.webp"),
    ("music.png", "THE MUSIC", "#1ed760", "win.webp"),
    ("work-with-me.png", "WORK WITH ME", "#f6f1e7", "evil.webp"),
]


def fit_font(text: str, max_width: int) -> ImageFont.FreeTypeFont:
    for size in range(27, 17, -1):
        font = ImageFont.truetype(str(HEADLINE_FONT), size)
        if font.getlength(text) <= max_width:
            return font
    return ImageFont.truetype(str(HEADLINE_FONT), 17)


def make_panel(filename: str, title: str, accent: str, art_name: str) -> None:
    canvas = Image.new("RGB", (320, 100), "#0b080d")
    draw = ImageDraw.Draw(canvas)
    art = Image.open(ROOT / "assets" / "emotes" / art_name).convert("RGBA")

    draw.rectangle((0, 0, 8, 100), fill=accent)
    draw.rectangle((8, 96, 320, 100), fill=accent)
    draw.polygon(((195, 0), (320, 0), (320, 100), (235, 100)), fill="#151018")
    draw.line((185, 0, 238, 100), fill=accent, width=2)
    draw.ellipse((178, 11, 194, 27), outline=accent, width=2)
    draw.ellipse((186, 19, 191, 24), fill=accent)

    label_font = ImageFont.truetype(str(UTILITY_FONT), 10)
    title_font = fit_font(title, 190)
    draw.text((22, 17), "SMABBLEZ", font=label_font, fill=accent)
    draw.text((20, 38), title, font=title_font, fill="#f6f1e7", stroke_width=1, stroke_fill="#0b080d")

    face = art.resize((114, 114), Image.Resampling.LANCZOS)
    canvas.paste(face, (211, -6), face)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT / filename, "PNG", optimize=True)


def main() -> None:
    for panel in PANELS:
        make_panel(*panel)
    print(f"Created {len(PANELS)} Twitch panels in {OUTPUT}")


if __name__ == "__main__":
    main()
