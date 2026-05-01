# Pixel Art

Pixel art is a constraint-driven style. The constraints (low resolution, limited palette, grid-aligned pixels) are what produce the aesthetic — remove them and you get blurry low-res art, which is not the same thing.

Read when the user asks about: sprites, pixel art, 2D character art, tilesets, palette for pixel art, dithering, anti-aliasing on small sprites, sprite animation, or working in Aseprite.

## The canonical setup

Tool: **Aseprite** is the default. It's purpose-built, has a modest one-time license fee, and all pixel artists use it. Alternatives: Pyxel Edit, GraphicsGale, LibreSprite (free Aseprite fork), or Photoshop with all filters/AA turned off (not recommended — Aseprite is better).

Engine import settings:
- **Unity**: Texture Type: Sprite (2D and UI). Filter Mode: **Point (no filter)**. Compression: **None** (or low quality). Generate Mip Maps: off. Pixels Per Unit: match your tile size (16 for 16×16 tiles).
- **Godot**: Import tab → Texture → 2D. Filter: **Nearest**. Mipmaps: off. In Project Settings, enable "Use Pixel Snap" and "Stretch Mode: Viewport" with an integer base resolution.

If your pixel art looks blurry or jittery in-engine, 95% of the time it's a filter/mipmap/camera-fractional-position issue, not the art itself.

## Picking a resolution

Common character sprite sizes and what they communicate:

| Size | Feel | Examples | Per-frame effort |
|---|---|---|---|
| 8×8 | Extreme retro, Atari-era | Downwell | Minutes |
| 16×16 | NES / Game Boy | Stardew Valley (tiles), Shovel Knight (NPCs) | 10–20 min |
| 32×32 | SNES / most indie | Celeste, Hyper Light Drifter | 30–60 min |
| 48×64 | Premium indie | Dead Cells (characters), Hollow Knight (side sprites) | 1–2 hrs |
| 64×64+ | Large sprites, more detail | Owlboy, Blasphemous | 2–4 hrs |

**Pick once and commit**. Mixing sprite resolutions (a 16×16 player with 32×32 enemies) looks wrong unless deliberately stylized. If you must mix, keep it at exactly 2× ratios (16 and 32) and center everything on those pixel boundaries.

## Palette discipline

See `foundations.md` for general palette rules. For pixel art specifically:

- Start from a pre-built palette. Hand-picking colors is an expert skill you don't need to develop yet. Use:
  - **Pico-8** (16 colors) — aggressive constraint, great for game jams
  - **Sweetie 16** — softer, friendlier 16
  - **Endesga 32** — workhorse palette, warm and readable
  - **Resurrect 32** / **Resurrect 64** — balanced, lots of value range
  - **AAP-64** — broadest general-purpose
- Work in **Indexed Color mode** in Aseprite (Sprite → Color Mode → Indexed). This literally prevents you from picking off-palette colors. It will save you from yourself.
- When you need a "new" color, try:
  1. Hue-shifting an existing color (rotate hue 15–30°, same value)
  2. Using an existing darker shade as "shadow" or lighter as "highlight"
  3. Dithering two existing colors to blend them perceptually

## The core techniques

### Clustering

Isolated single pixels are almost always noise. Group pixels into clusters of 2–3 or more. A "single-pixel detail" surrounded by different colors reads as a speck of dust rather than an intentional detail.

Exception: the eye of a small character. A single pixel eye is iconic. But as a rule, clusters beat singles.

### Selective anti-aliasing (AA)

Pixel art purists avoid AA entirely. Modern pixel art uses AA selectively — applied to smooth curves that look distractingly jagged, but never automatically by the software.

How to apply AA manually:
1. Identify a jagged curve (commonly at 30° or 60° angles).
2. At the "stair step" corner pixels, place a pixel of intermediate value between the line color and the background.
3. Keep hue of the AA pixel analogous to the darker color, not a true average — true averages look muddy.
4. If in doubt, leave it jagged. Jaggies are part of the style. Over-AAed pixel art starts to look like low-res antialiased art, which is worse than both pure pixel art and real high-res art.

### Dithering

Dithering is patterned mixing of two colors to suggest a third. Old hardware needed it. Modern pixel art uses it as a style choice.

Patterns, from subtle to textural:
- **50% checkerboard** — alternates every pixel, cleanest mid-tone blend
- **25%/75%** — sparse single pixels of one color in the other (gradient transition)
- **Bayer dithering** — larger pattern, feels retro
- **Noise dithering** — random pattern, organic

When to use:
- Smooth gradients without adding palette colors (sky, water, light)
- Texturing large flat surfaces (stone walls, metal)
- Transitions between palette bands (shadow → midtone)

When not to use:
- Small sprites (below 32×32). Dither at small scales looks like dirt.
- Already-detailed areas. Dither adds noise; noisy on noisy is mud.

### Shading and outlining styles

**Hard outline with flat fill** — Stardew Valley style. Every asset has a 1-pixel dark outline. Inside is flat color, maybe 2 shades for basic lighting. Very forgiving. Good default.

**Selective outline** — only on characters/interactables, not on environment. Creates strong visual hierarchy. Hollow Knight, Hyper Light Drifter.

**No outline** — Celeste, Owlboy. Relies on strong value contrast between colors. Harder to pull off at small sizes because lack of outline means silhouettes need to be very readable.

**Pillow shading** (lighting everything from the center out, regardless of light direction) is the single biggest beginner mistake. Pick a light direction (usually top-left or top), shade consistently.

## Animation

### Frame counts that feel right

- **Idle**: 4 frames, ~6 FPS. Subtle chest breath, hair drift. Loops.
- **Walk**: 4–8 frames, ~12 FPS. The classic 4-frame walk (contact, down, pass, up) still works.
- **Run**: 6–8 frames, ~15 FPS. Faster, more extreme poses.
- **Jump**: 1 frame anticipation (crouch), 1 frame takeoff, 1–2 midair, 1 frame land, 1 frame recovery. Not a loop — a sequence triggered by events.
- **Attack**: 1 anticipation, 1 impact, 2 follow-through. Hold the impact frame slightly longer than others for punch.

### Timing tricks

- **Hold key poses longer** than transition frames. A walk with 2 frames held 3× as long as 2 others looks more expressive than 4 evenly-timed frames.
- **Inbetween counts lie.** A "12-frame walk cycle" that's really 4 key poses and 8 interpolations often looks worse than a pure 4-frame walk. Fewer, stronger frames beat more, weaker ones.
- **Squash and stretch**. Even in pixel art. A jump should squash the character shorter and wider on takeoff/land, stretch taller and thinner in midair.

### The 4-frame walk (template)

Frame 1 (Contact — left foot forward, right foot back)
Frame 2 (Passing — both feet near center, body at high point)
Frame 3 (Contact — right foot forward, left foot back)
Frame 4 (Passing — body at high point again)

If the character has a head/body distinction, the head bobs up on passing frames and down on contacts.

### Secondary motion

Hair, cape, tail, belt — these shouldn't move with the body; they drag. One-frame delay of these elements relative to the body makes animation feel alive rather than rigid.

## Tilesets

### The 47-tile autotile set

For tile-based worlds (top-down or platformer), you don't need hand-made corner tiles for every possible neighbor combination. The standard **47-tile autotile** handles all edge cases:

- 1 interior tile (all 4 neighbors same)
- 4 outer corners
- 4 edges (top, bottom, left, right)
- 4 inner corners
- 14 convex corners + concave corners
- ... plus edge transitions

Unity's Rule Tile and Godot's TileMap with terrains both support this automatically given the 47 base sprites. Most tutorials show a simplified 16-tile set (wang tiles) which works for simple grids.

### Tiling seamlessly

Tiles need to wrap seamlessly. Rules:
- Design the tile interior *first*, ignoring edges.
- Duplicate the tile and place copies edge-to-edge. Anywhere the seam is visible, edit pixels to continue patterns across the boundary.
- Avoid highly distinctive features (bright highlights, unique shapes) near edges. They'll create visible repetition when tiled.
- Use a large reference tiling canvas (8×8 or 16×16 tiles) while working, so you can eyeball tiling at scale.

## Common bugs and fixes

- **Sprite looks blurry in-engine** → Filter Mode is set to Bilinear/Trilinear. Set to Point/Nearest.
- **Pixels "shimmer" while the camera moves** → Camera position is not snapped to integer pixels. Round camera.position to the nearest pixel each frame.
- **Pixels look different sizes across the scene** → Mixed pixel densities (your environment is 32PPU but character is 16PPU rendered at 2× scale). Pick one density.
- **Sprites look stretched on wide screens** → Camera is stretching the view. Use FitHeight/FitWidth consistently, use viewport-based scaling.
- **Character looks "off-grid" during movement** → If pixel-perfect feel is desired, snap the sprite's final render position to integer pixels. Let physics run at float precision but round for rendering.
- **Sprite sheet sprites have bleeding edges** (colored pixels bleeding in from neighbors) → Use padding/extrude in Aseprite export, or in engine set wrap mode to Clamp and add 1-pixel transparent border around each frame.

## A/B test for pixel art quality

Export your sprite at 1× (native) and 4× (nearest-neighbor upscale). View both.

- At 1×: does it read as the object it's supposed to be?
- At 4×: do the clusters feel intentional? Are there stray single pixels that look like noise? Do outlines flow cleanly, or do they look accidental?

If 1× reads correctly and 4× looks clean, the sprite is ready.

## Learning sources

- **Brandon James Greer** (YouTube) — deep pixel art breakdowns, very good at explaining *why* choices matter
- **Adam CYounis** — longer-form pixel art streams, lots of process
- **MortMort** — fast tutorials, practical tricks
- **Pixel Parmesan blog** — written deep dives into AA and dithering specifically
- **Lospec** — palettes, community tutorials, pixel-art Discord
