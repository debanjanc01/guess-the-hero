# Guess the Hero — web

An unofficial Dota 2 silhouette game rebuilt from the original Android app. React + Vite, Tailwind v4, accessible Radix/shadcn-style source-owned UI primitives, Lucide icons. No backend, accounts, analytics, or paid services.

## Play

https://guessthehero.megachunkgames.win/

Part of [MegaChunk Games](https://megachunkgames.win/). The existing GitHub Pages URL remains available during migration.

![Dota-inspired landing page](docs/home.webp)

- **Original:** all 32 original silhouettes and reveal images.
- **Classic:** the 116-hero December 2018 roster. Original artwork where available; current transparent silhouettes elsewhere, explicitly labeled. Archived 2018 portraits appear after revealing and in the archive.
- **All Pick:** all 127 heroes in the verified Valve roster snapshot, including Kez, Ringmaster, and Largo.
- **New Blood:** 11 heroes introduced after the classic roster snapshot.

On phones/touch screens, the game uses a compact viewport-aware layout. It does not auto-open the keyboard. The silhouette, 16px answer input (avoiding Safari focus zoom), and Guess button remain together above the keyboard, using the browser's VisualViewport API to handle keyboard resize and pan. Desktop keyboard autofocus remains available.

Correct answer: +10 points. Three skips per match. Wrong guesses have no penalty. Names, common aliases, spacing, case, and punctuation are normalized. A skipped hero is revealed before moving on. When skips run out, the skip control is disabled rather than unexpectedly ending the game. GG saves your score and ends the match. High scores are local to the browser, independently per roster.

Audio plays only on reveal or an explicit replay. The mute preference is saved. Io, Phoenix, Marci, and Primal Beast use their actual vocalizations/whistles/roars rather than invented speech. No timers; restrained reveal motion respects reduced-motion preferences. The landing showcase uses a lazy-loaded Three.js carousel via **React Three Fiber + Drei**, not a custom animation engine. Drei's built-in **CameraControls** handles fast clockwise transitions; Billboard keeps the existing hero cutouts facing the camera. The showcase cycles through all **127 heroes**, holding each picture still for **1.5 seconds**, then making a quick, eased swap in roughly **0.6 seconds**. Demand-rendered animations are synchronized with a preparatory frame, following R3F's official guidance, so the first frame does not jump after the idle period. This is not continuous rotation. Near heroes brighten and far heroes become silhouettes through Three.js lighting. Pause/resume and a Next button are available. Offscreen/tab suspension, reduced-motion static art, and a WebGL-unavailable fallback keep it usable. Four hero cards are loaded at a time: one foreground, two side shadows, and a hidden rear buffer. Only the hidden rear slot is replaced after each turn; a camera-angle fade keeps it invisible during recycling. Retired textures are disposed rather than retaining the full roster on the GPU.

## Development

Node 22+:

```sh
cd web
npm ci
npm run dev
```

Open http://127.0.0.1:5173/guess-the-hero/.

```sh
npm test
npm run assets:verify
npm run build
npm run preview
```

## Structure

- `src/game.js`: small immutable state transitions, object-based answer dictionaries, Fisher–Yates ordering.
- `src/useGameViewport.js` / `src/mobile-game.css`: keyboard-aware mobile battlefield layout.
- `src/data/heroes.json`: keyed hero records, asset provenance, signature quotes, and historical verification metadata.
- `src/App.jsx`: landing, game, results, rules, and searchable hero archive.
- `src/components/ui.jsx`: customizable button/input/dialog primitives; Radix handles focus trapping, Escape, and screen-reader semantics.
- `src/components/HeroOrbit.jsx` / `OrbitScene.jsx`: accessible showcase wrapper and lazily loaded Drei/Three.js scene. Labels remain in a separate HTML overlay so artwork never hides them.
- `public/assets/`: frozen, optimized local media. No runtime third-party asset dependencies.
- `research/`: source snapshots and checksum ledger.
- `tests/`: gameplay regression tests.

3D library documentation: [React Three Fiber](https://r3f.docs.pmnd.rs/), [Drei controls](https://drei.docs.pmnd.rs/controls/introduction), [Drei Billboard](https://drei.docs.pmnd.rs/abstractions/billboard). All three libraries (including Three.js) are MIT-licensed.

The only gameplay ordering array is the shuffled hero-ID sequence. Names, image references, voices, accepted aliases, results, and high scores use keyed objects. No parallel arrays, repeated `contains` scans, random retry loops, or chained array transformations in the main logic. UI lists still use normal React rendering methods.

## Assets

See [ASSETS.md](ASSETS.md) for provenance, caveats, and usage rights. The original Android files in `../main/` are untouched.

All media is already checked in; builds **do not** scrape or depend on upstream availability. To re-source the pinned set, optionally use Python + Pillow + ffmpeg:

```sh
python3 -m pip install Pillow
python3 scripts/source-assets.py
npm run assets:verify
```

The script caches downloads in ignored `.asset-cache/`, validates existing images, atomically writes optimized WebP images, and converts two WAV sources to real MP3s. Metadata comes from a pinned Dotabase revision. Official roster updates are deliberate: refresh the source snapshots, review new media, then regenerate and test. "Current" denotes a verified snapshot, not a live service that silently changes.

## Hosting

GitHub Pages is free for this public repository and needs no separate provider account. `.github/workflows/pages.yml` tests, verifies checksums, builds, and deploys on `master` pushes. GitHub repository Settings → Pages must use **GitHub Actions** as the source. Vite's base is `/guess-the-hero/`, so assets work on the repository subpath and the app does not need SPA rewrite rules.

### Cloudflare production

The game is live on `guessthehero.megachunkgames.win` using Workers Static Assets. `wrangler.jsonc` configures the `guessthehero` Worker and its custom domain. No backend or paid resources are required.

```sh
npm run build:cloudflare # VITE_BASE_PATH=/; GitHub Pages keeps the existing default base
npm run deploy          # tests, asset verification, root-path build, Wrangler deployment
```

`.github/workflows/cloudflare.yml` checks builds on pushes/PRs and deploys production once a scoped `CLOUDFLARE_API_TOKEN` repository secret is configured. Until that secret is added, it emits a setup warning and leaves the live deployment unchanged. Wrangler's local OAuth login is not copied into CI. Use a scoped token for Workers Scripts Edit / Account Settings Read and Zone Read / Workers Routes Edit limited to `megachunkgames.win`.

Static responses include security headers, one-day media caching, revalidated HTML, and a real 404 page. The browser UI links back to the arcade and to Debanjan's Twitter/X contact, not to GitHub.

### Loading optimizations

Vite's `compact-hero-runtime-data` plugin removes research-only provenance fields from the browser payload while preserving the complete checked-in hero ledger. Regression tests compare every roster, accepted alias, artwork reference, quote, voice, and historical flag against the full source. The main JS bundle went from about 467 KB to 369 KB before compression (about 21% smaller; gzip approximately 118 KB to 112 KB).

The optional 3D scene waits until after the initial page paint and an idle slot. Data-saving connections and reduced-motion preferences use the static showcase instead, without fetching Three.js. The WebGL renderer no longer retains its drawing buffer unnecessarily. Existing four-texture recycling, demand rendering, offscreen suspension, lazy archive images, next-hero image prefetch, and reveal-only audio loading remain intact. The frozen WebP/MP3 media was already optimized, so it was not destructively recompressed. All 441 asset checksums still match.

## Limitations

This is a casual client-side quiz, not an anti-cheat leaderboard. Asset filenames and hero records can be inspected in browser tools. Saved records do not sync between devices. Valve media rights are separate from open-source UI dependencies; attribution is not a replacement for permission.
