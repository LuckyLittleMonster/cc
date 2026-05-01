# Stylized 3D

Realistic 3D is a lifetime craft. Stylized 3D is tractable for solo devs because the "style" forgives a lot of technical limitations. This reference covers the styles that programmer-artists can ship.

Read when the user asks about: low poly, voxel, PSX style, flat shading, stylized 3D, toon 3D, modeling without experience, Blender workflow, vertex colors, or "how do I make 3D art without being a 3D artist."

## The four approachable styles

These four styles work because they lean into constraints that map well to programmer-artist skills.

### 1. Low poly / faceted flat shading

The Monument Valley / Superhot / Untitled Goose Game look. Models are intentionally under-subdivided — you can see the triangles. Shading is flat (no smooth shading across faces). Lighting is simple (often just directional + ambient). Usually no textures — colors come from vertex colors or per-face materials.

**Why it works for non-artists:** You don't need to sculpt, topology doesn't matter, UVs don't matter, you can model by pushing primitives around.

**Tooling:** Blender is the standard. Workflow:
1. Start from primitives (cube, cylinder, icosphere).
2. Enter Edit mode, manipulate vertices/edges/faces directly.
3. Apply "Shade Flat" to every object (right-click → Shade Flat) — this is the defining step.
4. Color by assigning a material per face, OR use vertex colors (one color per vertex, interpolated across faces).

**Vertex colors** are the killer trick. Instead of UV-mapping a texture, paint a color directly into each vertex. A single shader (`ALBEDO = COLOR`) renders it. No UVs to manage, no textures to pack, infinite unique colors per model.

```glsl
// Godot spatial shader for vertex-color lit models
shader_type spatial;
void fragment() {
    ALBEDO = COLOR.rgb;
}
```

Unity: in Shader Graph, use the **Vertex Color** node plugged into Base Color.

**Typical mesh density:**
- A human character: 200–800 tris
- A tree: 30–100 tris
- A boulder: 20–60 tris
- A chair: 50–150 tris

If your "low poly" asset has 3000 tris it's not low poly. Commit to the constraint.

### 2. PSX / PS1 style

The Crow Country, Bloodborne PSX, Chasing Static look. Deliberately limited: low-res textures (32×32 to 128×128), no texture filtering, vertex-snapping jitter (positions quantize to integer pixel grid), affine texture mapping (textures warp at angles), low-res output resolution (320×240 internal, upscaled).

**Why it works:** The constraints hide all fidelity concerns. "Why does this character's face look wrong?" — it's PSX, it's meant to look wrong. The nostalgia/horror genre fit is strong.

**Key techniques (shader-side):**

*Vertex snapping* (jitter):
```glsl
// Godot vertex function — snap vertices to low-res grid in clip space
void vertex() {
    vec4 clip = PROJECTION_MATRIX * MODELVIEW_MATRIX * vec4(VERTEX, 1.0);
    vec2 grid = vec2(320.0, 240.0);  // virtual resolution
    clip.xy = floor(clip.xy / clip.w * grid) / grid * clip.w;
    POSITION = clip;
}
```

*Affine texture mapping* (textures warp at angles — correct perspective divide disabled):
```glsl
// In vertex: varying vec2 uv_affine
// In fragment: sample texture with uv_affine * VERTEX.w then divide
// Trick: use noperspective interpolation on UV varying
// GDShader: requires a bit of manual UV rescaling
```

In practice: just use a PS1 shader asset (Unity Asset Store or godot-shaders community repo). This is one case where ready-made is fine because the "style" is exactly these specific quirks applied consistently.

*Textures*: 64×64 or 128×128 max, no filtering (Nearest), no mipmaps. Paint in GIMP/Aseprite with maybe 16 colors.

### 3. Voxel

MagicaVoxel is the tool. Models are assembled from cubes on a grid, like 3D pixel art. The tool is free, the workflow is immediate, and the output looks stylistically unified by construction.

**Workflow:**
1. Open MagicaVoxel, create a new model, start placing voxels.
2. Each voxel is a color-indexed cube on the grid.
3. MagicaVoxel has built-in lighting and SSAO for previewing — use these as a reference while modeling.
4. Export to `.obj` (mesh) or `.vox` (read by engines via plugins).
5. Unity: use [QuboidVox](https://assetstore.unity.com) or just import the OBJ. Godot: use the [VoxTools](https://github.com/VoxtoolsOrg/VoxTools) addon or import OBJ.

Voxel pros: instant "style," no topology knowledge needed, fast iteration.
Voxel cons: characters animate awkwardly (voxel rigs are limited); not everyone's taste.

Good voxel games to study: Cube World, Teardown, 3D Dot Game Heroes.

### 4. Toon / cel-shaded 3D

A step up in fidelity from the above three. Normal subdivided 3D meshes, UVs, textures — but lit with a cel shader (see `shaders.md` → Toon/cel shading section) that flattens lighting into discrete bands.

**Why it works:** The cel shading hides a lot of lighting/material crimes. Asset authoring time goes up (you're now doing real modeling and UVs) but polish floor is lower.

This is the most "expert" of the four styles. Skip it if you don't have Blender experience. Cel shading works on top of real 3D fundamentals — it's not a shortcut around them.

## Blender workflow for programmer-artists

Minimum skill set for a programmer to produce usable low-poly assets:

1. **Box modeling basics** — extrude (E), inset (I), loop cut (Ctrl+R), bevel (Ctrl+B), merge vertices (M).
2. **Shade Flat vs Shade Smooth** — right-click menu. Low poly = flat.
3. **Vertex color painting** — Paint mode, pick a color, click faces (with "Face" selection mode enabled).
4. **Export to FBX** — select object(s), File → Export → FBX. Uncheck "Leaf Bones" and "Tangent Space" for game engines.

That's enough to build the whole Monument Valley school of assets.

**Don't learn yet:** rigging, weight painting, sculpting, UV unwrapping, retopology. These are real skills with months of learning. Low-poly faceted art doesn't need them.

### Materials in Blender vs. in-engine

Blender materials don't transfer well to Unity/Godot. Instead:
- Use vertex colors (transfer perfectly)
- Use a solid-color material per "color zone" on the mesh
- Or bake the Blender material to a texture and import that

For game engines, vertex colors are the cleanest — one shader, one mesh, infinite color variation.

## Lighting and post-processing for stylized 3D

Stylized 3D lives and dies on lighting. A well-lit low-poly scene looks professional; a poorly-lit one looks like placeholder art.

**The two-light setup:**
- **Key light** (directional): warm color (2700–4000K, RGB ~1.0, 0.85, 0.6), shining down from a high angle. This is the "sun."
- **Fill light** (directional or ambient): cool color (6500K+, RGB ~0.7, 0.8, 1.0), opposite direction, lower intensity. This is "sky."

This alone, with flat ambient set low, produces dramatic stylized lighting. Every AAA cinematic uses this two-color warm/cool setup.

**For Unity URP:**
- Add a Directional Light, color warm, intensity 1.2.
- In Lighting settings, set Environment Lighting → Color → cool blue-grey.

**For Godot:**
- DirectionalLight3D, color warm, energy 1.0.
- WorldEnvironment → Ambient Light → Color cool, Energy 0.3.
- Turn on SSAO in Environment (see post-processing.md).

### SSAO is non-negotiable for stylized 3D

Screen-space ambient occlusion adds shadowing in corners and crevices. Low-poly scenes look dramatically better with SSAO than without — it's the single biggest "where did this polish come from" boost.

URP: Renderer → Renderer Features → Add → Screen Space Ambient Occlusion.
Godot: Environment → SSAO → Enable. Radius 0.5, Intensity 1.5.

### Fog

Stylized 3D scenes benefit enormously from colored atmospheric fog. Distance hazing hides low-poly boundaries in the distance and adds mood.

- **Warm amber fog** → sunset, cozy, desert
- **Cool grey-blue** → dawn, cold, mountain
- **Green** → forest, swamp
- **Pink/magenta** → dreamy, otherworldly

Fog distance: start at ~15 units, end at ~80 units for a typical scene. Tune by walking around.

## Asset sources for non-modelers

If modeling is truly not your skill, these sources let you ship stylized 3D without modeling:

- **Kenney.nl** — free low-poly asset packs, consistent style, CC0 license. The single best free resource.
- **Quaternius** — free low-poly packs, especially good for nature and creatures.
- **Synty Studios** — paid but very affordable low-poly packs, entire genres covered (medieval, sci-fi, city).
- **Poly Haven** — CC0 textures, HDRIs, and models (more realistic, mixes less well with stylized).

**Mixing asset sources is fine if they share style.** All Kenney assets mix with all Kenney assets. Kenney + Synty is harder — their poly counts and shading conventions differ. Pick one asset universe and stick with it.

**Re-texturing matters.** Even when using store-bought assets, re-tint them with your palette. A world full of identical default Kenney-green trees reads as "asset flip." Ten trees each hue-shifted slightly reads as intentional.

## Common pitfalls

- **Too much detail too soon.** A first-time 3D artist tries to sculpt a realistic face. That's 200 hours of skill away. Low-poly is the answer.
- **Smooth shading on low-poly.** Low poly + smooth shading = ugly Gouraud shading artifacts. Flat shading on low poly; smooth only when poly count is high enough to carry it.
- **Mixing triangle densities.** A 200-tri character in a 50000-tri environment looks out of place. Commit to a density range (say, 50–500 tris per object) and enforce it.
- **Not using reference.** Pick a game with the style you want, pause screenshots, keep them open in a second monitor while you work. Don't try to invent stylized 3D from first principles.
- **Ignoring lighting.** Most failed stylized 3D scenes have passable geometry but terrible lighting. Spend 20% of time modeling and 30% of time lighting.

## The "it looks like programmer 3D" fixes

In order of impact, the fixes that transform a drab stylized 3D scene:

1. Add SSAO (biggest single perceived-quality boost)
2. Add the warm-key-cool-fill two-light setup, kill ambient-only lighting
3. Add colored distance fog
4. Add bloom + ACES tonemapping (see post-processing.md)
5. Hue-shift the palette — warm everything very slightly or cool everything very slightly, not neutral
6. Add subtle camera motion (breathe, sway) even in static scenes
7. Add particle motion — dust, leaves, pollen, embers — so the space feels inhabited
