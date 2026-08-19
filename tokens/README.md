# Rastaak token workflow

## One source of truth

**Edit only [`design-tokens.ts`](./design-tokens.ts).** It is the only hand-authored home for color values.

| Need to change | Edit this source field | Consumer |
| --- | --- | --- |
| UI colors, surfaces, text, borders, state, overlays | `tokens.colors.*` | CSS custom properties, Tailwind utilities, React inline styles |
| Active homepage WebGL colors | `tokens.scene.*` | Legacy WebGL renderer and its worker; separate fill and glow controls for end-story elements |
| Homepage Three.js renderer defaults | `tokens.experimentalScene.*` | Initial values for `HeroCanvas3D` / `sceneConfig.ts` until 3D Studio saves overrides |

`scene` contains only active homepage elements and is the 3D palette shown in Token Studio. Its values are numeric because Three.js consumes numeric color representations. `experimentalScene` stays outside the Studio because changing it does not affect the visible homepage.

## Active homepage scene palette

The **3D scene** tab deliberately follows the supplied reference-image names. Every fill and every glow is a separate source token and renderer binding.

| Reference image | Token controls |
| --- | --- |
| `elements.png` | `elementsFill` |
| `building-logo.png` | `buildingLogoFill`, `buildingLogoGlow` |
| `glowing-dots.png` | `glowingDotsFill`, `glowingDotsGlow` |
| `laser-1.png` | `laser1Fill`, `laser1Glow` |
| `laser-2.png` | `laser2Fill`, `laser2Glow` |
| `logo-active.png` | `logoActiveFill`, `logoActiveGlow` |
| `logo-deactive.png` | `logoDeactiveFill`, `logoDeactiveGlow` |
| `square-active.png` | `squareActiveFill`, `squareActiveGlow` |
| Central activation tile | `activationSquareFill`, `activationSquareGlow` |
| `squares-deactive.png` | `squaresDeactiveFill` |

The homepage backdrop remains the UI token `colors.bgHero`, shown as **Homepage 3D backdrop** in the UI collection. Logo fill tokens are lit material tints—not flat screen overlays—so their geometry, ambient occlusion, normal shading, and depth remain visible for both white and colored fills.

## Generated files

`npm run tokens:generate` creates these **ignored build artifacts**:

- `tokens/generated.css` — CSS custom properties used by `app/globals.css`.
- `public/_astro/scene-tokens.js` — numeric scene values imported by the legacy WebGL bundle and worker.

They are intentionally not committed and are overwritten by every generator run. Never edit them manually.

## Safe edit workflow

1. In development, open [http://localhost:3000/token-studio](http://localhost:3000/token-studio).
2. Choose **UI colors** for `tokens.colors`, or **3D scene** for `tokens.scene`.
3. Adjust the native picker (and, for UI tokens, the OKLCH controls).
4. Select **Apply locally** to update `tokens/design-tokens.ts` and regenerate the runtime files, or copy the source line for a manual edit.
5. For a 3D scene color, reload the main site in a new tab so the legacy WebGL module is recreated.
6. Generate and validate:

   ```bash
   npm run tokens:generate
   npm run tokens:check
   npm run build
   ```

7. Commit **only the source-token change** (plus any intentional component use changes). Generated files are ignored.

## How values reach the application

```text
 tokens/design-tokens.ts
       │
       ├── Tailwind config imports tokens directly
       │       └── bg-surface-*, text-content-*, border-edge-* utilities
       │
       ├── npm run tokens:generate
       │       ├── tokens/generated.css
       │       │       └── app/globals.css imports semantic CSS variables
       │       └── public/_astro/scene-tokens.js
       │               └── legacy WebGL main thread + worker
       │
       └── React / Three.js imports tokens directly
```

`/token-studio` is a local development tool only. In development it can write the selected token back to `tokens/design-tokens.ts` through `POST /api/token-studio`. That route returns 404 in production, so visual edits remain version-controlled code changes.
