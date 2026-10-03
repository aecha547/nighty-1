# THE GARDEN THE NIGHT KEPT — beta

Current integration authority: `garden_work`. This release preserves the five chapters, the mutual ending, and the existing art direction.

## Run and verify

Use Node 20.19+ or a compatible recent Node release.

```sh
npm ci
npm run verify
npm run dev
```

For the deployable single-file HTML and static assets:

```sh
npm run build
npm run preview
```

Deploy the entire generated `dist/` directory over HTTP(S), including its `audio/` and `images/` directories. The current base is `/`; configure Vite's base if hosting below a subdirectory. Opening HTML with `file://` is not the supported delivery path. Dependencies and generated builds are excluded from the source ZIP.

## Remaining recipient-release step

Add the creator's exact forty-five-day portrait at `public/images/portrait-45-days.png`, rebuild, and inspect its reveal in A4. No substitute portrait is supplied. Six real historical MP3s are already included in `public/audio/`.

## Normal beta posture

`.env.production` explicitly disables `VITE_JEV_REFLECTION` and `VITE_JEV_ALLOW`. Do not override those values for the recipient build. There is no provider secret or required backend.

QA controls exist only in Vite development with `?dev=1`; the production build ignores that parameter. The optional reflection can be inspected in a separate dev process with `VITE_JEV_REFLECTION=1`. Restart without that environment variable after testing. The external adapter is unnecessary and remains off.

## Controls and saves

Click or tap physical objects and available paths. On narrow screens, swipe or use look-left/right controls. Tab, Enter and Space activate controls. Escape opens/closes the menu; M toggles sound outside text fields. The menu pauses cinematic time and isolates keyboard focus. Save data is an event ledger in localStorage; invalid data is quarantined and the experience starts clean.

## Review

Read `SOL_6_1_BETA_READINESS.md`, `SOL_6_1_ADVERSARIAL_AUDIT.md`, `ENCODING_AUDIT.md` and `KNOWN_ISSUES.md`. `BROWSER_QA.md` describes repeatable browser checks. This is a source package; no publication, deployment or message to the recipient has occurred.
