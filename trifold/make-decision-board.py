# Writes decision-board.svg: the "Would you sell this rug today?" board,
# 38 x 27 in, drawn in tenths of an inch (3800 x 2700 units).
# Edit the text below or open the SVG in Illustrator/Inkscape/Figma.
# The fold lines are in their own group (id="fold-lines"); hide it before printing.
# The rug is a marked placeholder (id="rug-slot"): drop the signature rug image there.

IVORY = "#f4ede0"
INK = "#1f1a17"
SOFT = "#5c524a"
ACCENT = "#9b2a22"  # madder; replace with a colour sampled from the signature rug
FONT = "'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"

def t(x, y, s, size, weight=400, fill=INK, anchor="start", extra=""):
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}" letter-spacing="{-0.02 * size:.1f}"{extra}>{s}</text>')

L, R = 120, 2900  # left edges of the side panels' text
parts = []
parts.append(f'<rect id="board" width="3800" height="2700" fill="{IVORY}"/>')

# ---------- center ----------
parts.append('<g id="center">')
parts.append(t(1900, 440, "RugDealer", 280, 800, INK, "middle"))
parts.append(
    '<g id="rug-slot">'
    f'<rect x="1460" y="580" width="880" height="1260" fill="none" stroke="{ACCENT}" stroke-width="10" stroke-dasharray="40 26"/>'
    + t(1900, 1170, "Signature rug", 70, 700, ACCENT, "middle")
    + t(1900, 1270, "image goes here", 70, 400, ACCENT, "middle")
    + '</g>')
parts.append(t(1900, 2030, "You need cash now.", 105, 500, SOFT, "middle"))
parts.append(t(1900, 2240, "Would you sell", 175, 800, INK, "middle"))
parts.append(t(1900, 2440, f'this rug <tspan fill="{ACCENT}">today?</tspan>', 175, 800, INK, "middle"))
parts.append('</g>')

# ---------- left: sell today ----------
parts.append('<g id="left">')
parts.append(t(L, 760, "Sell", 230, 800))
parts.append(t(L, 990, "today.", 230, 800))
parts.append(f'<rect x="{L}" y="1110" width="220" height="14" fill="{ACCENT}"/>')
parts.append(t(L, 1340, "Cash now.", 110, 500))
parts.append(t(L, 1500, "The sale", 110, 500))
parts.append(t(L, 1640, "is final.", 110, 500))
# the rug leaves: an outline walking out of the panel
parts.append(f'<g id="rug-gone" fill="none" stroke="{SOFT}" stroke-width="8">'
             f'<rect x="{L}" y="1900" width="300" height="430" stroke-dasharray="24 18"/>'
             f'<path d="M{L+360} 2115 H{L+640} M{L+580} 2055 L{L+640} 2115 L{L+580} 2175" stroke-linecap="round" stroke-linejoin="round"/>'
             '</g>')
parts.append('</g>')

# ---------- right: take an advance ----------
def outcome(y, head, line):
    return t(R, y, head, 70, 800) + t(R, y + 90, line, 66, 400, SOFT)
def orline(y):
    return (f'<line x1="{R}" y1="{y}" x2="{R+150}" y2="{y}" stroke="{ACCENT}" stroke-width="6"/>'
            + t(R + 190, y + 22, "or", 64, 700, ACCENT)
            + f'<line x1="{R+290}" y1="{y}" x2="{R+780}" y2="{y}" stroke="{ACCENT}" stroke-width="6"/>')

parts.append('<g id="right">')
parts.append(t(R, 500, "Take an", 165, 800))
parts.append(t(R, 680, "advance.", 165, 800))
parts.append(f'<rect x="{R}" y="790" width="220" height="14" fill="{ACCENT}"/>')
parts.append(t(R, 1010, "Cash now.", 96, 500))
parts.append(t(R, 1130, "A rug shop holds the rug.", 66, 400, SOFT))
parts.append(outcome(1340, "Repay", "Reclaim the rug."))
parts.append(orline(1530))
parts.append(outcome(1680, "Not repaid", "The shop can buy it out."))
parts.append(orline(1870))
parts.append(outcome(2020, "Shop misses window", "The investor can claim it."))
parts.append(t(R, 2250, "Any resale happens separately.", 60, 400, SOFT, extra=' font-style="italic"'))
parts.append(t(R, 2440, "One lead partner, with additional", 52, 500, INK))
parts.append(t(R, 2510, "partners interested in participating.", 52, 500, INK))
parts.append('</g>')

# ---------- fold lines (preview only) ----------
parts.append('<g id="fold-lines">'
             '<rect x="940" y="0" width="20" height="2700" fill="#000" opacity="0.05"/>'
             '<rect x="2840" y="0" width="20" height="2700" fill="#000" opacity="0.05"/>'
             '<line x1="950" y1="0" x2="950" y2="2700" stroke="#000" stroke-opacity="0.22" stroke-width="3"/>'
             '<line x1="2850" y1="0" x2="2850" y2="2700" stroke="#000" stroke-opacity="0.22" stroke-width="3"/>'
             '</g>')

inner = "\n".join(parts)
svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="38in" height="27in" viewBox="0 0 3800 2700">\n'
       '<title>RugDealer: Would you sell this rug today?</title>\n' + inner + '\n</svg>\n')
open("decision-board.svg", "w", encoding="utf8").write(svg)
open("build/decision-board-inner.svg", "w", encoding="utf8").write(inner)
print("wrote decision-board.svg")
