# Post-processing

Post-processing is the highest-visual-impact-per-hour work in game art. No new assets, just screen-space effects layered on the final frame. A default Unity scene with bloom + color grading + vignette added looks dramatically more professional than the same scene untouched.

Read when the user asks about: bloom, color grading, LUT, vignette, chromatic aberration, depth of field, motion blur, film grain, tonemapping, Volume profile, URP Volume, HDRP Volume, WorldEnvironment, or any "make my scene look cinematic" request.

## The starter stack

If you add nothing else, add these three effects in order. This alone transforms a scene:

1. **Bloom** — bright areas bleed light into surrounding pixels. Makes emissive materials and lights feel luminous.
2. **Color grading / tonemapping** — shifts the whole palette toward a mood. Usually warm highlights + cool shadows, with some contrast.
3. **Vignette** — darkens the frame corners subtly. Focuses attention to center and reduces the "flat computer screen" read.

Everything else is optional polish on top.

## Unity URP

URP uses the **Volume** system. Core workflow:

1. Create an empty GameObject → Add Component → Volume → Global (or Box Collider for local).
2. Create a **Volume Profile** asset (the component offers a "New" button).
3. Add **Overrides** to the profile — each override is a post-processing effect.

Ensure the URP Camera has "Post Processing" checked in its inspector, and the URP asset has post-processing enabled.

### Bloom (URP)

Volume → Add Override → Post-processing → Bloom.

| Property | Starting value | What it does |
|---|---|---|
| Threshold | 1.0 | Pixel brightness above which bloom starts. Lower = more glows. |
| Intensity | 0.8 | Strength of the glow. Higher = brighter halos. |
| Scatter | 0.7 | How far the glow spreads. Higher = softer falloff. |
| Tint | white | Color-tint the bloom (e.g. slight warm). |
| Clamp | 65472 | Caps brightness; leave default unless HDR values are causing artifacts. |

For a stylized look, raise Intensity to 1.5+ and lower Threshold to 0.7. For realistic subtle bloom, Intensity 0.3, Threshold 1.2.

**Making materials bloom**: the material's emission must have a color with value ≥ threshold. Use `Color.HDR` in the material inspector and crank the intensity slider on an HDR color picker. A normal color won't bloom regardless of how bright it looks.

### Color grading via Tonemapping + Color Adjustments (URP)

- **Tonemapping** (Override → Tonemapping): switch Mode from None to **ACES** or **Neutral**. ACES is the film industry default — more contrasty, warmer highlights. Use ACES unless you have a reason not to.
- **Color Adjustments**: Post Exposure (+0 to +1 for brighter, -0.5 for moodier), Contrast (+10 to +30 makes things pop), Color Filter (tint everything, subtly), Saturation (+20 for punchy, -30 for washed-out cinematic).
- **White Balance**: Temperature and Tint sliders. Drop Temperature to -30 for cool blue night, raise to +30 for warm sunset.

### LUT color grading

For full creative color control, use a LUT (Look-Up Texture). Workflow:

1. Take a screenshot of your game.
2. Open in Photoshop/Affinity. Make non-destructive color adjustments until it looks right.
3. Apply the same adjustments to a neutral LUT texture (a 1024×32 or 512×512 strip with unchanged colors).
4. Save the adjusted LUT as a PNG, import to Unity with color space set to sRGB.
5. Volume → Color Lookup override → assign LUT → contribution 1.0.

This lets your colorist work in Photoshop and the game just applies the result. Unity ships a neutral LUT in the URP package; search for "Neutral LUT".

### Vignette (URP)

Volume → Vignette. Intensity 0.3, Smoothness 0.3 is a good starting point. Color usually black; occasionally a dark tint that matches mood.

### Chromatic aberration

Volume → Chromatic Aberration. Use **sparingly** — 0.1–0.2 adds a subtle "lens feel." Anything above 0.4 looks cheap and causes eyestrain. Great for damage moments (tween intensity up briefly).

### Depth of field

Gaussian mode for mobile-friendly, Bokeh for higher-end. Start Distance = foreground focal distance, Focal Length controls the blur spread. For menus/cutscenes only — gameplay DoF often fights with player attention.

### Motion blur

Subtle motion blur (Intensity 0.3) adds cinematic smoothness. Disable for competitive games or games where players need fast reaction.

### Film grain

Adds a subtle noise layer. Intensity 0.2, Response 0.8. Great for horror/noir games, wrong for bright cartoony games. Adds a surprising amount of organic quality to low-fidelity art.

## Unity HDRP

HDRP uses the same Volume system but more effects are available and better quality. The same overrides above exist (Bloom, Tonemapping, Vignette, etc.). HDRP adds:

- **Physical Camera** properties (ISO, shutter speed, f-stop) that drive exposure naturally.
- **Exposure** override with auto-exposure (adaptive to scene brightness).
- Screen-space reflections and global illumination.

Default to URP unless the user is on HDRP already — HDRP is significantly heavier.

## Godot 4

Godot's post-processing is split between:

- **WorldEnvironment node** (scene-wide environment: sky, ambient, fog, glow, adjustment)
- **CameraAttributes** (exposure, DoF per camera)
- **Custom shaders on a full-screen quad** (for effects not built in)

### Setup

1. Add a `WorldEnvironment` node to the scene.
2. Assign a new `Environment` resource to it.
3. Expand the Environment's properties panel — each section is a post effect.

### Bloom in Godot (Glow)

In Environment → **Glow** section:
- Enabled: true
- Intensity: 0.8 (start here)
- Strength: 1.0
- HDR Threshold: 1.0 (lower for more glow)
- HDR Scale: 2.0 (how much above threshold brightens)
- Levels 1–7: each level is a blur pass at different radius. Defaults are OK.
- Blend Mode: Screen or Softlight. Screen is classic bloom; Softlight is more subtle.

For emissive materials to glow, the material's Emission needs to exceed the HDR Threshold. Set Emission Energy Multiplier to 2+ in the StandardMaterial3D.

### Tonemapping / Color in Godot

Environment → **Tonemap**:
- Mode: **Filmic** or **ACES**. ACES gives a warmer, more film-like result.
- Exposure: 1.0 (raise for brighter scene, lower for moodier)
- White: 1.0

Environment → **Adjustments**:
- Brightness, Contrast, Saturation sliders.
- Color Correction: assign a LUT texture (Godot supports 1D and 3D LUTs).

### Vignette in Godot

Godot doesn't have a built-in vignette — use a custom canvas_item shader on a `ColorRect` child of `CanvasLayer`:

```glsl
shader_type canvas_item;
uniform float intensity : hint_range(0.0, 1.0) = 0.4;
uniform float smoothness : hint_range(0.0, 1.0) = 0.5;
uniform vec4 vignette_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);

void fragment() {
    float d = length(UV - vec2(0.5)) * 1.4;
    float v = smoothstep(1.0 - smoothness, 1.0, d) * intensity;
    COLOR = vec4(vignette_color.rgb, v);
}
```

Set the ColorRect's CanvasLayer to a high layer index (100+) so it draws above everything.

### Screen-space ambient occlusion (SSAO)

In Environment → **SSAO**: Enabled = true. Radius 1.0, Intensity 2.0 is a solid starting point. SSAO adds contact shadows in corners/crevices that make geometry feel grounded. Huge "perceived quality" boost for interiors.

### Fog

Environment → **Fog**: set enabled, density 0.01, height_curve. Fog hides distance detail and makes scenes feel atmospheric. For stylized games, use colored fog that matches the palette (sunset orange, forest green).

### Depth of field

CameraAttributesPhysical or CameraAttributesPractical → DoF Blur (Far, Near). Focus Distance is the focal plane.

## Recipes — full post-processing looks

### "Cinematic stylized indie" (Hollow Knight / Hades vibe)

- Bloom: Intensity 1.2, Threshold 0.8
- Tonemapping: ACES
- Color Adjustments: Contrast +15, Saturation +10, Color Filter slightly warm (RGB ~1.0, 0.98, 0.92)
- Vignette: Intensity 0.3
- Film Grain: Intensity 0.1

### "Moody noir" (Limbo / Inside vibe)

- Bloom: Intensity 0.6, Threshold 1.2
- Tonemapping: Neutral
- Color Adjustments: Saturation -60 (nearly grayscale), Contrast +30
- Vignette: Intensity 0.5
- Film Grain: Intensity 0.4

### "Warm sunset" (firewatch / open world)

- Bloom: Intensity 1.0
- White Balance: Temperature +25
- Color Adjustments: Color Filter RGB (1.0, 0.85, 0.7)
- Vignette: Intensity 0.25

### "Cyberpunk / neon" (high contrast bright signs)

- Bloom: Intensity 2.0, Threshold 0.6, Scatter 0.8
- Chromatic Aberration: 0.2
- Color Adjustments: Saturation +40, Contrast +20
- LUT with strong magenta/cyan shift
- Film Grain: 0.1

### "Clean cartoon" (Splatoon vibe)

- Bloom: Intensity 0.8, Threshold 1.0
- Tonemapping: Neutral (not ACES — ACES will warm-tint clean cartoons weirdly)
- Color Adjustments: Saturation +25
- No vignette, no grain, no chromatic aberration

## Common mistakes

- **Too much bloom.** If everything glows, nothing glows. Bloom should be selective — reserved for lights, emissive materials, bright effects. If the UI or normal walls are blooming, threshold is too low.
- **Saturation cranked to the max.** Everything 100% saturated looks like clown vomit. Most cinematic looks *reduce* saturation, not increase it.
- **Chromatic aberration as default.** Don't. It's a flavor spice, not a base ingredient. Reserve for damage moments, intense scenes.
- **No tonemapper.** Unity without a tonemapper produces "that Unity look" — flat, slightly blown-out. ACES or Neutral should be on by default.
- **Post-processing on low-end targets.** Each effect has a cost. Profile mobile before shipping every effect. Bloom and SSAO are especially expensive.
- **Using post-processing to hide bad art.** It's a multiplier, not a fix. Bad art + post-processing = polished bad art. Post-processing complements good fundamentals; it doesn't replace them.

## Workflow tip

Create **three Volume Profiles / WorldEnvironments**: "None" (diagnostic, nothing applied), "Game" (what you ship with), "Cinematic" (extra juice for cutscenes). Switch between them to A/B test whether your post-processing is actually helping or masking something.

Most of the "wow, looks great" reactions on social media reel videos are screen-recording with cinematic post. In gameplay, you usually want it toned down 30–50% because players need to see clearly.
