/**
 * journeyPath.ts
 *
 * Scrollytelling route through Rastaak-3D-Scene-Ver-IV.glb.
 *
 * Landmarks measured from world positions in GLB:
 *   Bank Building:                   [13.36, 0.02, -4.39]
 *   Government Building:             [9.94,  0.02, -2.41]
 *   Industry Building:               [16.68, 0.02,  0.48]
 *   Government Organization Building: [14.35, 0.02,  2.87]
 *   Rastaak Building:                [15.91, 0.02,  2.61]
 *   Logo:                            [16.07, 4.10,  2.20]
 */

export interface JourneyStop {
  readonly id: string;
  readonly camera: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export const JOURNEY: readonly JourneyStop[] = [
  {
    // Beat 1: Overview of Customer Buildings (Bank & Government) & Red Data Alert
    id: 'request',
    camera: [2.0, 16.0, -14.0],
    target: [13.0, 1.5, -2.0],
  },
  {
    // Beat 2: Zooming into Rastaak Building Base (Analysis & Intake)
    id: 'analyze',
    camera: [7.0, 6.0, 0.0],
    target: [15.9, 2.5, 2.6],
  },
  {
    // Beat 3: Spiraling up Rastaak Mid-Floors (Solution Architecture & Staffing)
    id: 'solution',
    camera: [22.0, 12.0, 5.0],
    target: [15.9, 8.0, 2.6],
  },
  {
    // Beat 4: Top Spire View Firing Blue Protection Lasers across the City
    id: 'shield',
    camera: [18.0, 16.0, 8.0],
    target: [12.0, 1.5, -2.0],
  },
];

export const FINALE: JourneyStop = {
  id: 'logo',
  camera: [6.0, 22.0, -8.0],
  target: [16.0, 3.5, 2.2],
};

export const LANDMARKS = {
  bank: [13.36, 1.2, -4.39],
  gov: [9.94, 1.2, -2.41],
  industry: [16.68, 1.2, 0.48],
  govOrg: [14.35, 1.2, 2.87],
  rastaakBase: [15.91, 1.5, 2.61],
  rastaakMid: [15.91, 6.0, 2.61],
  rastaakTop: [15.91, 12.0, 2.61],
  logo: [16.07, 4.10, 2.20],
} as const;

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
