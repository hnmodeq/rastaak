/**
 * scrollPath.ts
 *
 * Maps page scroll (0..1) to a 5-phase journey. Each phase has an X anchor
 * and a `lookY` (the height the camera aims at). The phase-progress helper
 * returns:
 *   - active: the dominant phase index
 *   - distances: per-phase weight (0..1) that drops off as you scroll away
 */

import * as THREE from 'three';

export enum Phase {
  Chaos = 0,
  Assessment = 1,
  Recommend = 2,
  Deploy = 3,
  Support = 4,
}

export const PHASE_COUNT = 5;

export interface PhaseAnchor {
  x: number;
  lookY: number;
}

export const createScrollPath = (): PhaseAnchor[] => [
  { x: -30, lookY: 1.5 },   // Chaos
  { x: -15, lookY: 2.5 },   // Assessment
  { x:   0, lookY: 2.5 },   // Recommend
  { x:  15, lookY: 2.0 },   // Deploy
  { x:  30, lookY: 3.0 },   // Support
];

export interface PhaseState {
  active: Phase;
  distances: number[]; // length PHASE_COUNT, 0..1
}

/**
 * Convert scroll progress (0..1) to a soft per-phase weight using a
 * Gaussian falloff centered on each phase center. Adjacent phases
 * cross-fade so transitions feel smooth.
 */
export function phaseProgress(scroll: number): PhaseState {
  const s = THREE.MathUtils.clamp(scroll, 0, 1);
  const centers = [0.0, 0.25, 0.5, 0.75, 1.0];
  const sigma = 0.18;
  const distances = centers.map((c) => {
    const d = (s - c) / sigma;
    return Math.exp(-0.5 * d * d);
  });

  let active: Phase = 0;
  let max = -Infinity;
  for (let i = 0; i < distances.length; i++) {
    if (distances[i] > max) {
      max = distances[i];
      active = i as Phase;
    }
  }

  return { active, distances };
}
