# Foundations: color, contrast, composition, shape language

This is the load-bearing reference. Almost every "my art looks bad" diagnosis traces back to something in this file. Read it when the user is asking general visual questions or when you've identified a specific weakness in color, contrast, composition, or shape.

## Palette discipline

### The 5-color rule for stylized 2D

Pick **3 to 5 colors total** for stylized 2D work and use only those everywhere — characters, tiles, UI, particles. This sounds restrictive and it is. Restriction is what makes it look cohesive.

Workflow:
1. Go to [Lospec Palette List](https://lospec.com/palette-list) and pick a palette that fits the mood (pico-8, endesga-32, resurrect-32, sweetie-16 are all battle-tested starting points).
2. Import it into Aseprite (File → Save Palette) or GIMP (Windows → Dockable Dialogs → Palettes).
3. Lock yourself to those colors — "indexed color" mode in Aseprite will literally prevent you from picking anything else.
4. When you *think* you need a sixth color, try hue-shifting or darkening an existing one first. 90% of the time that solves it.

### Restricted palettes for 3D

For 3D you can't limit yourself to 5 literal colors, but you can limit the *palette space*:

- Pick a dominant hue (e.g. warm orange) and an accent hue (e.g. cool teal). The complementary pair is the most common because it works.
- Keep saturation controlled — one or two "hero" materials can be vivid, everything else sits at 40–60% saturation.
- Use the same color ramp (the progression from dark-to-light within a hue) across every material. This is what gives a scene stylistic unity.

### Hue shifting

When shading, don't just darken the same hue — rotate the hue as you darken, and rotate it the other way as you lighten. A red object's shadow should drift toward purple or blue, and its highlight toward yellow or orange. Flat value-only shading is the single biggest "programmer art" tell.

Concrete in Aseprite: use the HSV color wheel, move down in value and left/right in hue by 10–30°.

In a shader: in the fragment function, shift the hue of the color as a function of lighting:
```glsl
// GDShader / Godot fragment function
void fragment() {
    float lit = dot(NORMAL, LIGHT_DIR) * 0.5 + 0.5;
    vec3 base = COLOR.rgb;
    vec3 shadow_tint = base * vec3(0.7, 0.75, 1.1); // push shadows cool
    vec3 light_tint  = base * vec3(1.1, 1.05, 0.9); // push highlights warm
    ALBEDO = mix(shadow_tint, light_tint, lit);
}
```

## Contrast

### Value contrast is king

Colors can be wildly different in hue and still have the same value (lightness). Your eye reads *value* first. Test: take a screenshot, desaturate it in any image editor. If the foreground (player, enemies, interactables) doesn't pop out in grayscale, you have a contrast problem that no amount of color work will fix.

Fix options, in order of impact:
1. Darken the background significantly (often to 20–30% of FG value).
2. Desaturate the background, keep FG saturated.
3. Put a subtle vignette or darker wash over non-interactable areas.
4. Add a rim light / outline on interactables.

### Silhouette test

A character should be identifiable as a pure black silhouette against a white background. If two characters become indistinguishable at silhouette, one of them needs a distinguishing silhouette element (hat, weapon, cape, different proportions). This is the test every animation studio uses and it transfers directly to game art.

## Composition

### Negative space

Crowded scenes read as noise. Leave emptiness around important elements. Alto's Adventure does this extremely well — the sky is often 60%+ of the screen and the snowboarder has room to breathe. Your player character should almost never have background detail directly behind its head/face.

### Rule of thirds for static compositions

Place the focal element on one of the third-lines, not dead center, for menus, cutscenes, and key art. Dead-center is acceptable for gameplay where the camera follows the player, but for anything you *compose* deliberately, third-lines feel better to the eye.

### Leading the player

In a platformer or puzzle, arrange background lines, light gradients, and element placement so they form vectors pointing toward the goal. Little Nightmares uses luggage shapes, hanging ropes, and light shafts to silently tell the player where to go. Your player doesn't consciously notice but they end up moving in the right direction.

## Shape language

### Primary reads

| Shape | Reads as | Example use |
|---|---|---|
| Circle / round | Friendly, safe, player, pickup, bouncy, soft | Player character, coins, heart pickups |
| Square / rectangle | Stable, reliable, platform, structure | Floor tiles, crates, buildings |
| Triangle / sharp angle | Dangerous, threat, fast, attacking | Spikes, enemies, weapons, damage UI |
| Irregular / organic | Alive, natural, chaotic, uncertain | Vegetation, creatures, fluid |

Violating these is *allowed* but costs player attention. A round-shaped enemy is confusing unless you cue its threat some other way (red color, aggressive animation, sound). A triangle-shaped collectible feels wrong unless you're explicitly designing for unease.

### Silhouette hierarchy

The most important thing on screen should have the most distinctive silhouette. Player > enemies > pickups > platforms > background. Give the player an asymmetry (a hat tilted, a trailing cape, weapon on one shoulder) that reads instantly at low resolution.

## Consistency

This is the one that trips up most programmer-artists. You'll make a great first asset, then draw the second in a slightly different style, and now nothing fits.

Before starting assets, write down a one-page style guide answering:

- **Line weight.** Are assets outlined or not? If yes, at what thickness (1px, 2px, 3px)? With what color (pure black, dark version of base color, purple-black)?
- **Pixel density.** What's the canonical pixel size? If the player is 16×24, then "one pixel" is that visual unit and everything scales to it.
- **Color count per asset.** Is each sprite restricted to 4 colors? 8?
- **Lighting direction.** Is light coming from top-left at 45°? Then every sprite needs to respect that. Mixed lighting directions look chaotic.
- **Animation framerate.** 8 FPS, 12 FPS, 24 FPS? Mix and it looks janky.
- **Resolution of detail.** If your main character shows eyes and mouth, other characters should too. If the hero is a block with no features, don't suddenly give the villain an anatomically detailed face.

Keep this doc open while working. When you're tempted to deviate, it should be a conscious exception, not a drift.

## The "squint test"

At any point while working, squint at the screen until your vision is blurry. What do you still see? Those are your compositional elements. If you squint and everything becomes uniform mush, you have no compositional hierarchy. If you squint and see a clear figure against ground, you're on track.

This is free and it's the single fastest feedback loop in visual design.

## Common diagnoses

When the user describes a problem, these are the most likely causes:

- **"It looks flat"** — No hue shift in shading. Or flat ambient lighting with no directional. Or no post-processing (bloom/color-grade).
- **"It looks muddy"** — Too many similar-value colors. Usually fixed by pushing FG much lighter and BG much darker.
- **"It looks busy/noisy"** — Too much detail at uniform density. Reduce detail on non-focal elements.
- **"It looks generic"** — No shape-language commitment, no palette restriction. Everything is technically correct but nothing's distinctive.
- **"It looks amateur"** — Usually default fonts + default blue-grey UI + default skybox. Swap any one of these for something custom and the read jumps.
- **"Characters blend into the background"** — Pure value contrast problem. Silhouette test will confirm.
- **"My sprites look jaggy"** — Either real jaggies (fix with selective AA, see pixel-art reference) or filter/mipmap issue (set texture to Point filter, no mipmaps in engine import).
