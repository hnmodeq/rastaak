# Controlling the Rastaak 3D scene

The live homepage scene is driven by saved TypeScript config, not by hardcoded
values inside the canvas.

| File | What it controls |
|---|---|
| `components/canvas/scene/sceneConfig.ts` | Camera stops, fog, background, exposure, materials. 3D Studio writes this file. |
| `components/canvas/scene/lightingConfig.ts` | Lights and shadows. 3D Studio writes this file. |
| `components/canvas/scene/journeyMath.ts` | Catmull-Rom sampling between camera stops. Do not overwrite this. |
| `components/canvas/HeroCanvas3D.tsx` | Loads the GLB and applies the config above. |

## Studio loop

1. Refresh the homepage in development. The panel and the scene both read the config files.
2. Move sliders. The scene updates immediately.
3. Click **Apply & Save directly to Code**. The panel writes the live scene back to the two config files.
4. Refresh. The same values load again. Each building stores two keys:
   `Building_9__facade` and `Building_9__window`.
   In 3D Studio open **Each Building (Body + Windows)** to color the
   building and its windows separately.

---

## 1. The mental model

Your Blender scene is loaded once, exactly as you built it, and never moved.
The camera is the only thing that animates. Scrolling the page from top to
bottom moves the camera from one end of your world to the other.

Scroll position is turned into a single number called **`t`**:

```
t = 0.0   top of the page
t = 1.0   bottom of the page
```

Your landmarks sit in a line along the **Z axis**, so the journey is basically
"increase Z as `t` increases":

```
   z=-82        z=-43        z=+14      z=+45        z=+66
 buildings  →  logo small  →  wrench  →  storage  →  RASTAAK LOGO
 cooling tower              deployment   + headset     (the end)
 Industry/Company/
 Organization/Bank
```

One thing worth knowing: your landmarks are **not** centred on x=0. They sit
around **x ≈ -15**. That's why every `target` below has an x near -15 rather
than 0. If you add new objects in Blender, keep them near that line or the
camera will look past them.

---

## 2. Moving the camera — `journeyPath.ts`

This is the whole thing. Five stops, then a finale:

```ts
export const JOURNEY = [
  {
    id: 'chaos',
    camera: [10, 22, -130],   // where the camera IS
    target: [-10, 8, -82],    // where the camera LOOKS
  },
  { id: 'assessment', camera: [4, 15, -82],  target: [-14, 4,  -43] },
  { id: 'recommend',  camera: [0, 12, -34],  target: [-15, 4,    0] },
  { id: 'deploy',     camera: [-3, 10, -12], target: [-15, 3.5, 14] },
  { id: 'support',    camera: [-6, 10, 20],  target: [-14.6, 3, 44.5] },
];
```

Both `camera` and `target` are `[x, y, z]` in **the same world coordinates you
see in Blender's N-panel**. So if you select the wrench in Blender and it reads
`(-15.3, 3.3, 13.6)`, that's exactly what you type here.

> ⚠️ One gotcha: **Blender is Z-up, three.js is Y-up.** The glTF exporter
> converts for you, which means Blender's `(x, y, z)` arrives as
> `(x, z, -y)`. If a number from Blender doesn't land where you expect, that
> swap is why. The values already in the file are measured from the *loaded*
> scene, so they're in the right space — copy their style.

### The five stops are spread evenly across the scroll

Stop 1 is at `t=0`, stop 5 is at `t=1`, and the rest are spaced evenly between.
The camera **curves smoothly** between them (Catmull-Rom interpolation), it
doesn't travel in straight lines. So you only place the key poses and the
motion between them is handled.

### Recipes

**"The camera is too far away at the start."**
Move the camera closer to its target. Reduce the gap between `camera` and
`target`:
```ts
camera: [10, 22, -130]   →   camera: [4, 14, -105]
```

**"I want to look from the other side."**
Flip the sign of the camera's x, keeping the target the same:
```ts
camera: [10, 22, -130]   →   camera: [-40, 22, -130]
```

**"The camera is too high / too low."**
Second number is height. `camera: [10, 22, -130]` → `[10, 12, -130]` for a
lower, more ground-level shot.

**"It moves too fast through the middle."**
Add a stop. The stops are just spread evenly across the scroll, so adding a
sixth one between `recommend` and `deploy` gives that stretch more scroll
distance:
```ts
{ id: 'recommend',  camera: [0, 12, -34], target: [-15, 4, 0] },
{ id: 'transit',    camera: [-1, 11, -22], target: [-15, 4, 7] },   // new
{ id: 'deploy',     camera: [-3, 10, -12], target: [-15, 3.5, 14] },
```

**"I want to add a stop at a new object I made in Blender."**
Select it in Blender, read its location, then:
```ts
{ id: 'mything', camera: [X+12, Y+8, Z-18], target: [X, Y, Z] },
```
Standing back `+12` in x, up `+8`, and `-18` in z is a decent starting shot for
an object a few units across. Adjust from there.

### The finale (the logo)

```ts
export const FINALE = {
  id: 'logo',
  camera: [-13, 20, 90],
  target: [-11, -7, 59],
};
```

This one is separate because the logo is the *resolution* of the story, not a
sixth stop. Over the last stretch of scroll the camera eases from wherever the
path had it onto this pose.

Two deliberate oddities here:

1. **The camera is high up (y=20) looking down.** Your logo lies flat on the
   ground, face-up. From a low angle it foreshortens into an unreadable blob;
   from above it reads as the logo.
2. **The target y is negative (-7), below the ground.** Aiming low pushes the
   logo *up* in frame. At the bottom of the page the opaque CTA and footer
   sections cover the lower part of the screen, so the logo has to sit high to
   stay visible. If the logo looks too high or too low on the finished page,
   **nudge this number** — more negative pushes it up, less negative pulls it
   down.

To change *when* the finale takes over, in `HeroCanvas3D.tsx`:
```ts
const finaleWeight = THREE.MathUtils.smoothstep(t, 0.86, 1.0);
```
`0.86` = start easing onto the logo at 86% scroll. Lower it to `0.75` to land
on the logo earlier and hold it longer.

---

## 3. Lighting — `HeroCanvas3D.tsx`

Your materials are mostly untextured light greys, so **the lights are doing
almost all of the visual work.** The setup is deliberately warm at the
"problem" end of the story and cool/clean at the "solved" end.

```ts
// Overall base brightness. Raise if the scene looks too dark overall.
const ambient = new THREE.AmbientLight(tokens.experimentalScene.ambient, 1.2);

// Sky/ground tint. Gives shape without harsh shadows.
const hemi = new THREE.HemisphereLight(sky, ground, 1.6);

// The main "sun". Position controls shadow direction.
const keyLight = new THREE.DirectionalLight(colour, 2.2);
keyLight.position.set(60, 90, 40);

// Softens the shadow side so it doesn't go pure black.
const fillLight = new THREE.DirectionalLight(colour, 1.2);
fillLight.position.set(-70, 40, -50);
```

The last number in each constructor is **intensity** — that's your brightness
dial. `1.2` → `2.5` doubles it.

### The three animated lights

These change as you scroll, which is what gives the journey its mood arc:

```ts
const chaosWeight   = 1 - THREE.MathUtils.smoothstep(t, 0.0, 0.35);
const supportWeight = THREE.MathUtils.smoothstep(t, 0.55, 0.95);

warmKey.intensity   = chaosWeight   * 900;  // warm glow over the buildings
coolFill.intensity  = supportWeight * 900;  // cool glow over the storage
logoLight.intensity = finaleWeight  * 700;  // lights the logo at the end
```

- `warmKey` fades **out** over the first 35% of the scroll.
- `coolFill` fades **in** between 55% and 95%.
- `logoLight` comes up only for the finale.

The `900` / `700` are brightness. These are point lights with a distance
falloff of 160 units, which is why the numbers look huge compared to the
directional lights — that's normal, don't be alarmed.

To move where a glow sits, change its position:
```ts
warmKey.position.set(-10, 30, -82);   // hovering over the buildings
coolFill.position.set(-10, 26, 46);   // hovering over the storage
```

### Colours

**Don't hardcode hex values.** The repo has an automated check
(`npm run tokens:check`, runs on every build) that fails if it finds raw colours
outside the token file. Edit `tokens/design-tokens.ts` instead:

```ts
experimentalScene: {
  canvasBackground: 0x050419,   // the void behind everything
  ambient:          0x261779,
  keyLight:         0x4f86ff,
  fillLight:        0x261779,
},
dataStorageScene: {
  keyLightWarm:  ...,   // the warm glow at the start
  fillLightCool: ...,   // the cool glow at the end
  scannerBeam:   ...,   // the logo light
},
```

---

## 4. Other dials worth knowing

**Fog** — how quickly distance fades to background. Your world is ~477 units
across, so the far numbers are large:
```ts
scene.fog = new THREE.Fog(colour, 120, 420);
//                                ^^^  ^^^
//                    fully clear ─┘    └─ fully faded out
```
Want to see further? Raise `420`. Want a moodier, more enclosed feel? Lower
both.

**Field of view** — `45` is a natural lens. Higher (`60`) is wider and more
dramatic; lower (`30`) is more telephoto and compressed:
```ts
new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
```

**How responsive the camera feels to scrolling:**
```ts
const damping = 1 - Math.exp(-delta * 3.71);
```
`3.71` is the responsiveness. Higher (`8`) = camera snaps tightly to your
scroll. Lower (`1.5`) = long, floaty, cinematic lag.

> Keep the `1 - Math.exp(-delta * k)` form. The obvious alternative
> (`current += (target - current) * 0.06`) looks fine on your machine but
> runs at completely different speeds on a 144Hz monitor versus a throttled
> background tab — on slow hardware the camera literally never reaches the end
> of the path. This form is frame-rate independent.

**The gentle idle drift** (so the shot isn't dead when you stop scrolling):
```ts
camPos.y += Math.sin(elapsed * 0.4) * 0.4;
//                            ^^^      ^^^
//                          speed    amount
```
Set the `0.4` amount to `0` to switch it off entirely.

**Overall exposure:**
```ts
renderer.toneMappingExposure = 1.1;   // whole-image brightness
```

---

## 5. Material note (why metalness is clamped)

On load, every material gets:
```ts
m.metalness = Math.min(m.metalness, 0.25);
m.roughness = Math.max(m.roughness, 0.45);
```

There is **no environment map** in this scene. A metallic surface renders by
reflecting its surroundings — with nothing to reflect, high metalness renders
as **flat black**. If you set something to metallic in Blender and it shows up
black, that's the cause.

Two ways to get real metal later, if you want it:
1. Add an environment map (an HDRI) — then remove the clamp.
2. Keep metalness low and fake the sheen with roughness and lighting.

---

## 6. Workflow

The fastest loop: edit `journeyPath.ts`, save, and the page hot-reloads. Scroll
to the section you're tuning and watch. Camera positions are the kind of thing
you nudge by feel — change one number by a chunk (not `10` → `11`, but `10` →
`20`) so you can actually see which direction it moved, then narrow in.

Sanity checks before pushing:
```bash
npx tsc --noEmit        # types
npm run tokens:check    # no stray hardcoded colours
```

---

## 7. Performance, when you're happy with the look

The GLB is **11 MB / 236k triangles / 958 objects**, uncompressed. It works,
but it's a heavy first load. When the visuals are settled, the easy win is
compression on export from Blender:

- **Draco** (geometry compression) — typically gets 11 MB down to ~2-3 MB.
  The loader in `HeroCanvas3D.tsx` is *already wired for it*
  (`dracoLoader.setDecoderPath('/draco/')` and `/public/draco/` exists), so a
  Draco-compressed re-export drops straight in with no code change.
- In Blender: **File → Export → glTF 2.0 → Compression ✓**

Also worth doing at some point: 958 separate objects means 958 draw calls.
Joining objects that share a material (Ctrl+J in Blender) cuts that
substantially.
