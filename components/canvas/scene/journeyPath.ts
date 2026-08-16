/**
 * journeyPath
 *
 * The A→B route through the authored Blender world
 * (`/glb/Rastaak-3D-Scene.glb`).
 *
 * The scene was modelled as a line of landmarks along the Z axis, so the
 * "story" is already baked into the geometry — we only have to walk it.
 * World-space centres measured from the GLB node graph:
 *
 *   Z = -82   buildings + cooling tower, Organization/Industry/Company/Bank text
 *   Z = -43   Rastaak Logo Small
 *   Z = +14   Wrench
 *   Z = +30…45  Data Storage (server stacks + headset figure)
 *   Z = +66   Rastaak Logo Big   ← the finale, "B"
 *
 * Scroll 0 starts at the organisations and scroll 1 lands on the big logo.
 */

export interface JourneyStop {
  /** Human label — matches the story beat. */
  readonly id: string;
  /** Where the camera sits, world space. */
  readonly camera: readonly [number, number, number];
  /** Where the camera aims, world space. */
  readonly target: readonly [number, number, number];
}

/**
 * Five stops mapped onto the five story beats. Camera positions are offset
 * to the +X side of the landmarks so the travelling shot sweeps past them
 * rather than driving through them.
 */
export const JOURNEY: readonly JourneyStop[] = [
  {
    // 1. Chaos — the organisations: cooling tower, office blocks and the
    //    Industry / Company / Organization / Bank labels. Wide and cold.
    id: 'chaos',
    camera: [10, 22, -130],
    target: [-10, 8, -82],
  },
  {
    // 2. Assessment — we close in; the small Rastaak logo comes into view.
    id: 'assessment',
    camera: [4, 15, -82],
    target: [-14, 4, -43],
  },
  {
    // 3. Recommend — mid-path, travelling toward the proposal.
    id: 'recommend',
    camera: [0, 12, -34],
    target: [-15, 4, 0],
  },
  {
    // 4. Deploy — the wrench: installation and hands-on rollout.
    id: 'deploy',
    camera: [-3, 10, -12],
    target: [-15, 3.5, 14],
  },
  {
    // 5. Support — server stacks with the headset operator, 24/7 cover.
    id: 'support',
    camera: [-6, 10, 20],
    target: [-14.6, 3, 44.5],
  },
];

/**
 * The finale. Kept separate from JOURNEY because the logo is the resolution
 * of the story, not a sixth stop — the camera eases onto it over the tail of
 * the scroll while the Support beat is still on screen.
 *
 * Deliberately aimed well BELOW the logo: at the foot of the page the opaque
 * CTA/footer sections cover the bottom of the viewport, so a low aim point
 * pushes the mark up into the band of canvas that stays visible.
 */
export const FINALE: JourneyStop = {
  id: 'logo',
  camera: [-13, 20, 90],
  target: [-11, -7, 59],
};

/** Landmark world positions, for anything that needs to reference them. */
export const LANDMARKS = {
  logoBig: [-14.9, 2.7, 66.1],
  logoSmall: [-14.4, 2.1, -42.6],
  dataStorage: [-14.6, 2.7, 44.5],
  wrench: [-15.3, 3.3, 13.6],
  industryText: [-3.3, 13.3, -81.9],
} as const;

/**
 * Sample the path at `t` (0..1).
 *
 * Uses Catmull-Rom style interpolation across the stops so the camera curves
 * between landmarks instead of snapping in straight lines between them. The
 * endpoints are duplicated so the curve starts and ends cleanly.
 */
export function sampleJourney(
  t: number,
  out: { camera: [number, number, number]; target: [number, number, number] },
): void {
  const stops = JOURNEY;
  const n = stops.length - 1;
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const scaled = clamped * n;
  const i = Math.min(Math.floor(scaled), n - 1);
  const f = scaled - i;

  const p0 = stops[Math.max(i - 1, 0)];
  const p1 = stops[i];
  const p2 = stops[i + 1];
  const p3 = stops[Math.min(i + 2, n)];

  for (let axis = 0; axis < 3; axis++) {
    out.camera[axis] = catmullRom(
      p0.camera[axis],
      p1.camera[axis],
      p2.camera[axis],
      p3.camera[axis],
      f,
    );
    out.target[axis] = catmullRom(
      p0.target[axis],
      p1.target[axis],
      p2.target[axis],
      p3.target[axis],
      f,
    );
  }
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}
