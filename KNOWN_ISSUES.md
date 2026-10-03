# Known issues — final integration

## Required before recipient delivery

- **Real portrait missing.** Supply `public/images/portrait-45-days.png`, the creator's exact forty-five-day artwork, then rebuild and inspect A4. The fallback is safe but is not a substitute for that central artifact. Six real music tracks are integrated.

## Nonblocking behavior and verification limits

- An unfinished intro restarts its presentation after reload. An unfinished A2 conversation resumes from its beginning; once its ending beat is committed, that conversation does not replay. Canonical events are not duplicated. Local presentation progress within every line is not persisted.
- Audio denial, missing files, HTML fallback and decoding failure degrade to silence; stalled clocks continue. Audible/perceived synchronization was not personally listened to through the available tools. Runtime playback and eight-second seek were observed and all six MP3s fully decoded successfully.
- Chromium viewport testing is not a physical-device certification. Actual iOS/Android keyboard, screen reader, OS text scaling and live OS reduced-motion rendering were not available. Reduced-motion JavaScript detection, canonical reachability and authored CSS end states were checked; that is not an OS/browser end-to-end certification.
- The optional reflection UI was tested on a phone viewport for bounded input, Enter, empty submission, dismissal and navigation/reload. Its actual OS keyboard remains unverified. Reflection and external Jev remain OFF in production.
- Saves depend on localStorage availability. When persistence is denied/full, the current story continues, but its progress cannot survive a reload; warnings are intentional.
- The current Vite base is `/`; deployment under a subpath requires setting the base and rebuilding. Serve the full build over HTTP(S).

No remaining demonstrated canonical, encoding, production-debug, dialogue double-advance, menu-focus or critical viewport defect is known. No recipient message or deployment has been performed.
