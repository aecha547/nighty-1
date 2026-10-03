# Repeatable browser QA

Use `npm run dev` with `?dev=1` only for isolated QA. Normal production ignores the parameter. QA scene jumps build a legal event ledger and are useful for isolated screenshots/reload tests; they are not a substitute for the main first-time playthrough.

1. Build and preview on a fresh origin. Start at the doorway, watch I1, insert each recording, use physical required objects and exits, reach the canonical ending, acknowledge the portrait, and reach F5. Do not jump scenes. Conversation timing is reader-controlled; next-line in F1 is an authored control.
2. Repeat from a saved state. Reload I1, D2, O2, H2, H4, A2, A3, A4, A5, F1 and F5. In dev QA, log the ledger before/after; its prefix must be identical.
3. At H2 after contact_attempt, reload: no second phone ring. At A2 after ending_spoken, no second ending conversation. At A4 after portrait interaction, no second interaction event. F4/F5 resume their own phase and camera point.
4. A3: no-action exit stays blocked; each of five choices makes the horizon available; remaining objects stay optional. Double-click conversation text; only one advance. Silence cannot be manually skipped.
5. Open the register/menu with keyboard. Tab/Shift+Tab remain in the dialog. Escape closes it and restores focus. Menu pauses automatic progression. Enter/Space activate native controls; M does not intercept text input.
6. Geometry and screenshots: 320x568, 360x800, 390x844, 430x932, 844x390, 932x430, 768x1024, 820x1180, 1024x768, 1280x720, 1366x768, 1440x900, 1920x1080, 2560x1440, 3440x1440. Use representative scenes rather than every scene at every size. Inspect A3's lower ledge on ultrawide; F4/F5 framing on a phone after reload. Capture the visible viewport for horizontally pannable scenes: the available full-page exporter resets scrollLeft.
7. Separate process: VITE_JEV_REFLECTION=1, A3 one choice, wait for the optional offer. Test empty/long text, Enter, leave-it, not-now, Escape, repeated offer, navigation and reload. Do not turn this on in the recipient build.
8. Build first, then `node tests/media-failure-server.mjs`: its local 4384 server deliberately returns HTTP 200 text/html for media. Verify intro/loader/story progression despite media decoding rejection. It is a negative fixture, not a deployment server.
9. Dev QA performance/media buttons expose local measurements only; no telemetry. Corrupt-save button targets the disposable dev origin and deliberately resets the test ledger.
