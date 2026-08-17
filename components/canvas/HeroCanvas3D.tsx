'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tokens } from '@/tokens/design-tokens';
import { SCENE_CONFIG, sampleSceneJourney } from './scene/sceneConfig';

export const HeroCanvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;

    const env = SCENE_CONFIG.environment;
    const camConfig = SCENE_CONFIG.camera;

    // ─────────────────────────────────────────────────────────────────────
    //  Scene / Camera / Renderer (Shadow Map Enabled)
    // ─────────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(tokens.experimentalScene.canvasBackground);
    scene.fog = new THREE.Fog(
      tokens.experimentalScene.canvasBackground,
      env.fogStart,
      env.fogEnd,
    );

    const camera = new THREE.PerspectiveCamera(
      camConfig.defaultFov,
      window.innerWidth / window.innerHeight,
      camConfig.near,
      camConfig.far,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = '';
    renderer.domElement.classList.add('is-ready');
    renderer.domElement.style.zIndex = '0';
    containerRef.current.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────────────
    //  Exact Blender Viewport Lighting (6500K Point / Sun Light with Shadows)
    // ─────────────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(tokens.experimentalScene.ambient, env.ambientIntensity);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(
      tokens.experimentalScene.keyLight,
      tokens.experimentalScene.hemisphereGround,
      1.1,
    );
    scene.add(hemi);

    // Main 6500K Key Light matching Blender's 763W Light
    const keyLight = new THREE.DirectionalLight(tokens.experimentalScene.keyLight, env.keyLightIntensity);
    keyLight.position.set(-20, 55, -15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 180;
    keyLight.shadow.camera.left = -45;
    keyLight.shadow.camera.right = 45;
    keyLight.shadow.camera.top = 45;
    keyLight.shadow.camera.bottom = -45;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft fill light from opposite angle to soften dark shadow faces
    const fillLight = new THREE.DirectionalLight(tokens.experimentalScene.fillLight, env.fillLightIntensity);
    fillLight.position.set(40, 30, 30);
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
            m.metalness = Math.min(m.metalness, 0.12);
            m.roughness = Math.max(m.roughness, 0.60);
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
    //  Scroll Progress Calculation
    // ─────────────────────────────────────────────────────────────────────
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const handleScroll = () => {
      const heroHeight = window.innerHeight * SCENE_CONFIG.scroll.headerScrollMultiplier;
      const scrollY = window.scrollY;
      targetScrollProgress = Math.min(1.0, Math.max(0, scrollY / heroHeight));
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
      fov: camConfig.defaultFov,
    };

    const camPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth framerate-independent camera damping
      const damping = 1 - Math.exp(-delta * SCENE_CONFIG.scroll.cameraDamping);
      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * damping;
      const t = currentScrollProgress;

      // Sample scene journey parameters from controller config
      sampleSceneJourney(t, sample);

      camPos.set(sample.camera[0], sample.camera[1], sample.camera[2]);

      // Subtle natural breathing float
      if (SCENE_CONFIG.scroll.idleFloatAmount > 0) {
        camPos.y +=
          Math.sin(elapsed * SCENE_CONFIG.scroll.idleFloatSpeed) *
          SCENE_CONFIG.scroll.idleFloatAmount;
      }
      camera.position.copy(camPos);

      lookAt.set(sample.target[0], sample.target[1], sample.target[2]);
      camera.lookAt(lookAt);

      if (camera.fov !== sample.fov) {
        camera.fov = sample.fov;
        camera.updateProjectionMatrix();
      }

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
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
