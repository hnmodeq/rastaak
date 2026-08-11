/**
 * chaosGroup.ts — Phase 1: "Data Crisis"
 *
 * - ~400 floating cube particles tumbling chaotically
 * - A few broken cable segments (curved tubes) dangling mid-air
 * - A pair of pulsing warning "lights" (red spheres)
 *
 * The whole group sways gently and the warning spheres pulse on a sine wave.
 * Weight comes from the scroll progress; the chaos dies down as the user
 * scrolls away (cubes fall, opacity fades).
 */

import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';

const PARTICLE_COUNT = 400;
const PARTICLE_AREA = 22; // half-extent of the chaos cube
const CABLE_COUNT = 6;
const WARNING_LIGHT_COUNT = 2;

export interface ChaosGroup {
  group: THREE.Group;
  update: (delta: number, elapsed: number, weight: number) => void;
  dispose: () => void;
}

export function createChaosGroup(opts: { x: number }): ChaosGroup {
  const root = new THREE.Group();
  root.position.set(opts.x, 0, 0);
  root.name = 'chaosGroup';

  const t = tokens.dataStorageScene;
  const accent = new THREE.Color(t.chaosParticle);
  const alarm = new THREE.Color(t.chaosAlarm);

  // ─── Particles (InstancedMesh for performance) ────────────────────────
  const particleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const particleMat = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  });
  const particles = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
  particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Per-instance spin / drift state
  const particleState: { pos: THREE.Vector3; spin: THREE.Vector3; phase: number }[] = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * PARTICLE_AREA * 2,
      (Math.random() - 0.5) * PARTICLE_AREA * 1.5 + 1,
      (Math.random() - 0.5) * PARTICLE_AREA * 2
    );
    particleState.push({
      pos,
      spin: new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      phase: Math.random() * Math.PI * 2,
    });
    dummy.position.copy(pos);
    dummy.updateMatrix();
    particles.setMatrixAt(i, dummy.matrix);
  }
  particles.instanceMatrix.needsUpdate = true;
  root.add(particles);

  // ─── Broken cables (curved tubes) ─────────────────────────────────────
  const cableGroup = new THREE.Group();
  cableGroup.name = 'chaosCables';
  for (let i = 0; i < CABLE_COUNT; i++) {
    const points: THREE.Vector3[] = [];
    const startX = (Math.random() - 0.5) * 16;
    const startY = Math.random() * 4 - 1;
    const startZ = (Math.random() - 0.5) * 16;
    for (let j = 0; j < 8; j++) {
      const t = j / 7;
      points.push(
        new THREE.Vector3(
          startX + Math.sin(t * Math.PI * 2 + i) * 2.5,
          startY + Math.cos(t * Math.PI + i) * 1.5 - t * 1.5, // dangle down
          startZ + (t - 0.5) * 4
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.06, 6, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: t.cableIdle,
      emissive: t.cableIdle,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.7,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    cableGroup.add(tube);
  }
  root.add(cableGroup);

  // ─── Warning lights (pulsing red spheres) ─────────────────────────────
  const warningLights: THREE.Mesh[] = [];
  for (let i = 0; i < WARNING_LIGHT_COUNT; i++) {
    const geo = new THREE.SphereGeometry(0.35, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: alarm,
      emissive: alarm,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(
      (i === 0 ? -1 : 1) * 4,
      3.5 + Math.sin(i) * 0.5,
      (i === 0 ? -1 : 1) * 2
    );
    root.add(m);
    warningLights.push(m);

    // Outer glow halo
    const haloGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: alarm,
      transparent: true,
      opacity: 0.15,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    m.add(halo);
  }

  // ─── Tilted broken rack (procedural fallback, no GLB needed) ─────────
  const brokenRack = new THREE.Group();
  brokenRack.name = 'brokenRack';
  const rackFrameMat = new THREE.MeshStandardMaterial({
    color: t.rackFrame,
    transparent: true,
    opacity: 0.85,
  });
  const rackFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2, 5, 1.5),
    rackFrameMat
  );
  brokenRack.add(rackFrame);
  for (let i = 0; i < 4; i++) {
    const unit = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 1.2),
      new THREE.MeshStandardMaterial({
        color: t.rackPanel,
        transparent: true,
        opacity: 0.85,
      })
    );
    unit.position.y = -1.8 + i * 0.9;
    brokenRack.add(unit);
  }
  brokenRack.position.set(0, 0.5, 0);
  brokenRack.rotation.z = 0.18; // tilted, broken
  root.add(brokenRack);

  // ─── update ───────────────────────────────────────────────────────────
  const update = (_delta: number, elapsed: number, weight: number) => {
    // Particles: tumble + drift, weight controls how alive they are
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = particleState[i];
      s.spin.x += 0.01 * (0.3 + weight);
      s.spin.y += 0.013 * (0.3 + weight);
      s.spin.z += 0.009 * (0.3 + weight);

      const drift = 0.05 * weight;
      const driftY = Math.sin(elapsed * 0.6 + s.phase) * drift;
      const driftX = Math.cos(elapsed * 0.4 + s.phase * 0.7) * drift;
      const driftZ = Math.sin(elapsed * 0.5 + s.phase * 1.1) * drift;

      dummy.position.set(
        s.pos.x + driftX,
        s.pos.y + driftY,
        s.pos.z + driftZ
      );
      dummy.rotation.set(s.spin.x, s.spin.y, s.spin.z);
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;

    // Warning lights pulse
    warningLights.forEach((l, i) => {
      const pulse = 0.6 + Math.sin(elapsed * 3 + i) * 0.4;
      (l.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 1.6 * weight;
      (l.material as THREE.MeshStandardMaterial).opacity = 0.4 + pulse * 0.5;
      const halo = l.children[0] as THREE.Mesh;
      if (halo) {
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.1 + pulse * 0.2 * weight;
        halo.scale.setScalar(0.8 + pulse * 0.4);
      }
    });

    // Cables sway
    cableGroup.children.forEach((c, i) => {
      c.rotation.z = Math.sin(elapsed * 0.7 + i) * 0.05;
      c.rotation.x = Math.cos(elapsed * 0.5 + i) * 0.05;
    });

    // Overall opacity & group fade by weight
    root.visible = weight > 0.01;
    const w = THREE.MathUtils.clamp(weight, 0, 1);
    particleMat.opacity = 0.9 * w;
    cableGroup.children.forEach((c) => {
      (c as THREE.Mesh).traverse((m) => {
        if ((m as THREE.Mesh).isMesh) {
          const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.transparent) mat.opacity = 0.7 * w;
        }
      });
    });
    brokenRack.children.forEach((c) => {
      const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.transparent) mat.opacity = 0.85 * w;
    });
  };

  const dispose = () => {
    particleGeo.dispose();
    particleMat.dispose();
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mm) => mm.dispose());
        else m.material?.dispose();
      }
    });
  };

  return { group: root, update, dispose };
}
