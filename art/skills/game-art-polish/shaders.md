# Shaders: Unity Shader Graph & Godot GDShader

Shaders are where you escape the "engine default look." This reference covers the common shader recipes that transform a scene, for both Unity (Shader Graph + HLSL) and Godot 4 (GDShader).

Read when the user asks for: toon shader, cel shading, outline, rim light, fresnel, dissolve, hologram, water, ice, glass, distortion, screen-space effect, stylized material, or "why does my game look like default Unity."

## Mental model

A shader is a program that runs for every vertex (vertex shader) and every pixel (fragment shader) of a mesh. The vertex shader can move the mesh. The fragment shader decides the final color of the pixel. Everything else is just different ways to organize this.

**Unity Shader Graph** lets you author shaders visually. It compiles to HLSL under the hood. It's the right default for 90% of effect work; drop to HLSL only for things Shader Graph can't express (custom lighting models, geometry shaders, compute).

**Godot GDShader** is a text-based shader language based on GLSL ES. You write it directly. Godot's Visual Shader (node-based) exists but is less used than writing GDShader by hand.

## Per-engine starter templates

### Unity Shader Graph (URP)

1. Right-click in Project → Create → Shader Graph → URP → **Lit Shader Graph** (for 3D), **Sprite Lit/Unlit Shader Graph** (for 2D), or **Unlit Shader Graph** (for pure VFX).
2. Open it, the graph appears with a Master Stack (Vertex + Fragment blocks).
3. Author: plug values into Base Color, Metallic, Smoothness, Emission, Normal, Alpha.
4. Create a Material, assign the Shader Graph.

### Godot GDShader template

```glsl
// Sprite / 2D shader — canvas_item
shader_type canvas_item;

uniform vec4 tint : source_color = vec4(1.0);

void fragment() {
    vec4 c = texture(TEXTURE, UV);
    COLOR = c * tint;
}
```

```glsl
// 3D mesh shader — spatial
shader_type spatial;

uniform sampler2D albedo_tex : source_color;
uniform vec4 tint : source_color = vec4(1.0);

void fragment() {
    vec4 c = texture(albedo_tex, UV);
    ALBEDO = c.rgb * tint.rgb;
    ALPHA = c.a * tint.a;
}
```

## Recipes

### Toon / cel shading (3D)

Flattens lighting into 2–4 bands for an animated look. Works for Borderlands / Wind Waker / Genshin styles.

**Godot 4 (spatial):**
```glsl
shader_type spatial;
render_mode diffuse_toon, specular_toon;

uniform vec4 albedo : source_color = vec4(1.0);
uniform vec4 shadow_tint : source_color = vec4(0.6, 0.65, 0.9, 1.0);
uniform float shadow_threshold : hint_range(0.0, 1.0) = 0.5;

void fragment() {
    ALBEDO = albedo.rgb;
}

void light() {
    float NdotL = dot(NORMAL, LIGHT);
    float lit = step(shadow_threshold, NdotL);   // hard 2-band
    // For a 3-band: float lit = smoothstep(0.4,0.45,NdotL) + smoothstep(0.65,0.7,NdotL);
    vec3 toon_color = mix(ALBEDO * shadow_tint.rgb, ALBEDO, lit) * ATTENUATION * LIGHT_COLOR;
    DIFFUSE_LIGHT += toon_color;
}
```

**Unity Shader Graph approach:** a Custom Function node with HLSL that does the NdotL step, or use the built-in **Step** node after dotting the world normal with a light direction. For multi-light support, use URP's lighting functions via a Custom Function.

Tuning: 2 bands (binary) is the most graphic. 3 bands adds an ambient shadow zone. 4+ starts to look like smooth shading. Pick 2 or 3 for stylized games.

### Outline

For that "Zelda / Jet Set Radio" line around models. Two common approaches:

**1. Inverted-hull outline** (cheap, looks great on characters):
- Duplicate the material slot on the mesh; second material is a black unlit shader.
- In the vertex function, expand vertices along their normal by a small amount and cull front faces.

```glsl
// Godot spatial, second pass outline
shader_type spatial;
render_mode cull_front, unshaded, depth_draw_opaque;
uniform float thickness : hint_range(0.0, 0.1) = 0.02;
uniform vec4 outline_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);

void vertex() {
    VERTEX += NORMAL * thickness;
}
void fragment() {
    ALBEDO = outline_color.rgb;
}
```

For Unity, same trick: a second pass (or second material) with inverted face culling and vertex extrusion.

**Gotcha:** Inverted hull outlines break on hard edges where normals don't point outward. For those, you need a post-processing edge-detect outline instead.

**2. Post-processing edge detect** (more robust, more expensive):
Uses the depth buffer and normal buffer, finds pixels where depth or normal change sharply between neighbors, colors those edges.

In Unity URP, use Shader Graph with the Scene Depth + Scene Color nodes and a custom edge detect Custom Function.
In Godot, make a post-processing `Sprite2D` covering the viewport with a shader that samples depth/normals.

### Rim light / Fresnel

The bright edge around an object, seen strongly at grazing angles. Makes things "pop" against the background.

**Godot:**
```glsl
// add to fragment of a spatial shader
float rim = 1.0 - dot(NORMALIZE(NORMAL), NORMALIZE(VIEW));
rim = pow(rim, rim_power);       // tighten the falloff
EMISSION += rim_color.rgb * rim * rim_strength;
```

**Unity Shader Graph:** Use the **Fresnel Effect** node, multiply by color, plug into Emission.

Tuning: `rim_power` 2–5 gives a natural edge, 0.5–1 gives a big glow. Rim_strength 0.5–2.

### Dissolve (burn / disintegrate)

Object burns away from an edge pattern. Used for spawn/despawn, damage, progress states.

Two textures needed: the noise map and the albedo. The noise map is sampled; pixels where noise < threshold are clipped. Pixels near the threshold are colored with an "edge" color (the burning line).

**Godot spatial:**
```glsl
shader_type spatial;
uniform sampler2D albedo_tex : source_color;
uniform sampler2D dissolve_noise : repeat_enable;
uniform float dissolve : hint_range(0.0, 1.0) = 0.0;
uniform float edge_width : hint_range(0.0, 0.2) = 0.05;
uniform vec4 edge_color : source_color = vec4(1.0, 0.3, 0.0, 1.0);

void fragment() {
    vec4 c = texture(albedo_tex, UV);
    float n = texture(dissolve_noise, UV).r;
    if (n < dissolve) { discard; }
    float edge = smoothstep(dissolve, dissolve + edge_width, n);
    ALBEDO = c.rgb;
    EMISSION = edge_color.rgb * (1.0 - edge) * 3.0;  // bright edge
}
```

**Unity Shader Graph:** sample the noise texture, compare with a `dissolve` property using **Step**, feed into Alpha Clip Threshold. For the emissive edge, another Step with a threshold offset, subtract, multiply by edge color, plug into Emission.

Animating the `dissolve` property from 0 to 1 in script gives the burn-away effect.

### Hologram

Scrolling scanlines + transparency + fresnel. Great for UI holograms, teleport effects, ghost characters.

```glsl
shader_type spatial;
render_mode blend_add, unshaded, cull_disabled, depth_draw_never;
uniform vec4 tint : source_color = vec4(0.3, 0.8, 1.0, 1.0);
uniform float scanline_density : hint_range(10.0, 200.0) = 60.0;
uniform float scanline_speed = 1.0;
uniform float fresnel_power : hint_range(1.0, 8.0) = 3.0;

void fragment() {
    float scan = sin((UV.y + TIME * scanline_speed) * scanline_density) * 0.5 + 0.5;
    float rim = pow(1.0 - dot(NORMALIZE(NORMAL), NORMALIZE(VIEW)), fresnel_power);
    ALBEDO = tint.rgb;
    ALPHA = (scan * 0.5 + 0.3 + rim * 0.5) * tint.a;
}
```

### Stylized water (top-down or side-view)

Real-time water is a deep rabbit hole, but a passable stylized water needs only:

1. Two scrolling normal maps at different speeds → distortion
2. A foam line at shore intersections (depth-based)
3. A fresnel blend between deep color and shallow color
4. Optional: refraction using screen texture

```glsl
// Godot, water plane (canvas_item for top-down)
shader_type canvas_item;
uniform sampler2D noise_tex : repeat_enable, filter_linear;
uniform vec4 deep_color : source_color = vec4(0.0, 0.3, 0.6, 1.0);
uniform vec4 shallow_color : source_color = vec4(0.3, 0.7, 0.9, 1.0);
uniform float scroll_speed_1 = 0.02;
uniform float scroll_speed_2 = 0.05;
uniform float wave_strength = 0.02;

void fragment() {
    vec2 n1 = texture(noise_tex, UV + vec2(TIME * scroll_speed_1, 0.0)).rg - 0.5;
    vec2 n2 = texture(noise_tex, UV * 1.3 + vec2(0.0, TIME * scroll_speed_2)).rg - 0.5;
    vec2 wave = (n1 + n2) * wave_strength;
    float sparkle = smoothstep(0.95, 1.0, (n1.r + n2.r + 0.5));
    vec3 c = mix(deep_color.rgb, shallow_color.rgb, length(n1 + n2) + 0.3);
    c += vec3(1.0) * sparkle;
    COLOR = vec4(c, 1.0);
}
```

### Screen flash / damage vignette

A full-screen shader applied as a post-processing step for "took damage" or "enemy crit" feedback.

**Unity URP**: Volume Override → Custom Post-processing, or use a full-screen Shader Graph with URP's new Fullscreen Shader Graph target (Unity 2022.2+).
**Godot**: ColorRect child of a CanvasLayer, sized to viewport, with a canvas_item shader that draws a radial gradient from transparent center to red edge based on a `damage_amount` uniform.

```glsl
shader_type canvas_item;
uniform float damage : hint_range(0.0, 1.0) = 0.0;
uniform vec4 tint : source_color = vec4(1.0, 0.1, 0.1, 1.0);

void fragment() {
    float d = length(UV - vec2(0.5)) * 2.0;
    float v = smoothstep(0.4, 1.0, d) * damage;
    COLOR = vec4(tint.rgb, v * tint.a);
}
```

Tween `damage` from 0 → 1 → 0 over 400ms on hit.

### 2D sprite outline (pixel-perfect)

For giving a sprite a hard 1-pixel outline at runtime, so it can be toggled on interaction:

```glsl
shader_type canvas_item;
uniform vec4 outline_color : source_color = vec4(1.0);
uniform float outline_enabled : hint_range(0.0, 1.0) = 0.0;

void fragment() {
    vec4 c = texture(TEXTURE, UV);
    if (c.a < 0.01 && outline_enabled > 0.5) {
        vec2 tex_size = vec2(textureSize(TEXTURE, 0));
        vec2 px = 1.0 / tex_size;
        float neighbor = 0.0;
        neighbor += texture(TEXTURE, UV + vec2( px.x, 0)).a;
        neighbor += texture(TEXTURE, UV + vec2(-px.x, 0)).a;
        neighbor += texture(TEXTURE, UV + vec2(0,  px.y)).a;
        neighbor += texture(TEXTURE, UV + vec2(0, -px.y)).a;
        if (neighbor > 0.0) {
            COLOR = outline_color;
            return;
        }
    }
    COLOR = c;
}
```

Note: the sprite must have some transparent border pixels for the outline to draw into, or the outline gets clipped at sprite bounds. In Godot, set the `Sprite2D.texture_filter = NEAREST` for pixel art.

### Flash on hit

Already covered in `juice-and-feel.md`, but as a shader pattern:

```glsl
uniform float flash_amount : hint_range(0.0, 1.0) = 0.0;
// in fragment
vec4 c = texture(TEXTURE, UV);
c.rgb = mix(c.rgb, vec3(1.0), flash_amount);
COLOR = c;
```

Tween `flash_amount` from 1 → 0 over 80ms.

## Shader performance notes

- **Alpha blending is expensive.** Use alpha clipping (discard) when possible, especially for foliage and hair.
- **Texture samples are the main cost.** Every `texture()` call is work. Combining textures into a single packed texture (R/G/B/A channels holding different maps) halves sample count.
- **Avoid branching in fragment shaders.** `if` statements divergent across pixels cost. Use `step`, `smoothstep`, `mix` instead.
- **Mobile is different.** For mobile, stay under ~4 texture samples, avoid high math ops per fragment, avoid screen-space effects that read back the framebuffer.

## Unity Shader Graph specific notes

- Graph Settings → Material: choose Lit / Unlit / Sprite Lit / Sprite Unlit. Unlit is fastest and fine for VFX.
- Graph Settings → Surface: Opaque / Transparent / Alpha Clipping. Picking Transparent when Alpha Clip would work tanks performance.
- **Subgraphs** (Create → Shader Graph → Sub Graph) are how you encapsulate common functions. Use them.
- Custom Function node lets you drop HLSL when the graph can't express it. Point to an external `.hlsl` file for anything non-trivial.
- URP and HDRP Shader Graphs are not cross-compatible — a URP Shader Graph won't render in HDRP without rework.

## Godot GDShader specific notes

- Built-in variables: `UV`, `VERTEX`, `NORMAL`, `TIME`, `SCREEN_UV`, `COLOR`. Read the [shader reference](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/) for the full list per shader type.
- For screen-read effects (refraction, blur), use `SCREEN_TEXTURE` (Godot 3) / `hint_screen_texture` (Godot 4).
- `render_mode` flags at the top control blending, culling, depth: `blend_add`, `blend_mix`, `cull_disabled`, `unshaded`, `depth_draw_never`.
- For canvas_item shaders on pixel art, be aware of `filter_nearest` vs `filter_linear` — pixel art wants nearest.
- Shader parameters are set in script with `material.set_shader_parameter("name", value)`.

## When a shader looks "close but not right"

Most frequent cause: **you're in linear vs sRGB color space confusion.** A color that looks right as a `source_color` uniform will look washed out if you treat it as linear, and vice versa. In Unity, check Color space in Project Settings (Linear vs Gamma). In Godot, `source_color` hint on a vec4 uniform handles this automatically for colors — use it.

Second most frequent: **alpha premultiplication mismatch.** Your texture is pre-multiplied but you're blending as if it's not (or vice versa). Results in dark halos around sprites. Fix by picking one convention and sticking to it; most engines default to non-premultiplied.

Third: **normals are in object/view/world space and you're mixing them.** Fresnel needs world-space normals dotted with world-space view. Getting this wrong produces flat or inverted fresnel.
