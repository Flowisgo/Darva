# Trifold display board

The RugDealer board for the Stellar Blockchain Innovation Challenge Project Showcase: 38 × 27 in, three panels (9.5 | 19 | 9.5 in).

| File | What it is |
|---|---|
| [`trifold.pdf`](trifold.pdf) | Print file: one 38 × 27 in page, vector text and graphics, fonts embedded as TrueType. No fold guides. |
| [`trifold-preview.png`](trifold-preview.png) | Downscaled preview with dashed fold guides (bold = fold, faint = the 0.5 in keep-clear line on each side). |
| [`board.html`](board.html) | Editable source: all copy, layout and colours. |
| [`render.mjs`](render.mjs) | Builds, checks and exports the board. |
| [`capture.mjs`](capture.mjs) | Re-captures the app screenshot in `img/` from the live app. |
| [`rubric-map.md`](rubric-map.md) | Each rubric item, where it is on the board, and how strong the evidence is. |

## Change the copy

```bash
cd trifold
npm install
npm run render
```

`render` uses Playwright from `../video/node_modules` (run `npm install` in `video/` first if it's missing) and the app's kilim generator in `../frontend/lib/kilim.ts` (Node 23.6 or later, for TypeScript imports). It prints the title's cap height and the smallest text size, then lists any problem: text that overflows a panel, or anything below the banner within 0.5 in of a fold or 0.75 in of the outer edge. It exits 1 if there is a problem. Set `DETAIL=1` to also write full-size panel crops to `build/` for checking.

## If the real panels differ

Change the fold positions in two places: `FOLDS` in `render.mjs` and `--fold-1` / `--fold-2` in `board.html`'s `:root`. Then re-render and fix anything the check reports.

## Fonts

`fonts/` holds static weights (400–800) of Schibsted Grotesk, the app's font (SIL Open Font License), made from the app's variable font with `fonttools varLib.instancer`. Static weights embed in the PDF as TrueType; a variable font would come out as Type 3 outlines, which some print shops reject.
