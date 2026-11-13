# Storyboard: RugDealer, 60 seconds

Every shot is captured from the running app (production build, `next start`) driving the real Varial wallet on Stellar Testnet. One rug, **No. 0005**, goes from certificate to collection on screen; a second, **No. 0006**, is bought out by the store. Overlays (cursor, click ripples, highlight rings, captions, speed chips) are drawn by the compositor from the capture logs, at the coordinates of the real elements.

Timecodes are output seconds at 60 fps. The exact cut points live in [`src/timeline.ts`](src/timeline.ts), keyed to named markers in [`capture/logs/`](capture/logs), so a re-capture moves the cuts with it.

## Beat sheet

| # | In–out | Screen | Action | Caption (burned in) | Rationale | Rubric line |
|---|---|---|---|---|---|---|
| 1 | 0.0–5.6 | Landing: hero and worked-example rug, slow push-in | Pointer drifts to the worked example; ring on it | "A buyer would pay about 1,500 USDC for Ayşe's rug. Finding that buyer takes months." → "The store will pay 600 today. She needs the cash, so she sells cheap." | Problem in the app's own figures (the hero card reads "A rug a buyer would pay about 1,500 USDC for") | Problem and social impact |
| 2 | 5.6–8.0 | Landing: "How a loan ends", three outcomes | Scroll; rings on the three outcomes | "RugDealer: she borrows that price instead, and keeps the rug until a real buyer comes." | One line of solution before the proof | Solution |
| 3 | 8.0–16.9 | `/store` as Kaya Rug House | Type the rug, **Issue rug certificate**, real Varial popup (held longest of all popups), 8× through confirmation, ring the new **No. 0005** | "Kaya Rug House holds the rug and writes its certificate at 600 USDC, its own buying price." → "Each step is signed in a real wallet. Network fee: 0.0058 XLM, a fraction of a cent." → "Certificate No. 0005 now lives in the contract. Ayşe owns it. The store keeps the rug safe." | The store's price is the security; the wallet popup is the most credible three seconds; the fee is checkable and tiny | Working build; Stellar fit; UX |
| 4 | 16.9–25.3 | `/weaver` as Ayşe | Click 12 then 6 months (fees update, "Figures checked with the contract"), ring the breakdown labelled 600 − 45 − 6 − 9 = 540.00, **Ask for 600.00 USDC**, popup, "Waiting for an investor" | "Ayşe borrows the store's price for 6 months. In this demo, 1 month lasts 1 minute." → "Fees come off once: she receives 540.00 USDC today, ≈ 24,300 TRY, and the rug is still hers." | Pricing in one glance, quoted by the contract | Monetization; UX |
| 5 | 25.3–31.6 | `/investor` as Deniz | Ring "You lend 600 / You earn 45 / You get back 645", **Lend 600.00 USDC**, popup, 8×, card becomes **Running, Due in 5:59** | "Deniz funds the whole loan in one transaction, and will get back 645.00 USDC." | One investor, one transaction, and the payout the README promises | Solution; Stellar (one contract holds certificate and money) |
| 6 | 31.6–44.1 | `/weaver` then `/store?handover=…` | **Repay 600.00 USDC** (Due in 1:4x on screen), popup; **Collect the rug**, Varial *Confirm Authorizations: redeem*; **Copy link for the store**; store opens the link, **Sign to close the certificate**, popup; "Certificate No. 0005 is closed." | "A buyer turns up: she repays 600 USDC. The loan cost her 60, not the 900 lost selling cheap." → "To collect the rug she signs her half, then Kaya Rug House co-signs." → "Two signatures close the certificate. The rug goes home with Ayşe." | The two-signature hand-over is one of the two strongest mechanisms; it is shown click by click | Security and trust; differentiation |
| 7 | 44.1–51.5 | `/store`, Overdue loans, rug No. 0006 (1-month loan, staged) | Chip "A second rug, No. 0006: 1-month loan, unpaid, 60 s later"; ring the overdue card with its live buy-out countdown; **Buy the rug for 600.00 USDC**, popup; rug shows **Bought by this store**, ring its price | "No repayment? The store must buy the rug at the price it set. The contract enforces it." → "That's why it can't lowball her, and the investor is repaid from the purchase." | The forced buy-back at the store's own price is the core mechanism; protected time | Differentiation; Stellar (rule enforced by code) |
| 8a | 51.5–55.5 | `/activity` | Fast scroll (2.5×) through plain-sentence events, each linked to its transaction | "Every step above is a Testnet transaction. Each line here links to its own." | Proof, in the app's own words | Verifiable build |
| 8b | 55.5–59.6 | End card (the only full-frame graphic) | Rug No. 0005's own woven pattern, contract ID, URL, count of transactions signed on screen | Card text: "Borrow against your rug. Don't sell it cheap." | End on proof, not on a slogan | Verifiable build; presentation |

Real footage: 0.0–55.5 s (93%). Total 59.58 s. Full-frame graphic cards: one (8b).

## Rubric → timestamp

| Criterion | Where it is served |
|---|---|
| Problem and social impact | 0.0–5.6 (1,500 vs 600, from the app's worked example) |
| Solution and differentiation | 5.6–8.0; 31.6–35.5 (60 vs 900); 44.1–51.5 (forced buy-back) |
| Customer segment | 0.0–5.6 (a weaver selling to a local store); narration names the segment; trifold carries market size |
| Monetization | 16.9–25.3 (platform fee 6.00, store fee 9.00, investor 45.00, all on screen) |
| User validation | Not in the video (no user testing yet); the presenter covers it live |
| Meaningful use of Stellar | 8.0–16.9 (certificate in a Soroban contract; 0.0058 XLM fee); 25.3–31.6 (one contract holds certificate and money); 44.1–51.5 (the store's obligation enforced by the contract) |
| Architecture | 16.9–25.3 ("Figures checked with the contract": the app quotes from the contract by simulation) |
| Working, verifiable build | Every beat; hashes in [`verification.md`](verification.md); 51.5–55.5 activity feed; 55.5–59.6 contract ID and URL |
| Security and trust | 11.1–13.5 (wallet signature, fee ringed); 35.5–44.1 (two-signature hand-over) |
| UX and accessibility | Plain-language desks throughout; local currency line at 19.9–25.3 (≈ 24,300 TRY) |
| Presentation | Silent master with burned-in captions for the live pitch; narrated master for Devpost |

## Rules applied

- One idea per caption; at most two lines, 58 characters a line.
- Numbers come from the app's screens or the contract: 600, 45, 6, 9, 540, 645, 60 and 24,300 TRY are all visible in the footage at the moment they are captioned (verified against `docs/testnet-demo-results.json` and the live loan, see `verification.md`).
- Long waits are sped up with a visible speed chip (and the measured time to confirm), never frozen.
- No browser chrome, no dev indicator (production build), no wallet import or settings screens, no secret on any frame.
