# Task: fix the caption pacing in the RugDealer demo video

**Path convention.** Run from the repository root (`C:\Users\User\rug-dealer`). Paths written as `video/…` are the video project; paths written inside a `video/` step (`src/timeline.ts`, `scripts/…`, `node scripts/render.mjs`) are relative to `video/`. Everything else (`docs/…`, `README.md`, `frontend/…`) is relative to the repo root.

The 60-second master is cut, captured and rendered. The footage is good. **The captions are the problem, and only the captions.**

They were written to *fill* each beat's window rather than to be *spoken*, so the reading speed swings between **150 and 392 words a minute** across 15 cards:

| # | Window | Words | Speed |
|---:|---|---:|---:|
| 1 | 0.15–2.85 | 15 | 333 wpm |
| 2 | 2.85–5.60 | 14 | 305 wpm |
| 3 | 5.70–8.00 | 15 | **391 wpm** |
| 4 | 8.02–11.02 | 17 | 340 wpm |
| 5 | 11.02–13.62 | 17 | **392 wpm** |
| 6 | 13.62–16.92 | 17 | 309 wpm |
| 7 | 16.93–19.93 | 16 | 320 wpm |
| 8 | 19.93–25.33 | 18 | 200 wpm |
| 9 | 25.43–31.03 | 14 | 150 wpm |
| 10 | 31.55–35.45 | 19 | 292 wpm |
| 11 | 35.45–39.75 | 13 | 181 wpm |
| 12 | 39.75–44.05 | 11 | 153 wpm |
| 13 | 44.07–47.67 | 17 | 283 wpm |
| 14 | 47.67–51.37 | 14 | 227 wpm |
| 15 | 51.45–55.45 | 15 | 225 wpm |

Someone reading the cards aloud as the video plays cannot do this: two of them are auctioneer speed, and others sit on screen long after they have been read. Every card must be speakable at one steady tempo, with a breath after it, for the whole minute.

Fix that. **Do not re-capture, do not re-edit the footage, do not rebuild the cut.** The clips, logs, rings, cameras and transaction hashes are final. This is a copy-and-timing change inside the composition, plus one render.

---

## 1. Definition of done

One card = one spoken unit, read once, at **2.35–2.55 words a second (141–153 wpm)**, with **0.15–0.35 s of air** before the next card, for every card in the film.

- No card is a sentence fragment of another card. A reader can land on any card and say it start to finish.
- A card never outlasts its own speech by more than 0.6 s (that is what "too slow" felt like).
- Every card is on screen for at least 2.2 s, so it registers before it must be spoken.
- Captions and `narration.md` are **the same words, 1:1**, generated from one array, so they can never drift again. After this, the presenter records the voice-over by reading the video itself.
- The file still passes the existing spec checks: 58–60 s, 1920×1080, 60 fps, H.264, `yuv420p`, no audio, +faststart, < 60 MB.

## 2. The budget (this is the hard part)

Captions do not have to span their beat. Spare time is air, not a slower card. Total caption time is ~54.6 s over the eight content beats; with the 0.42 s fade allowance (0.22 in + 0.20 out) and ~0.25 s of air per card, the script has room for **roughly 128 words**, down from 234. That is a 45% copy cut, and it is the actual fix: the footage does not change, the words do.

Read exact beat windows from `npm run timeline` (never estimate them), then budget each card as:

```
speech seconds = words / 2.45
needed seconds = speech + 0.42 (fade) + 0.25 (air)
```

Approximate ceilings to work from (verify):

| Beat | Window | Cards | Words available |
|---|---|---:|---:|
| problem | 0.0–5.6 | 1–2 | 12 |
| solution | 5.7–8.0 | 1 | 4–5 |
| store-issue | 8.0–16.9 | 2 | 20 |
| weaver-borrow | 16.9–25.3 | 2 | 19 |
| investor-lend | 25.4–31.0 | 1 | 12 |
| repay-collect | 31.6–44.1 | 3 | 29 |
| buyout | 44.1–51.4 | 2 | 16 |
| activity | 51.5–55.5 | 1 | 8 |
| end card | 55.5–59.6 | 1 | 8 |

If a beat genuinely cannot hold its line — the 2.3 s "solution" beat is the obvious one — you may **slow at most two segments**, by at most 15%, and shave at most 0.6 s off the end card, so the total stays inside 58–60 s. Nothing else about the cut may move. Alternatively drop that caption and let the beat play silent: two seconds of real footage with no text is a legitimate beat, a card nobody can say is not.

## 3. Work plan

1. **Measure first.** Add `scripts/caption-pace.mjs`: bundles `src/timeline.ts` the same way `scripts/timeline-report.mjs` does, walks `BEATS[].captions`, and prints a table — card, beat, window, duration, words, wpm, speech estimate, air, and `ok`/`why not`. Exit non-zero on any violation of section 1 or 4. Wire it to `npm run pace` and make `npm run render` run it first. This gate is the deliverable that matters: it is what stops the next edit from re-breaking the pacing, and it fails loudly instead of relying on anyone's ear. Do not make `narration-timing.ps1` the gate — `SelectVoice` threw when I tried it here ("No voice installed… with the current security setting"), so it is machine-dependent. Keep it as an optional cross-check if it runs; the Node gate is the source of truth.
2. **Rewrite the copy to the budget**, beat by beat, keeping the story arc and every number. Use the existing `narration.md` as raw material — it is already ~120 words at ~150 wpm and was written to be spoken — then tighten it to the ceiling above.
3. **Re-time in `src/timeline.ts`**: keep the existing `{ at, to, lines }` schema, beat-relative seconds, so `Demo.tsx` needs no change. One spoken unit per card; `lines` is display only (max 2 lines, max 9 words per line, max ~96 characters total, including the digits). Place cards so the fade ends as the speech should begin and the card leaves within 0.6 s of it ending.
4. **Generate `narration.md` from the same array** — one row per card, `| start–end | say | cue |`, with the cue being what is on screen (e.g. "the Varial window opens on 'real wallet'"). Regenerate the `.srt` from the timeline as before.
5. **Render only the master:** `node scripts/render.mjs master` (≈10 minutes; Remotion's own Chromium and ffmpeg are installed — do not fetch anything). **Do not run `npm run capture`, `npm run verify`, `npm run all`, or Remotion Studio.** Archive the current file first: `out/archive/rugdealer-demo-60s-v1.mp4`. Regenerate the `.srt`. The poster has no caption on it — skip it.
6. **Look at the result.** Extract one frame 0.9 s after each card's start at 480 px wide into `.cache/pace/`, assemble a contact sheet, and read every card. Then check the rendered `.srt` back against `timeline.ts`: same count, same words, no card under 2.2 s, no card over 2.6 w/s.

## 4. Copy rules for a read-aloud script

- Short sentences. One clause each. Write what a person says, not what a slide says.
- Digits stay digits on screen (`600 USDC`, `540.00 USDC`, `$60`, `645.00`). They are readable and checkable.
- Cut everything that needs explaining mid-sentence: the 0.0058 XLM network fee, `≈ 24,300 TRY`, "Certificate No. 0005", two-clause compounds. One idea per card.
- Keep the four beats that carry the score: the 900 lost vs. the 60 paid; the store must buy back at its own price; two signatures close the certificate; every step is a checkable Testnet transaction.
- No line may contradict `docs/mechanism-guide.md`, and none may claim more than `README.md`'s "Limits of the prototype".
- Name people (Ayşe, Kaya Rug House, Deniz). Say "Ayşe" as EYE-sheh in `narration.md`'s notes.
- Contractions are fine. No exclamation marks, no "seamless", no "revolutionary".

## 5. Guardrails

- Footage, capture logs, segment in/out points, rings, camera moves and `verification.md` hashes are frozen. If your change moves a ring off its element, you have gone too far.
- Do not touch `frontend/` or the contract.
- Work on the existing `demo-video` branch. If the render looks worse than v1, keep v1 and say so.
- Time-box: 40 minutes of wall time end to end. If the pace gate passes and the render completes, stop — no second round of taste.

## 6. Report

Give me: the before/after pace table (card, words, wpm) so I can see the swing is gone; the new total duration and word count; actual render time; the one-liner for any segment you slowed and why; and confirmation that the spec checks and the `.srt` re-check passed. State the exact command I run after a copy change: `cd video && npm run render`.
