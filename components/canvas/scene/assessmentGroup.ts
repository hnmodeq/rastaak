/**
 * assessmentGroup.ts — Phase 2: "Assessment"
 *
 * - A vertical scanner beam (a downward-pointing cone with a glow material)
 * - A holographic blueprint (a thin wireframe box + a rotating ring)
 * - A "data point cloud" (sparse particles) that gets organized by the beam
 *
 * The beam rotates around the Y axis and a sweep shader highlights parts of
 * the blueprint it passes over.
 */

import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';

export interface AssessmentGroup {
  group: THREE.Group;
  update: (delta: number, elapsed: number, weight: number) => void;
  dispose: () => void;
}

export function createAssessmentGroup(opts: { x: number }): AssessmentGroup {
  const root = new THREE.Group();
  root.position.set(opts.x, 0, 0);
  root.name = 'assessmentGroup';

  const t = tokens.dataStorageScene;
  const beamColor = new THREE.Color(t.scannerBeam);
  const coreColor = new THREE.Color(t.scannerCore);

  // ─── Holographic blueprint: a wireframe box ──────────────────────────
  const blueprint = new THREE.Group();
  blueprint.name = 'blueprint';
  const bpGeo = new THREE.BoxGeometry(3.5, 4, 2.5);
  const bpEdges = new THREE.EdgesGeometry(bpGeo);
  const bpMat = new THREE.LineBasicMaterial({
    color: t.hologramEdge,
    transparent: true,
    opacity: 0.7,
  });
  const bpLines = new THREE.LineSegments(bpEdges, bpMat);
  blueprint.add(bpLines);

  // Inner translucent fill
  const bpFill = new THREE.Mesh(
    bpGeo,
    new THREE.MeshBasicMaterial({
      color: t.hologramFill,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    })
  );
  blueprint.add(bpFill);

  // Rotating "data ring" around the blueprint
  const ringGeo = new THREE.TorusGeometry(2.6, 0.04, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: t.hologramEdge,
    transparent: true,
    opacity: 0.6,
  });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2;
  blueprint.add(ring1);

  const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
  ring2.rotation.x = Math.PI / 4;
  ring2.rotation.y = Math.PI / 4;
  blueprint.add(ring2);

  // Small grid lines on the floor beneath the blueprint
  const localGrid = new THREE.GridHelper(8, 16, t.hologramEdge, t.hologramFill);
  (localGrid.material as THREE.LineBasicMaterial).transparent = true;
  (localGrid.material as THREE.LineBasicMaterial).opacity = 0.25;
  localGrid.position.y = -2;
  blueprint.add(localGrid);

  blueprint.position.set(0, 1.5, 0);
  root.add(blueprint);

  // ─── Scanner beam (vertical cone sweeping the blueprint) ──────────────
  // Cone tip up, base down (a downward "scan" beam)
  const beamGeo = new THREE.ConeGeometry(1.4, 7, 32, 1, true);
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: beamColor },
      uCore: { value: coreColor },
      uOpacity: { value: 0.5 },
    },
    vertexShader: /* glsl */ `
      varying float vY;
      void main() {
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uCore;
      uniform float uOpacity;
      varying float vY;
      void main() {
        // vY ranges roughly -3.5 .. +3.5 in local space
        float t = (vY + 3.5) / 7.0;
        float sweep = fract(t - uTime * 0.4);
        float ring = smoothstep(0.0, 0.05, sweep) * (1.0 - smoothstep(0.05, 0.5, sweep));
        float fade = 1.0 - abs(t - 0.5) * 1.5;
        vec3 col = mix(uColor, uCore, ring);
        float a = uOpacity * fade * (0.5 + ring * 1.2);
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 1.5, 0);
  beam.rotation.x = Math.PI; // tip up, base down
  root.add(beam);

  // A bright "core line" running vertically through the beam
  const coreLineGeo = new THREE.CylinderGeometry(0.03, 0.03, 7, 8);
  const coreLineMat = new THREE.MeshBasicMaterial({
    color: coreColor,
    transparent: true,
    opacity: 0.9,
  });
  const coreLine = new THREE.Mesh(coreLineGeo, coreLineMat);
  coreLine.position.set(0, 1.5, 0);
  root.add(coreLine);

  // ─── Update ───────────────────────────────────────────────────────────
  const update = (_delta: number, elapsed: number, weight: number) => {
    beamMat.uniforms.uTime.value = elapsed;

    // Holographic blueprint gentle rotation + ring spin
    blueprint.rotation.y = elapsed * 0.2;
    ring1.rotation.z = elapsed * 0.6;
    ring2.rotation.z = -elapsed * 0.4;

    // Beam bob
    beam.position.y = 1.5 + Math.sin(elapsed * 0.8) * 0.1;
    coreLine.position.y = beam.position.y;

    // Fade by weight
    const w = THREE.MathUtils.clamp(weight, 0, 1);
    root.visible = w > 0.01;
    beamMat.uniforms.uOpacity.value = 0.5 * w;
    (bpMat as THREE.LineBasicMaterial).opacity = 0.7 * w;
    (bpFill.material as THREE.MeshBasicMaterial).opacity = 0.08 * w;
    (ringMat as THREE.MeshBasicMaterial).opacity = 0.6 * w;
    (ring2.material as THREE.MeshBasicMaterial).opacity = 0.6 * w;
    (localGrid.material as THREE.LineBasicMaterial).opacity = 0.25 * w;
    (coreLineMat as THREE.MeshBasicMaterial).opacity = 0.9 * w;
  };

  const dispose = () => {
    beamGeo.dispose();
    beamMat.dispose();
    coreLineGeo.dispose();
    coreLineMat.dispose();
    bpGeo.dispose();
    bpEdges.dispose();
    bpMat.dispose();
    (bpFill.material as THREE.Material).dispose();
    ringGeo.dispose();
    ringMat.dispose();
    (localGrid.material as THREE.Material).dispose();
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && m !== bpFill) m.geometry.dispose();
    });
  };

  return { group: root, update, dispose };
}
