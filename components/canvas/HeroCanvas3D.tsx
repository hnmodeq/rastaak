'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tokens } from '@/tokens/design-tokens';
import { SCENE_CONFIG, sampleSceneJourney } from './scene/sceneConfig';
import { LIGHTS_CONFIG } from './scene/lightingConfig';

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
    //  Scene / Camera / Renderer
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
    //  Dynamic Lights Setup from LIGHTS_CONFIG
    // ─────────────────────────────────────────────────────────────────────
    for (const cfg of LIGHTS_CONFIG) {
      if (cfg.type === 'ambient') {
        const light = new THREE.AmbientLight(cfg.color, cfg.intensity);
        scene.add(light);
      } else if (cfg.type === 'hemisphere') {
        const light = new THREE.HemisphereLight(
          cfg.color,
          cfg.groundColor ?? tokens.experimentalScene.hemisphereGround,
          cfg.intensity,
        );
        scene.add(light);
      } else if (cfg.type === 'directional') {
        const light = new THREE.DirectionalLight(cfg.color, cfg.intensity);
        if (cfg.position) light.position.set(...cfg.position);
        if (cfg.target) {
          light.target.position.set(...cfg.target);
          scene.add(light.target);
        }
        if (cfg.castShadow) {
          light.castShadow = true;
          const size = cfg.shadowMapSize ?? 2048;
          light.shadow.mapSize.width = size;
          light.shadow.mapSize.height = size;
          light.shadow.camera.near = 1;
          light.shadow.camera.far = 180;
          light.shadow.camera.left = -45;
          light.shadow.camera.right = 45;
          light.shadow.camera.top = 45;
          light.shadow.camera.bottom = -45;
          light.shadow.bias = cfg.shadowBias ?? -0.0005;
          if (cfg.radius !== undefined) {
            light.shadow.radius = cfg.radius;
          }
        }
        scene.add(light);
      } else if (cfg.type === 'point') {
        const light = new THREE.PointLight(cfg.color, cfg.intensity, cfg.distance ?? 0);
        if (cfg.position) light.position.set(...cfg.position);
        if (cfg.castShadow) {
          light.castShadow = true;
          const size = cfg.shadowMapSize ?? 1024;
          light.shadow.mapSize.width = size;
          light.shadow.mapSize.height = size;
          light.shadow.bias = cfg.shadowBias ?? -0.0005;
          if (cfg.radius !== undefined) {
            light.shadow.radius = cfg.radius;
          }
        }
        scene.add(light);
      } else if (cfg.type === 'spot') {
        const light = new THREE.SpotLight(
          cfg.color,
          cfg.intensity,
          cfg.distance ?? 0,
          THREE.MathUtils.degToRad(cfg.angle ?? 45),
          cfg.penumbra ?? 0.5,
        );
        if (cfg.position) light.position.set(...cfg.position);
        if (cfg.target) {
          light.target.position.set(...cfg.target);
          scene.add(light.target);
        }
        if (cfg.castShadow) {
          light.castShadow = true;
          const size = cfg.shadowMapSize ?? 1024;
          light.shadow.mapSize.width = size;
          light.shadow.mapSize.height = size;
          light.shadow.bias = cfg.shadowBias ?? -0.0005;
          if (cfg.radius !== undefined) {
            light.shadow.radius = cfg.radius;
          }
        }
        scene.add(light);
      }
    }

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
