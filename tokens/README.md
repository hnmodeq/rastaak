# Rastaak token workflow

## One source of truth

**Edit only [`design-tokens.ts`](./design-tokens.ts).** It is the only hand-authored home for color values.

| Need to change | Edit this source field | Consumer |
| --- | --- | --- |
| UI colors, surfaces, text, borders, state, overlays | `tokens.colors.*` | CSS custom properties, Tailwind utilities, React inline styles |
| WebGL / Three.js colors | `tokens.scene.*` | `HeroCanvas3D`, the legacy WebGL renderer, and its worker |

The scene values are numeric because Three.js consumes numeric color representations. Do not add a matching CSS `scene*` token unless a CSS component genuinely needs the same semantic role.

## Generated files

`npm run tokens:generate` creates these **ignored build artifacts**:

- `tokens/generated.css` — CSS custom properties used by `app/globals.css`.
- `public/_astro/scene-tokens.js` — numeric scene values imported by the legacy WebGL bundle and worker.

They are intentionally not committed and are overwritten by every generator run. Never edit them manually.

## Safe edit workflow

1. In development, open [http://localhost:3000/token-studio](http://localhost:3000/token-studio).
2. Choose **UI colors** for `tokens.colors`, or **3D scene** for `tokens.scene`.
3. Adjust the native picker (and, for UI tokens, the OKLCH controls), then copy the generated source line.
4. Update that matching field in `tokens/design-tokens.ts`.
5. Generate and validate:

   ```bash
   npm run tokens:generate
   npm run tokens:check
   npm run build
   ```

6. Commit **only the source-token change** (plus any intentional component use changes). Generated files are ignored.

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

`/token-studio` is a local development tool only. It deliberately has no write API and returns 404 in a production build, so visual edits remain version-controlled code changes.
