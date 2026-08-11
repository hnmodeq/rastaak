'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tokens } from '@/tokens/design-tokens';
import { createChaosGroup } from './scene/chaosGroup';
import { createAssessmentGroup } from './scene/assessmentGroup';
import { createRecommendGroup } from './scene/recommendGroup';
import { createDeployGroup } from './scene/deployGroup';
import { createSupportGroup } from './scene/supportGroup';
import { createScrollPath, phaseProgress, Phase } from './scene/scrollPath';

/**
 * HeroCanvas3D
 *
 * A 5-phase A→B story for a data-storage seller:
 *   1. Data Crisis   (chaos)
 *   2. Assessment    (scanner / hologram)
 *   3. Recommend     (vendor cards: QNAP, Dell, HPE)
 *   4. Deploy        (server rack GLB + sliding units)
 *   5. Support       (operational rack + data streams + remote-hand glyph)
 *
 * The camera travels along the X axis driven by page scroll. Each phase
 * is a separate THREE.Group with its own update() function so the active
 * group can animate while the others rest.
 */
export const HeroCanvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;

    // ─────────────────────────────────────────────────────────────────────
    //  Renderer / scene / camera
    // ─────────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(tokens.experimentalScene.canvasBackground);
    scene.fog = new THREE.Fog(tokens.experimentalScene.canvasBackground, 30, 120);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6, 28);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────────────
    //  Lighting (carried from existing scene, slightly brightened)
    // ─────────────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(tokens.experimentalScene.ambient, 1.4);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(
      tokens.experimentalScene.ambient,
      tokens.experimentalScene.hemisphereGround,
      2
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(tokens.experimentalScene.keyLight, 2.5);
    keyLight.position.set(20, 40, 20);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(tokens.experimentalScene.fillLight, 1.5);
    fillLight.position.set(-20, -10, -20);
    scene.add(fillLight);

    // Warm key light, only used in phase 1 (Data Crisis). Starts off.
    const warmKey = new THREE.PointLight(tokens.dataStorageScene.keyLightWarm, 0, 30, 2);
    warmKey.position.set(-30, 6, 8);
    scene.add(warmKey);

    // Cool fill light, ramps up in phase 5 (Support).
    const coolFill = new THREE.PointLight(tokens.dataStorageScene.fillLightCool, 0, 30, 2);
    coolFill.position.set(30, 6, 8);
    scene.add(coolFill);

    // ─────────────────────────────────────────────────────────────────────
    //  Floor grid
    // ─────────────────────────────────────────────────────────────────────
    const grid = new THREE.GridHelper(
      200,
      100,
      tokens.experimentalScene.gridPrimary,
      tokens.experimentalScene.gridSecondary
    );
    grid.position.y = -2;
    scene.add(grid);

    // ─────────────────────────────────────────────────────────────────────
    //  Phase groups (each is a self-contained THREE.Group with update())
    // ─────────────────────────────────────────────────────────────────────
    const path = createScrollPath(); // contains per-phase anchors

    const chaos = createChaosGroup({ x: path[Phase.Chaos].x });
    scene.add(chaos.group);

    const assessment = createAssessmentGroup({ x: path[Phase.Assessment].x });
    scene.add(assessment.group);

    const recommend = createRecommendGroup({ x: path[Phase.Recommend].x });
    scene.add(recommend.group);

    // deploy + support depend on the loaded server-rack GLB, so we mount
    // them inside the loader callback below.

    let support: ReturnType<typeof createSupportGroup> | null = null;
    let deploy: ReturnType<typeof createDeployGroup> | null = null;

    // ─────────────────────────────────────────────────────────────────────
    //  GLB loaders
    // ─────────────────────────────────────────────────────────────────────
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      '/glb/servers/data_center_rack.glb',
      (gltf: any) => {
        if (isDisposed) return;
        const rack = gltf.scene;
        rack.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        deploy = createDeployGroup({
          x: path[Phase.Deploy].x,
          rackTemplate: rack,
        });
        scene.add(deploy.group);
        setIsLoaded(true);
      },
      undefined,
      (err: any) => {
        console.warn('data_center_rack.glb failed:', err);
        // Fall back: still create an empty deploy group with placeholder geometry
        deploy = createDeployGroup({ x: path[Phase.Deploy].x, rackTemplate: null });
        scene.add(deploy.group);
        setIsLoaded(true);
      }
    );

    gltfLoader.load(
      '/glb/servers/network_server_rack.glb',
      (gltf: any) => {
        if (isDisposed) return;
        const rack = gltf.scene;
        rack.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        support = createSupportGroup({
          x: path[Phase.Support].x,
          rackTemplate: rack,
        });
        scene.add(support.group);
      },
      undefined,
      (err: any) => {
        console.warn('network_server_rack.glb failed:', err);
        support = createSupportGroup({ x: path[Phase.Support].x, rackTemplate: null });
        scene.add(support.group);
      }
    );

    // ─────────────────────────────────────────────────────────────────────
    //  Scroll → phase progress
    // ─────────────────────────────────────────────────────────────────────
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ─────────────────────────────────────────────────────────────────────
    //  Render loop
    // ─────────────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth-scroll lerp
      currentScrollProgress +=
        (targetScrollProgress - currentScrollProgress) * 0.06;

      // Phase 0..4
      const phase = phaseProgress(currentScrollProgress);
      const { active, distances } = phase;

      // Per-group update (animations only fire when the group is "near" the camera)
      chaos.update(delta, elapsed, distances[Phase.Chaos]);
      assessment.update(delta, elapsed, distances[Phase.Assessment]);
      recommend.update(delta, elapsed, distances[Phase.Recommend]);
      deploy?.update(delta, elapsed, distances[Phase.Deploy]);
      support?.update(delta, elapsed, distances[Phase.Support]);

      // Camera: travel along the X axis from -30 to +30 with a slight arc
      const xT = currentScrollProgress;
      const camX = THREE.MathUtils.lerp(-30, 30, xT);
      const camZ = 28 - Math.sin(xT * Math.PI) * 4; // gentle push-in mid-path
      const camY = 6 + Math.sin(elapsed * 0.4) * 0.25 - xT * 1.5;

      camera.position.set(camX, camY, camZ);

      // Look at the active phase anchor
      const activeAnchor = path[active];
      camera.lookAt(activeAnchor.x, activeAnchor.lookY, 0);

      // Dynamic lighting: warm during crisis, cool during support
      warmKey.intensity = distances[Phase.Chaos] * 4.0;
      coolFill.intensity = distances[Phase.Support] * 4.0;
      keyLight.color.lerpColors(
        new THREE.Color(tokens.dataStorageScene.keyLightWarm),
        new THREE.Color(tokens.experimentalScene.keyLight),
        xT
      );

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // ─────────────────────────────────────────────────────────────────────
    //  Cleanup
    // ─────────────────────────────────────────────────────────────────────
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      // Dispose all groups
      chaos.dispose();
      assessment.dispose();
      recommend.dispose();
      deploy?.dispose();
      support?.dispose();

      dracoLoader.dispose();
      renderer.dispose();

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
