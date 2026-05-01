---
name: game-art-polish
description: Produce polished game art, VFX, shaders, UI, and post-processing for Unity and Godot. Use this skill any time the user asks for help making their game look better, moving beyond "programmer art," designing particle systems / VFX / shaders, styling game UI (including Unity UI Toolkit / USS / UXML and Godot Theme), adding "juice" or "game feel," doing post-processing, working with pixel art or stylized 3D, picking a palette, or asking why their game looks flat/unpolished/sterile. Trigger this skill even if the user does not use the phrase "game art" — requests like "add particles for my hit effect," "make my UI feel premium," "stylize this shader," "my Unity scene looks dead," "why does my game look bad," or "give me a spell VFX in Godot" all fall under it.
---

# Game Art & Polish

The gap between "programmer art" and "polished art" is almost never drawing skill. It's a small number of learnable techniques applied consistently: palette discipline, contrast, shape language, lighting, post-processing, and juice. This skill captures those techniques and turns them into concrete, engine-specific output for Unity and Godot.

## Core philosophy — read this before anything else

**1. Consistency beats quality.** A game where every asset is drawn at the same skill level, same palette, same line weight, same resolution looks *intentional* — even when the skill level is low. A game where some assets are polished and others aren't looks broken. If the user can only do simple shapes, commit fully to simple shapes. Don't mix fidelity levels.

**2. Contrast is readability.** Players can't engage with what they can't see. Foreground must have a clearly different *value* (lightness) from background, not just different hue. A forest with green enemies on green trees fails regardless of how pretty the trees are. Squint at a screenshot — if you can't instantly identify the player, contrast is wrong.

**3. Shape language carries meaning.** Players read shapes before colors before details. Squares and rectangles read as stable/safe/platform. Triangles read as sharp/threat/spike. Circles read as friendly/player/collectible. Respect these reads. Breaking them costs the player attention they don't want to spend.

**4. Limit the palette hard.** 3–5 core colors for stylized pixel/2D work; a dominant + accent hue for 3D scenes, with everything else desaturated. Overly saturated everything reads as chaotic. Use [Lospec](https://lospec.com/palette-list) or [Coolors](https://coolors.co) to pick — don't pick colors one at a time.

**5. Juice is the cheapest leverage.** Screen shake on impact, hitstop on hit, squash/stretch on jump, particles on pickup, a little bloom on bright sources — each of these is <30 minutes of work and moves perception of quality more than any asset upgrade. When someone asks "why does my game look bad," the answer is usually "you haven't juiced it," not "your art is bad." See `references/juice-and-feel.md`.

**6. Post-processing carries ~40% of the "AAA look."** Bloom, color grading (LUT or tonemapping), vignette, chromatic aberration, screen-space ambient occlusion, and motion blur. None of this requires new art. See `references/post-processing.md`.

**7. Iterate fast, bail early.** A good tech-artist workflow is: find a reference → implement a first pass → tweak for 30–60 minutes → decide if it's working or bin it. Don't polish a dying effect. When a user says they spent "an hour fine-tuning" particles and are satisfied, that's correct; an hour is the right budget per effect.

**8. Reference before creation.** Before making anything, identify a specific visual you're trying to match (a screenshot from Hollow Knight, a Gabriel Aguiar spell effect, a MirzaBeig explosion). Aimless creation produces programmer art; targeted recreation produces polish.

## When the user's request is vague

Users often say "make my game look better" without specifying what. Don't guess — or do guess, but frame the guess concretely. The best single-answer default, in order of highest-impact-per-minute:

1. Add post-processing (bloom + color grading + vignette) — biggest transformation, zero new art.
2. Add juice to the 3 most common player actions (hit, jump, collect) — makes the game feel alive.
3. Introduce palette discipline — if the game's colors are all over the place, pin down a 5-color palette and re-tint.
4. Fix contrast between foreground and background.
5. Add particle feedback on every gameplay event (impact, spawn, death, pickup).

If you offer this prioritized list, the user can point at one. If they've said enough to localize the problem (e.g. "my UI looks sterile" or "this spell is weak"), skip the list and route straight to the relevant reference.

## Routing table — which reference to read

Read only what the task needs. Most tasks touch 1–2 references, not all of them.

| If the user is asking about... | Read |
|---|---|
| Color, contrast, composition, affordance, shape language, why their art looks off but they can't say why, general "how do I make this look good" | `references/foundations.md` |
| Screen shake, hitstop, squash & stretch, anticipation, follow-through, "my game feels dead," impact, feedback, weight | `references/juice-and-feel.md` |
| Sprites, pixel art, palettes at small sizes, dithering, anti-aliasing on sprites, 2D animation frames, tilesets, sprite sheets | `references/pixel-art.md` |
| Low-poly 3D, voxel, PSX style, flat shading, toon/cel shading, vertex colors, stylized meshes, character modeling approach | `references/stylized-3d.md` |
| Particles, VFX, explosions, spell effects, trails, smoke, fire, magic, Shuriken, VFX Graph, GPUParticles2D/3D | `references/particles-vfx.md` |
| Shaders, Shader Graph (Unity), GDShader (Godot), dissolve, outline, rim light, water, hologram, toon shader | `references/shaders.md` |
| Bloom, color grading, LUT, vignette, chromatic aberration, depth of field, URP Volume, HDRP Volume, WorldEnvironment | `references/post-processing.md` |
| UI that looks "sterile" or "generic," UI Toolkit, UXML, USS, Unity's new CSS-like UI system, Godot Control nodes and Theme, menu polish, HUD polish | `references/ui-toolkit.md` |
| "Who should I learn from," references, inspiration, creators, YouTube channels, tutorials | `references/creators-and-resources.md` |

## Output expectations

When generating concrete artifacts:

**Unity** — default to URP unless the user says otherwise (HDRP is heavier and rarely what indies want). For C# scripts target Unity 2022 LTS or 6.x syntax. For UI, default to UI Toolkit (UXML + USS) over legacy uGUI unless the user explicitly asks for uGUI. For shaders, default to Shader Graph for visual effects and HLSL only when Shader Graph can't express it.

**Godot** — default to Godot 4.x. Use `GPUParticles2D`/`GPUParticles3D` over `CPUParticles` unless targeting very old hardware. GDShader (`shader_type canvas_item` or `spatial`) is the default shader language. Use the `Theme` resource for UI, not per-node inline styling.

**Code style** — Write code that compiles and runs. Don't fabricate API names. If unsure whether a specific Shader Graph node or Godot shader built-in exists by that exact name, either name a general pattern the user can translate, or state the uncertainty. Prefer patterns that have been standard for 2+ years over bleeding-edge features that may have changed API.

**Explanations** — For each effect you produce, include:
- What the effect *is* visually (one sentence)
- The 2–4 parameters the user will most likely want to tweak
- A one-line sanity check ("if this looks washed out, turn down X")
- A reference to a real game that uses a similar effect, if one is obvious

## Anti-patterns — do not do these

- **Do not suggest "just hire an artist"** when the user is asking how to do it themselves. They know that's an option. They're here for the other path.
- **Do not recommend Mixer/Quixel Megascans** for stylized indie games. That pipeline is for photoreal AAA. It fights against stylized consistency.
- **Do not pile on plugins.** Most polish effects can be built with the engine's built-in tools. Recommending 4 asset-store packages to achieve one effect is a smell.
- **Do not give a single "correct" palette.** Palettes are style choices. Offer 2–3 directions with different moods and let the user pick.
- **Do not say "it depends on your art style"** and stop. That's a non-answer. Commit to a recommendation; let the user push back if their style doesn't fit.
- **Do not generate UI with inline styles** in UI Toolkit (`style.backgroundColor = ...` in UXML attributes). Put styles in USS files. This is what the user will expect and what scales.
- **Do not describe particle effects in prose alone.** Give concrete module-by-module settings when possible. Prose ("use some smoke particles") is what produced programmer art in the first place.

## The "programmer art → polished art" checklist

When someone says their art looks like programmer art, walk through this list and fix the first item that's wrong. Almost always one of the top three is the culprit.

1. **Palette is unrestricted.** Pick 5 colors, re-tint everything to use only those.
2. **No post-processing.** Add bloom + a warm or cool color grade + vignette.
3. **No juice on player actions.** Add screen shake, hitstop, and particles on hit/jump/pickup.
4. **Value contrast between FG and BG is weak.** Darken the background or desaturate it.
5. **Inconsistent line/outline treatment.** Pick one: all outlined, none outlined, or outlined only on interactable objects.
6. **Lighting is flat ambient only.** Add at least one directional light with a warm color + one fill light with a cool color (two-color lighting is the 80/20 rule for scene mood).
7. **UI uses default fonts and flat solid-color backgrounds.** Swap in a display font, add rounded corners, add a subtle gradient or translucent blur panel.
8. **Shapes lack language.** Enemies aren't clearly threat-shaped (sharp, angular). Collectibles aren't clearly reward-shaped (round, bright, maybe rotating).
9. **Everything is the same scale of detail.** Vary detail density — hero elements get more, background less.
10. **No motion on "static" elements.** Even a 2% idle sway on trees, grass, UI buttons, cloth makes a scene feel alive.

## Using this skill with an LLM-assisted workflow (Unity LSP / MCP)

The user may be pairing this skill with an LLM plugged into Unity via LSP or an MCP server. Two things to keep in mind:

1. **The newer the Unity feature, the worse the LLM will be at it.** UI Toolkit at runtime is genuinely undertrained in most model weights as of early 2026. When writing USS/UXML, be extra explicit and conservative — stick to documented selectors, avoid obscure properties, and when using a property, include the Unity docs reference name so the user can verify.
2. **Particles always need hand-tuning.** Generated particle prefabs will be 60–70% correct on the first pass. Budget 30–60 minutes of taste-driven tuning per effect and consider that normal, not a failure of the generation.
