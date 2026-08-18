'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { tokens } from '@/tokens/design-tokens';
import { SCENE_CONFIG, sampleSceneJourney } from './scene/sceneConfig';
import { LIGHTS_CONFIG } from './scene/lightingConfig';
import { SceneStudioGUI } from './scene/SceneStudioGUI';

export const HeroCanvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;

    const env = SCENE_CONFIG.environment;
    const camConfig = SCENE_CONFIG.camera;

    // Unified initial body background color to avoid header dark bar seam
    document.body.style.backgroundColor = '#' + new THREE.Color(tokens.experimentalScene.canvasBackground).getHexString();

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

    // OrbitControls for Free Orbit Camera Studio Mode
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // ─────────────────────────────────────────────────────────────────────
    //  Dynamic Lights Setup from LIGHTS_CONFIG
    // ─────────────────────────────────────────────────────────────────────
    const lightsMap = new Map<string, THREE.Light>();

    for (const cfg of LIGHTS_CONFIG) {
      let light: THREE.Light | null = null;

      if (cfg.type === 'ambient') {
        light = new THREE.AmbientLight(cfg.color, cfg.intensity);
      } else if (cfg.type === 'hemisphere') {
        light = new THREE.HemisphereLight(
          cfg.color,
          cfg.groundColor ?? tokens.experimentalScene.hemisphereGround,
          cfg.intensity,
        );
      } else if (cfg.type === 'directional') {
        const dirLight = new THREE.DirectionalLight(cfg.color, cfg.intensity);
        if (cfg.position) dirLight.position.set(...cfg.position);
        if (cfg.target) {
          dirLight.target.position.set(...cfg.target);
          scene.add(dirLight.target);
        }
        if (cfg.castShadow) {
          dirLight.castShadow = true;
          const size = cfg.shadowMapSize ?? 2048;
          dirLight.shadow.mapSize.width = size;
          dirLight.shadow.mapSize.height = size;
          dirLight.shadow.camera.near = 1;
          dirLight.shadow.camera.far = 180;
          dirLight.shadow.camera.left = -45;
          dirLight.shadow.camera.right = 45;
          dirLight.shadow.camera.top = 45;
          dirLight.shadow.camera.bottom = -45;
          dirLight.shadow.bias = cfg.shadowBias ?? -0.0005;
          if (cfg.radius !== undefined) {
            dirLight.shadow.radius = cfg.radius;
          }
        }
        light = dirLight;
      } else if (cfg.type === 'point') {
        const ptLight = new THREE.PointLight(cfg.color, cfg.intensity, cfg.distance ?? 0);
        if (cfg.position) ptLight.position.set(...cfg.position);
        if (cfg.castShadow) {
          ptLight.castShadow = true;
          const size = cfg.shadowMapSize ?? 1024;
          ptLight.shadow.mapSize.width = size;
          ptLight.shadow.mapSize.height = size;
          ptLight.shadow.bias = cfg.shadowBias ?? -0.0001;
          if (cfg.radius !== undefined) {
            ptLight.shadow.radius = cfg.radius;
          }
        }
        light = ptLight;
      } else if (cfg.type === 'spot') {
        const spotLight = new THREE.SpotLight(
          cfg.color,
          cfg.intensity,
          cfg.distance ?? 0,
          THREE.MathUtils.degToRad(cfg.angle ?? 45),
          cfg.penumbra ?? 0.5,
        );
        if (cfg.position) spotLight.position.set(...cfg.position);
        if (cfg.target) {
          spotLight.target.position.set(...cfg.target);
          scene.add(spotLight.target);
        }
        if (cfg.castShadow) {
          spotLight.castShadow = true;
          const size = cfg.shadowMapSize ?? 1024;
          spotLight.shadow.mapSize.width = size;
          spotLight.shadow.mapSize.height = size;
          spotLight.shadow.bias = cfg.shadowBias ?? -0.0005;
          if (cfg.radius !== undefined) {
            spotLight.shadow.radius = cfg.radius;
          }
        }
        light = spotLight;
      }

      if (light) {
        scene.add(light);
        lightsMap.set(cfg.id, light);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Interactive Studio GUI
    // ─────────────────────────────────────────────────────────────────────
    let world: THREE.Group | null = null;

    const studioGUI = new SceneStudioGUI(
      scene,
      camera,
      renderer,
      lightsMap,
      () => world,
      (forcedT: number) => {
        targetScrollProgress = forcedT;
      },
      (orbitEnabled: boolean) => {
        controls.enabled = orbitEnabled;
      }
    );

    // ─────────────────────────────────────────────────────────────────────
    //  3D Model Loading (Rastaak-3D-Scene-Ver-V.glb)
    // ─────────────────────────────────────────────────────────────────────
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      '/glb/Rastaak-3D-Scene-Ver-V.glb',
      (gltf: any) => {
        if (isDisposed) return;
        world = gltf.scene as THREE.Group;

        world.traverse((child: any) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;

          // Programmatically clone materials so each building mesh gets its own unique, independent material copy
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map((m: any) => {
                const cloned = m.clone();
                cloned.name = `${child.name || 'Building'}_Mat`;
                cloned.metalness = Math.min(cloned.metalness, 0.12);
                cloned.roughness = Math.max(cloned.roughness, 0.60);
                return cloned;
              });
            } else {
              const cloned = child.material.clone();
              cloned.name = `${child.name || 'Building'}_Mat`;
              cloned.metalness = Math.min(cloned.metalness, 0.12);
              cloned.roughness = Math.max(cloned.roughness, 0.60);
              child.material = cloned;
            }
          }
        });

        scene.add(world);

        // Populate materials in studio panel now that GLTF is ready
        studioGUI.populateMaterials();

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

      if (studioGUI && studioGUI.isOrbitMode) {
        controls.update();
      } else if (studioGUI && studioGUI.isManualMode) {
        camera.position.copy(studioGUI.manualCamPos);
        camera.lookAt(studioGUI.manualLookAt);
      } else {
        // Scroll journey mode
        const damping = 1 - Math.exp(-delta * SCENE_CONFIG.scroll.cameraDamping);
        currentScrollProgress += (targetScrollProgress - currentScrollProgress) * damping;
        const t = currentScrollProgress;

        sampleSceneJourney(t, sample);

        camPos.set(sample.camera[0], sample.camera[1], sample.camera[2]);

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
      controls.dispose();
      studioGUI.destroy();

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
