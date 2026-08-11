'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tokens } from '@/tokens/design-tokens';

export const HeroCanvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;
    let animationFrameId: number;

    // Scene setup uses the Three.js-ready values from the shared token system.
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(tokens.experimentalScene.canvasBackground);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 32);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(tokens.experimentalScene.ambient, 1.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(tokens.experimentalScene.ambient, tokens.experimentalScene.hemisphereGround, 2);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(tokens.experimentalScene.keyLight, 3);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(tokens.experimentalScene.fillLight, 2);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(120, 60, tokens.experimentalScene.gridPrimary, tokens.experimentalScene.gridSecondary);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Draco & GLTF Loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const turbines: THREE.Object3D[] = [];
    let modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Load main facility model
    const isMobile = window.innerWidth <= 820;
    const modelUrl = isMobile
      ? '/glb/nuclear_staffing_noHumans_mobile.glb'
      : '/glb/nuclear_staffing_noHumans.glb';

    gltfLoader.load(
      modelUrl,
      (gltf: any) => {
        if (isDisposed) return;
        const root = gltf.scene;

        root.traverse((child: any) => {
          if (child.isMesh) {
            child.material.wireframe = false;
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.name.toLowerCase().includes('turbine') || child.name.toLowerCase().includes('rotor')) {
              turbines.push(child);
            }
          }
        });

        root.position.set(0, -2, 0);
        modelGroup.add(root);
        setIsLoaded(true);
      },
      undefined,
      (error: any) => {
        console.warn('Hero 3D model fallback:', error);
        setIsLoaded(true);
      }
    );

    // Load workers
    gltfLoader.load(
      '/glb/workers.glb',
      (gltf: any) => {
        if (isDisposed) return;
        const workers = gltf.scene;
        workers.position.set(0, -2, 0);
        workers.scale.set(1.1, 1.1, 1.1);
        modelGroup.add(workers);
      },
      undefined,
      (err: any) => {
        console.warn('Hero workers fallback:', err);
      }
    );

    // Scroll-based camera interpolation
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.05;

      turbines.forEach((t) => {
        t.rotation.z += delta * 2.5;
      });

      const radius = 30 - currentScrollProgress * 12;
      const angle = currentScrollProgress * Math.PI * 0.8 - 0.2;

      camera.position.x = Math.sin(angle) * radius;
      camera.position.z = Math.cos(angle) * radius;
      camera.position.y = 8 + Math.sin(elapsed * 0.5) * 0.3 - currentScrollProgress * 3;
      camera.lookAt(0, 2 - currentScrollProgress * 1.5, 0);

      modelGroup.rotation.y = Math.sin(elapsed * 0.2) * 0.05;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
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
