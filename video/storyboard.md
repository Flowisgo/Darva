# Storyboard: RugDealer, 60 seconds

Every shot is captured from the running app (production build, `next start`) driving the real Varial wallet on Stellar Testnet. One rug, **No. 0005**, goes from certificate to collection on screen; a second, **No. 0006**, is bought out by the store. Overlays (cursor, click ripples, highlight rings, captions, speed chips) are drawn by the compositor from the capture logs, at the coordinates of the real elements.

Timecodes are output seconds at 60 fps. The exact cut points live in [`src/timeline.ts`](src/timeline.ts), keyed to named markers in [`capture/logs/`](capture/logs), so a re-capture moves the cuts with it.

## Beat sheet

| # | In–out | Screen | Action | Caption (burned in) | Rationale | Rubric line |
|---|---|---|---|---|---|---|
| 1 | 0.0–5.6 | Landing: hero and worked-example rug, slow push-in | Pointer drifts to the worked example; ring on it | "A buyer might pay 1,500 USDC. The store offers Ayşe 600 today." | Problem in the app's own figures (the hero card reads "A rug a buyer would pay about 1,500 USDC for") | Problem and social impact |
| 2 | 5.6–8.0 | Landing: "How a loan ends", three outcomes | Scroll; rings on the three outcomes | "So she borrows 600 instead." | One line of solution before the proof | Solution |
| 3 | 8.0–16.9 | `/store` as Kaya Rug House | Type the rug, **Issue rug certificate**, real Varial popup (held longest of all popups), 8× through confirmation, ring the new **No. 0005** | "Kaya Rug House certifies the rug." → "Kaya signs in a real wallet." → "Ayşe now owns the certificate." | The store's price is the security; the wallet popup is the most credible three seconds; the fee is checkable and tiny | Working build; Stellar fit; UX |
| 4 | 16.9–25.3 | `/weaver` as Ayşe | Click 12 then 6 months (fees update, "Figures checked with the contract"), ring the breakdown labelled 600 − 45 − 6 − 9 = 540.00, **Ask for 600.00 USDC**, popup, "Waiting for an investor" | "Ayşe borrows 600 USDC for 6 months." → "Fees come off once, up front. She gets 540.00 USDC." | Pricing in one glance, quoted by the contract | Monetization; UX |
| 5 | 25.3–31.6 | `/investor` as Deniz | Ring "You lend 600 / You earn 45 / You get back 645", **Lend 600.00 USDC**, popup, 8×, card becomes **Running, Due in 5:59** | "Deniz lends 600 and gets 645.00 back." → "One transaction funds the loan." | One investor, one transaction, and the payout the README promises | Solution; Stellar (one contract holds certificate and money) |
| 6 | 31.6–44.1 | `/weaver` then `/store?handover=…` | **Repay 600.00 USDC** (Due in 1:4x on screen), popup; **Collect the rug**, Varial *Confirm Authorizations: redeem*; **Copy link for the store**; store opens the link, **Sign to close the certificate**, popup; "Certificate No. 0005 is closed." | "A buyer turns up. Ayşe repays 600." → "The loan cost $60. Selling cheap would lose $900." → "Two signatures close the certificate. Ayşe takes the rug home." | The two-signature hand-over is one of the two strongest mechanisms; it is shown click by click | Security and trust; differentiation |
| 7 | 44.1–51.5 | `/store`, Overdue loans, rug No. 0006 (1-month loan, staged) | Chip "A second rug, No. 0006: 1-month loan, unpaid, 60 s later"; ring the overdue card with its live buy-out countdown; **Buy the rug for 600.00 USDC**, popup; rug shows **Bought by this store**, ring its price | "No repayment? The store must buy at its own price." → "The store can't lowball her." | The forced buy-back at the store's own price is the core mechanism; protected time | Differentiation; Stellar (rule enforced by code) |
| 8a | 51.5–55.5 | `/activity` | Fast scroll (2.5×) through plain-sentence events, each linked to its transaction | "Each line here links to its own transaction." | Proof, in the app's own words | Verifiable build |
| 8b | 55.5–59.6 | End card (the only full-frame graphic) | Rug No. 0005's own woven pattern, contract ID, URL, count of transactions signed on screen | "Every step is a Testnet transaction you can check." (card text: "Borrow against your rug. Don't sell it cheap.") | End on proof, not on a slogan | Verifiable build; presentation |

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
| UX and accessibility | Plain-language desks throughout; local currency line on screen at 19.9–25.3 (≈ 24,300 TRY, not captioned) |
| Presentation | Silent master with burned-in captions for the live pitch; narrated master for Devpost |

## Rules applied

- Every caption is one spoken unit, read at 141–153 words a minute with 0.15–0.35 s of air before the next card; `npm run pace` enforces this (and at most two lines, nine words a line, 96 characters) and `npm run render` runs it first. The captions are the narration: `narration.md` is generated from the same array.
- Numbers come from the app's screens or the contract: 600, 45, 6, 9, 540, 645 and 60 are all visible in the footage while they are captioned (verified against `docs/testnet-demo-results.json` and the live loan, see `verification.md`).
- Long waits are sped up with a visible speed chip (and the measured time to confirm), never frozen.
- No browser chrome, no dev indicator (production build), no wallet import or settings screens, no secret on any frame.
