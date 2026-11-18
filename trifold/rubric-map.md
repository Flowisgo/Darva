# Trifold rubric map

Where each judging item appears on the board ([`trifold.pdf`](trifold.pdf), 38 × 27 in; panels 9.5 | 19 | 9.5 in) and how strong our evidence for it is.

**Strength:** *strong* = shown on the board and backed by something a judge can check (code, contract, testnet transactions, a cited source). *partial* = shown, but the evidence is a plan, an estimate or a narrow figure. *missing* = a TODO box on the board.

## 1. Business Impact and Relevance (37.5%)

| Rubric item | Where on the board | Evidence | Strength |
|---|---|---|---|
| Problem and social impact: real, specific, significant, with evidence | Left, **Sold too cheap**: $1,500 vs $600 bars, "$900 lost"; Findex box (1.3 bn unbanked) | Worked example in `README.md` and `docs/mechanism-guide.md`. Findex: World Bank, Global Findex Database 2025. The "about 40%" store price is our own description of the market, not a cited statistic | partial |
| How impact would be measured | Left, **Measuring impact**: money weavers keep, loans repaid vs bought out, cost of credit vs local alternatives | Metrics only, marked "No results yet" | partial |
| Solution and differentiation | Center, **How it works** (3 steps) and **Why it's different** (collateral = the store's own price; vs selling today and vs an informal loan) | Mechanism enforced by the contract (`docs/contract-interface.md`); comparison rows are qualitative, with no cited rates for informal lenders | strong |
| Advantage from building on Stellar | Right, **Built on Stellar**; center, network fees under $0.10 a loan | `docs/mechanism-guide.md` (network fees); testnet fees per transaction 0.001–0.0074 XLM in `video/verification.md` | strong |
| Customer segment: specific, reachable first group | Left, **Who we serve first**: handloom rug weavers who sell through local rug stores, Turkey pilot, reached through partner stores | The segment and channel are our plan. We have no signed stores yet | partial |
| Market size | Left, **$47 M** Turkey handmade-carpet exports, 2022 (+8%) | Hürriyet Daily News, 18 June 2023, quoting İHİB head Ahmet Hayri Diler. Exports only; no count of weavers and no home-market figure | partial |
| Monetization: revenue model, affordable pricing, costs | Center, **Business model**: $6 platform / $9 store / $45 investor; "Stores join" line; network-fee callout | Fee parameters on the deployed contract (1,500 / 100 / 25 bps); the weaver's total cost of $60 is on the board under "Weaver repays". No operating-cost model (anchor fees, KYC, support) | partial |
| Structurally cheaper (no funder's subsidy) | Center, dark callout: "Network fees under $0.10 a loan … No subsidy needed." | Every party is paid from the loan's own fees. The anchor's conversion fee (planned 2% each way in the mechanism guide) is not on the board | partial |
| User validation: tested with real users, feedback, what changed | Left, bottom: **User validation** TODO box | None yet | **missing** |

## 2. Technology and Implementation (37.5%)

| Rubric item | Where on the board | Evidence | Strength |
|---|---|---|---|
| Meaningful use of Stellar (Soroban, assets, anchors/SEPs, path payments) | Right, **Built on Stellar**: Soroban contract holds rug, loan and USDC and enforces the buy-out; USDC via a Stellar Asset Contract; anchor cash-out (mocked) | Contract `CCX3Z3DJ…4M2J`; test USDC SAC. No real anchor, no SEP integration, no path payments | partial |
| Architecture and scalability: on/off-chain split, RPC, path to production | Right, **On-chain / Off-chain** boxes; **Next:** line (real anchor, KYC, fee sponsorship, mainnet, several investors a loan) | `README.md` (What runs on Stellar, Limits); the app talks straight to the public RPC | strong |
| Working, verifiable build: deployed testnet prototype, end-to-end flow, public repo, contract IDs | Banner, top right: QR codes to the live app and the GitHub repo. Right, **Verify it yourself**: contract ID (short and full), Repay / Buy-out / Claim runs | `docs/testnet-demo-results.json` (three scenarios), `video/verification.md` (six on-screen transactions checked on Horizon). Repo returns HTTP 200 publicly | strong |
| Security and trust: contract safety, keys, auth, KYC awareness | Right, **Security & trust** (5 icon bullets); **Next:** KYC, fee sponsorship | `docs/contract-interface.md`: `StoreCannotBorrow`, third-party investor check, two-signature `redeem`, investor credit + `withdraw_credit`, `claim_rug` freezes the store, platform holds nothing. Keys stay in the wallet (Varial). No KYC built | strong (contract), partial (KYC) |
| UX and accessibility: hides blockchain complexity, onboarding, fee sponsorship, mobile, low-connectivity | Right, **UX: the weaver's terms**: screenshot of the weaver's fee breakdown in USDC and lira, one desk per role, plain-sentence feed, look around with no wallet | Live app. Not shown or built: fee sponsorship, mobile testing, offline/low-connectivity support, wallet-free onboarding for signing | partial |

## 3. Presentation and Deliverables (25%)

| Rubric item | Where on the board | Evidence | Strength |
|---|---|---|---|
| Pitch delivery (15%) | Not on the board; the board follows the pitch order: problem (left), solution (center), technology (right) | — | n/a |
| Trifold effort and display quality (10%) | Whole board: banner and center readable in 10 seconds; app colours, font and kilim patterns; body text ≥ 28 pt (≥ 22 pt only for icon labels; 18 pt only for sources and the full contract ID) | `render.mjs` checks overflow, fold gutters and edge margins on every build | strong |
| Demo video | Right, **Verify it yourself**: `[TODO: demo video link + QR]` | `video/out/rugdealer-demo-60s.mp4` exists locally; no public link in the repo | **missing** |

## Claims checked against sources

| On the board | Source |
|---|---|
| $1,500 buyer price, $600 store price, about 40% | `README.md` (The problem, Worked example) |
| $900 lost | $1,500 − $600 |
| 15% a year, 1% once, 0.25% a month, 1–12 months, 7-day buy-out | `docs/mechanism-guide.md` (Money Rules), deployment parameters in `README.md` |
| $45 / $6 / $9 / $540 / $645 / total cost $60 | `README.md` worked example; same figures read back from the contract in `video/verification.md` |
| Missed buy-out: store frozen, investor takes the rug + $45, weaver owes nothing more | `README.md` (How it ends), `docs/contract-interface.md` (`claim_rug`) |
| Network fees under $0.10 a loan | `docs/mechanism-guide.md` (Money Rules) |
| ~5 s settlement, sub-cent fees | General Stellar network facts, not measured by us. Our own fees: 0.001–0.0074 XLM per transaction (`video/verification.md`) |
| 1.3 bn adults unbanked | World Bank, Global Findex Database 2025 |
| $47 M Turkey handmade-carpet exports in 2022, +8% | Hürriyet Daily News, "Turkish rug sector eyes market leadership", 18 June 2023, quoting the Istanbul Carpet Exporters' Association |
| Security bullets | `docs/contract-interface.md`, `README.md` (Who holds what) |
| Repay / Buy-out / Claim ran on testnet | `docs/testnet-demo-results.json` (statuses Repaid, BoughtOut, Claimed) |
| Contract ID | `README.md` (Testnet deployment) |
| Pilot in Turkey, reached through partner stores | Our plan (the app's demo currency is TRY); not a result |

Notes:

- The network-fee payer differs between sources: the mechanism guide says the platform pays, while the README says each signer pays and fees are not sponsored. The board avoids saying who pays and lists fee sponsorship under "Next".
- The Hürriyet article also mentions "$1.17 billion" in world handmade-carpet exports, but it's unclear whether that is India's figure or the world's, so it is not on the board.
