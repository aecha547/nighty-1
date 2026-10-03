# Encoding audit — 2026-10-03

Classification: **EXPORT ONLY** (reported review/export-display problem; not corruption in the current source).

All current source/config/test text was decoded directly from bytes as strict UTF-8. No invalid UTF-8, replacement characters, or suspicious `ΓÇ`, `Γå`, `┬`, `Γë`, `Ã`, `Â`, or `â€` sequences were found in the implementation. The available MIMO and Sonnet Markdown exports also contain none of the six reported exact mojibake strings. The exact faulty export/display pipeline was not available to reproduce; its specific conversion cannot be attributed with certainty.

The actual source contains U+00B7 middle dots (UTF-8 C2 B7) and U+2014 em dashes (UTF-8 E2 80 94), not visually similar corrupted sequences. Chromium screenshots/accessibility text displayed `recording i · dusk`, the D2 dialogue punctuation, arrows, and `drawn by hand · 45 days` correctly. No source-wide encoding replacement was performed.

New/edited source and reports were saved as UTF-8. A targeted grammar correction in H2 was editorial, not an encoding repair. Historical raw exports are excluded from the release.
