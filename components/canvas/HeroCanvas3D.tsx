'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// @ts-ignore
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { tokens } from '@/tokens/design-tokens';
import { SCENE_CONFIG } from './scene/sceneConfig';
import { sampleSceneJourney } from './scene/journeyMath';
import { LIGHTS_CONFIG } from './scene/lightingConfig';
import type { SceneStudioGUI } from './scene/SceneStudioGUI';
import { BlenderViewport } from './scene/BlenderViewport';
import { applyMaterialsConfig } from './scene/materialKeys';
import { applyBuildingVisibility } from './scene/buildingVisibility';
import { applyTreeVisibility } from './scene/treeVisibility';
import { applySceneShadows, tintWorldShadows } from './scene/shadowTint';
import { applyLightShadow, applyRendererShadowFilter } from './scene/shadowSetup';
import { STORY_FRAME_EVENT } from './scene/storyConfig';
import {
  applyJourneyScrollLength,
  JOURNEY_SCROLL_LENGTH_EVENT,
  StoryRuntime,
  readStoryScrollProgress,
  setJourneyScrollLength,
} from './scene/storyRuntime';
import { BuildingNamePlateSet } from './scene/BuildingNamePlates';
import {
  ensureCinematicSky,
  disposeCinematicSky,
  setCinematicHorizonConfig,
  setCinematicSkyConfig,
  setCinematicSkyEnabled,
  tickCinematicSky,
} from './scene/CinematicSky';
import { subscribeLive } from '@/components/live/liveChannel';
import type {
  CameraKeyframe,
  CameraMethod,
  CameraStop,
  LightConfig,
  MaterialsConfig,
  SceneEnvironmentConfig,
  SceneVisibilityConfig,
} from './scene/sceneTypes';
import {
  LOOK_CONFIG,
  LookComposer,
  STORY_BLOOM_LAYER,
  applyLookOverlay,
  applySceneEnvironment,
  disposeSceneEnvironment,
  ensureLookOverlay,
  tickLookOverlay,
} from './scene/lookConfig';

type HeroCanvasMode = 'public' | 'admin';

type RenderProfile = {
  lowPower: boolean;
  pixelRatio: number;
  shadowMapCap: number;
  useBloom: boolean;
};

function renderProfile(): RenderProfile {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = reducedMotion || cores <= 4 || memory <= 4;
  const highPower = !lowPower && cores >= 8 && memory >= 8;
  return {
    lowPower,
    pixelRatio: Math.min(window.devicePixelRatio || 1, lowPower ? 1 : highPower ? 2 : 1.5),
    shadowMapCap: lowPower ? 1024 : 2048,
    useBloom: !lowPower,
  };
}

function reportHeroLoad(progress: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('rastaak-load-progress', { detail: { progress } }));
}

function reportSceneReady() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('rastaak-scene-ready'));
}

export const HeroCanvas3D: React.FC<{ mode?: HeroCanvasMode }> = ({ mode = 'public' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;
    let inactiveRenderTimer: number | null = null;

    const env = SCENE_CONFIG.environment;
    const camConfig = SCENE_CONFIG.camera;
    const backgroundColor = new THREE.Color(env.backgroundColor);
    const fogColor = new THREE.Color(env.fogColor ?? env.backgroundColor);

    document.body.style.backgroundColor = '#' + backgroundColor.getHexString();

    const scene = new THREE.Scene();
    scene.background = backgroundColor;
    scene.fog = env.fogEnabled === false ? null : new THREE.Fog(fogColor, env.fogStart, env.fogEnd);
    ensureCinematicSky(scene, env.skyEnabled !== false, env.sky, env.horizon);

    const host = containerRef.current;
    const viewW = () => Math.max(1, host.clientWidth || window.innerWidth);
    const viewH = () => Math.max(1, host.clientHeight || window.innerHeight);
    const profile = renderProfile();
    const shadowMapSize = (requested: number | undefined, fallback: number) =>
      Math.min(profile.shadowMapCap, requested ?? fallback);

    const camera = new THREE.PerspectiveCamera(
      camConfig.defaultFov,
      viewW() / viewH(),
      camConfig.near,
      camConfig.far,
    );
    camera.layers.enable(STORY_BLOOM_LAYER);

    const renderer = new THREE.WebGLRenderer({ antialias: !profile.lowPower, alpha: true });
    renderer.setSize(viewW(), viewH());
    renderer.setPixelRatio(profile.pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure ?? 1.15;
    renderer.shadowMap.enabled = true;
    applyRendererShadowFilter(renderer, profile.lowPower ? 'basic' : SCENE_CONFIG.renderer.shadowMapType);
    const lookPost = profile.useBloom ? new LookComposer(renderer) : null;
    lookPost?.setSize(viewW(), viewH());

    host.innerHTML = '';
    renderer.domElement.classList.add('is-ready');
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    if (mode !== 'admin') renderer.domElement.style.zIndex = '-1';
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 140;
    controls.zoomSpeed = 0.9;
    controls.rotateSpeed = 0.7;

    const isUiEvent = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el || typeof el.closest !== 'function') return false;
      return Boolean(
        el.closest('#rastaak-studio-dock') ||
          el.closest('#rastaak-layout-control') ||
          el.closest('#rastaak-story-timeline') ||
          el.closest('.lil-gui') ||
          el.closest('input, textarea, select, button, a, label, [contenteditable="true"]'),
      );
    };
    const viewport = new BlenderViewport(camera, isUiEvent);

    let orbitSeekT: number | null = null;

    RectAreaLightUniformsLib.init();

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
          dirLight.shadow.camera.left = -45;
          dirLight.shadow.camera.right = 45;
          dirLight.shadow.camera.top = 45;
          dirLight.shadow.camera.bottom = -45;
          applyLightShadow(dirLight, {
            shadowMapSize: shadowMapSize(cfg.shadowMapSize, 2048),
            shadowBias: cfg.shadowBias ?? -0.0005,
            shadowNormalBias: cfg.shadowNormalBias,
            shadowNear: cfg.shadowNear ?? 1,
            shadowFar: cfg.shadowFar ?? 180,
            shadowIntensity: cfg.shadowIntensity,
            radius: cfg.radius,
          });
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
          applyLightShadow(ptLight, {
            shadowMapSize: shadowMapSize(cfg.shadowMapSize, 1024),
            shadowBias: cfg.shadowBias ?? 0,
            shadowNormalBias: cfg.shadowNormalBias,
            shadowNear: cfg.shadowNear,
            shadowFar: cfg.shadowFar,
            shadowIntensity: cfg.shadowIntensity,
            radius: cfg.radius,
            distance: cfg.distance,
          });
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
          applyLightShadow(spotLight, {
            shadowMapSize: shadowMapSize(cfg.shadowMapSize, 1024),
            shadowBias: cfg.shadowBias ?? -0.0005,
            shadowNormalBias: cfg.shadowNormalBias,
            shadowNear: cfg.shadowNear,
            shadowFar: cfg.shadowFar,
            shadowIntensity: cfg.shadowIntensity,
            radius: cfg.radius,
            distance: cfg.distance,
          });
        }
        light = spotLight;
      } else if (cfg.type === 'rectarea') {
        const area = new THREE.RectAreaLight(
          cfg.color,
          cfg.intensity,
          Math.max(0.1, cfg.width ?? 6),
          Math.max(0.1, cfg.height ?? 6),
        );
        if (cfg.position) area.position.set(...cfg.position);
        const aim = cfg.target ?? [cfg.position?.[0] ?? 0, 0, cfg.position?.[2] ?? 0];
        area.lookAt(aim[0], aim[1], aim[2]);
        area.userData.lookTarget = [...aim];
        light = area;
      }

      if (light) {
        light.visible = cfg.enabled !== false;
        scene.add(light);
        lightsMap.set(cfg.id, light);
      }
    }
    applySceneShadows(lightsMap.values());
    applySceneEnvironment(scene, renderer);
    ensureLookOverlay(host);
    applyLookOverlay();

    let world: THREE.Group | null = null;
    let announcedReady = false;
    let studioGUI: SceneStudioGUI | null = null;
    let studioBooting = false;
    const story = new StoryRuntime();
    const namePlates = new BuildingNamePlateSet();
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onStudioBeforeSave = () => story.restoreBase();
    const onStudioAfterSave = () => story.captureBase();
    const onStudioMaterialsChanged = () => {
      story.rebindIdlePalette();
    };
    window.addEventListener('rastaak-studio-before-save', onStudioBeforeSave);
    window.addEventListener('rastaak-studio-after-save', onStudioAfterSave);
    window.addEventListener('rastaak-studio-materials-changed', onStudioMaterialsChanged);

    const unsubscribeLive = subscribeLive((patch) => {
      if (mode !== 'public') return;
      if (Array.isArray(patch.lights)) {
        for (const raw of patch.lights) {
          const cfg = raw as LightConfig;
          const light = lightsMap.get(cfg.id);
          if (!light) continue;
          if (cfg.enabled !== undefined) light.visible = cfg.enabled;
          if (typeof cfg.intensity === 'number') light.intensity = cfg.intensity;
          if (typeof cfg.color === 'number') light.color.setHex(cfg.color);
          if (cfg.position) light.position.set(...cfg.position);
          if (cfg.type === 'rectarea') {
            const area = light as THREE.RectAreaLight;
            if (cfg.width) area.width = cfg.width;
            if (cfg.height) area.height = cfg.height;
            if (cfg.target) {
              area.userData.lookTarget = [...cfg.target];
              area.lookAt(cfg.target[0], cfg.target[1], cfg.target[2]);
            }
          }
          if ('distance' in light && cfg.distance !== undefined) (light as THREE.PointLight).distance = cfg.distance;
          if ('decay' in light && cfg.decay !== undefined) (light as THREE.PointLight).decay = cfg.decay;
          if (cfg.castShadow !== undefined) light.castShadow = cfg.castShadow;
        }
      }
      if (patch.environment && typeof patch.environment === 'object') {
        const envPatch = patch.environment as SceneEnvironmentConfig;
        if (envPatch.backgroundColor !== undefined) {
          const col = new THREE.Color(envPatch.backgroundColor);
          scene.background = col;
          document.body.style.backgroundColor = '#' + col.getHexString();
        }
        if (envPatch.fogEnabled === false) {
          scene.fog = null;
        } else if (envPatch.fogEnabled === true && !scene.fog) {
          scene.fog = new THREE.Fog(
            envPatch.fogColor ?? SCENE_CONFIG.environment.fogColor ?? SCENE_CONFIG.environment.backgroundColor,
            envPatch.fogStart ?? SCENE_CONFIG.environment.fogStart,
            envPatch.fogEnd ?? SCENE_CONFIG.environment.fogEnd,
          );
        }
        if (scene.fog && envPatch.fogColor !== undefined) (scene.fog as THREE.Fog).color.setHex(envPatch.fogColor);
        if (scene.fog && envPatch.fogStart !== undefined) (scene.fog as THREE.Fog).near = envPatch.fogStart;
        if (scene.fog && envPatch.fogEnd !== undefined) (scene.fog as THREE.Fog).far = envPatch.fogEnd;
        if (envPatch.fogEnabled !== undefined) SCENE_CONFIG.environment.fogEnabled = envPatch.fogEnabled;
        if (envPatch.skyEnabled !== undefined) {
          SCENE_CONFIG.environment.skyEnabled = envPatch.skyEnabled;
          setCinematicSkyEnabled(scene, envPatch.skyEnabled);
        }
        if (envPatch.sky) {
          SCENE_CONFIG.environment.sky = { ...(SCENE_CONFIG.environment.sky ?? {}), ...envPatch.sky } as NonNullable<SceneEnvironmentConfig['sky']>;
          setCinematicSkyConfig(scene, SCENE_CONFIG.environment.sky, SCENE_CONFIG.environment.horizon);
        }
        if (envPatch.horizon) {
          SCENE_CONFIG.environment.horizon = { ...(SCENE_CONFIG.environment.horizon ?? {}), ...envPatch.horizon } as NonNullable<SceneEnvironmentConfig['horizon']>;
          SCENE_CONFIG.environment.fogColor = SCENE_CONFIG.environment.horizon.color;
          if (scene.fog) (scene.fog as THREE.Fog).color.setHex(SCENE_CONFIG.environment.horizon.color);
          setCinematicHorizonConfig(scene, SCENE_CONFIG.environment.horizon);
        }
        if (envPatch.shadowColor !== undefined) SCENE_CONFIG.environment.shadowColor = envPatch.shadowColor;
        if (envPatch.shadowOpacity !== undefined) SCENE_CONFIG.environment.shadowOpacity = envPatch.shadowOpacity;
        applySceneShadows(lightsMap.values());
      }
      if (patch.renderer && typeof patch.renderer === 'object' && 'toneMappingExposure' in (patch.renderer as object)) {
        renderer.toneMappingExposure = Number((patch.renderer as { toneMappingExposure: number }).toneMappingExposure);
      }
      if (patch.scroll && typeof patch.scroll === 'object') {
        Object.assign(SCENE_CONFIG.scroll, patch.scroll as Partial<typeof SCENE_CONFIG.scroll>);
        setJourneyScrollLength(SCENE_CONFIG.scroll.journeyScrollLength ?? 1);
      }
      if (patch.visibility && typeof patch.visibility === 'object') {
        const visibilityPatch = patch.visibility as SceneVisibilityConfig;
        SCENE_CONFIG.visibility = {
          ...(SCENE_CONFIG.visibility ?? {}),
          ...visibilityPatch,
          ...(visibilityPatch.buildings ? { buildings: { ...visibilityPatch.buildings } } : {}),
        };
        if (world) {
          applyTreeVisibility(world, SCENE_CONFIG.visibility);
          applyBuildingVisibility(world, SCENE_CONFIG.visibility);
        }
      }
      if (patch.cameraMethod === 'stops' || patch.cameraMethod === 'progress') {
        SCENE_CONFIG.cameraMethod = patch.cameraMethod as CameraMethod;
      }
      if (Array.isArray(patch.cameraStops)) {
        SCENE_CONFIG.stops.splice(0, SCENE_CONFIG.stops.length, ...(patch.cameraStops as CameraStop[]));
      }
      if (Array.isArray(patch.progressKeyframes)) {
        SCENE_CONFIG.progressKeyframes.splice(
          0,
          SCENE_CONFIG.progressKeyframes.length,
          ...(patch.progressKeyframes as CameraKeyframe[]),
        );
      }
      if (patch.materials && world) {
        applyMaterialsConfig(world, patch.materials as MaterialsConfig);
        story.rebindIdlePalette();
      }
      if (patch.look && typeof patch.look === 'object') {
        Object.assign(LOOK_CONFIG, patch.look);
        applySceneEnvironment(scene, renderer);
        applyLookOverlay();
      }
    });

    const bootStudio = async () => {
      if (studioGUI || studioBooting || isDisposed) return;
      studioBooting = true;
      try {
        // Keep all Studio/timeline code out of the public visitor bundle. This
        // import only runs after the server confirms an authenticated /admin session.
        const { SceneStudioGUI: StudioGUI } = await import('./scene/SceneStudioGUI');
        if (isDisposed) return;
        document.documentElement.dataset.studio = 'true';
        studioGUI = new StudioGUI(
          scene,
          camera,
          renderer,
          lightsMap,
          () => world,
          (forcedT: number) => {
            targetScrollProgress = forcedT;
            currentScrollProgress = forcedT;
            // In Blender viewport mode, a keyframe/timeline seek is a preview:
            // show the exact final journey pose now, then leave navigation free
            // for the user to compose or capture the next view.
            if (viewport.enabled) {
              applyJourneyToCamera(forcedT);
            } else if (controls.enabled) {
              orbitSeekT = forcedT;
            }
          },
          (orbitEnabled: boolean) => {
            if (mode === 'admin') {
              if (orbitEnabled) {
                controls.target.copy(lookAt);
                controls.enabled = true;
              } else {
                controls.enabled = false;
              }
              if (containerRef.current) {
                containerRef.current.style.pointerEvents = orbitEnabled ? 'auto' : 'none';
              }
              return;
            }
            if (orbitEnabled) {
              if (!viewport.enabled) viewport.target.copy(lookAt);
              viewport.setEnabled(true);
            } else {
              viewport.setEnabled(false);
            }
          },
          viewport,
          () => (mode === 'admin' ? controls.target : viewport.target),
        );
        if (world) {
          studioGUI.populateMaterials();
          studioGUI.populateBuildingVisibility();
        }
      } catch (error) {
        console.warn('[HeroCanvas3D] failed to load admin studio', error);
      } finally {
        studioBooting = false;
      }
    };

    void fetch('/api/admin/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) void bootStudio();
      })
      .catch(() => undefined);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    reportHeroLoad(10);

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
                if ('metalness' in cloned) cloned.metalness = Math.min(cloned.metalness ?? 0, 0.28);
                if ('roughness' in cloned) cloned.roughness = Math.max(Math.min(cloned.roughness ?? 0.45, 1), 0.22);
                return cloned;
              });
            } else {
              const cloned = mesh.material.clone() as THREE.MeshStandardMaterial;
              cloned.userData.gltfName = mesh.material.name || '';
              cloned.userData.nodeName = mesh.name || mesh.parent?.name || '';
              cloned.name = mesh.material.name || `${mesh.name || 'Building'}_Mat_0`;
              if ('metalness' in cloned) cloned.metalness = Math.min(cloned.metalness ?? 0, 0.28);
              if ('roughness' in cloned) cloned.roughness = Math.max(Math.min(cloned.roughness ?? 0.45, 1), 0.22);
              mesh.material = cloned;
            }
          }
        });

        applyMaterialsConfig(world, SCENE_CONFIG.materials);
        applyTreeVisibility(world, SCENE_CONFIG.visibility);
        applyBuildingVisibility(world, SCENE_CONFIG.visibility);
        tintWorldShadows(world);
        applySceneShadows(lightsMap.values());
        applySceneEnvironment(scene, renderer);
        scene.add(world);
        world.updateMatrixWorld(true);
        if (process.env.NODE_ENV === 'development') {
          const named = world.children.map((child) => child.name).filter(Boolean);
          console.info('[story] loaded world nodes', named.length, named);
        }
        story.attach(world, scene);
        namePlates.attach(world, scene);
        studioGUI?.populateMaterials();
        studioGUI?.populateBuildingVisibility();
        reportHeroLoad(94);
      },
      (xhr: ProgressEvent) => {
        const total = xhr.total > 0 ? xhr.total : 11 * 1024 * 1024;
        const percent = 10 + Math.round((xhr.loaded / total) * 80);
        reportHeroLoad(Math.min(90, percent));
      },
      (error: unknown) => {
        console.error('[HeroCanvas3D] failed to load world model', error);
        reportHeroLoad(100);
        reportSceneReady();
        setIsLoaded(true);
      },
    );

    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const handleScroll = () => {
      targetScrollProgress = readStoryScrollProgress(SCENE_CONFIG.scroll.headerScrollMultiplier);
    };
    const handleJourneyScrollLengthChange = () => {
      applyJourneyScrollLength();
      handleScroll();
    };

    applyJourneyScrollLength();
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener(JOURNEY_SCROLL_LENGTH_EVENT, handleJourneyScrollLengthChange);

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = viewW() / viewH();
      camera.updateProjectionMatrix();
      renderer.setSize(viewW(), viewH(), false);
      lookPost?.setSize(viewW(), viewH());
      handleJourneyScrollLengthChange();
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(host);

    const startTime = performance.now();
    let lastTime = startTime;
    const sample = {
      camera: [0, 0, 0] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      fov: camConfig.defaultFov,
    };

    const camPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    function applyJourneyToCamera(t: number) {
      sampleSceneJourney(t, sample);
      camPos.set(sample.camera[0], sample.camera[1], sample.camera[2]);
      lookAt.set(sample.target[0], sample.target[1], sample.target[2]);
      camera.position.copy(camPos);
      camera.lookAt(lookAt);
      if (camera.fov !== sample.fov) {
        camera.fov = sample.fov;
        camera.updateProjectionMatrix();
      }
      controls.target.copy(lookAt);
      // Blender navigation owns its own target, so synchronize it whenever a
      // keyframe or timeline seek applies a saved camera pose.
      viewport.target.copy(lookAt);
    }

    const stopPageWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (mode === 'admin') {
      applyJourneyToCamera(0);
      controls.enabled = true;
      host.style.pointerEvents = 'auto';
      renderer.domElement.style.pointerEvents = 'auto';
      renderer.domElement.style.touchAction = 'none';
      host.addEventListener('wheel', stopPageWheel, { passive: false });
    }

    const sceneNeedsFrame = () => {
      if (document.hidden) return false;
      if (mode === 'admin' || studioGUI?.isEditing) return true;
      // Once opaque page content has taken over, the fixed canvas is hidden
      // behind it. Pause costly WebGL frames until the visitor scrolls back.
      const features = document.querySelector<HTMLElement>('.features');
      return !features || features.getBoundingClientRect().top > 0;
    };

    const scheduleNextFrame = (active: boolean) => {
      if (active) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      inactiveRenderTimer = window.setTimeout(() => {
        inactiveRenderTimer = null;
        animationFrameId = requestAnimationFrame(animate);
      }, 250);
    };

    const animate = () => {
      if (isDisposed) return;
      const now = performance.now();
      const active = sceneNeedsFrame();
      if (!active) {
        lastTime = now;
        scheduleNextFrame(false);
        return;
      }
      const delta = Math.min(0.05, (now - lastTime) / 1000);
      const elapsed = (now - startTime) / 1000;
      lastTime = now;

      if (studioGUI?.isManualMode) {
        camera.position.copy(studioGUI.manualCamPos);
        camera.lookAt(studioGUI.manualLookAt);
      } else if (viewport.enabled || (studioGUI?.isOrbitMode && mode !== 'admin')) {
        camera.lookAt(viewport.target);
      } else if (mode === 'admin' && controls.enabled) {
        if (orbitSeekT !== null) {
          applyJourneyToCamera(orbitSeekT);
          orbitSeekT = null;
        }
        controls.update();
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

      studioGUI?.tick();
      tickCinematicSky(scene, elapsed);
      if (!profile.lowPower) tickLookOverlay(elapsed);
      renderer.render(scene, camera);
      lookPost?.composite(scene, camera);
      if (world && !announcedReady) {
        announcedReady = true;
        reportHeroLoad(100);
        reportSceneReady();
        setIsLoaded(true);
      }
      scheduleNextFrame(true);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      if (inactiveRenderTimer !== null) window.clearTimeout(inactiveRenderTimer);
      host.removeEventListener('wheel', stopPageWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener(JOURNEY_SCROLL_LENGTH_EVENT, handleJourneyScrollLengthChange);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      window.removeEventListener('rastaak-studio-before-save', onStudioBeforeSave);
      window.removeEventListener('rastaak-studio-after-save', onStudioAfterSave);
      window.removeEventListener('rastaak-studio-materials-changed', onStudioMaterialsChanged);
      unsubscribeLive();
      story.dispose();
      namePlates.dispose();
      controls.dispose();
      viewport.dispose();
      studioGUI?.destroy();
      delete document.documentElement.dataset.studio;
      delete document.documentElement.dataset.viewport;

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

      disposeCinematicSky(scene);
      lookPost?.dispose();
      dracoLoader.dispose();
      renderer.dispose();

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [mode]);

  if (mode === 'admin') {
    return (
      <div
        ref={containerRef}
        className={`rastaak-admin-canvas ${isLoaded ? 'is-ready' : ''}`}
        id="rastaak-admin-canvas"
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}
      />
    );
  }

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
