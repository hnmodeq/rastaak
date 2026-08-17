/**
 * journeyPath.ts
 *
 * Cinematic roadmap through Rastaak-3D-Scene-Ver-IV.glb.
 */

export interface JourneyStop {
  readonly id: string;
  readonly camera: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export const JOURNEY: readonly JourneyStop[] = [
  {
    // Beat 1 (t = 0.00): High isometric wide overview of client buildings
    id: 'overview',
    camera: [0.0, 22.0, -18.0],
    target: [14.0, 2.0, -1.0],
  },
  {
    // Beat 2 (t = 0.25): Gliding low along street towards Rastaak Building front
    id: 'approach',
    camera: [6.0, 7.0, -6.0],
    target: [15.9, 2.0, 2.6],
  },
  {
    // Beat 3 (t = 0.50): Ascending spiral around Rastaak Building
    id: 'ascent',
    camera: [26.0, 14.0, 6.0],
    target: [15.9, 8.0, 2.6],
  },
  {
    // Beat 4 (t = 0.75): High angle from Rastaak Spire looking over the city
    id: 'spire',
    camera: [20.0, 22.0, 10.0],
    target: [12.0, 2.0, -2.0],
  },
];

export const FINALE: JourneyStop = {
  // Beat 5 (t = 1.00): Elevated top-down view looking at Rastaak Logo
  id: 'logo',
  camera: [8.0, 24.0, -6.0],
  target: [16.0, 3.8, 2.2],
};

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
