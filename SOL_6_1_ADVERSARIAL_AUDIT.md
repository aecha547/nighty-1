# Sol 6.1 adversarial integration audit — 2026-10-03

## Authority and preservation

Reviewed the current Downloads `garden_work`; did not overwrite it with an older ZIP. No Git repository was present. Before source edits, preserved 48 source/config/test files in an internal baseline ZIP and recorded SHA-256 hashes. Existing installed dependencies matched the lockfile. Baseline: 26 tests passed, typecheck passed, production HTML 426.89 kB. Canonical data/guards, choices, chapter order and ending were retained.

## P0 findings

No demonstrated unavoidable canonical dead end or premature AFTERLIGHT route remains. The model has 28 scene definitions; I0 is the immediate start gesture, leaving 27 presented scenes. All five story chapters remain reachable. No source mojibake or relationship scoring/reconciliation route was found.

## P1 findings and fixes

| Finding | Correction |
|---|---|
| Unknown/missing-ID events in an otherwise valid saved ledger could be silently accepted | Runtime event-envelope/type/required-field validation before dispatch; corrupt save recovery reuses strict ledger decoding. |
| An audio element remaining “playing” while stalled could freeze its cinematic clock | Bounded 1.5-second stall detection and monotonic wall-clock continuation; audio remains optional. |
| Menu did not pause unseen cinematic time; focus could leave dialogs, and autoFocus prevented return to the opener | Shared active-time scheduler, track/context suspension, inert background, focus trap, Escape handling and opener restoration. |
| Multiple fast conversation activations could advance more than one line or skip authored silence | Transition lock, timer cleanup and manual silence activation disabled. |
| Ultrawide cover scaling could crop lower A3 interactions | At aspect ratios >= 2:1, retain the whole vertical stage and center it. |
| A2 committed ending/AFTERLIGHT completed voice could replay during the completion-to-transition reload window | Committed beats resume directly to the next legal scene. |
| F4/F5 resume replayed earlier morning presentation, and initial mobile camera framing could miss the bird/gate | Resume from the saved morning phase; Stage supports explicit initial/resized world-point framing. |
| External Jev opt-in could accept protocol-relative foreign endpoints or follow redirects | Resolve every endpoint against the origin, restrict schemes/credentials, refuse redirects. The test seam requires an injected fetch implementation. Adapter remains off. |

## P2 findings and fixes

- Negated reflections such as “I don’t want to let go” previously classified as RELEASE. Boundary-aware affirmation matching now returns uncertainty, while “I forgive but don’t want to forget” retains FORGIVE.
- Nonfinite/missing external confidence is rejected as malformed. Hard timeout also bounds adapters/body parsing that ignore abort. Cache includes exact normalized input/state as well as hashes.
- A3 and H3 delayed remarks could leak after leaving; pending presentation timers now cancel on unmount. Scene changes clear subtitles.
- A4 reload could emit another portrait interaction; it checks the existing interaction site first.
- Firefly could keep its first target after H1's next blocker changed; the guide plan now resets when the unmet target set changes.
- `?dev=1` previously exposed production debug/intro-skip UI; both now require the development build.
- M no longer intercepts typing in reflection fields; the experimental reflection dialog traps/restores focus.
- M and the sound button share mute state, so the menu label cannot become stale after keyboard toggling.
- Hidden subtitle/portrait-next content is removed from the accessibility tree until visible.
- Ambient bed scheduling retained every historical timeout ID; only live IDs are now retained.
- H2's dangling modifier was corrected to “Hands in coat pockets, B watches…”. A's behavioral accountability and the rest of DAWN were preserved.

## P3 observations and rejected changes

No broad visual redesign, dialogue rewrite, engine rewrite, additional ending, analytics/backend, bundle optimization campaign, or expanded Jev role. The night palettes, physical A3 objects and optional echoes remain. An unrelated painting and photographic exhibits were not substituted for the real portrait. No replacement music was fabricated.

The screenshot tool's full-page export resets horizontal scrollers. Apparent F3 misframing caused by that export was not treated as a story defect. Pannable scenes were recaptured with viewport screenshots. Separately, the actual F4/F5 resume framing issue was reproduced from DOM geometry before any screenshot and fixed.

## Unresolved release issue

The creator's exact forty-five-day portrait was not located. Its stable URL and safe fallback remain. Inject that real asset and rebuild before sending the experience to the intended recipient. Listening/perceived synchronization, physical mobile keyboard, screen reader and OS reduced-motion checks are explicitly bounded by available test surfaces; see the readiness report.

## Substantially changed baseline files

- `src/App.tsx`
- `tests/engine.test.ts`
- `src/audio/director.ts`
- `src/content/dialogue.ts`
- `src/dev/qa.ts`
- `src/engine/engine.ts`
- `src/engine/jev.ts`
- `src/lib/timeline.ts`
- `src/scenes/Afterlight.tsx`
- `src/scenes/Cinematics.tsx`
- `src/scenes/Intro.tsx`
- `src/scenes/Rooms.tsx`
- `src/store/story.ts`
- `src/styles/story.css`
- `src/ui/Conversation.tsx`
- `src/ui/RegisterBook.tsx`
- `src/ui/Room.tsx`
- `src/ui/say.tsx`
- `src/ui/Stage.tsx`

New code: `src/lib/pause.ts`, `src/store/persistence.ts`, `src/ui/useModal.ts`, and the negative-media test server. Added production flags, six real MP3s, documentation and release reports. Engine definitions, decision tables, canonical facts and scene guards were not redesigned.
