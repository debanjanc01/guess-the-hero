# Asset ledger & historical fidelity

This is an **unofficial, non-commercial Dota 2 fan game**. Dota 2, hero artwork, voices, and trademarks belong to Valve Corporation. No affiliation or endorsement is implied. The media is not relicensed as open source. Check [Valve's legal information](https://store.steampowered.com/legal/) and applicable permissions before commercial use or redistribution; attribution alone does not establish a license. Assets can be removed on request.

## Frozen sources

Source audit: **2026-10-09 UTC**. The roster is a build-time snapshot, not an automatically updating claim about future releases.

| Source | Purpose |
| --- | --- |
| [Valve's official hero list](https://www.dota2.com/datafeed/herolist?language=english) | Current 127-hero roster and names; snapshot in `research/valve-roster.json` |
| [Valve hero website](https://www.dota2.com/heroes) and `cdn.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/{hero}.png` | Current transparent hero renders, downloaded locally |
| [Original Android repository](https://github.com/debanjanc01/guess-the-hero/tree/master/main/res) | 32 original silhouette/reveal pairs, three backgrounds, all seven committed audio files |
| [OpenDota revision `7a90e808a44c9928e05e760af496365065ef65e7`](https://github.com/odota/dotaconstants/tree/7a90e808a44c9928e05e760af496365065ef65e7) | December 2018 116-hero roster; snapshot in `research/heroes-2018.json` |
| [GameTracking-Dota2 revision `823a1df1cbf4bbee72e6d13a56bc464303417049`](https://github.com/SteamTracking/GameTracking-Dota2/tree/823a1df1cbf4bbee72e6d13a56bc464303417049) | December 2018 in-game portraits and hero response rules |
| [Dotabase revision `7ec2f5a91d21f52aae5a37bf12caa3c057fdbffa`](https://github.com/mdiller/dotabase/tree/7ec2f5a91d21f52aae5a37bf12caa3c057fdbffa) | Base-hero voice metadata, aliases, signature quotes, and extracted game audio references |
| `https://dotabase.dillerm.io/dota-vpk{response.mp3}` | MP3/WAV source files extracted from Dota; copied locally, never hotlinked at runtime |

**Per-hero URLs, response IDs, quotes, and historical flags are recorded in `src/data/heroes.json`. File sizes and SHA-256 hashes are recorded in `research/asset-checksums.json`.**

## What is actually period-correct?

- All **32 original silhouette/reveal pairs** are preserved in optimized copies. The original PNGs in `main/` remain untouched.
- **113 portraits** come from an immutable December 2018 game-tracking revision. They are low-resolution in-game portraits, not large transparent full-body renders. They are shown as historical reference cards, without pretending to be high-resolution art.
- **Dark Willow, Pangolier, and Grimstroke** are on the verified classic roster but do not have portraits at the checked archive path. No contemporary image is misrepresented as an archived portrait for these three.
- Every **116 classic hero's selected voice-line ID** appears in the archived 2018 response scripts. The MP3s were downloaded from a **current game extraction**. This establishes the line existed in 2018, **not** that the recording is byte-identical to an eight-year-old file. Re-recordings, changes in encoding, or mixing cannot be ruled out.
- For classic heroes beyond the original 32, the playable silhouette is derived from the alpha mask of a **current transparent render** using CSS brightness. This is explicitly labeled in the game and credits. Matching art and silhouette geometry is preferred over a black rectangular archived portrait.
- **All Pick and New Blood** use current Valve renders and base-hero voices (no personas or Arcana substitutions). New Blood covers Mars, Void Spirit, Snapfire, Hoodwink, Dawnbreaker, Marci, Primal Beast, Muerta, Ringmaster, Kez, and Largo.
- Io, Phoenix, Marci, and Primal Beast have actual game vocalizations/whistles/roars, not synthetic voice lines. Marci's `marci_deny` response is a whistle.

This does **not** claim a fully restored 2018 game client, a complete set of historical full-body models, or exact historical audio recordings.

## Optimization

- 127 transparent renders resized to at most 720×720 and encoded as WebP with alpha preserved.
- Original silhouette/reveal copies optimized without changing the source files.
- Archived portraits remain at their native low resolution; no AI upscaling or fabricated historical artwork.
- Original backgrounds downscaled for web where needed.
- One curated voice per hero. Short base-hero spawn/identity lines are preferred; known iconic lines such as Axe's “There is no team in Axe!” and Pudge's “Fresh meat!” are prioritized where historically verified.
- Source files for Io and Marci are WAV despite an `.mp3` source URL. They are converted to true 96 kbps MP3s and marked in the metadata.
- All 127 voices and all images have been decoded locally to check for corrupt files. The build verifies referenced files and checksum integrity.
- Total local media is about **12.2 MB** for the full roster; the landing page loads only its artwork, archive thumbnails are lazy-loaded, and voices are fetched only on reveal/replay. Fonts are self-hosted.

## UI dependencies

React, Vite, Tailwind CSS, Radix UI, Lucide, class-variance-authority, clsx, and tailwind-merge are free/open-source dependencies with their respective licenses. The rotating landing showcase uses [Three.js](https://github.com/mrdoob/three.js), [React Three Fiber](https://github.com/pmndrs/react-three-fiber), and [Drei](https://github.com/pmndrs/drei), all MIT-licensed. Drei's built-in OrbitControls and Billboard components supply the 3D interaction; the scene reuses existing hero cutouts and adds no externally sourced models, paid assets, or custom animation engine. Button/input/dialog primitives follow the source-owned shadcn/ui pattern and are custom-styled to the Dota-inspired visual direction. Cinzel and Inter fonts are distributed under the SIL Open Font License through Fontsource. No paid component kits or shader subscriptions are used.
