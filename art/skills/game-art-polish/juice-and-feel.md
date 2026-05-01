# Juice and Game Feel

This is the highest-ROI polish category. Juice is the difference between a game that looks correct and a game that feels alive. It's also the category where programmer-artists can compete with traditional artists, because it's 90% code and timing, 10% art.

Read when the user asks about: screen shake, hitstop, impact, feedback, "feels dead," "feels weightless," "feels weak," anticipation, follow-through, squash and stretch, or general "how do I add polish."

## The core principle

Every meaningful action the player takes should produce *three layers* of feedback:

1. **Immediate** (0 frames): the thing happens visually — projectile appears, enemy flinches, UI counter changes.
2. **Amplified** (1–10 frames): screen shake, flash, particles, scale pop, sound effect.
3. **Residual** (10–60 frames): lingering smoke, cooldown UI animation, scorch mark on ground, color fade.

Missing layer 2 is what makes actions feel weak. Missing layer 3 is what makes the world feel forgettable. Most programmer-art games have only layer 1.

## The juice checklist

For every player verb (shoot, jump, dash, collect, damage, die, spawn, menu-open, menu-close, level-up), the game should have:

- [ ] A sound (even a placeholder one)
- [ ] A particle burst or flash
- [ ] A transform change on the actor (squash, scale pop, rotation nudge)
- [ ] A camera response on significant actions (shake, punch-in, punch-out)
- [ ] A UI response if the action affects a resource (counter tick, bar animation)

If any checkbox is missing, that's where the next unit of polish should go.

## Specific techniques, with code

### Screen shake

The single most effective juice technique. Works for hits, explosions, heavy landings, impactful UI events.

**Unity (C#):**
```csharp
using UnityEngine;

public class CameraShake : MonoBehaviour {
    Vector3 originalPos;
    float shakeTimer;
    float shakeMagnitude;

    void Awake() { originalPos = transform.localPosition; }

    public void Shake(float duration, float magnitude) {
        shakeTimer = duration;
        shakeMagnitude = magnitude;
    }

    void LateUpdate() {
        if (shakeTimer > 0) {
            // Random offset, decaying with remaining time
            float t = shakeTimer; // remaining
            Vector2 offset = Random.insideUnitCircle * shakeMagnitude * t;
            transform.localPosition = originalPos + (Vector3)offset;
            shakeTimer -= Time.deltaTime;
        } else {
            transform.localPosition = originalPos;
        }
    }
}
// Usage: cameraShake.Shake(0.15f, 0.3f); // on hit
//        cameraShake.Shake(0.35f, 0.8f); // on explosion
```

**Godot 4 (GDScript):**
```gdscript
extends Camera2D

var shake_timer := 0.0
var shake_mag := 0.0
var base_offset := Vector2.ZERO

func shake(duration: float, magnitude: float) -> void:
    shake_timer = duration
    shake_mag = magnitude

func _process(delta: float) -> void:
    if shake_timer > 0:
        offset = base_offset + Vector2(randf_range(-1,1), randf_range(-1,1)) * shake_mag * shake_timer
        shake_timer -= delta
    else:
        offset = base_offset
```

**Tuning guide:**
- Tiny hits: 0.1s duration, 0.15 magnitude
- Normal hits: 0.15s, 0.3
- Big hits / heavy landing: 0.25s, 0.5
- Explosions / boss slam: 0.4s, 1.0+
- Scale magnitude to screen size — 0.3 on a small screen looks different from on a 4K display. Prefer magnitude in world units, not pixels.

**Warning:** Screen shake on *everything* becomes noise. Reserve it for 20% of events, tune magnitude by event weight. Vlambeer made the Nuclear Throne screenshake a signature; they also gated it behind event importance.

### Hitstop (time freeze on impact)

Freezing the game for 50–100ms on a hit conveys enormous weight. Smash Bros, Hyper Light Drifter, and Dead Cells all do this.

**Unity:**
```csharp
public static class Hitstop {
    static float savedTimeScale = 1f;
    public static void Freeze(MonoBehaviour host, float durationSeconds) {
        host.StartCoroutine(FreezeRoutine(durationSeconds));
    }
    static System.Collections.IEnumerator FreezeRoutine(float d) {
        savedTimeScale = Time.timeScale;
        Time.timeScale = 0f;
        yield return new WaitForSecondsRealtime(d);
        Time.timeScale = savedTimeScale;
    }
}
// Usage: Hitstop.Freeze(this, 0.06f); // on normal hit
//        Hitstop.Freeze(this, 0.12f); // on heavy hit
```

**Godot:**
```gdscript
func hitstop(duration: float) -> void:
    Engine.time_scale = 0.0
    await get_tree().create_timer(duration, true, false, true).timeout  # ignore_time_scale=true
    Engine.time_scale = 1.0
```

**Tuning:** 40ms (light hit), 80ms (normal), 150ms (boss hit). Any longer and it feels like lag.

### Squash and stretch

Scale the player non-uniformly on jump/land/hit. Disney animation principle #1, transfers directly to games.

```csharp
// Unity - on jump
transform.localScale = new Vector3(0.7f, 1.3f, 1f); // stretch up
// then over the next 150ms, ease back to Vector3.one

// On land
transform.localScale = new Vector3(1.3f, 0.7f, 1f); // squash down
// ease back over 200ms
```

Use a tween library (DOTween in Unity, the built-in `Tween` in Godot) instead of coroutines for this — it's much cleaner:

```csharp
// DOTween
transform.DOScale(new Vector3(1.3f, 0.7f, 1), 0.08f)
         .OnComplete(() => transform.DOScale(Vector3.one, 0.2f).SetEase(Ease.OutElastic));
```

```gdscript
# Godot
var t = create_tween()
t.tween_property(self, "scale", Vector2(1.3, 0.7), 0.08)
t.tween_property(self, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
```

### Anticipation and follow-through

Before a fast action (jump, attack, dash), insert 3–6 frames of the opposite motion. Before a jump, the character compresses. Before an attack, they wind up. This is slow in frame count but makes the action read as intentional and powerful.

After the action, let the character overshoot slightly and settle. An attack that snaps back to idle looks robotic; one that drifts for 100ms before settling feels weighty.

### Number/text pop on feedback

When a counter changes (score, health, ammo), don't just update the number. Scale the text up to 1.3× and back over 150ms, and optionally flash its color briefly. This makes stat changes feel important.

```csharp
// On score change
scoreLabel.transform.DOScale(1.3f, 0.08f).OnComplete(() =>
    scoreLabel.transform.DOScale(1f, 0.15f));
```

### Impact frames and flash

When an enemy is hit, flash its sprite pure white for 50–100ms. Trivial to do, drastically improves hit feel.

**Unity (sprite):**
```csharp
[SerializeField] Material flashMat;   // white/unlit material
[SerializeField] Material normalMat;
SpriteRenderer sr;

public void Flash() { StartCoroutine(FlashRoutine()); }
System.Collections.IEnumerator FlashRoutine() {
    sr.material = flashMat;
    yield return new WaitForSeconds(0.08f);
    sr.material = normalMat;
}
```

For 3D, use a shader property `_FlashAmount` (0–1) and lerp the albedo toward white by that amount.

**Godot (GDShader canvas_item):**
```glsl
shader_type canvas_item;
uniform float flash : hint_range(0.0, 1.0) = 0.0;

void fragment() {
    vec4 c = texture(TEXTURE, UV);
    c.rgb = mix(c.rgb, vec3(1.0), flash);
    COLOR = c;
}
```
Then in script: `material.set_shader_parameter("flash", 1.0)` and tween back to 0.

### Particles on every feedback event

Every hit, jump, land, pickup, death, spawn needs particles. See `particles-vfx.md` for concrete recipes. The minimum bar:

- **Hit**: 5–10 small particles bursting radially from impact point, 200ms lifetime, in the attacker's damage color
- **Land**: 8–12 dust puffs along the ground line, 400ms lifetime
- **Pickup**: 6 sparkles rising and fading, 500ms lifetime, in the pickup's color
- **Death**: larger burst, 15–25 particles, 800ms, with some that leave trails

### Cooldown/charge-up pulsing

When an ability is off cooldown, make it *pulse* — don't just change the UI color. A gentle scale breathe (1.0 → 1.05 → 1.0 over 1 second, looping) on an ability icon signals "ready" without being loud.

### Idle motion

Even when nothing is happening, things should move. Trees sway 1–2 pixels. UI buttons have a 2% scale breathe. Water has idle ripples. A scene where only the player moves feels dead; a scene with ambient motion feels alive.

## The timing cheat sheet

These are tuned values that feel right in most games. Deviate with intent.

| Event | Duration | Notes |
|---|---|---|
| Screen flash on hit | 50–80ms | Pure white → fade |
| Enemy hit flash | 80ms | See above |
| Hitstop (normal) | 60–80ms | |
| Hitstop (heavy) | 120–200ms | Boss phase change etc. |
| Screen shake (light hit) | 100ms | |
| Screen shake (explosion) | 300–500ms | |
| Squash on land | 80ms down, 200ms up | Ease-out |
| Scale pop on UI change | 80ms up, 150ms back | |
| Menu transition | 200–300ms | Fast enough not to annoy |
| Death pause | 400ms before respawn/death screen | Let the moment land |
| Coyote time (platformer) | 100–150ms | Grace after leaving ledge |
| Input buffer (platformer) | 100–150ms | Accept jump pressed just before landing |

## Frame-by-frame juice analysis

When in doubt about how to juice an effect, open a reference game at 0.25× speed on YouTube and count frames:

- At frame 0 of a hit, what changes?
- At frame 1?
- At frame 2?
- At frame 5?
- At frame 15?

You'll usually find 4–6 distinct visual events layered into a single hit over 250ms. That's the depth of juice you're aiming for. Dead Cells, Hades, and Hollow Knight are particularly good references to frame-count.

## The "feels weak" diagnosis

When the user says an attack/impact feels weak, check in order:

1. Is there hitstop? (Usually the #1 fix.)
2. Is there a hit flash on the target?
3. Is there a particle burst on impact?
4. Is there screen shake scaled to hit magnitude?
5. Is there a knockback on the target that visually displaces them?
6. Is there a sound with real low-frequency content (not just a high-pitched zap)?
7. Does the attacker have anticipation and follow-through?

Usually 1–3 unchecked items are the problem. Adding them takes minutes.
