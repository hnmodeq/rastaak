'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tokens } from '@/tokens/design-tokens';
import { sampleJourney, FINALE } from './scene/journeyPath';
import { FarsiScrollyOverlay } from './FarsiScrollyOverlay';

export const HeroCanvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCanvasVisible, setIsCanvasVisible] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;

    // ─────────────────────────────────────────────────────────────────────
    //  Scene / Camera / Renderer (Neutral Clay Setup matching Blender render)
    // ─────────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(tokens.experimentalScene.canvasBackground);
    scene.fog = new THREE.Fog(
      tokens.experimentalScene.canvasBackground,
      100,
      380,
    );

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.innerHTML = '';
    renderer.domElement.classList.add('is-ready');
    renderer.domElement.style.zIndex = '0';
    containerRef.current.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────────────
    //  Neutral Directional Lighting (Exact Blender setup)
    // ─────────────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(tokens.experimentalScene.ambient, 1.4);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(
      tokens.experimentalScene.keyLight,
      tokens.experimentalScene.hemisphereGround,
      1.2,
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(tokens.experimentalScene.keyLight, 1.8);
    keyLight.position.set(50, 80, 40);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(tokens.experimentalScene.fillLight, 1.0);
    fillLight.position.set(-50, 40, -50);
    scene.add(fillLight);

    // ─────────────────────────────────────────────────────────────────────
    //  3D Model Loading
    // ─────────────────────────────────────────────────────────────────────
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    let world: THREE.Group | null = null;

    gltfLoader.load(
      '/glb/Rastaak-3D-Scene-Ver-IV.glb',
      (gltf: any) => {
        if (isDisposed) return;
        world = gltf.scene as THREE.Group;

        world.traverse((child: any) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;

          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          for (const m of materials) {
            if (!m) continue;
            m.metalness = Math.min(m.metalness, 0.15);
            m.roughness = Math.max(m.roughness, 0.55);
          }
        });

        scene.add(world);

        // Notify loader of 100% completion
        window.dispatchEvent(
          new CustomEvent('rastaak-load-progress', { detail: { progress: 100 } })
        );
        setIsLoaded(true);
      },
      (xhr: ProgressEvent) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          window.dispatchEvent(
            new CustomEvent('rastaak-load-progress', { detail: { progress: percent } })
          );
        }
      },
      (error: unknown) => {
        console.error('[HeroCanvas3D] failed to load world model', error);
        window.dispatchEvent(
          new CustomEvent('rastaak-load-progress', { detail: { progress: 100 } })
        );
        setIsLoaded(true);
      }
    );

    // ─────────────────────────────────────────────────────────────────────
    //  Scroll Handling (Scope 3D Scene ONLY to Header Section)
    // ─────────────────────────────────────────────────────────────────────
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const handleScroll = () => {
      // Calculate scrollytelling progress t based on header height (2.5x viewport height)
      const heroHeight = window.innerHeight * 2.5;
      const scrollY = window.scrollY;

      targetScrollProgress = Math.min(1.0, Math.max(0, scrollY / heroHeight));

      // Fade canvas out when scrolling down past the header scrollytelling intro
      setIsCanvasVisible(scrollY < heroHeight + 100);
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
    //  Render Loop
    // ─────────────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const sample = {
      camera: [0, 0, 0] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
    };
    const camPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth framerate-independent camera damping
      const damping = 1 - Math.exp(-delta * 3.71);
      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * damping;
      const t = currentScrollProgress;

      // Sample camera roadmap path
      sampleJourney(t, sample);

      const finaleWeight = THREE.MathUtils.smoothstep(t, 0.88, 1.0);

      camPos.set(
        THREE.MathUtils.lerp(sample.camera[0], FINALE.camera[0], finaleWeight),
        THREE.MathUtils.lerp(sample.camera[1], FINALE.camera[1], finaleWeight),
        THREE.MathUtils.lerp(sample.camera[2], FINALE.camera[2], finaleWeight),
      );

      // Subtle natural breathing float
      camPos.y += Math.sin(elapsed * 0.4) * 0.2;
      camera.position.copy(camPos);

      lookAt.set(
        THREE.MathUtils.lerp(sample.target[0], FINALE.target[0], finaleWeight),
        THREE.MathUtils.lerp(sample.target[1], FINALE.target[1], finaleWeight),
        THREE.MathUtils.lerp(sample.target[2], FINALE.target[2], finaleWeight),
      );
      camera.lookAt(lookAt);

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
    <>
      <div
        ref={containerRef}
        className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
          isLoaded && isCanvasVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: '100vw', height: '100vh' }}
      />
      {/* Farsi Scrollytelling Overlay (Visible only during header scrollytelling) */}
      <FarsiScrollyOverlay />
    </>
  );
};
