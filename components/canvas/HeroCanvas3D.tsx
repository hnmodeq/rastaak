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
import { SCENE_CONFIG } from './scene/sceneConfig';
import { sampleSceneJourney } from './scene/journeyMath';
import { LIGHTS_CONFIG } from './scene/lightingConfig';
import { SceneStudioGUI } from './scene/SceneStudioGUI';
import { applyMaterialsConfig } from './scene/materialKeys';
import { applySceneShadows, tintWorldShadows } from './scene/shadowTint';
import { STORY_FRAME_EVENT } from './scene/storyConfig';
import { StoryRuntime, readStoryScrollProgress } from './scene/storyRuntime';

const studioEnabled = process.env.NODE_ENV === 'development';

export const HeroCanvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;

    const env = SCENE_CONFIG.environment;
    const camConfig = SCENE_CONFIG.camera;
    const backgroundColor = new THREE.Color(env.backgroundColor);
    const fogColor = new THREE.Color(env.fogColor ?? env.backgroundColor);

    document.body.style.backgroundColor = '#' + backgroundColor.getHexString();

    const scene = new THREE.Scene();
    scene.background = backgroundColor;
    scene.fog = new THREE.Fog(fogColor, env.fogStart, env.fogEnd);

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
    renderer.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure ?? 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    containerRef.current.innerHTML = '';
    renderer.domElement.classList.add('is-ready');
    renderer.domElement.style.zIndex = '-1';
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

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
        const ptLight = new THREE.PointLight(
          cfg.color,
          cfg.intensity,
          cfg.distance ?? 0,
          cfg.decay ?? 2,
        );
        if (cfg.position) ptLight.position.set(...cfg.position);
        if (cfg.castShadow) {
          ptLight.castShadow = true;
          const size = cfg.shadowMapSize ?? 2048;
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
          cfg.decay ?? 2,
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
    applySceneShadows(lightsMap.values());

    let world: THREE.Group | null = null;
    let studioGUI: SceneStudioGUI | null = null;
    const story = new StoryRuntime();
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onStudioBeforeSave = () => story.restoreBase();
    const onStudioAfterSave = () => story.captureBase();
    const onStudioMaterialsChanged = () => {
      story.rebindIdlePalette();
    };
    window.addEventListener('rastaak-studio-before-save', onStudioBeforeSave);
    window.addEventListener('rastaak-studio-after-save', onStudioAfterSave);
    window.addEventListener('rastaak-studio-materials-changed', onStudioMaterialsChanged);

    if (studioEnabled) {
      studioGUI = new SceneStudioGUI(
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
          if (containerRef.current) {
            containerRef.current.style.pointerEvents = orbitEnabled ? 'auto' : 'none';
          }
        },
      );
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      '/glb/Rastaak-3D-Scene-Ver-V.glb',
      (gltf: { scene: THREE.Group }) => {
        if (isDisposed) return;
        world = gltf.scene;

        world.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((m, idx) => {
                const cloned = m.clone() as THREE.MeshStandardMaterial;
                cloned.userData.gltfName = m.name || '';
                cloned.userData.nodeName = mesh.name || mesh.parent?.name || '';
                cloned.name = m.name || `${mesh.name || 'Building'}_Mat_${idx}`;
                if ('metalness' in cloned) cloned.metalness = Math.min(cloned.metalness ?? 0, 0.12);
                if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 1, 0.6);
                return cloned;
              });
            } else {
              const cloned = mesh.material.clone() as THREE.MeshStandardMaterial;
              cloned.userData.gltfName = mesh.material.name || '';
              cloned.userData.nodeName = mesh.name || mesh.parent?.name || '';
              cloned.name = mesh.material.name || `${mesh.name || 'Building'}_Mat_0`;
              if ('metalness' in cloned) cloned.metalness = Math.min(cloned.metalness ?? 0, 0.12);
              if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 1, 0.6);
              mesh.material = cloned;
            }
          }
        });

        applyMaterialsConfig(world, SCENE_CONFIG.materials);
        tintWorldShadows(world);
        applySceneShadows(lightsMap.values());
        scene.add(world);
        world.updateMatrixWorld(true);
        if (process.env.NODE_ENV === 'development') {
          const named = world.children.map((child) => child.name).filter(Boolean);
          console.info('[story] loaded world nodes', named.length, named);
        }
        story.attach(world, scene);
        studioGUI?.populateMaterials();

        window.dispatchEvent(
          new CustomEvent('rastaak-load-progress', { detail: { progress: 100 } }),
        );
        setIsLoaded(true);
      },
      (xhr: ProgressEvent) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          window.dispatchEvent(
            new CustomEvent('rastaak-load-progress', { detail: { progress: percent } }),
          );
        }
      },
      (error: unknown) => {
        console.error('[HeroCanvas3D] failed to load world model', error);
        window.dispatchEvent(
          new CustomEvent('rastaak-load-progress', { detail: { progress: 100 } }),
        );
        setIsLoaded(true);
      },
    );

    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const handleScroll = () => {
      targetScrollProgress = readStoryScrollProgress(SCENE_CONFIG.scroll.headerScrollMultiplier);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      handleScroll();
    };
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();
    let lastTime = startTime;
    const sample = {
      camera: [0, 0, 0] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      fov: camConfig.defaultFov,
    };

    const camPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    const animate = () => {
      if (isDisposed) return;
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastTime) / 1000);
      const elapsed = (now - startTime) / 1000;
      lastTime = now;

      if (studioGUI?.isOrbitMode) {
        controls.update();
      } else if (studioGUI?.isManualMode) {
        camera.position.copy(studioGUI.manualCamPos);
        camera.lookAt(studioGUI.manualLookAt);
      } else {
        const damping = 1 - Math.exp(-delta * SCENE_CONFIG.scroll.cameraDamping);
        currentScrollProgress += (targetScrollProgress - currentScrollProgress) * damping;
        const t = currentScrollProgress;

        sampleSceneJourney(t, sample);

        camPos.set(sample.camera[0], sample.camera[1], sample.camera[2]);

        const floatFade = 1 - THREE.MathUtils.smoothstep(t, 0.86, 1);
        if (SCENE_CONFIG.scroll.idleFloatAmount > 0 && floatFade > 0) {
          camPos.y +=
            Math.sin(elapsed * SCENE_CONFIG.scroll.idleFloatSpeed) *
            SCENE_CONFIG.scroll.idleFloatAmount *
            floatFade;
        }
        camera.position.copy(camPos);

        lookAt.set(sample.target[0], sample.target[1], sample.target[2]);
        camera.lookAt(lookAt);

        if (camera.fov !== sample.fov) {
          camera.fov = sample.fov;
          camera.updateProjectionMatrix();
        }
      }

      story.setEnabled(true);
      const frame = story.update({
        t: currentScrollProgress,
        camera,
        width: window.innerWidth,
        height: window.innerHeight,
        delta,
        elapsed,
        reducedMotion: motionQuery.matches,
        compact: window.innerWidth <= 820,
      });
      window.dispatchEvent(new CustomEvent(STORY_FRAME_EVENT, { detail: frame }));

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('rastaak-studio-before-save', onStudioBeforeSave);
      window.removeEventListener('rastaak-studio-after-save', onStudioAfterSave);
      window.removeEventListener('rastaak-studio-materials-changed', onStudioMaterialsChanged);
      story.dispose();
      controls.dispose();
      studioGUI?.destroy();

      if (world) {
        world.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh) return;
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of materials) {
            if (!m) continue;
            for (const key of Object.keys(m)) {
              const value = (m as unknown as Record<string, { isTexture?: boolean; dispose?: () => void }>)[key];
              if (value && value.isTexture) value.dispose?.();
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
      className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      id="rastaak-hero-canvas"
      style={{ width: '100vw', height: '100vh', zIndex: -1 }}
    />
  );
};
