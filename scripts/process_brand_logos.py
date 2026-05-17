"""Export brand logo PNGs (3:2) and square favicon icons."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "logo.png"

LOGO_TARGETS = [
    ROOT / "logo.png",
    ROOT / "frontend_platform" / "public" / "logo.png",
    ROOT / "frontend_company" / "public" / "logo.png",
    ROOT / "frontend_portfolio" / "public" / "logo.png",
]

ICON_TARGETS = [
    ROOT / "frontend_platform" / "public" / "icon.png",
    ROOT / "frontend_platform" / "src" / "app" / "icon.png",
    ROOT / "frontend_company" / "public" / "icon.png",
    ROOT / "frontend_portfolio" / "public" / "icon.png",
    ROOT / "frontend_portfolio" / "src" / "app" / "icon.png",
]

LOGO_MAX_WIDTH = 1200
ICON_SIZE = 512
ICON_MAX_W = 0.88
ICON_MAX_H = 0.68


def trimmed_logo() -> Image.Image:
    im = Image.open(SRC).convert("RGBA")
    if bbox := im.getbbox():
        im = im.crop(bbox)
    w, h = im.size
    if w > LOGO_MAX_WIDTH:
        im = im.resize((LOGO_MAX_WIDTH, int(h * LOGO_MAX_WIDTH / w)), Image.Resampling.LANCZOS)
    return im


def square_icon(logo: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    lw, lh = logo.size
    scale = min(ICON_SIZE * ICON_MAX_W / lw, ICON_SIZE * ICON_MAX_H / lh)
    nw, nh = int(lw * scale), int(lh * scale)
    resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((ICON_SIZE - nw) // 2, (ICON_SIZE - nh) // 2), resized)
    return canvas


def main() -> None:
    logo = trimmed_logo()
    for path in LOGO_TARGETS:
        path.parent.mkdir(parents=True, exist_ok=True)
        logo.save(path, format="PNG", optimize=True)
    icon = square_icon(logo)
    for path in ICON_TARGETS:
        path.parent.mkdir(parents=True, exist_ok=True)
        icon.save(path, format="PNG", optimize=True)


if __name__ == "__main__":
    main()
