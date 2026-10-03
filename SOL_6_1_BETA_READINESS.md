# Sol 6.1 beta readiness — 2026-10-03

## Verdict and recipient-release condition

The canonical experience completes in Chromium and no demonstrated code or layout blocker remains. Six real MP3s are included. The creator's exact forty-five-day portrait is still absent: add `public/images/portrait-45-days.png`, rebuild, and inspect A4 before sending this to its intended recipient. Its safe missing-image state is not a substitute for the artwork. No message or deployment was performed.

## Final gates

| Area | Result |
|---|---|
| Authority / preservation | Current `garden_work` retained; pre-edit baseline and hashes preserved internally. |
| Dependencies | Installed exact versions matched package-lock; no unnecessary reinstall. Source ZIP supports `npm ci`. |
| Typecheck / tests | `tsc --noEmit` passed; **44 passed, 0 failed** (baseline 26). |
| Production build | Vite 7.3.2 succeeded; **429.57 kB HTML**, **128.04 kB gzip**. Real media remains in static directories. |
| First-time browser route | Final build: fresh start, unskipped intro, sequential recordings, physical objects/exits, mutual ending, portrait fallback, full AFTERLIGHT and visible F5 ending. No QA scene jump or dev UI used. |
| Saved/resumed route | Separate earlier full route included an A2 reload and completed F5. Final build also resumed a saved A1, and completed F5 reload returned sensibly to the garden/end card. |
| Console | Final production tab: no warnings/errors. Negative-media fixture also progressed without console-breaking errors. Corrupted-save QA warning is intentional. |
| Encoding | Direct UTF-8 bytes and rendered text checked; no user-visible source mojibake. Classification: EXPORT ONLY, with unavailable faulty export pipeline explicitly qualified. |
| Story / navigation | Five chapters and mutual ending preserved. All A3 choices converge; no-action exit, early AFTERLIGHT, invalid objects/actions and illegal transitions rejected. H1 guide resets when its blocker changes. |
| Real assets | Six original MP3s extracted from the historical archive, hashed and fully decoded with no errors. Exact portrait not found; no substitute supplied. |
| Production posture | Reflection and external Jev explicitly OFF; `?dev=1` cannot expose production QA/intro skip. No required backend or browser provider secret. |

The production HTML SHA-256 is `1d1239c342929e6d73e29b1aae709a0e5eda180232813cfe6a438172b5fa900a`.

## Browser route and timing

The final phone route used 390×844. Literal D2 discovery, ORBIT warmth, HOURS' missed-contact consequences, DAWN's behavioral accountability and physical A3 choice remained understandable; AFTERLIGHT stays a single continuous morning. The portrait reveal retains its authored silence despite the missing image. The complete presentation reached its end card.

Observed first-scene-to-next-chapter wall-clock intervals (including tape transitions and pauses between automation batches):

| Phase | Rough observed interval |
|---|---|
| INTRO | 1.0 minutes |
| DUSK | 1.5 minutes |
| ORBIT | 3.2 minutes |
| HOURS | 1.3 minutes |
| DAWN | 3.9 minutes |
| AFTERLIGHT | 2.9 minutes |

Total observed final route: approximately **13.8 minutes**. These are actual browser-run intervals, not predicted recipient reading times. Conversation advances used the normal controls; authored silences were allowed to finish and F1's voice sequence was not manually skipped. Optional exploration will change duration.

## Responsive visual review

Screenshots were inspected, not just rectangles. Smart matrix covered ARCHIVE, D1, D2, D3, O2, O3A, O3B, O5, H1, H2, H4, A1, A2, A3, A4, F2, F3, F4 and F5 at representative sizes:

320×568, 360×800, 390×844, 430×932; 844×390 and 932×430; 768×1024, 820×1180 and 1024×768; 1280×720, 1366×768, 1440×900, 1920×1080, 2560×1440; ultrawide 3440×1440.

Fixed demonstrable ultrawide vertical cropping and F4/F5 initial/resume camera framing. Phone framing verified from live DOM scroll position before screenshot export. The available full-page exporter resets horizontal scrollers; affected phone captures were repeated as viewport screenshots. This matrix is selective, not every scene on every viewport or a physical-device certification.

## Accessibility and reflection

Native keyboard Enter/Space, Tab, Escape, visible focus and object labels checked. Dialogs isolate background focus, trap Tab, close on Escape and return focus. Menu pauses presentation/audio; M and the menu button now share mute state. No required object relies on hover. Representative phone actions used the same click/tap controls and explicit look-left/right controls.

Reduced-motion detection and canonical reachability were tested, and authored reduced-motion CSS end states inspected. Actual OS reduced-motion rendering, high OS text scaling, a physical screen reader and iOS/Android keyboard were not available; these are not claimed as completed hardware tests.

Reflection-ON dev QA covered phone viewport layout, bounded long text, negation fallback, Enter submission, empty submission, dismissal, one-shot offer behavior, navigation and reload. The actual on-screen keyboard remains unverified. Both reflection and external Jev stay OFF in the beta.

## Storage and adversarial engine checks

All eleven reload points preserved their ledger prefix: I1, D2, O2, H2, H4, A2, A3, A4, A5, F1 and F5. Malformed actual dev storage recovered cleanly. Corrupt/stale envelopes, missing fields, illegal IDs, duplicate/colliding IDs, repeated beats, all five A3 choices and save/replay equivalence are regression tested. Committed A2/F1 beats and A4 interaction no longer replay during reload windows; F4/F5 resume their own phase. An unfinished conversation restarts its presentation, with canonical events retained.

## Audio and performance

All six original MP3s fully decoded. Intro playback was observed at the authored cue with a source seek of about 8.03 seconds; cue constants remain 2.6/5.3/9.3/13.0/16.3/19.8/23.8/27.3. Runtime samples reflected those cues with normal sampling/render latency. Cinematic clocks use playback when progressing, and continue monotonically after a 1.5-second stall. HTTP 200 `text/html` media fallback was rejected by browser decoding/playback; intro/archive/D1 remained reachable in the negative fixture.

**Perceived/audible synchronization was not personally listened to with the available tools.** Playback, seek, decoding and graceful failure were tested; an audible check should accompany portrait injection.

An 8-second H4 sample reported zero long tasks, 330 frames, maximum frame gap 49.9 ms, 327 DOM nodes and 216 SVG nodes. This is a scoped local sample, not a whole-game/mobile performance benchmark. Obvious delayed-timer leaks, subtitle leaks and historical timeout-ID accumulation were fixed; no speculative bundle optimization was performed.

## Known issues and delivery

See `KNOWN_ISSUES.md` for portrait injection, presentation-level restart behavior, unavailable hardware/listening checks, storage-denial limitations and subpath deployment. `SOL_6_1_ADVERSARIAL_AUDIT.md` records severity, fixes, rejected churn and changed files; `BROWSER_QA.md` gives repeatable checks; `ASSET_MANIFEST.json` records real assets.

The source ZIP excludes dependencies, generated dist, browser binaries, screenshots, logs, caches and historical agent artifacts. It includes source, tests, configuration, lockfile, reports and the six real audio files. Preserve the final working directory and serve a rebuilt full `dist/` over HTTP(S).

The sole demonstrated asset release requirement is the original portrait. The documented test-surface limitations do not represent proven defects. Inject that portrait and perform the final visual/audible recipient review before sending.

BETA READY — ASSET INJECTION REQUIRED
