# scripts/generate-icon.ts

Draws Cinder's app icon and writes `icon.iconset/` (every size `iconutil` needs, 16 to 1024 px), which `electrobun.config.ts` passes to the macOS build (`build.mac.icons`). Run it with `bun run icon` after changing the design, and commit the PNGs.

- The design is original and drawn from code: a warm graphite rounded square (the `--graphite-750` → `--graphite-900` tones, macOS grid: 824 px tile with radius 185 inside a 1024 canvas), an ember glow, a flame (an uneven capsule: a round base tapering to a point) filled with an ember gradient (`#ffd27a` → `--ember-400` → `--ember-600`) with a pale core, and two four-point sparks.
- Every size is rendered directly at its resolution with 4 × 4 supersampling per pixel (no downscaling), so small sizes stay crisp. Pixels outside the tile are transparent.
- PNGs are encoded by hand: RGBA, 8 bits, filter 0 on every row, zlib from `node:zlib` `deflateSync`, CRC from `Bun.hash.crc32`. No image library or third-party artwork is involved.
