/**
 * supportGroup.ts — Phase 5: "Support"
 *
 * - A network_server_rack.glb (or procedural fallback) as the operational rack
 * - Glowing data streams (tube geometries with flowing shader) entering from
 *   the left and exiting to the right
 * - A floating "remote-hand" glyph (an abstract wrench + hand shape built
 *   from primitives) hovering over the rack
 * - A security shield ring rotating around the whole assembly
 * - Floating metric panels with procedurally drawn text (UPTIME, IOPS, etc.)
 */

import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';

const METRIC_PANELS = ['UPTIME', 'IOPS', 'CAPACITY', 'LATENCY'];
const METRIC_VALUES = ['99.99%', '125K', '2.4 PB', '< 2 ms'];

export interface SupportGroup {
  group: THREE.Group;
  update: (delta: number, elapsed: number, weight: number) => void;
  dispose: () => void;
}

function makeMetricTexture(label: string, value: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f1226';
  ctx.fillRect(0, 0, 512, 256);
  // Border
  ctx.strokeStyle = '#57cdff';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 240);
  // Label
  ctx.fillStyle = '#a7d0fb';
  ctx.font = '500 32px "Roboto", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, 32, 32);
  // Value
  ctx.fillStyle = '#57cdff';
  ctx.font = '700 88px "Roboto", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value, 256, 90);
  // A "live" indicator
  ctx.fillStyle = '#69f29c';
  ctx.beginPath();
  ctx.arc(440, 56, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#69f29c';
  ctx.font = '500 20px "Roboto", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('LIVE', 420, 46);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSupportGroup(opts: {
  x: number;
  rackTemplate: THREE.Object3D | null;
}): SupportGroup {
  const root = new THREE.Group();
  root.position.set(opts.x, 0, 0);
  root.name = 'supportGroup';

  const t = tokens.dataStorageScene;

  // ─── Operational rack (GLB or procedural) ─────────────────────────────
  if (opts.rackTemplate) {
    const rack = opts.rackTemplate.clone(true);
    rack.traverse((child: any) => {
      if (child.isMesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.color = new THREE.Color(t.rackFrame);
          mat.emissive = new THREE.Color(t.rackEdge);
          mat.emissiveIntensity = 0.1;
          mat.metalness = 0.7;
          mat.roughness = 0.4;
        }
      }
    });
    rack.position.set(0, 0.5, 0);
    rack.scale.set(1.4, 1.0, 1.4);
    root.add(rack);
  } else {
    // Procedural fallback: a clean operational rack with 8 filled units
    const rackGeo = new THREE.BoxGeometry(2.4, 4.5, 1.6);
    const rackMat = new THREE.MeshStandardMaterial({
      color: t.rackFrame,
      metalness: 0.7,
      roughness: 0.4,
    });
    const rack = new THREE.Mesh(rackGeo, rackMat);
    rack.position.y = 0.75;
    root.add(rack);

    for (let i = 0; i < 8; i++) {
      const u = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.38, 1.4),
        new THREE.MeshStandardMaterial({
          color: t.insertSlotFilled,
          emissive: t.statusLED,
          emissiveIntensity: 0.2,
        })
      );
      u.position.set(0, -1.6 + i * 0.45, 0);
      root.add(u);

      // Green LED
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: t.statusLED })
      );
      led.position.set(0.85, 0, 0.71);
      u.add(led);
    }
  }

  // ─── Data streams (tubes with flowing shader) ─────────────────────────
  const streamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(t.dataStream) },
      uOpacity: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying float vX;
      void main() {
        vX = uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vX;
      void main() {
        float flow = fract(vX * 6.0 - uTime * 1.2);
        float band = smoothstep(0.0, 0.05, flow) * (1.0 - smoothstep(0.05, 0.3, flow));
        vec3 col = uColor * (0.5 + band * 1.5);
        float a = uOpacity * (0.5 + band * 0.8);
        gl_FragColor = vec4(col, a);
      }
    `,
  });

  const streamGroup = new THREE.Group();
  streamGroup.name = 'dataStreams';

  // Incoming stream (left → rack)
  const inPts = [
    new THREE.Vector3(-7, 0.5, 0.5),
    new THREE.Vector3(-4, 1.0, 0.5),
    new THREE.Vector3(-2, 1.0, 0.4),
    new THREE.Vector3(0, 0.8, 0.2),
  ];
  const inCurve = new THREE.CatmullRomCurve3(inPts);
  const inTube = new THREE.Mesh(
    new THREE.TubeGeometry(inCurve, 64, 0.06, 8, false),
    streamMat
  );
  streamGroup.add(inTube);

  // Outgoing stream (rack → right)
  const outPts = [
    new THREE.Vector3(0, 0.5, -0.5),
    new THREE.Vector3(2, 0.5, -0.5),
    new THREE.Vector3(4, 1.0, -0.5),
    new THREE.Vector3(7, 0.5, -0.5),
  ];
  const outCurve = new THREE.CatmullRomCurve3(outPts);
  const outTube = new THREE.Mesh(
    new THREE.TubeGeometry(outCurve, 64, 0.06, 8, false),
    streamMat
  );
  streamGroup.add(outTube);

  root.add(streamGroup);

  // ─── Remote-hand glyph (abstract wrench + hand) ───────────────────────
  // We build it from a small box (the "wrench handle") and a sphere on top
  // (the "hand"), plus a slowly rotating ring around it.
  const handGroup = new THREE.Group();
  handGroup.name = 'remoteHand';

  // Wrench handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.2, 12),
    new THREE.MeshStandardMaterial({
      color: t.remoteHand,
      emissive: t.remoteHand,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.3,
    })
  );
  handle.position.y = -0.6;
  handGroup.add(handle);

  // Wrench head (open-end style: a box with a notch)
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.2),
    new THREE.MeshStandardMaterial({
      color: t.remoteHand,
      emissive: t.remoteHand,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.3,
    })
  );
  head.position.y = 0.2;
  handGroup.add(head);

  // Halo ring around the hand
  const handRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.025, 8, 48),
    new THREE.MeshBasicMaterial({
      color: t.remoteHand,
      transparent: true,
      opacity: 0.6,
    })
  );
  handRing.rotation.x = Math.PI / 2;
  handGroup.add(handRing);

  handGroup.position.set(0, 4.5, 0);
  root.add(handGroup);

  // ─── Shield ring (rotating around the whole assembly) ────────────────
  const shieldGeo = new THREE.TorusGeometry(3.5, 0.05, 12, 96);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: t.shieldRing,
    transparent: true,
    opacity: 0.5,
  });
  const shieldRing = new THREE.Mesh(shieldGeo, shieldMat);
  shieldRing.rotation.x = Math.PI / 2;
  shieldRing.position.y = 0.5;
  root.add(shieldRing);

  // Second, perpendicular shield ring for a fuller 3D cage look
  const shieldRing2 = new THREE.Mesh(shieldGeo, shieldMat.clone());
  shieldRing2.rotation.x = Math.PI / 4;
  shieldRing2.rotation.y = Math.PI / 4;
  shieldRing2.position.y = 0.5;
  root.add(shieldRing2);

  // ─── Metric panels (4 holographic cards) ──────────────────────────────
  const metricGroup = new THREE.Group();
  metricGroup.name = 'metricPanels';
  const metricMeshes: THREE.Mesh[] = [];
  METRIC_PANELS.forEach((label, i) => {
    const tex = makeMetricTexture(label, METRIC_VALUES[i]);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), mat);
    // Place 4 panels in a 2x2 grid above-right of the rack
    const col = i % 2;
    const row = Math.floor(i / 2);
    mesh.position.set(3.2 + col * 1.7, 3.2 - row * 1.0, 0);
    mesh.lookAt(0, mesh.position.y, 5); // face camera roughly
    metricGroup.add(mesh);
    metricMeshes.push(mesh);
  });
  root.add(metricGroup);

  // ─── Update ───────────────────────────────────────────────────────────
  const update = (_delta: number, elapsed: number, weight: number) => {
    const w = THREE.MathUtils.clamp(weight, 0, 1);
    root.visible = w > 0.01;

    // Data streams: opacity scales with weight, time animates flow
    streamMat.uniforms.uTime.value = elapsed;
    streamMat.uniforms.uOpacity.value = w;

    // Remote-hand floats + rotates
    handGroup.position.y = 4.5 + Math.sin(elapsed * 0.8) * 0.2;
    handGroup.rotation.y = elapsed * 0.4;
    handRing.rotation.z = elapsed * 1.2;

    // Shield rings counter-rotate
    shieldRing.rotation.z = elapsed * 0.25;
    shieldRing2.rotation.z = -elapsed * 0.18;
    shieldMat.opacity = 0.5 * w;
    (shieldRing2.material as THREE.MeshBasicMaterial).opacity = 0.4 * w;

    // Metric panels gently bob
    metricMeshes.forEach((m, i) => {
      m.position.y = 3.2 - Math.floor(i / 2) * 1.0 + Math.sin(elapsed * 0.6 + i) * 0.08;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.9 * w;
    });
  };

  const dispose = () => {
    streamMat.dispose();
    inTube.geometry.dispose();
    outTube.geometry.dispose();
    shieldGeo.dispose();
    shieldMat.dispose();
    (shieldRing2.material as THREE.Material).dispose();
    handGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mm) => mm.dispose());
        else m.material?.dispose();
      }
    });
    metricMeshes.forEach((m) => {
      m.geometry.dispose();
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.dispose();
    });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !metricMeshes.includes(m) && m !== inTube && m !== outTube) {
        m.geometry?.dispose();
      }
    });
  };

  return { group: root, update, dispose };
}
