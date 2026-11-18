# Verification

Checked 2026-11-18T02:36:13Z with `node capture/verify.mjs` (read-only). Contract `CBJVX327NQLL5YSFIOCFOK4WVW2F7CJUN4WUTT53CDU4D5S3OLIJNLMS` on Stellar Testnet.

**Capture route: automated wallet (route a).** Every button press in the film is a real click in the production build of the app (`next start`), and every signature is the real Varial wallet (v5.52.0, loaded unpacked into Playwright's Chromium) approving the real request. Nothing was replaced by a script or a graphic. The Varial windows in the film are screen recordings of the extension's own popup pages; they are composited beside the app (the popup's empty backdrop above its sheet is cropped), because a real popup is a separate window.

## How each hash was checked

1. The hash comes from the app's own `sendTransaction` RPC response, recorded while the button was pressed (`capture/logs/state.json`).
2. `GET https://horizon-testnet.stellar.org/transactions/<hash>` must return the transaction with `successful: true`; the ledger and close time below come from that response, the contract function from its operation.
3. The film's loans are then read back from the contract with `stellar contract invoke --send=no` (simulation: `get_loan`, `get_rug`, `next_loan_id`) and every figure captioned on screen is compared with the contract's record.

## Transactions on screen

| Action | Contract call | Transaction | Ledger | Closed (UTC) | Fee (XLM) | Horizon |
|---|---|---|---:|---|---:|---|
| Kaya Rug House issues the certificate for rug No. 0004 | mint_rug | [`e415b1b2b4…`](https://stellar.expert/explorer/testnet/tx/e415b1b2b4dc4bff10e686f752c883b6a9ef27a9769b5140e3780ba71c421037) | 5789044 | 2026-11-18T02:27:46Z | 0.0052479 | success |
| Ayşe asks for 600.00 USDC for 6 months | request_loan | [`0efd73fb45…`](https://stellar.expert/explorer/testnet/tx/0efd73fb451bf1093571fc1cfa3ac9bc7f2fdd7122503b447924796353149de8) | 5789054 | 2026-11-18T02:28:36Z | 0.0083793 | success |
| Deniz lends 600.00 USDC | fund_loan | [`1169068d43…`](https://stellar.expert/explorer/testnet/tx/1169068d433611de981d897bcaaa1a0ac3c120beaeac2f3831bef350523c6c80) | 5789062 | 2026-11-18T02:29:16Z | 0.0026373 | success |
| Ayşe repays 600.00 USDC | repay | [`04404d07f0…`](https://stellar.expert/explorer/testnet/tx/04404d07f07cd55711687ed98026888e29acfb31568d499ceab0701823c15012) | 5789070 | 2026-11-18T02:29:56Z | 0.0015672 | success |
| Kaya Rug House co-signs; certificate No. 0004 closed | redeem | [`f97e18b6ce…`](https://stellar.expert/explorer/testnet/tx/f97e18b6ce2647edd9890a1c4ec63954b64d415bf994c93eaa1dfc424ed16a2f) | 5789090 | 2026-11-18T02:31:36Z | 0.0009845 | success |
| Kaya Rug House buys rug No. 0005 for 600.00 USDC | store_buyout | [`ab81d1dfd8…`](https://stellar.expert/explorer/testnet/tx/ab81d1dfd878b9d342a89ea72e0542b9419d2e6e96ebda3d771fb4357d2cd551) | 5789120 | 2026-11-18T02:34:06Z | 0.0016147 | success |

The hand-over also needed Ayşe's signature on an authorisation entry (Varial's *Confirm Authorizations: redeem*). That is a signature, not a transaction; it is inside the co-sign transaction above.

## Transactions made for the film but not shown

| Action | Contract call | Transaction | Ledger | Closed (UTC) | Fee (XLM) | Horizon |
|---|---|---|---:|---|---:|---|
| Staging (not on screen): rug No. 0005 issued, 1-month request, funded | mint_rug | [`6745286c9c…`](https://stellar.expert/explorer/testnet/tx/6745286c9cb0833d4a0d6a8ddbd8842f9b9b67b3cad7e95bc8edffe3413a9c6e) | 5789096 | 2026-11-18T02:32:06Z | 0.0051965 | success |
| Staging (not on screen): rug No. 0005 issued, 1-month request, funded | request_loan | [`ad1bb68641…`](https://stellar.expert/explorer/testnet/tx/ad1bb68641c2205290d89b38b0f6b5323ca5db1c321afd520d1de9ed6fff7ac1) | 5789101 | 2026-11-18T02:32:31Z | 0.0083728 | success |
| Staging (not on screen): rug No. 0005 issued, 1-month request, funded | fund_loan | [`b993690795…`](https://stellar.expert/explorer/testnet/tx/b993690795e2f607d9a3f309a97697204a370f877083ddb78e16dea215b9e25a) | 5789105 | 2026-11-18T02:32:51Z | 0.0026371 | success |

Connection approvals (Varial's *Connection Request*) are not transactions.

## Figures on screen, checked against the contract

| Check | Contract says | Result |
|---|---|---|
| Rug No. 0004 price | `600.00` | matches |
| Rug No. 0004 status after the hand-over | `Redeemed` | matches |
| Loan on No. 0004: months | `6` | matches |
| Loan on No. 0004: principal | `600.00` | matches |
| Loan on No. 0004: interest held for the investor | `45.00` | matches |
| Loan on No. 0004: platform fee | `6.00` | matches |
| Loan on No. 0004: store fee | `9.00` | matches |
| Loan on No. 0004: weaver receives | `540.00` | matches |
| Loan on No. 0004: investor gets back (principal + interest) | `645.00` | matches |
| Loan on No. 0004: weaver's total cost (principal − payout) | `60.00` | matches |
| Loan on No. 0004: status | `Repaid` | matches |
| Loan on No. 0004: investor | `GCVBINDMVFUMQ3OBUVQGE6RFBWWBHSRKSLEQVZ6I7XQNQR2424HQOA2W` | matches |
| Rug No. 0005 owner after the buy-out | `GBWCNPACZXNZKJKB7NA2EHRCZTNWT3LQBEHTYPTVF5X6VZNU5RXPPLCN` | matches |
| Loan on No. 0005: months | `1` | matches |
| Loan on No. 0005: status | `BoughtOut` | matches |
| Kaya Rug House frozen | `false` | matches |
| Kaya Rug House open principal (USDC) | `0.00` | matches |

The local-currency figures (≈ 24,300 TRY etc.) are the app's fixed demo rate of 45 TRY per USDC, as the README says. The network fee caption (0.0058 XLM) is the fee Varial displayed for the issue transaction; Horizon's `fee_charged` for it is in the first table.

## Testnet state the film leaves behind

- Rugs **No. 0001–0003**: the scripted repay, buy-out and claim scenarios (`scripts/testnet.py demo`), run before the capture.
- Rug **No. 0004** "Wool kilim, madder red field, 160 × 230 cm": loan 4 repaid, certificate closed. It shows under *Earlier rugs* as Collected on Ayşe's desk.
- Rug **No. 0005** "Wool kilim, indigo border, 120 × 180 cm": loan 5 bought out; Kaya Rug House holds the certificate (*Bought by this store*, with a **Close the certificate** button on the store desk).
- Kaya Rug House is **not** frozen and has no open loans; nothing is overdue or claimable.
- /activity shows all of the above as plain sentences; the testnet RPC keeps about 7 days of events.
