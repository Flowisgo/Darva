# Demo video

**[`video/out/rugdealer-demo-60s.mp4`](../video/out/rugdealer-demo-60s.mp4)**: 59.58 s, 1920×1080, 60 fps, H.264, silent with burned-in captions. Subtitles: [`.srt`](../video/out/rugdealer-demo-60s.srt). Thumbnail: [`poster.jpg`](../video/out/poster.jpg). Every frame at a glance: [`contact-sheet.jpg`](../video/out/contact-sheet.jpg).

## What it shows

One rug, **No. 0005**, from start to finish on Stellar Testnet: Kaya Rug House issues its certificate at 600 USDC; Ayşe borrows for 6 months and receives 540.00 USDC; Deniz lends 600.00 USDC and is due 645.00; Ayşe repays 600.00, signs to collect, and the store co-signs to close the certificate. A second rug, **No. 0006**, on a 1-month loan, is bought by the store at its own price when the loan isn't repaid. It ends on the /activity feed and the contract ID.

## How it was captured

Real clicks, real wallet, real chain. Playwright drove the production build of the app (`next start`) in Chromium with the **Varial** extension loaded, and approved each signature in Varial's own popup. Every action is a real Testnet transaction; the six on screen and the staging ones are listed with ledgers in [`video/verification.md`](../video/verification.md), which also reads the loan back from the contract to confirm 45 / 6 / 9 / 540 / 645. Network waits are sped up with an on-screen speed chip. The pointer, rings and captions are drawn by the compositor (Remotion) at the logged positions of the real elements.

## More

- [`video/storyboard.md`](../video/storyboard.md): beat sheet, and which second serves which judging criterion
- [`video/narration.md`](../video/narration.md): the presenter's script, the captions word for word, generated from the cut by `npm run pace`
- [`video/README.md`](../video/README.md): one-command re-render after a copy change (`cd video && npm run render`), re-capture, and known limits
