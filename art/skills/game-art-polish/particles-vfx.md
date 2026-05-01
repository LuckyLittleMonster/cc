# Particles and VFX

VFX is where tech-artistry lives. This reference covers Unity's Shuriken (built-in particle system) and VFX Graph, plus Godot's GPUParticles2D/3D. For each, concrete recipes for the effects that come up constantly in gameplay.

Read when the user asks about: particles, explosions, spells, magic, trails, smoke, fire, dust, impact effects, projectiles, auras, weather, or any VFX-shaped request.

## Picking the right system

### Unity: Shuriken vs VFX Graph

**Use Shuriken (built-in Particle System) when:**
- Particle counts are in the hundreds or low thousands
- You want script-level access to individual particles (steering behaviors, tracking, physics interactions)
- You're on mobile or targeting lower-end hardware
- You need a particle system that *just works* without pipeline setup
- You're new to Unity VFX — Shuriken's module-based workflow is more approachable

**Use VFX Graph when:**
- Particle counts are in the tens of thousands to millions
- You want node-based visual authoring similar to Shader Graph
- You're on URP or HDRP (VFX Graph is not supported on legacy built-in RP)
- You're doing GPU-driven effects, fluid sims, or large-scale environmental VFX

MirzaBeig's take, condensed: most indie VFX should be Shuriken. VFX Graph is great for spectacle but you'll hit Shuriken's ceiling much later than most people assume, and you give up per-particle scripting when you switch.

### Godot: GPUParticles vs CPUParticles

- **GPUParticles2D / GPUParticles3D** is the default. Fast, scales well.
- **CPUParticles2D / CPUParticles3D** only when GPU isn't available (web builds on old hardware, or when you need per-particle behavior GPU can't do).

## Particle system fundamentals

Regardless of engine, every particle system is a sum of these layered decisions:

| Module | Shuriken name | VFX Graph block | Godot property |
|---|---|---|---|
| How many per second | Emission: Rate over Time | Set Spawn Rate | `amount` + `lifetime` |
| Where they spawn | Shape module | Set Position (shape) | `emission_shape` |
| Where they go | Velocity over Lifetime | Add Velocity | `direction` + `velocity` curves |
| How big they are | Start Size + Size over Lifetime | Set Size + Set Size over Life | `scale` + `scale_curve` |
| What color | Start Color + Color over Lifetime | Set Color + Set Color over Life | `color` + `color_ramp` |
| How they rotate | Rotation over Lifetime | Set Angle + Angular Velocity | `angle` + `angular_velocity` |
| How they fade | Color over Lifetime (alpha) | Set Alpha over Life | `color_ramp` alpha channel |
| Physics | Gravity modifier, External forces | Force blocks | `gravity`, `damping` |

**The universal truth:** good-looking particles need all of these modules dialed in. A system with only "emission + texture" will look flat. A system with all seven tuned will look alive.

## The four life-curves that separate pro from programmer

Every professional particle effect animates *at least four* properties over the particle's lifetime:

1. **Size over lifetime** — typically starts small, grows quickly, shrinks to zero at end. S-curve, not linear.
2. **Alpha over lifetime** — fade in over the first 10% of life, fade out over the last 30%. Never pop on or off hard.
3. **Color over lifetime** — shift from bright/saturated at birth to dark/desaturated at death. Fire goes yellow → orange → red → black.
4. **Velocity over lifetime** — particles should *decelerate* visually, even if physically they'd keep moving. Use drag or an explicit velocity curve.

Any particle system where these four aren't deliberately shaped will look amateur. Fix those four curves first, other modules second.

## Recipes

All of these assume a single particle system (one "emitter"). For spectacular effects, layer 3–6 of these together.

### Hit impact burst

When a bullet hits an enemy or a sword connects.

**Shuriken settings:**
- Duration: 1s, Looping: off
- Start Lifetime: 0.2–0.4s (randomize between two values)
- Start Speed: 3–6 (random)
- Start Size: 0.1–0.3 (random)
- Start Rotation: random 0–360
- Start Color: bright white with a tint of the damage color
- Emission: Burst, count=8–15, cycles=1
- Shape: Sphere, radius=0.1
- Velocity over Lifetime: Linear, damping=3 (slows them down)
- Size over Lifetime: curve from 1 → 0 (ease-out, they shrink)
- Color over Lifetime: alpha fades from 1 → 0 in last 40%
- Renderer: Billboard, additive blending

**Godot equivalent:** GPUParticles2D with a ParticleProcessMaterial, Direction=(0,0), Spread=180, InitialVelocityMin/Max=3/6, LifetimeRandomness=0.5, ScaleCurve= ease-out-to-zero, AlphaCurve= hold-then-fade, one-shot=true, amount=12.

**Tuning:** If it looks weak, increase burst count to 20+ and add a second system that emits 2–3 larger, slower particles (sparks). If it looks noisy, drop count and increase per-particle size.

### Muzzle flash (gun/spell)

- Duration: 0.15s, Looping: off
- Burst: 1 particle (or 2–3 for a "crunchier" flash)
- Start Lifetime: 0.08s (very short)
- Start Size: 0.4–0.8, animated on a sprite sheet (4 frames minimum)
- Texture Sheet Animation: 4×4 or 2×2 flipbook, play once over lifetime
- Renderer: Stretched billboard along forward axis, additive

A muzzle flash that lasts longer than 100ms looks wrong. Keep it brief.

### Fire / torch

- Duration: continuous (Looping: on)
- Start Lifetime: 0.8–1.5s
- Start Speed: 1–2, direction upward
- Start Size: 0.3–0.6
- Emission rate: 20–40/sec
- Shape: Cone, small radius, angle ~15°
- Color over Lifetime: white → yellow → orange → red → dark-red → transparent
- Size over Lifetime: grows slightly then shrinks to 0 (inverted-U)
- Noise module: strength 0.3, frequency 0.5 (gives the wobbly flame motion)
- Velocity over Lifetime: upward push that decreases with life
- Renderer: additive, soft particle texture

Layer a second system for smoke: same emitter position, larger particles, grey, slower, higher lifetime, offset color toward brown.

### Smoke trail

- Looping: on
- Start Lifetime: 2–4s (long)
- Start Speed: 0.5–1 (slow)
- Start Size: 0.3 grow to 1.5
- Emission: 10/sec
- Start Color: light grey, 40% alpha
- Color over Lifetime: fade alpha to 0 over last 60%
- Size over Lifetime: linear grow from 0.3 → 1.5
- Rotation over Lifetime: slight random rotation drift
- Noise: strength 0.2 for organic drift
- Renderer: alpha-blended, soft cloud texture

### Pickup / collect sparkle

- Burst: 1 shot, 6–8 particles on pickup
- Start Lifetime: 0.5s
- Start Speed: 1, direction up (cone shape narrow upward)
- Start Size: 0.1
- Color: bright (match pickup color), additive
- Size over Lifetime: 1 → 0, ease-out
- Gravity modifier: -0.5 (they rise faster than physics)
- Second layer: a single scale-pop ring that expands from 0 to 0.8 and fades in 0.3s (requires a separate "ring" particle or a mesh with shader)

### Dust on land

- Burst on landing: 10–15 particles
- Start Lifetime: 0.4s
- Start Speed: 2 (random horizontal direction)
- Start Size: 0.2
- Color: background-matched brown/grey with 70% alpha
- Shape: horizontal circle, radius 0.3
- Size over Lifetime: grow 1 → 1.5 (puff outward)
- Alpha over Lifetime: fade to 0 in last 60%
- Gravity modifier: 0.2 (slight fall)
- Renderer: alpha-blended, soft dust texture

### Lightning / electric beam

Lightning is not really a particle system — it's a dynamic mesh or a line renderer with noise offsets. But you layer particles on top:

1. Core: LineRenderer (Unity) or Line2D / ImmediateMesh (Godot), points regenerated each frame with perlin noise offsets perpendicular to the line. Additive bright cyan/white shader.
2. Glow: second line renderer, wider, lower-alpha, outer color.
3. Particles along the path: small white additive particles spawning along the line, very short lifetime, slight outward drift.
4. Impact sparks: burst of additive sparks at both endpoints.

See MirzaBeig's Lightning VFX asset — the public breakdowns show exactly this layering.

### Explosion (the big one)

Never a single particle system. Always 5+ layered:

1. **Flash** — single white billboard, scales from 0 to large and fades in 100ms. Additive, no texture needed.
2. **Fireball** — 10–20 particles, sprite-sheet animated fire, radial burst, 400–600ms lifetime, additive.
3. **Smoke** — 8–12 grey particles, slower, 2s lifetime, alpha blended, expanding.
4. **Shockwave** — single ring mesh with an additive shader, scales from 0 to 3× and fades, 300ms.
5. **Sparks** — 20–40 tiny bright particles, physics-driven with gravity and bounce, 0.8–1.5s lifetime, stretched billboards.
6. **Debris** (optional) — a few mesh particles (small rocks) with real physics.

Sync all of these to a single trigger event. This is what makes an explosion "feel AAA" — the layering, not any one asset.

## Texture and shader essentials for particles

### Texture shapes that show up repeatedly

- **Soft circle** (radial gradient from white center to transparent edge). The universal workhorse. Used for dust, smoke, light glows, magic.
- **Star / cross flare** (4-pointed or 6-pointed flare). For sparkles, bullet hits, lens flares.
- **Streak** (horizontal gradient, fades at both ends). For trails, motion streaks, laser cores.
- **Circle with noise** (soft circle masked by a low-frequency noise). For organic blobby particles like smoke plumes.
- **Flipbook fire/smoke** (4×4 grid of frames). Pre-rendered looping fire or smoke animation.

Free resources: [Kenney's particle pack](https://kenney.nl/assets), [OpenGameArt](https://opengameart.org), the free Kripto289 effects on the Unity Asset Store, or generate them in Photoshop/GIMP with radial gradients.

### Soft particles

When a particle intersects geometry, its hard edge looks bad. "Soft particles" fade out near depth-buffer intersections. URP's Particles/Simple Lit and VFX Graph's outputs support this. In Godot, use a custom shader:

```glsl
// Godot spatial shader, soft-particle fade
shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;
uniform sampler2D tex : source_color;
uniform sampler2D DEPTH_TEXTURE : hint_depth_texture;
uniform float fade_distance = 0.5;

void fragment() {
    float depth = texture(DEPTH_TEXTURE, SCREEN_UV).r;
    vec4 ndc = vec4(SCREEN_UV * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = INV_PROJECTION_MATRIX * ndc;
    float linear_depth = -view.z / view.w;
    float particle_depth = -VERTEX.z;
    float fade = clamp((linear_depth - particle_depth) / fade_distance, 0.0, 1.0);
    vec4 c = texture(tex, UV);
    ALBEDO = c.rgb;
    ALPHA = c.a * fade;
}
```

## Working with Unity VFX Graph

### The mental model

VFX Graph is a graph of *contexts*: Spawn → Initialize → Update → Output. Particles flow through these contexts each frame.

- **Spawn**: decides how many particles to create this frame. Outputs events.
- **Initialize**: sets starting attributes (position, velocity, color, size, lifetime) on newly spawned particles.
- **Update**: runs every frame, modifies attributes (apply forces, age, fade).
- **Output**: renders the particles.

Inside each context you add *blocks* — "Set Position (Sphere)", "Add Velocity from Direction", etc.

### Common gotchas

- VFX Graph blocks ≠ Shuriken modules 1:1. Don't translate literally — you'll write verbose graphs. Find the VFX Graph idiom for each effect.
- Custom shaders on VFX Graph outputs require a Shader Graph with "Support VFX Graph" checked in graph settings.
- VFX Graph on URP sometimes has lighting quirks — if lit output looks wrong, try unlit and tint manually.

## Working with Godot GPUParticles

### The mental model

`GPUParticles2D/3D` is a node that emits particles. You attach a `ParticleProcessMaterial` (the per-particle physics/transform logic) and a `Mesh2D/QuadMesh` with a `CanvasItemMaterial`/`StandardMaterial3D`/custom shader (the per-particle rendering).

### Common gotchas

- `amount` × `lifetime` = maximum concurrent particles. Set both together.
- `one_shot=true` with `explosiveness=1.0` is the equivalent of Shuriken's "Burst."
- For scripted behavior per particle (e.g. homing), you need a custom process shader — Godot's process material has limited behavior compared to Shuriken scripting.
- `preprocess` lets a continuous emitter start already running; essential for ambient fire/smoke on level load.

### Example: fire in Godot

```gdscript
var fire := GPUParticles2D.new()
fire.amount = 30
fire.lifetime = 1.2
fire.one_shot = false
fire.preprocess = 1.0  # starts already burning
var mat := ParticleProcessMaterial.new()
mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_POINT
mat.direction = Vector3(0, -1, 0)
mat.initial_velocity_min = 40
mat.initial_velocity_max = 80
mat.spread = 15.0
mat.gravity = Vector3(0, -30, 0)  # negative = up
mat.scale_min = 0.4
mat.scale_max = 0.8
mat.scale_curve = _make_inverted_u_curve()
mat.color_ramp = _make_fire_gradient()  # white → yellow → red → transparent
fire.process_material = mat
```

## The tuning loop

Particles are never right on the first pass. Expect:

1. **First pass (15 min)**: block out the effect with defaults. Check that it triggers at the right time, in the right place, and lasts the right duration.
2. **Shape pass (15 min)**: tune emission shape, count, speed, lifetime. Get the *silhouette* of the effect right.
3. **Color pass (15 min)**: tune color over lifetime, alpha, blending mode. Get the *palette* right.
4. **Detail pass (15 min)**: add secondary particles (sparks on an explosion), tune size curve, add noise for organic motion.
5. **Integration pass (15 min)**: play it in the actual gameplay context. If it reads well in gameplay, done. If not, go back to shape or color.

MirzaBeig's point: budget about an hour per effect and don't feel bad about it. That's the professional pace.
