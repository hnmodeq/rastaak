'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tokens } from '@/tokens/design-tokens';
import { sampleJourney, FINALE, LANDMARKS } from './scene/journeyPath';

/**
 * HeroCanvas3D
 *
 * Scroll-driven flythrough of the authored Blender world
 * (`/glb/Rastaak-3D-Scene.glb`).
 *
 * The world already contains the whole A→B story as a line of landmarks
 * along the Z axis — organisations and their buildings at one end, the
 * Rastaak logo at the other, with storage and support in between. So the
 * component's only job is to move the camera along that line as the user
 * scrolls, and to light it.
 *
 * Story beats, in scroll order:
 *   1. Chaos       — the organisations (buildings + cooling tower)
 *   2. Assessment  — approach, small Rastaak logo
 *   3. Recommend   — mid-path proposal
 *   4. Deploy      — the wrench / installation
 *   5. Support     — server stacks + headset operator (24/7)
 *   →  Finale      — Rastaak Logo Big
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
    // The world is ~477 units across, so fog has to sit much further out
    // than it did for the old procedural scene or the far landmarks vanish.
    scene.fog = new THREE.Fog(
      tokens.experimentalScene.canvasBackground,
      120,
      420,
    );

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.innerHTML = '';
    // Global CSS ships `canvas { opacity:0; z-index:-1 }` and only reveals
    // via `.is-ready` (the legacy bundle used to add that). We own this
    // canvas, so opt into the ready state and sit above the -1 layer.
    renderer.domElement.classList.add('is-ready');
    renderer.domElement.style.zIndex = '0';
    containerRef.current.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────────────
    //  Lighting
    //
    //  The Blender materials are mostly untextured light greys, so the mood
    //  comes almost entirely from these lights. Warm at the "problem" end of
    //  the path, cool and clean at the "solved" end.
    // ─────────────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(tokens.experimentalScene.ambient, 1.2);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(
      tokens.experimentalScene.keyLight,
      tokens.experimentalScene.hemisphereGround,
      1.6,
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(tokens.experimentalScene.keyLight, 2.2);
    keyLight.position.set(60, 90, 40);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(tokens.experimentalScene.fillLight, 1.2);
    fillLight.position.set(-70, 40, -50);
    scene.add(fillLight);

    // Warm accent over the organisations (start of the journey).
    const warmKey = new THREE.PointLight(
      tokens.dataStorageScene.keyLightWarm,
      0,
      160,
      2,
    );
    warmKey.position.set(-10, 30, -82);
    scene.add(warmKey);

    // Cool accent over the storage/support cluster (end of the journey).
    const coolFill = new THREE.PointLight(
      tokens.dataStorageScene.fillLightCool,
      0,
      160,
      2,
    );
    coolFill.position.set(-10, 26, 46);
    scene.add(coolFill);

    // Dedicated logo light so the finale mark reads crisply against the fog.
    const logoLight = new THREE.PointLight(
      tokens.dataStorageScene.scannerBeam,
      0,
      120,
      2,
    );
    logoLight.position.set(
      LANDMARKS.logoBig[0] + 10,
      LANDMARKS.logoBig[1] + 22,
      LANDMARKS.logoBig[2] + 16,
    );
    scene.add(logoLight);

    // ─────────────────────────────────────────────────────────────────────
    //  World
    // ─────────────────────────────────────────────────────────────────────
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    let world: THREE.Group | null = null;

    gltfLoader.load(
      '/glb/Rastaak-3D-Scene.glb',
      (gltf: any) => {
        if (isDisposed) return;
        world = gltf.scene as THREE.Group;

        world.traverse((child: any) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
          // No environment map is bound in this scene, so any metalness
          // above ~0.3 renders as flat black. Keep surfaces diffuse.
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const m of materials) {
            if (!m) continue;
            if (typeof m.metalness === 'number') {
              m.metalness = Math.min(m.metalness, 0.25);
            }
            if (typeof m.roughness === 'number') {
              m.roughness = Math.max(m.roughness, 0.45);
            }
          }
        });

        scene.add(world);
        setIsLoaded(true);
      },
      undefined,
      (error: unknown) => {
        // Don't leave the page hidden behind a permanently transparent
        // canvas if the world fails to load.
        console.error('[HeroCanvas3D] failed to load world', error);
        setIsLoaded(true);
      },
    );

    // ─────────────────────────────────────────────────────────────────────
    //  Scroll wiring
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
    const sample = {
      camera: [0, 0, 0] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
    };
    const camPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();
    const warmColor = new THREE.Color(tokens.dataStorageScene.keyLightWarm);
    const coolColor = new THREE.Color(tokens.experimentalScene.keyLight);

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Framerate-independent damping. A fixed per-frame factor converges at
      // wildly different speeds on 144Hz vs. a throttled tab, and on slow
      // hardware the camera would never reach the end of the path.
      const damping = 1 - Math.exp(-delta * 3.71);
      currentScrollProgress +=
        (targetScrollProgress - currentScrollProgress) * damping;

      const t = currentScrollProgress;

      // Walk the authored path.
      sampleJourney(t, sample);

      // Ease onto the logo over the last stretch so the finale lands cleanly
      // without fighting the Support beat for the same frame.
      const finaleWeight = THREE.MathUtils.smoothstep(t, 0.86, 1.0);

      camPos.set(
        THREE.MathUtils.lerp(sample.camera[0], FINALE.camera[0], finaleWeight),
        THREE.MathUtils.lerp(sample.camera[1], FINALE.camera[1], finaleWeight),
        THREE.MathUtils.lerp(sample.camera[2], FINALE.camera[2], finaleWeight),
      );
      // A gentle idle drift keeps the shot alive when the user stops scrolling.
      camPos.y += Math.sin(elapsed * 0.4) * 0.4;
      camera.position.copy(camPos);

      lookAt.set(
        THREE.MathUtils.lerp(sample.target[0], FINALE.target[0], finaleWeight),
        THREE.MathUtils.lerp(sample.target[1], FINALE.target[1], finaleWeight),
        THREE.MathUtils.lerp(sample.target[2], FINALE.target[2], finaleWeight),
      );
      camera.lookAt(lookAt);

      // Lighting follows the story: warm/uneasy at the start, cool and
      // resolved at the end, with the logo lit only for the finale.
      const chaosWeight = 1 - THREE.MathUtils.smoothstep(t, 0.0, 0.35);
      const supportWeight = THREE.MathUtils.smoothstep(t, 0.55, 0.95);
      warmKey.intensity = chaosWeight * 900;
      coolFill.intensity = supportWeight * 900;
      logoLight.intensity = finaleWeight * 700;
      keyLight.color.lerpColors(warmColor, coolColor, THREE.MathUtils.clamp(t * 1.4, 0, 1));

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

      if (world) {
        world.traverse((child: any) => {
          if (!child.isMesh) return;
          child.geometry?.dispose();
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const m of materials) {
            if (!m) continue;
            for (const key of Object.keys(m)) {
              const value = (m as any)[key];
              if (value && value.isTexture) value.dispose();
            }
            m.dispose();
          }
        });
        scene.remove(world);
        world = null;
      }

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
