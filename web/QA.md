# Release checks

Checked 2026-10-09 using Node 23 locally; GitHub Actions uses Node 22. Browser checks use Chromium through agent-browser against the production Vite preview, not only the dev server.

## Automated

- 19 Node gameplay tests: pool counts, canonical/alias answers, normalization, every classic voice-line identifier verified, unbiased no-repeat ordering, correct/empty/wrong guesses, double submissions, three skips, no-skip state, Next guards, full Original and All Pick completion, GG, restart, artwork selection, blocked/corrupt local storage.
- 127 hero records, 431 referenced media files, 441 SHA-256 checksum matches.
- Pillow decode/verification of all WebP files.
- ffmpeg decode of every downloaded/copied audio file, including converted Io/Marci responses.
- Production build succeeds.
- `npm audit`: zero known vulnerabilities in the installed dependency tree at audit time.
- axe-core 4.10.3 WCAG 2 A/AA + WCAG 2.1 AA checks: no violations on the mobile landing page and hero-detail dialog in the checked states. This is not a claim of complete accessibility certification.

## Browser workflows

- Desktop landing, roster selection, readable silhouette stage, reveal artwork, archived portrait reference, and results.
- Wrong answer shows a live status message without subtracting score/skips.
- Correct answer with punctuation accepted; score increments exactly ten.
- Reveal puts keyboard focus on Next; next hero puts focus on the answer field.
- Hero audio plays without an error; replay, mute, and persisted sound preference checked.
- Three consecutive skips reveal heroes and reduce the available skips to zero. Skip is then disabled while guessing remains possible.
- GG confirmation supports cancellation; confirming reaches results and saves the per-roster high score.
- Results focus the heading; choose another era returns to the landing page.
- Archive opens as a focus-trapped dialog, filters to Largo, shows its render/quote, and closes cleanly.
- Credits expose historical caveats and source links.
- Mobile 390×844 and desktop 1440×1000: no horizontal overflow in the checked landing/game/results states; no failed images or browser errors in the production smoke test.
- Original Android source files remain unchanged.

## 3D showcase follow-up

- Uses MIT-licensed React Three Fiber + Drei OrbitControls/Billboard, with no authored animation loop or custom shaders.
- Library camera position was sampled five seconds apart to verify horizontal auto-rotation; front/back positions were also checked explicitly to ensure neither billboard disappears on the opposite side.
- Pause switches to demand rendering. Two screenshots taken after damping settled were pixel-identical; camera position movement measured zero while paused.
- Mobile 390×844: labels visible above the artwork and no horizontal overflow.
- OS reduced-motion emulation removes the canvas entirely and renders two static images.
- Artificial WebGL context loss switches to static images; gameplay and hero reveals remain operational.
- Production landing page: axe-core WCAG 2 A/AA + 2.1 AA reported no violations in the checked state.
- Graphics library is lazy-loaded separately from the core game; render resolution is capped at 1.5× and rotation suspends offscreen, behind dialogs, and in hidden tabs.
- Rebuilt production output; 19 gameplay tests and all asset checksums still pass. Dependency audit remains clear.

Screenshots: [landing](docs/home.webp), [battlefield](docs/battlefield.webp), [mobile](docs/mobile.webp).
