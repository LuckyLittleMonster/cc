# UI: Unity UI Toolkit (UXML/USS) and Godot Theme

Default game engine UI looks sterile. This reference covers making UI feel like part of the game — for Unity (UI Toolkit with UXML/USS, plus uGUI fallback) and Godot (Control nodes + Theme resource).

Read when the user asks about: UI that looks generic/sterile, HUD polish, menus, UI animations, UXML, USS, UI Toolkit, uGUI, Godot Theme, Control nodes, NinePatchRect.

**A note on Unity UI Toolkit specifically.** As of Unity 6/2022 LTS, runtime UI Toolkit is the officially-endorsed path forward but is still evolving. LLMs (including the one you're using via LSP or MCP) have less training data on it than on legacy uGUI. Expect to verify generated UXML/USS against the docs more than you'd verify C# code. When in doubt, use properties and selectors that are explicitly documented at [docs.unity3d.com/Manual/UIElements.html](https://docs.unity3d.com/Manual/UIElements.html).

## Unity UI Toolkit — what it is

UI Toolkit is a retained-mode UI system inspired by web technologies:

- **UXML** — an XML file describing the *structure* of UI (similar to HTML). Elements like `<ui:VisualElement>`, `<ui:Button>`, `<ui:Label>`.
- **USS** — Unity Style Sheets, a stylesheet format modeled on CSS. Selectors, properties, cascading. Controls the *appearance*.
- **C#** — handles *logic*. Queries elements by name/class, registers callbacks.

The separation mirrors web's HTML/CSS/JS split. This is the same model the user knows from web work.

### Minimal runtime UI example

**UXML file** (`Assets/UI/Hud.uxml`):
```xml
<ui:UXML xmlns:ui="UnityEngine.UIElements" xmlns:uie="UnityEditor.UIElements">
    <ui:VisualElement name="root" class="hud">
        <ui:VisualElement name="health-bar" class="bar bar--health">
            <ui:VisualElement name="health-fill" class="bar__fill" />
            <ui:Label name="health-label" text="100 / 100" class="bar__label" />
        </ui:VisualElement>
        <ui:Button name="pause-btn" text="||" class="btn btn--icon" />
    </ui:VisualElement>
</ui:UXML>
```

**USS file** (`Assets/UI/Hud.uss`):
```css
.hud {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    flex-direction: row;
    justify-content: space-between;
}

.bar {
    width: 240px;
    height: 24px;
    background-color: rgba(0, 0, 0, 0.55);
    border-radius: 12px;
    padding: 2px;
    overflow: hidden;
}

.bar__fill {
    height: 100%;
    width: 100%;
    border-radius: 10px;
    transition: width 0.15s ease-out;
}

.bar--health .bar__fill {
    background-color: rgb(220, 60, 80);
}

.bar__label {
    position: absolute;
    top: 3px;
    left: 0;
    right: 0;
    -unity-text-align: middle-center;
    color: white;
    -unity-font-style: bold;
    font-size: 14px;
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
}

.btn {
    width: 44px;
    height: 44px;
    background-color: rgba(0, 0, 0, 0.65);
    border-radius: 22px;
    border-width: 0;
    color: white;
    font-size: 20px;
    transition: scale 0.1s ease-out, background-color 0.1s ease-out;
}

.btn:hover {
    background-color: rgba(40, 40, 60, 0.85);
    scale: 1.08;
}

.btn:active {
    scale: 0.92;
}
```

**C# driver** (`HudController.cs`):
```csharp
using UnityEngine;
using UnityEngine.UIElements;

[RequireComponent(typeof(UIDocument))]
public class HudController : MonoBehaviour {
    VisualElement healthFill;
    Label healthLabel;
    Button pauseBtn;

    void OnEnable() {
        var root = GetComponent<UIDocument>().rootVisualElement;
        healthFill  = root.Q<VisualElement>("health-fill");
        healthLabel = root.Q<Label>("health-label");
        pauseBtn    = root.Q<Button>("pause-btn");
        pauseBtn.clicked += OnPause;
    }

    public void SetHealth(int current, int max) {
        float pct = Mathf.Clamp01((float)current / max);
        healthFill.style.width = Length.Percent(pct * 100f);
        healthLabel.text = $"{current} / {max}";
    }

    void OnPause() { /* … */ }
}
```

**Scene setup:**
1. Create empty GameObject, add `UIDocument` component.
2. Assign a `PanelSettings` asset (create one via Assets → Create → UI Toolkit → Panel Settings).
3. Assign the UXML as Source Asset on the UIDocument.
4. On PanelSettings, set Scale Mode to "Scale with Screen Size" and reference resolution to your target (e.g. 1920×1080).
5. Attach `HudController` to the same GameObject.

### USS selectors that actually work at runtime

The docs list many; these are the ones that reliably matter:

| Selector | Matches | Use for |
|---|---|---|
| `.class-name` | Elements with that class added via `AddToClassList` or `class=""` in UXML | Everything. Your default. |
| `#name` | Element with that unique name | When you need to style one specific element only |
| `.parent > .child` | Direct children of `.parent` | Scoping styles to a subtree |
| `.parent .descendant` | Any descendant | Less performant; use child selector when you can |
| `.a.b` | Elements with BOTH classes | Modifiers like `.btn.btn--primary` |
| `.btn:hover` | On mouse hover | Hover states |
| `.btn:active` | While pressed | Press feedback |
| `.btn:focus` | When focused | Keyboard/gamepad nav indication |
| `.btn:disabled` | When `SetEnabled(false)` | Disabled styling |

`:hover` is documented as the biggest perf gotcha — it triggers re-styling passes. For lots of hover-able elements, prefer toggling classes from C# via pointer callbacks over `:hover` selectors.

### USS properties you'll use daily

```css
.element {
    /* Layout (Flexbox) */
    flex-direction: row | column;
    justify-content: flex-start | center | space-between | space-around;
    align-items: flex-start | center | stretch;
    flex-grow: 1;                    /* expand to fill */
    flex-shrink: 0;                  /* don't shrink */
    width: 100px; height: 100px;
    min-width: 100px; max-width: 400px;
    padding: 8px 12px;               /* shorthand */
    margin: 0 4px;
    position: relative | absolute;
    top: 10px; left: 0; right: 0; bottom: 0;

    /* Appearance */
    background-color: rgba(0, 0, 0, 0.6);
    background-image: url('project://database/Assets/UI/panel.png');
    -unity-background-scale-mode: stretch-to-fill | scale-and-crop | scale-to-fit;
    -unity-slice-left: 8; -unity-slice-right: 8;
    -unity-slice-top: 8; -unity-slice-bottom: 8;    /* 9-slice */

    /* Borders */
    border-radius: 12px;
    border-width: 2px;
    border-color: rgb(255, 255, 255);

    /* Text */
    color: white;
    font-size: 16px;
    -unity-font-style: normal | bold | italic | bold-and-italic;
    -unity-text-align: upper-left | middle-center | lower-right;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
    -unity-font-definition: url('project://database/Assets/Fonts/MyFont.asset');

    /* Effects & Animation */
    opacity: 0.9;
    scale: 1.0 1.0;
    rotate: 0deg;
    translate: 10px 0;
    transition: all 0.15s ease-out;   /* CSS-style transitions */
}
```

**Properties prefixed with `-unity-`** are Unity-specific and won't be familiar to web developers. `-unity-text-align`, `-unity-font-style`, `-unity-slice-*`, `-unity-background-scale-mode` are the common ones.

### The biggest UI Toolkit gotchas

1. **Background images must be imported with specific settings.** Set Texture Type to "Sprite (2D and UI)". If it's a 9-slice panel, set Mesh Type to "Full Rect" and configure the border.

2. **Relative URL in `url()` doesn't work.** Use `url('project://database/Assets/…')` with the full project path.

3. **Inline styles in UXML** (like `<ui:Button style="color: red" />`) blow up memory for lots of elements. Use USS classes instead, per Unity's own best practices.

4. **No `:nth-child()` selector.** Web-style tricks for alternating rows don't work directly. Apply classes from C#.

5. **No grid layout.** UI Toolkit is flexbox-only. For grid layouts, nest flex rows/columns.

6. **Transitions are on a limited property set.** Animatable properties include `opacity`, `scale`, `rotate`, `translate`, `background-color`, `color`, `width`, `height`, `border-radius`, a few more. Check the manual before assuming. Non-animatable properties snap.

7. **Runtime vs Editor UXML.** Same file, but at runtime `PanelSettings` controls scaling. In Editor, the window controls it. Design for runtime scaling from the start.

8. **Gamepad/keyboard navigation isn't free.** Set `focusable="true"` on UXML elements meant to receive focus, and USS `:focus` to show the focused state. Test with a gamepad or set `tabindex` in UXML.

### Panel Settings for runtime

Critical settings on the `PanelSettings` asset:

| Setting | Value | Why |
|---|---|---|
| Scale Mode | Scale With Screen Size | UI scales with resolution |
| Reference Resolution | 1920 × 1080 | Your design target |
| Screen Match Mode | Match Width or Height | Pick one or use 0.5 for balanced |
| Sort Order | Higher = on top | For multiple UIDocuments |
| Theme Style Sheet | assign your base `.tss` | Project-wide theme |

A **TSS (Theme Style Sheet)** lets you set a base USS that applies across every UIDocument using those PanelSettings. Useful for typography defaults, color palette variables.

### USS custom properties (variables)

USS supports CSS-style custom properties:

```css
:root {
    --color-bg: rgb(18, 20, 30);
    --color-accent: rgb(90, 200, 255);
    --color-text: rgb(235, 235, 245);
    --radius-md: 10px;
}

.panel {
    background-color: var(--color-bg);
    color: var(--color-text);
    border-radius: var(--radius-md);
}

.accent {
    color: var(--color-accent);
}
```

This is the right way to establish a design token system. Change one variable, every matching element re-themes.

## UI polish techniques (engine-agnostic)

### 1. Use a display font, not the default

The single biggest "looks like Unity/Godot default" tell is the default font. Import a free display font from [Google Fonts](https://fonts.google.com), [1001 Free Fonts](https://www.1001freefonts.com), or itch.io pixel font collections.

Matching font to game mood:
- Serif (e.g. Cinzel, EB Garamond) → epic, fantasy, historical
- Sans-serif display (Bebas Neue, Montserrat Black) → action, modern, sci-fi
- Monospace (JetBrains Mono, IBM Plex Mono) → cyberpunk, hacking, tech
- Rounded sans (Quicksand, Nunito) → cozy, friendly, casual
- Pixel font (m5x7, Press Start 2P, Pixeloid) → pixel art games

Unity: create a TextMesh Pro Font Asset from the font (Window → TextMeshPro → Font Asset Creator). For UI Toolkit, either use TMP through a custom element or use regular `Font` assets via `-unity-font-definition`.

Godot: import the font, create a `Theme`, set `default_font`.

### 2. Translucent panels with backdrop blur (or simulated)

A solid opaque panel looks blocky. A translucent panel with some blur behind it looks premium (like iOS/macOS).

**Unity UI Toolkit** doesn't have built-in backdrop blur. Workarounds:
- Pre-blur the game behind a menu by rendering a Camera to a RenderTexture with a blur shader, show that under the menu panel.
- Or use a translucent dark panel (`rgba(0,0,0,0.55)`) without blur — simpler and reads as intentional.

**Godot** has `CanvasItem → BackBufferCopy` which can copy+blur the screen behind. Or apply a shader to a full-screen TextureRect with the screen texture.

### 3. Rounded corners

Flat rectangular UI reads as "default engine UI." Add `border-radius: 8px` (or `corner_radius_*` in Godot Theme) and it immediately looks more crafted.

Radius scale suggestion: 4px for small elements (buttons), 8–12px for panels, 20px+ for big cards. Consistent radius across the UI is what makes it feel designed.

### 4. Subtle gradients

Flat colors feel flat (surprise). A subtle vertical gradient (darker at bottom, lighter at top) on a button makes it feel physical.

USS (via background image trick, since USS doesn't have native gradient syntax):
```css
.btn {
    background-image: url('project://database/Assets/UI/btn-gradient.png');
    -unity-background-scale-mode: stretch-to-fill;
}
```

Create a 2×64 pixel PNG in Photoshop/Aseprite with a vertical gradient — that's your button background.

**Godot** supports gradients natively via `GradientTexture2D` as a `Theme` stylebox texture.

### 5. Animated state transitions

UI Toolkit's `transition` property makes hover, press, focus states animate. Use it everywhere:

```css
.btn {
    transition: scale 0.1s ease-out,
                background-color 0.1s ease-out,
                color 0.1s ease-out;
}
.btn:hover { scale: 1.05; }
.btn:active { scale: 0.95; }
```

That tiny scale pop on hover makes buttons feel responsive in a way static UI can't.

### 6. Micro-particles on UI events

When the player clicks a big button (buy, confirm, level-up), spawn a small particle burst around the button. This is the UI equivalent of juice.

In UI Toolkit: instantiate a world-space particle system positioned over the button's screen position, or use a second UIDocument with animated VisualElements.

### 7. Sound on everything

Every UI event (hover, click, confirm, cancel, menu-open, menu-close) needs a sound. A set of 6–8 UI sounds costs nothing (Kenney UI audio pack is free, CC0) and transforms UI feel.

## Godot UI via Theme

Godot takes a different approach: Control nodes (Button, Label, TextureRect, Panel, VBoxContainer, HBoxContainer, etc.) for structure; a single **Theme** resource for styling.

### Creating a Theme

1. Create a new Theme resource (Right-click in FileSystem → New Resource → Theme).
2. Double-click it to open the Theme editor.
3. Add type overrides for each control type you want to style (Button, Label, Panel, etc.).
4. For each type, set:
   - **Colors** (font colors, etc.)
   - **Constants** (spacing, outline size)
   - **Fonts** (font file, font size)
   - **Styles** (a StyleBox resource — StyleBoxFlat is the rounded-rect workhorse)

### The StyleBoxFlat cheat sheet

The rounded-rect style everyone uses:

```gdscript
# In script, or set via inspector
var sb := StyleBoxFlat.new()
sb.bg_color = Color(0.1, 0.1, 0.15, 0.85)
sb.corner_radius_top_left = 8
sb.corner_radius_top_right = 8
sb.corner_radius_bottom_left = 8
sb.corner_radius_bottom_right = 8
sb.content_margin_left = 16
sb.content_margin_right = 16
sb.content_margin_top = 10
sb.content_margin_bottom = 10
sb.border_color = Color(1, 1, 1, 0.1)
sb.border_width_left = 1
sb.border_width_right = 1
sb.border_width_top = 1
sb.border_width_bottom = 1
# Optional shadow
sb.shadow_color = Color(0, 0, 0, 0.4)
sb.shadow_size = 4
sb.shadow_offset = Vector2(0, 2)

theme.set_stylebox("normal", "Button", sb)
```

Create variants (`normal`, `hover`, `pressed`, `disabled`, `focus`) for each interactive control. Godot automatically applies them based on state.

### Godot UI animation

For hover/press animations, use `Tween` on the Control node's `scale` property:

```gdscript
func _ready():
    mouse_entered.connect(_on_hover)
    mouse_exited.connect(_on_exit)

func _on_hover():
    var t = create_tween()
    t.tween_property(self, "scale", Vector2(1.05, 1.05), 0.1)

func _on_exit():
    var t = create_tween()
    t.tween_property(self, "scale", Vector2.ONE, 0.1)
```

Be aware Godot Control scale pivots by default at (0,0); set `pivot_offset = size / 2` for center scaling.

### NinePatchRect

The Godot equivalent of UXML's 9-slice background. `NinePatchRect` with a texture and configured patch margins (Inspector → patch_margin_left/right/top/bottom) lets a single small texture stretch to any panel size.

Essential for hand-drawn stylized UI — paint a small decorative panel once, use it at any size.

## Menu polish checklist

Walking through a menu and asking "does this have each of these" is a good self-audit:

- [ ] Custom font (not engine default)
- [ ] Consistent corner radius across elements
- [ ] Subtle background (gradient, translucent dark, or textured panel — not flat solid)
- [ ] Hover state that animates (scale or color)
- [ ] Press state (scale or color)
- [ ] Focus state for gamepad navigation
- [ ] Sound on hover (subtle) and click (louder)
- [ ] Menu open/close animation (fade in, slide from side, scale in)
- [ ] Title uses display font or has some distinguishing styling vs body text
- [ ] Icons on key actions (save disk icon, gear for settings, etc.)
- [ ] Background isn't empty — a blurred game background, a subtle moving texture, or a parallax scene

Missing 3+ of these usually correlates with "my UI looks sterile."
