# Verification

Checked 2026-11-13T00:05:17Z with `node capture/verify.mjs` (read-only). Contract `CCX3Z3DJ7KS6YCSWQCIOJWFZCB76A7SD7LJI6BHDILO5FGSI6ZJJ4M2J` on Stellar Testnet.

**Capture route: automated wallet (route a).** Every button press in the film is a real click in the production build of the app (`next start`), and every signature is the real Varial wallet (v5.52.0, loaded unpacked into Playwright's Chromium) approving the real request. Nothing was replaced by a script or a graphic. The Varial windows in the film are screen recordings of the extension's own popup pages; they are composited beside the app (the popup's empty backdrop above its sheet is cropped), because a real popup is a separate window.

## How each hash was checked

1. The hash comes from the app's own `sendTransaction` RPC response, recorded while the button was pressed (`capture/logs/state.json`).
2. `GET https://horizon-testnet.stellar.org/transactions/<hash>` must return the transaction with `successful: true`; the ledger and close time below come from that response, the contract function from its operation.
3. The film's loans are then read back from the contract with `stellar contract invoke --send=no` (simulation: `get_loan`, `get_rug`, `next_loan_id`) and every figure captioned on screen is compared with the contract's record.

## Transactions on screen

| Action | Contract call | Transaction | Ledger | Closed (UTC) | Fee (XLM) | Horizon |
|---|---|---|---:|---|---:|---|
| Kaya Rug House issues the certificate for rug No. 0005 | mint_rug | [`9f73bbb05f…`](https://stellar.expert/explorer/testnet/tx/9f73bbb05f7d4116837f750939552839da3036e5af900b0abdfef56494f96083) | 5700619 | 2026-11-12T23:38:59Z | 0.0046781 | success |
| Ayşe asks for 600.00 USDC for 6 months | request_loan | [`3cb5d9222e…`](https://stellar.expert/explorer/testnet/tx/3cb5d9222ed397bb748f75d40c693ab9940d531c4cb1ce6f3ba1be52777a970f) | 5700633 | 2026-11-12T23:40:09Z | 0.0074412 | success |
| Deniz lends 600.00 USDC | fund_loan | [`35f571fba9…`](https://stellar.expert/explorer/testnet/tx/35f571fba9c78e2eb07e1184a3fee77f2988eeb386a970c99f2f8977afa9e711) | 5700644 | 2026-11-12T23:41:04Z | 0.002563 | success |
| Ayşe repays 600.00 USDC | repay | [`d08d6b083a…`](https://stellar.expert/explorer/testnet/tx/d08d6b083af8d17d12061e0c0771943d70273e92d5427b25d5cdae575a6c6692) | 5700698 | 2026-11-12T23:45:34Z | 0.0015672 | success |
| Kaya Rug House co-signs; certificate No. 0005 closed | redeem | [`8bfa11eecc…`](https://stellar.expert/explorer/testnet/tx/8bfa11eecc0f43a77005e03c59956be3f1553fc7a9360eaf167d3098a1ff2996) | 5700710 | 2026-11-12T23:46:34Z | 0.0009711 | success |
| Kaya Rug House buys rug No. 0006 for 600.00 USDC | store_buyout | [`6b6dfe0270…`](https://stellar.expert/explorer/testnet/tx/6b6dfe02704a71503b7a5eeccd8a00ba22757cafcbdc581e03df452c55c09b9f) | 5700759 | 2026-11-12T23:50:39Z | 0.001609 | success |

The hand-over also needed Ayşe's signature on an authorisation entry (Varial's *Confirm Authorizations: redeem*). That is a signature, not a transaction; it is inside the co-sign transaction above.

## Transactions made for the film but not shown

| Action | Contract call | Transaction | Ledger | Closed (UTC) | Fee (XLM) | Horizon |
|---|---|---|---:|---|---:|---|
| Phase 0 probe (not in the film): Kaya Rug House issues probe rug No. 0004 | mint_rug | [`4c682902af…`](https://stellar.expert/explorer/testnet/tx/4c682902af422e437bdb6d5dd031db488cf5150e67d5f7e5ba8017313718c8f1) | 5700501 | 2026-11-12T23:29:09Z | 0.0046781 | success |
| Rehearsal (not in the film): weaver collects probe rug No. 0004, store co-signs | redeem | [`eaa96e66e8…`](https://stellar.expert/explorer/testnet/tx/eaa96e66e828277a66418e9fdbad050e0e827ae7017aabc9414b1e19e6255eb4) | 5700575 | 2026-11-12T23:35:19Z | 0.0009711 | success |
| Staging (not on screen): rug No. 0006 issued, 1-month request, funded | mint_rug | [`d330f59047…`](https://stellar.expert/explorer/testnet/tx/d330f5904703deea11a98fa975a6f585dc979c0cca990d65972ab242325cadff) | 5700723 | 2026-11-12T23:47:39Z | 0.0046363 | success |
| Staging (not on screen): rug No. 0006 issued, 1-month request, funded | request_loan | [`f71434974f…`](https://stellar.expert/explorer/testnet/tx/f71434974fd32d437669b48125f6549ff4252ced2c657ad7f065e369e373a9ff) | 5700739 | 2026-11-12T23:48:59Z | 0.007441 | success |
| Staging (not on screen): rug No. 0006 issued, 1-month request, funded | fund_loan | [`593bfb22b8…`](https://stellar.expert/explorer/testnet/tx/593bfb22b8ba3465f082dca1332e23530178740e57875b2ab44db8a243ba97d4) | 5700743 | 2026-11-12T23:49:19Z | 0.0025628 | success |

Rug No. 0004 was issued in the Phase 0 probe (`4c682902…`, issued with the description "Probe: wool kilim, madder red, 120 × 180 cm") and collected in the rehearsal above. Connection approvals (Varial's *Connection Request*) are not transactions.

## Figures on screen, checked against the contract

| Check | Contract says | Result |
|---|---|---|
| Rug No. 0005 price | `600.00` | matches |
| Rug No. 0005 status after the hand-over | `Redeemed` | matches |
| Loan on No. 0005: months | `6` | matches |
| Loan on No. 0005: principal | `600.00` | matches |
| Loan on No. 0005: interest held for the investor | `45.00` | matches |
| Loan on No. 0005: platform fee | `6.00` | matches |
| Loan on No. 0005: store fee | `9.00` | matches |
| Loan on No. 0005: weaver receives | `540.00` | matches |
| Loan on No. 0005: investor gets back (principal + interest) | `645.00` | matches |
| Loan on No. 0005: weaver's total cost (principal − payout) | `60.00` | matches |
| Loan on No. 0005: status | `Repaid` | matches |
| Loan on No. 0005: investor | `GCVBINDMVFUMQ3OBUVQGE6RFBWWBHSRKSLEQVZ6I7XQNQR2424HQOA2W` | matches |
| Rug No. 0006 owner after the buy-out | `GBWCNPACZXNZKJKB7NA2EHRCZTNWT3LQBEHTYPTVF5X6VZNU5RXPPLCN` | matches |
| Loan on No. 0006: months | `1` | matches |
| Loan on No. 0006: status | `BoughtOut` | matches |
| Kaya Rug House frozen | `false` | matches |
| Kaya Rug House open principal (USDC) | `0.00` | matches |

The local-currency figures (≈ 24,300 TRY etc.) are the app's fixed demo rate of 45 TRY per USDC, as the README says. The network fee caption (0.0058 XLM) is the fee Varial displayed for the issue transaction; Horizon's `fee_charged` for it is in the first table.

## One marker added after capture

The investor-lend beat's "loan confirmed" marker was missed live (the app moves a funded request out of *Open requests*, so the text the script waited for never appeared). It was added afterwards to `capture/logs/investor-lend.json` as `done:lend`, at the first repaint after the transaction was sent (16.28 s into the clip), where the card reappears under *Your loans* as **Running, Due in 5:59**. The capture script now waits for that card instead.

## Testnet state the film leaves behind

- Rug **No. 0004** (probe): collected, certificate closed.
- Rug **No. 0005** "Wool kilim, madder red field, 160 × 230 cm": loan 4 repaid, certificate closed. It shows under *Earlier rugs* as Collected on Ayşe's desk.
- Rug **No. 0006** "Wool kilim, indigo border, 120 × 180 cm": loan 5 bought out; Kaya Rug House holds the certificate (*Bought by this store*, with a **Close the certificate** button on the store desk).
- Kaya Rug House is **not** frozen and has no open loans; nothing is overdue or claimable.
- /activity shows all of the above as plain sentences; the testnet RPC keeps about 7 days of events.
