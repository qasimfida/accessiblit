# Phase 7 evidence

These are measured engineering receipts, not a screen-reader or whole-site conformance claim.

- `blocked-evidence.json` preserves the original stopped CSP audit.
- `discovery.json` records the complete local discovery run: 1,169 passed, 15 failed and 9 skipped on runtime f9c96b0. Those failures led to separately committed fixes; this is deliberately not labelled a final clean run. Its successful individual measurements retain that provenance.
- `local-verification.json` records the refreshed five-project headed keyboard walk, lifecycle/heap samples, content timings and packed integrations. Explicit CDP-only skips remain visible.
- `ci-verification.json` records checkpoint 4532e80: 2,367 browser passes, 7 failures and 18 explicit capability skips across Node 20/22. The seven failures are unchanged WebKit 100 ms next-frame gates; synchronous samples remain below 100 ms. Both verification jobs pass. This is a BLOCKED run, not a final pass.
- `screenshots.json` lists each PNG, its source revision, captured state and SHA-256. Host images show the adjusted page with the panel closed after Escape; keyboard images show the open panel with Reset all focused before reset. They are not all from the final revision.
- `*-keyboard.json` contains the corresponding actual keyboard path and semantic tree. Native events changed all eighteen features; reset restored defaults, Escape returned focus, and Tab left the non-modal panel. Every saved configuration was separately audited on a matching independent page to avoid the documented Firefox tooling crash.
- `pixel-rtl-fixed.json` and its PNG show the corrected 412px viewport placement: panel left 36/right 396.

The current CI matrix and final verdict belong in the phase report. Phone profiles are emulated, not physical devices. No screen reader was used. Pixel dimensions can differ with device scale; target and contrast measurements use CSS pixels/computed colours.
