'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tokens } from '@/tokens/design-tokens';
import { sampleJourney, FINALE, LANDMARKS } from './scene/journeyPath';
import { FarsiScrollyOverlay } from './FarsiScrollyOverlay';

export const HeroCanvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;

    // ─────────────────────────────────────────────────────────────────────
    //  Scene / Camera / Renderer
    // ─────────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(tokens.experimentalScene.canvasBackground);
    scene.fog = new THREE.Fog(
      tokens.experimentalScene.canvasBackground,
      80,
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
    renderer.toneMappingExposure = 1.15;

    containerRef.current.innerHTML = '';
    renderer.domElement.classList.add('is-ready');
    renderer.domElement.style.zIndex = '0';
    containerRef.current.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────────────
    //  Lighting Setup
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
    keyLight.position.set(50, 80, 40);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(tokens.experimentalScene.fillLight, 1.2);
    fillLight.position.set(-60, 40, -50);
    scene.add(fillLight);

    // Floor point lights on Rastaak Building
    const baseLight = new THREE.PointLight(tokens.dataStorageScene.statusLEDpending, 0, 40, 2);
    baseLight.position.set(LANDMARKS.rastaakBase[0], LANDMARKS.rastaakBase[1] + 2, LANDMARKS.rastaakBase[2]);
    scene.add(baseLight);

    const midLight = new THREE.PointLight(tokens.dataStorageScene.statusLED, 0, 50, 2);
    midLight.position.set(LANDMARKS.rastaakMid[0], LANDMARKS.rastaakMid[1] + 2, LANDMARKS.rastaakMid[2]);
    scene.add(midLight);

    const topLight = new THREE.PointLight(tokens.dataStorageScene.scannerBeam, 0, 60, 2);
    topLight.position.set(LANDMARKS.rastaakTop[0], LANDMARKS.rastaakTop[1] + 2, LANDMARKS.rastaakTop[2]);
    scene.add(topLight);

    // Finale logo spotlight
    const logoLight = new THREE.PointLight(tokens.dataStorageScene.scannerBeam, 0, 100, 2);
    logoLight.position.set(LANDMARKS.logo[0] + 5, LANDMARKS.logo[1] + 10, LANDMARKS.logo[2] + 5);
    scene.add(logoLight);

    // ─────────────────────────────────────────────────────────────────────
    //  Dynamic Data Lasers
    // ─────────────────────────────────────────────────────────────────────
    const redLaserMat = new THREE.MeshBasicMaterial({
      color: tokens.scene.laser1Fill,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const blueLaserMat = new THREE.MeshBasicMaterial({
      color: tokens.scene.laser2Fill,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const createLaserMesh = (start: THREE.Vector3, end: THREE.Vector3, mat: THREE.Material) => {
      const distance = start.distanceTo(end);
      const geom = new THREE.CylinderGeometry(0.12, 0.12, distance, 8);
      geom.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.lookAt(end);
      return mesh;
    };

    const bankPos = new THREE.Vector3(...LANDMARKS.bank);
    const govPos = new THREE.Vector3(...LANDMARKS.gov);
    const industryPos = new THREE.Vector3(...LANDMARKS.industry);
    const rastaakBasePos = new THREE.Vector3(...LANDMARKS.rastaakBase);
    const rastaakTopPos = new THREE.Vector3(...LANDMARKS.rastaakTop);

    // Red request lasers: Customer Buildings -> Rastaak Base
    const redLaser1 = createLaserMesh(bankPos, rastaakBasePos, redLaserMat);
    const redLaser2 = createLaserMesh(govPos, rastaakBasePos, redLaserMat);
    scene.add(redLaser1);
    scene.add(redLaser2);

    // Blue protection lasers: Rastaak Top Spire -> Customer Buildings
    const blueLaser1 = createLaserMesh(rastaakTopPos, bankPos, blueLaserMat);
    const blueLaser2 = createLaserMesh(rastaakTopPos, govPos, blueLaserMat);
    const blueLaser3 = createLaserMesh(rastaakTopPos, industryPos, blueLaserMat);
    scene.add(blueLaser1);
    scene.add(blueLaser2);
    scene.add(blueLaser3);

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
            if (typeof m.metalness === 'number') {
              m.metalness = Math.min(m.metalness, 0.25);
            }
            if (typeof m.roughness === 'number') {
              m.roughness = Math.max(m.roughness, 0.45);
            }
          }
        });

        scene.add(world);

        // Dispatch 100% load progress
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
    //  Scroll Handling
    // ─────────────────────────────────────────────────────────────────────
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
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
    //  Render Loop
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

      // Smooth scroll damping
      const damping = 1 - Math.exp(-delta * 3.71);
      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * damping;
      const t = currentScrollProgress;

      // Sample camera spline path
      sampleJourney(t, sample);

      const finaleWeight = THREE.MathUtils.smoothstep(t, 0.88, 1.0);

      camPos.set(
        THREE.MathUtils.lerp(sample.camera[0], FINALE.camera[0], finaleWeight),
        THREE.MathUtils.lerp(sample.camera[1], FINALE.camera[1], finaleWeight),
        THREE.MathUtils.lerp(sample.camera[2], FINALE.camera[2], finaleWeight),
      );

      // Subtle idle float
      camPos.y += Math.sin(elapsed * 0.4) * 0.3;
      camera.position.copy(camPos);

      lookAt.set(
        THREE.MathUtils.lerp(sample.target[0], FINALE.target[0], finaleWeight),
        THREE.MathUtils.lerp(sample.target[1], FINALE.target[1], finaleWeight),
        THREE.MathUtils.lerp(sample.target[2], FINALE.target[2], finaleWeight),
      );
      camera.lookAt(lookAt);

      // ───────────────────────────────────────────────────────────────────
      //  Visual Effects & Lighting Animations synced with scroll t
      // ───────────────────────────────────────────────────────────────────
      // Red request lasers: active t = 0.0 -> 0.25
      const redOpacity = THREE.MathUtils.smoothstep(t, 0.02, 0.12) * (1 - THREE.MathUtils.smoothstep(t, 0.22, 0.32));
      redLaserMat.opacity = redOpacity;

      // Rastaak floor lighting steps:
      // Base floor (t = 0.20 -> 0.50)
      baseLight.intensity = THREE.MathUtils.smoothstep(t, 0.18, 0.45) * 500;

      // Mid floor (t = 0.45 -> 0.75)
      midLight.intensity = THREE.MathUtils.smoothstep(t, 0.42, 0.70) * 700;

      // Top spire (t = 0.65 -> 0.90)
      topLight.intensity = THREE.MathUtils.smoothstep(t, 0.62, 0.88) * 900;

      // Blue protection lasers: active t = 0.68 -> 0.92
      const blueOpacity = THREE.MathUtils.smoothstep(t, 0.65, 0.78) * (1 - THREE.MathUtils.smoothstep(t, 0.88, 0.96));
      blueLaserMat.opacity = blueOpacity;

      // Finale logo spotlight
      logoLight.intensity = finaleWeight * 800;

      keyLight.color.lerpColors(warmColor, coolColor, THREE.MathUtils.clamp(t * 1.3, 0, 1));

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
        className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: '100vw', height: '100vh' }}
      />
      {/* Farsi Scrollytelling Overlay in Bottom-Left */}
      <FarsiScrollyOverlay />
    </>
  );
};
