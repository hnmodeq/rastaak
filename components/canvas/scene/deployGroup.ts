/**
 * deployGroup.ts — Phase 4: "Deploy"
 *
 * - The data_center_rack.glb is used as the "rack frame" (cloned so we can
 *   also keep the original in the support phase if desired)
 * - Procedural "storage units" slide INTO the rack from above with a stagger
 * - Glowing cables plug into the back of each unit as it lands
 * - Status LEDs on each unit go from amber → green
 *
 * The animation is time-based but only progresses meaningfully while the
 * group has weight (i.e. user is in this phase). When weight drops, the
 * animation pauses; when it returns, it resumes.
 */

import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';

const UNIT_COUNT = 6;             // number of storage units in the rack
const RACK_SLOT_COUNT = 8;        // visible slots in the rack
const SLOT_HEIGHT = 0.42;
const SLOT_BASE_Y = -1.6;
const INSERT_DURATION = 0.6;      // seconds per unit
const INSERT_STAGGER = 0.18;      // delay between units
const CABLE_COLOR = new THREE.Color(tokens.dataStorageScene.cableActive);
const CABLE_IDLE = new THREE.Color(tokens.dataStorageScene.cableIdle);

export interface DeployGroup {
  group: THREE.Group;
  update: (delta: number, elapsed: number, weight: number) => void;
  dispose: () => void;
}

interface UnitEntry {
  mesh: THREE.Mesh;
  led: THREE.Mesh;
  cable: THREE.Mesh;
  insertStart: number;   // when this unit's insert begins (in 'progress' time)
  insertEnd: number;
  cableProgress: number; // 0..1, builds after insert finishes
}

export function createDeployGroup(opts: {
  x: number;
  rackTemplate: THREE.Object3D | null;
}): DeployGroup {
  const root = new THREE.Group();
  root.position.set(opts.x, 0, 0);
  root.name = 'deployGroup';

  const t = tokens.dataStorageScene;
  const units: UnitEntry[] = [];
  let progress = 0; // 0..1, drives the entire insert sequence

  // ─── Rack frame (GLB if available, else procedural fallback) ──────────
  if (opts.rackTemplate) {
    // Clone the GLB so we can scale/position independently
    const rack = opts.rackTemplate.clone(true);
    rack.traverse((child: any) => {
      if (child.isMesh) {
        // Recolor to match the data storage palette
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat) {
          if (child.name.toLowerCase().includes('frame') || child.name === 'Object_2') {
            mat.color = new THREE.Color(t.rackFrame);
            mat.metalness = 0.7;
            mat.roughness = 0.4;
          } else {
            mat.color = new THREE.Color(t.rackPanel);
            mat.metalness = 0.5;
            mat.roughness = 0.6;
          }
          mat.emissive = new THREE.Color(t.rackEdge);
          mat.emissiveIntensity = 0.05;
        }
      }
    });
    rack.position.set(0, 0.5, 0);
    rack.scale.set(1.4, 1.0, 1.4);
    root.add(rack);
  } else {
    // Procedural fallback rack
    const rackGeo = new THREE.BoxGeometry(2.4, 4.5, 1.6);
    const rackMat = new THREE.MeshStandardMaterial({
      color: t.rackFrame,
      metalness: 0.7,
      roughness: 0.4,
      transparent: true,
      opacity: 0.95,
    });
    const rack = new THREE.Mesh(rackGeo, rackMat);
    rack.position.y = 0.75;
    root.add(rack);

    // Empty slots (visible placeholders)
    for (let i = 0; i < RACK_SLOT_COUNT; i++) {
      const slotGeo = new THREE.BoxGeometry(2.0, SLOT_HEIGHT - 0.05, 1.4);
      const slotMat = new THREE.MeshStandardMaterial({
        color: t.insertSlotEmpty,
        emissive: t.insertSlotEmpty,
        emissiveIntensity: 0.1,
      });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.set(0, SLOT_BASE_Y + i * SLOT_HEIGHT, 0);
      root.add(slot);
    }
  }

  // ─── Storage units (slide in from above) ──────────────────────────────
  const unitGeo = new THREE.BoxGeometry(2.0, SLOT_HEIGHT - 0.05, 1.4);
  for (let i = 0; i < UNIT_COUNT; i++) {
    const unitMat = new THREE.MeshStandardMaterial({
      color: t.rackPanel,
      metalness: 0.6,
      roughness: 0.4,
      emissive: t.rackEdge,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 1.0,
    });
    const mesh = new THREE.Mesh(unitGeo, unitMat);
    // Start position: high above the rack
    mesh.position.set(0, 8 + i * 0.3, 0);
    mesh.visible = false;
    root.add(mesh);

    // Status LED on the front of the unit
    const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({
      color: t.statusLEDpending,
      transparent: true,
      opacity: 1.0,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.85, 0, 0.71);
    mesh.add(led);

    // Cable (a tube going from the back of the unit to the floor)
    const cablePoints = [
      new THREE.Vector3(0, 0, -0.7),
      new THREE.Vector3(0, -1.5, -0.7),
      new THREE.Vector3(0, -2, -0.5),
    ];
    const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
    const cableGeo = new THREE.TubeGeometry(cableCurve, 16, 0.025, 6, false);
    const cableMat = new THREE.MeshBasicMaterial({
      color: CABLE_IDLE,
      transparent: true,
      opacity: 0.0, // hidden until unit lands
    });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    mesh.add(cable);

    units.push({
      mesh,
      led,
      cable,
      insertStart: i * INSERT_STAGGER,
      insertEnd: i * INSERT_STAGGER + INSERT_DURATION,
      cableProgress: 0,
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────
  const update = (delta: number, _elapsed: number, weight: number) => {
    const w = THREE.MathUtils.clamp(weight, 0, 1);
    root.visible = w > 0.01;

    // Drive the insert progress only when this phase is in view
    progress += delta * 0.6 * w;
    progress = Math.min(progress, 1.5); // a little headroom so cables finish

    units.forEach((u, i) => {
      // Local progress 0..1 for this unit (0 = pre-insert, 1 = fully in)
      const local =
        progress <= u.insertStart
          ? -1
          : progress >= u.insertEnd
            ? 1
            : (progress - u.insertStart) / (u.insertEnd - u.insertStart);

      if (local < 0) {
        u.mesh.visible = false;
        return;
      }
      u.mesh.visible = true;

      // Ease-out cubic for a snappy landing
      const t01 = 1 - Math.pow(1 - local, 3);
      const targetY = SLOT_BASE_Y + i * SLOT_HEIGHT;
      u.mesh.position.x = THREE.MathUtils.lerp(0.5, 0, t01);
      u.mesh.position.y = THREE.MathUtils.lerp(8, targetY, t01);
      u.mesh.position.z = THREE.MathUtils.lerp(0.3, 0, t01);
      u.mesh.rotation.z = THREE.MathUtils.lerp(0.15, 0, t01);

      // LED: amber while inserting, green when settled
      const settled = local >= 1;
      const ledColor = settled ? t.statusLED : t.statusLEDpending;
      (u.led.material as THREE.MeshBasicMaterial).color.set(ledColor);
      (u.led.material as THREE.MeshBasicMaterial).opacity = settled
        ? 0.6 + Math.sin(_elapsed * 4 + i) * 0.4
        : 1.0;

      // Cable plugs in after unit lands
      if (settled) {
        u.cableProgress = Math.min(1, u.cableProgress + delta * 1.2);
      }
      const cableT = u.cableProgress;
      (u.cable.material as THREE.MeshBasicMaterial).opacity = cableT * w;
      (u.cable.material as THREE.MeshBasicMaterial).color.lerpColors(
        CABLE_IDLE,
        CABLE_COLOR,
        cableT
      );
    });
  };

  const dispose = () => {
    unitGeo.dispose();
    units.forEach((u) => {
      (u.mesh.material as THREE.Material).dispose();
      (u.led.geometry as THREE.BufferGeometry).dispose();
      (u.led.material as THREE.Material).dispose();
      (u.cable.geometry as THREE.BufferGeometry).dispose();
      (u.cable.material as THREE.Material).dispose();
    });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry && !units.find((u) => u.mesh === m)) {
        m.geometry.dispose();
      }
    });
  };

  return { group: root, update, dispose };
}
