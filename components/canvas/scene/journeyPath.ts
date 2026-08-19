/**
 * journeyPath.ts
 * Re-exports from sceneConfig / journeyMath for backward compatibility.
 */

import { SCENE_CONFIG } from './sceneConfig';
import { sampleSceneJourney } from './journeyMath';

export { SCENE_CONFIG, sampleSceneJourney };

export interface JourneyStop {
  readonly id: string;
  readonly camera: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export const JOURNEY = SCENE_CONFIG.stops;
export const FINALE = SCENE_CONFIG.stops[SCENE_CONFIG.stops.length - 1];

export const sampleJourney = (
  t: number,
  out: { camera: [number, number, number]; target: [number, number, number] },
) => {
  const sampled = {
    camera: [0, 0, 0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 45,
  };
  sampleSceneJourney(t, sampled);
  out.camera[0] = sampled.camera[0];
  out.camera[1] = sampled.camera[1];
  out.camera[2] = sampled.camera[2];
  out.target[0] = sampled.target[0];
  out.target[1] = sampled.target[1];
  out.target[2] = sampled.target[2];
};
