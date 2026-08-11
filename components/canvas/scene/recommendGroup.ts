/**
 * recommendGroup.ts — Phase 3: "Recommend"
 *
 * Three floating "vendor cards" representing the brands the company sells.
 * Each card is a thin box with a glowing accent edge and a label texture
 * procedurally drawn on a canvas (QNAP, Dell, HPE).
 *
 * The cards orbit slowly around the phase anchor and face outward.
 */

import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';

interface CardSpec {
  label: string;
  accent: number;
  sub: string;
}

const CARDS: CardSpec[] = [
  { label: 'QNAP', accent: tokens.dataStorageScene.cardAccent, sub: 'NAS / SAN' },
  { label: 'Dell', accent: tokens.dataStorageScene.cardAccentDell, sub: 'PowerScale / PowerStore' },
  { label: 'HPE', accent: tokens.dataStorageScene.cardAccentHpe, sub: 'Alletra / Primera' },
];

const CARD_W = 1.8;
const CARD_H = 2.4;
const CARD_D = 0.08;
const ORBIT_RADIUS = 3.2;

export interface RecommendGroup {
  group: THREE.Group;
  update: (delta: number, elapsed: number, weight: number) => void;
  dispose: () => void;
}

function makeLabelTexture(spec: CardSpec): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 680;
  const ctx = canvas.getContext('2d')!;
  // BG
  ctx.fillStyle = '#1e2240';
  ctx.fillRect(0, 0, 512, 680);
  // Accent bar
  ctx.fillStyle = '#' + spec.accent.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 512, 8);
  // Sub
  ctx.fillStyle = '#a7d0fb';
  ctx.font = '500 36px "Roboto", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(spec.sub.toUpperCase(), 256, 60);
  // Brand name
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 96px "Roboto", system-ui, sans-serif';
  ctx.fillText(spec.label, 256, 220);
  // A small spec block to look "techy"
  ctx.strokeStyle = '#57cdff';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 460, 432, 160);
  ctx.fillStyle = '#57cdff';
  ctx.font = '500 24px "Roboto", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('▸ Enterprise-grade', 70, 490);
  ctx.fillText('▸ 24/7 Support', 70, 530);
  ctx.fillText('▸ Certified deployment', 70, 570);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRecommendGroup(opts: { x: number }): RecommendGroup {
  const root = new THREE.Group();
  root.position.set(opts.x, 0, 0);
  root.name = 'recommendGroup';

  const t = tokens.dataStorageScene;
  const cards: THREE.Mesh[] = [];
  const edges: THREE.LineSegments[] = [];
  const accents: THREE.Mesh[] = [];

  CARDS.forEach((spec) => {
    // Card body
    const geo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D);
    const tex = makeLabelTexture(spec);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: new THREE.Color(t.cardBase),
      emissive: new THREE.Color(spec.accent),
      emissiveIntensity: 0.18,
      metalness: 0.4,
      roughness: 0.6,
      transparent: true,
      opacity: 1.0,
    });
    const card = new THREE.Mesh(geo, mat);
    card.userData.spec = spec;

    // Glowing edge frame
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: spec.accent,
      transparent: true,
      opacity: 0.9,
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    card.add(edgeLines);

    // Accent strip on top
    const stripGeo = new THREE.BoxGeometry(CARD_W, 0.08, CARD_D + 0.02);
    const stripMat = new THREE.MeshBasicMaterial({
      color: spec.accent,
      transparent: true,
      opacity: 1.0,
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.y = CARD_H / 2 - 0.04;
    card.add(strip);
    accents.push(strip);

    root.add(card);
    cards.push(card);
    edges.push(edgeLines);
  });

  // A central "YOU ARE HERE" highlight ring on the floor
  const ringGeo = new THREE.RingGeometry(0.7, 0.9, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: t.cardAccent,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const highlightRing = new THREE.Mesh(ringGeo, ringMat);
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.position.y = -1.95;
  root.add(highlightRing);

  const update = (_delta: number, elapsed: number, weight: number) => {
    const w = THREE.MathUtils.clamp(weight, 0, 1);
    root.visible = w > 0.01;

    cards.forEach((card, i) => {
      const angle = (i / CARDS.length) * Math.PI * 2 + elapsed * 0.15;
      const x = Math.cos(angle) * ORBIT_RADIUS;
      const z = Math.sin(angle) * ORBIT_RADIUS;
      const y = 1.5 + Math.sin(elapsed * 0.8 + i) * 0.25;
      card.position.set(x, y, z);

      // Make card face outward (away from center) so the label is visible
      // from the camera which sits at +Z.
      card.lookAt(0, card.position.y, 0);
      // Now flip 180° because lookAt makes the +Z axis face outward
      card.rotation.y += Math.PI;

      // Active (front) card has stronger emissive
      const isActive = z > 0.5;
      const targetIntensity = isActive ? 0.6 * w : 0.18 * w;
      const mat = card.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        targetIntensity,
        0.1
      );
      mat.opacity = 0.4 + 0.6 * w;
    });

    edges.forEach((e) => {
      (e.material as THREE.LineBasicMaterial).opacity = 0.9 * w;
    });

    accents.forEach((a) => {
      (a.material as THREE.MeshBasicMaterial).opacity = w;
    });

    // Pulse the highlight ring
    ringMat.opacity = (0.3 + Math.sin(elapsed * 2) * 0.2) * w;
    highlightRing.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.1);
  };

  const dispose = () => {
    cards.forEach((c) => {
      c.geometry.dispose();
      const m = c.material as THREE.MeshStandardMaterial;
      m.map?.dispose();
      m.dispose();
    });
    ringGeo.dispose();
    ringMat.dispose();
    edges.forEach((e) => {
      e.geometry.dispose();
      (e.material as THREE.Material).dispose();
    });
    accents.forEach((a) => {
      a.geometry.dispose();
      (a.material as THREE.Material).dispose();
    });
  };

  return { group: root, update, dispose };
}
