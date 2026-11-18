# Task: build and render Darva's 60-second demo video

You are working in the Darva repo. Build a **60-second demo video** for the Velocity *Blockchain Innovation Challenge powered by Stellar*, not a slideshow: it must show the working prototype doing real things on Stellar Testnet. Judge it the way a skeptical Stellar engineer would: every figure on screen should be checkable against the chain afterwards.

Deliver a finished `.mp4` plus the code that produces it, so it can be re-rendered or re-cut after any copy change.

---

## 1. Ground truth — read these before writing any code

- `README.md` — what the product is, the worked example, the limits
- `frontend/DEMO.md` — the existing 60-second shot list (a good starting point; improve on it)
- `docs/mechanism-guide.md` — the rules you must not misstate on screen
- `docs/frontend-status.md` — what was verified in the browser and what was **not** (this matters, see Phase 0)
- `docs/testnet-demo.md`, `docs/testnet-demo-results.json` — deployment, scenarios, exact USDC deltas
- `frontend/lib/deployment.json` — contract ID, USDC SAC, demo accounts
- `frontend/app/*/page.tsx`, `frontend/components/rug-actions.tsx`, `frontend/lib/tx.ts`, `frontend/lib/events.ts` — real routes, copy and button labels

Facts you may rely on (verify against the repo before using them on screen):

| Fact | Value |
|---|---|
| Contract | `CBJVX327NQLL5YSFIOCFOK4WVW2F7CJUN4WUTT53CDU4D5S3OLIJNLMS` (Testnet) |
| Live app | `darvarugs.vercel.app` |
| Demo rug | 600 USDC price; a real buyer would pay ~1,500 USDC |
| 6-month loan | 45.00 interest, 6.00 platform fee, 9.00 store fee → weaver receives **540.00** |
| Weaver repays | pays 600.00 → total cost **60.00**; investor receives **645.00** |
| Local currency | 1 USDC ≈ 45 TRY (mocked), so 540.00 ≈ 24,300 TRY |
| Demo clock | 1 loan month = 60 s; store buy-out window = 60 s |
| Desks | `/store`, `/weaver`, `/investor`, `/platform`, `/activity`, `/rug/[id]` |
| Demo accounts | Kaya Rug House (store), Ayşe the weaver, Deniz the investor, Darva platform |

## 2. What is being scored (verbatim rubric, weighted)

**Business Impact and Relevance — 37.5%**
- *Problem and social impact:* is the problem real, specific, significant; would solving it meaningfully improve lives; evidence-backed; how impact is measured.
- *Solution and differentiation:* does it address the problem; why better than alternatives; show how the product works for the user; advantage of building on Stellar.
- *Customer segment:* a specific, reachable customer group and a sense of market size.
- *Monetization:* credible path to sustainability, affordable pricing, early cost thinking.
- *User validation:* tested with real users; concrete feedback and iteration.

**Technology and Implementation — 37.5%**
- *Meaningful and innovative use of Stellar:* Stellar essential and used creatively — Soroban contracts, assets, path payments, anchors/SEPs — and why Stellar is the right fit.
- *Architecture and scalability:* sensible on-chain/off-chain split, clean Horizon/RPC integration, realistic path to production.
- *Working, verifiable build:* deployed prototype with an end-to-end core flow, public repo, contract IDs.
- *Security and trust:* contract safety, wallet and key management, auth, compliance awareness.
- *User experience and accessibility:* hides blockchain complexity; onboarding, fee sponsorship, mobile, low-connectivity users.

**Presentation & Deliverables — 25%** (15% delivery, 10% trifold)
- Clear, concise, engaging. The video is the evidence inside a 3-minute verbal presentation; it is also watched standalone from a Devpost link.

**Hard requirement:** the one-minute demo video must demonstrate the functioning prototype. *"Slide-only videos do not meet this requirement."*

## 3. Non-negotiables

1. **60 seconds.** 58.0 ≤ duration ≤ 60.0. No exceptions, no "just one more beat".
2. **1920×1080, 60 fps, H.264 (`yuv420p`), `+faststart`, CRF 18**, under 60 MB so it can live in git and upload anywhere.
3. **Real UI, real chain.** Every scene is captured from the running app or from real on-chain data. No mocked screens, no invented balances, no fabricated "success" toasts, no re-typed numbers that differ from the contract.
4. **The button presses happen.** At least the issue → borrow → fund → repay/collect flow must be shown as actual clicks producing actual Testnet transactions. If a wallet signature cannot be automated, escalate per Phase 0 — do not silently replace clicks with a graphic.
5. **Watchable muted.** Master is silent with burned-in captions (it plays during a live pitch). Also render a narrated master.
6. **Screen-first.** ≥ 70% of frames are captured app UI. At most two full-frame graphic cards; everything else is an overlay on real footage.
7. **Nothing embarrassing in frame.** No secret keys, no wallet import/settings, no browser chrome, bookmarks bar, OS notifications, dev-tools badge, or Next.js dev indicator.
8. **Legible small.** Captions must still read at 720p and 480p. Keep them in the lower band, never over the primary button being clicked.

## 4. Deliverables

```
video/
  package.json            # scripts: capture, render, render:narrated, all
  capture/                # Playwright capture scripts + fixtures + click logs (JSON)
  src/                    # composition source (Remotion components, timeline, styles)
  assets/                 # raw clips, audio, generated cursor/ripple assets
  out/
    darva-demo-60s.mp4
    darva-demo-60s-narrated.mp4
    darva-demo-60s.srt
    poster.jpg            # 1920×1080 frame for the Devpost thumbnail
  storyboard.md           # beat sheet: time, screen, action, caption, rationale
  narration.md            # VO script with timecodes, readable live by the presenter
  verification.md         # every tx hash shown, its ledger, and the check you ran
  README.md               # prerequisites, one-command re-render, known limits
docs/demo-video.md        # short repo-facing page linking the above
```

Work on a branch named `demo-video`. Do not touch `main` history, the deployment files, or the contract.

## 5. Phase 0 — can this even be filmed? (gate before any editing)

`docs/frontend-status.md` says the signed flows were **never exercised in a browser**: "Code done and typechecked. Not exercised: needs Freighter." Assume they may be broken. Spend up to 45 minutes here and do not start the video until one full happy path has landed on chain and you can quote the transaction hashes.

1. **Fresh state.** The Testnet RPC keeps ~7 days of events, so `/activity` may be nearly empty. Seed real history on the *existing* contract (keeps the ID matching the README) by issuing rugs and running `python scripts/testnet.py demo --scenario repay|buyout|claim`. Only redeploy if the contract is genuinely unusable — and if you do, run `npm run sync-deployment` and update every ID in `README.md`, `docs/testnet-demo.md`, `docs/frontend-status.md` and `contracts/`. Judges will notice a dead link.
2. **Clean build for capture.** Record against `npm run build && npm start`, not `npm run dev`, so the dev indicator and HMR overlays are gone. Keep `npm run dev` for iteration.
3. **Wallet automation.** Try, in this order, and stop at the first that gives you a real signature:
   - **a. Automate Varial.** Playwright persistent Chromium context with the extension loaded (`--disable-extensions-except=… --load-extension=…`, headed; service workers need `chromium.launchPersistentContext`). Unlock the wallet once in that profile, switch it to Testnet, import the three demo accounts from `~/.darva-demo/config`. The signature prompt is a separate extension page/window — catch it with `context.waitForEvent('page')` and click Approve there. Record it; a real wallet popup is the most credible 3 seconds in the video.
   - **b. Ask for drop-in footage.** If the extension resists automation, write `video/assets/dropin/INSTRUCTIONS.md` with exact specs (1920×1080, no browser chrome, 60 fps or 30 fps, ≤ 20 s each, what to click, which account to have selected) and a file list for six clips: store issues, weaver borrows, investor lends, weaver repays, weaver collects + store co-signs, store buys out. Splice them in by filename; fall back to Phase 0 steps 3c for any clip not supplied.
   - **c. Honest fallback.** Use the real `?as=store|weaver|investor|platform` read-only desks for UI, drive the on-chain actions with `python scripts/testnet.py` (real transactions, real hashes), and show the resulting real state — `/activity` sentences, loan cards, balanced changes — plus the explorer proof. State plainly in `verification.md` that button presses were not captured and why. Never fake an extension popup, a signature, or a success banner.
4. **Framing check.** The app was verified at 1280 px and 375 px but never at 1920. Screenshot every route at 1920×1080 first. If the layout stretches, present a 1440×900 capture on a subtle woven-texture backdrop inside the 16:9 frame rather than shipping a loose layout.
5. **Write down the plan.** `storyboard.md` before the first render: beat, time in/out, screen, action, caption, rubric line it serves.

## 6. Capture architecture

Optimise for *reproducible*, not *one perfect take*. Short clips per beat, cut in the composition.

- **Playwright, headed Chromium, viewport 1920×1080, deviceScaleFactor 1.** Wait for `document.fonts.ready` and for skeleton loaders to clear before each action. Freeze any non-deterministic UI (blinking carets) with an injected stylesheet.
- **Move like a human.** `page.mouse.move(x, y, { steps: 12 })` with eased intermediate points and a 60–120 ms settle before the click; never teleport.
- **Draw your own cursor.** Playwright video does **not** capture the mouse pointer. Inject a small cursor element plus a click ripple via `addInitScript`, and log every move/click with timestamps to `capture/clicks.json`. Re-render both as overlays in the composition so they are crisp, on-brand, and frame-accurate.
- **One clip per beat**, each with a pre-roll and post-roll of at least 1 s so cuts land cleanly. Name them `01-landing.webm …`.
- **Smoothness.** Playwright `recordVideo` gives ~25 fps VP8. If motion looks choppy at 60 fps, either capture via CDP `Page.startScreencast` (JPEG frames + timestamps, assemble at constant 60 fps with ffmpeg) or keep the 25 fps clip and only add *compositor* motion (zoom/pan) at 60 fps. Do not ship stuttering clicks.
- **Long waits become cuts.** The 60-second loan month means real waiting. Use a hard cut with a small "60 s later" chip or a sped-up (4×, with a speed indicator) segment — never a frozen countdown that reads `00:00`.
- **Composition.** Use Remotion (React) for the timeline: video layer, overlay layer, caption layer. It is deterministic, re-renderable, and you can iterate frame-by-frame. If installing Remotion fails, the fallback is one HTML page with a manually driven clock, screenshot-stepped by Playwright, assembled with ffmpeg — same look, more work.
- **Anchored overlays.** Export each clicked element's `boundingBox()` with the clip. In the composition, place highlight rings, arrows and callouts from those coordinates (converted through the zoom transform) so they land exactly on the real element instead of roughly near it.

## 7. Storyboard brief (60 s, 8 beats)

Steal this structure, then improve it after seeing the app. Captions below are working copy — keep the numbers exactly, rewrite the phrasing to match the app's own voice.

| # | Time | Screen & action | Caption (≤ 2 lines, ≤ 58 chars/line) | Serves |
|---|---|---|---|---|
| 1 | 0.0–6.0 | Landing hero and the worked-example rug, slow push-in | "A finished rug is worth about 1,500 USDC." → "The store offers 600 today, because she needs cash now." | Problem |
| 2 | 6.0–10.5 | Landing: hero title and the three outcomes | "So she borrows the rug's price instead of selling it." | Solution |
| 3 | 10.5–19.0 | `/store` as Kaya Rug House: Issue rug certificate, 600 USDC → confirm → on-chain. Hold on the new certificate and its No. | "Kaya Rug House prices the rug and issues a certificate on Stellar." / "600.00 USDC, held as security." | Working build, UX |
| 4 | 19.0–29.5 | `/weaver` as Ayşe: pick 6 months, the fee breakdown, `Ask for 600.00 USDC` → signed. Overlay the money waterfall 600 − 45 − 6 − 9 = 540. | "Six months, fees once: she receives 540.00 USDC today." / "≈ 24,300 TRY." | Monetization, UX |
| 5 | 29.5–37.0 | `/investor` as Deniz: open request, `Lend 600.00 USDC` → balance drops. | "One investor funds the whole loan in one transaction." / "She pays 60 in fees, not 900 selling cheap." | Monetization, differentiation |
| 6 | 37.0–45.0 | `/weaver`: countdown, `Repay 600.00 USDC`, `Collect the rug` → link → `/store` `Sign and hand over` → "Certificate closed" | "She repays from a real buyer and collects the rug — the store co-signs." | Trust, UX |
| 7 | 45.0–52.0 | `/store` overdue loans: `Buy the rug for 600.00 USDC` → investor repaid. Highlight the store's own price on the certificate. | "No repayment? The store must buy back at the price it set." / "That's why it can't lowball her." | Differentiation, Stellar |
| 8 | 52.0–60.0 | `/activity` plain-sentence feed, fast scroll; end card: contract ID chip, "Live on Stellar Testnet", `darvarugs.vercel.app` | "Every step is a Stellar transaction." / "Borrow against your rug. Don't sell it cheap." | Verifiable build |

Rules for the cut:

- **One idea per beat.** If a caption needs a comma-heavy sentence, it is two beats or zero beats.
- **Show the mechanism, not the marketing.** The strongest 10 seconds in this product are the store's forced buy-back at its own price and the two-signature hand-over. Protect that time; cut the landing page before you cut those.
- **Numbers on screen must come from the app or the contract.** The 45 / 6 / 9 / 540 / 645 figures are already verified in `docs/testnet-demo-results.json`.
- **No dead air.** Every frame has either motion, a click, a change of state, or a caption landing.
- **End on proof**, not on a slogan: contract ID + URL + a visible count of real transactions.

## 8. Copy rules

- Sentence case, present tense, active voice. No "revolutionary", "seamless", "unlock the power of", no exclamation marks.
- Name the people: Ayşe the weaver, Kaya Rug House, Deniz the investor. Generic "users" is weak.
- Every Stellar reference must earn its place: say what the chain *does* for her (one contract holds the certificate and the money; the store's obligation is enforced by code; settlement in seconds for a fraction of a cent), not that it is "built on Stellar".
- One local-currency line total (1 USDC ≈ 45 TRY), because it grounds the economics.
- Do not claim anything outside `README.md`'s "Limits of the prototype" (no mainnet, no real anchor, no KYC). If a caption would imply otherwise, drop it.

## 9. Audio

- **Master:** silent, captions burned in. This is what plays in the 3-minute pitch while a team member talks.
- **Narrated master:** same timeline, VO from `narration.md`. Use a TTS engine if one is available locally (Windows SAPI via `System.Speech.Synthesis.SpeechSynthesizer`, macOS `say`, or an API key if the environment already has one). Keep it dry, ~150 wpm, no music bed unless a licensed track is supplied at `video/assets/music.mp3`. If TTS sounds robotic, ship the silent master and the script — a bad robot voice is worse than none.
- **`narration.md`** is the real deliverable for the presenter: timecode, one spoken sentence per beat, and a note on where to pause for the click.

## 10. Self-review loop — this is most of the work

Render, then **look at the output** and fix it. Repeat until the video is genuinely good, not until the script exits 0.

1. `ffprobe` asserts: duration, 1920×1080, 60 fps, `yuv420p`, audio stream absent/present as expected, file size.
2. Extract frames at every beat boundary and every 2 s; also a 3×3 contact sheet per beat. Look at them.
3. Score 1–5 on each of: real footage ratio, clarity of the problem, clarity of the mechanism, Stellar specificity, proof (IDs/hashes visible), caption legibility at 480p, pacing, polish. Fix the lowest score. Max 4 iterations, then ship.
4. Check the mp4 at 480p width and on a phone-sized player. Captions are the usual casualty.
5. Confirm no frame contains a cursor parked over a label, a half-loaded skeleton, a truncated number, or a caption covering the button.
6. **Verify every transaction shown** with a read-only RPC/Horizon call and record hash → ledger → timestamp in `verification.md`. If a hash in the video does not verify, the frame does not ship.

## 11. Safety and repo hygiene

- Secret keys live only in `~/.darva-demo/config`; read them through the Stellar CLI, never echo, print, log, or screenshot them. Nothing secret enters git, the video, or `verification.md`.
- `.gitignore` `video/node_modules`, `video/assets/*.webm`, `video/assets/*.wav`. Commit the source, the final mp4s, the srt and the poster.
- Do not change app behaviour to make filming easier except a capture-only gate that is inert in production builds — and say so in `video/README.md`. The Vercel deployment must behave exactly as before.
- Leave no dev server running at the end. Note any testnet state you created (rugs, loans) in `verification.md` so the team knows what the app will show judges.

## 12. Definition of done

- [ ] `video/out/darva-demo-60s.mp4` — 58–60 s, 1080p60, H.264, < 60 MB, silent, captions burned in
- [ ] `video/out/darva-demo-60s-narrated.mp4` and `narration.md` (or a written reason it is silent-only)
- [ ] `poster.jpg`, `darva-demo-60s.srt`
- [ ] `storyboard.md` with a rubric→timestamp table (which second serves which criterion)
- [ ] `verification.md` with every tx hash, ledger, and the check that confirms it
- [ ] One command re-renders the video from committed source: `cd video && npm run render`
- [ ] `docs/demo-video.md` links the file, states duration/fps, and says how the footage was captured
- [ ] A frame-by-frame contact sheet I can skim in one image

## 13. Report back

End with: the output paths and durations; a rubric→timestamp table; the list of real transactions captured with hashes and their explorer links; which capture route you used (automated wallet / drop-in clips / honest fallback) and what is therefore not shown; the known weak spots you would fix with another hour; and the exact command the team runs to re-render after a copy change.

If you must choose between a polished edit and a video that proves the prototype, choose the proof. Judges are told a slide-only video fails; they are not told a plain video that shows a real transaction fails.
