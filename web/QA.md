# Release validation

## Automated checks

```sh
npm test
npm run assets:verify
npm run build:cloudflare
```

- 37 regression tests cover gameplay, roster counts, aliases, normalization, scoring, repeated submissions, skips, match completion, browser storage, mobile viewport state, carousel ordering, texture-slot recycling, and compact runtime-data equivalence.
- 127 hero records, 431 referenced media files, and 441 SHA-256 checksums are verified.
- Roster sizes: Original 32, Classic 116, All Pick 127, New Blood 11.
- Production builds support both Cloudflare's root path and GitHub Pages' existing subpath.

## Browser coverage

- Landing page, roster selection, silhouette artwork, correct and incorrect guesses, reveal, voice playback, Next, Skip, GG confirmation, results, and saved personal bests.
- Archive search and hero details, focus-trapped dialogs, mute preference, asset credits, and links to the arcade and maker contact.
- Desktop and mobile layouts, image loading, horizontal overflow, browser errors, and keyboard navigation.
- Wrong answers preserve score and skips. Correct answers award exactly ten points. Skips reveal without awarding points. GG preserves the earned score.
- High scores and preferences are browser-local and origin-specific. Storage failures must not prevent play.

## Rendering and performance

- Optional Three.js preview is lazy-loaded after the initial page render.
- Reduced-motion and data-saving preferences use a static preview with manual Next.
- The carousel holds each hero for 1.5 seconds and uses Drei CameraControls for eased transitions.
- Four quarter-turn slots preserve visible cards while recycling only the hidden rear buffer. Retired textures are disposed and removed from the loader cache.
- Demand rendering, capped pixel ratio, offscreen/tab suspension, and WebGL fallback reduce unnecessary work.
- Research-only metadata is excluded from browser bundles. Full provenance remains in the source ledger; regression tests confirm identical gameplay data.
- Archive images are lazy-loaded; audio is fetched on reveal/replay rather than preloaded for the whole roster.

## Accessibility and mobile limits

Automated axe-core WCAG 2 A/AA and WCAG 2.1 AA checks supplement keyboard and visual testing. A passing checked state is not complete accessibility certification.

Viewport unit tests cover compact keyboard layouts, Safari-style viewport pan offsets, focus changes before keyboard collapse, and viewport restoration. Browser-emulated keyboard conditions cannot prove physical iOS/Android behavior. Real-device testing remains recommended.

## Hosting checks

- HTTPS responses on the production game domain.
- Root-relative production assets and real 404 responses.
- Security headers, one-day media caching, and revalidated HTML.
- Source assets and the original Android application remain unchanged.

Screenshots: [landing](docs/home.webp), [battlefield](docs/battlefield.webp), [mobile](docs/mobile.webp), [compact mobile game](docs/mobile-game.webp), [keyboard-sized viewport](docs/mobile-keyboard.webp).
