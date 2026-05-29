<script setup lang="ts">
import {
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  WebGLRenderer,
  AdditiveBlending,
  DirectionalLight,
  ShaderMaterial,
  AmbientLight,
  FrontSide,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { tryOnMounted, tryOnUnmounted, useWindowSize } from "@vueuse/core";
import { useTemplateRef } from "vue";
import GUI from "lil-gui";

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const { width, height } = useWindowSize();
let gui: GUI | undefined;
let controls: OrbitControls | undefined;
let renderer: WebGLRenderer | undefined;
let animationFrameId = 0;

tryOnUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  controls?.dispose();
  gui?.destroy();
  renderer?.dispose();
});

import { getStarField } from "../lib/stars";

tryOnMounted(() => {
  if (!canvas.value) return;

  // scene
  const scene = new Scene();

  // camera
  const camera = new PerspectiveCamera(
    75,
    width.value / height.value,
    0.1,
    1000,
  );
  camera.position.z = 3;

  // renderer
  renderer = new WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  });
  renderer.setSize(width.value, height.value);

  // light
  const sunLight = new DirectionalLight(0xffffff);
  sunLight.position.set(2, -0.5, 1.5);
  scene.add(sunLight);

  // earth group
  const earthGroup = new Group();
  earthGroup.rotation.z = (-23.4 * Math.PI) / 180;
  scene.add(earthGroup);

  // earth mesh
  const loader = new TextureLoader();

  const geometry = new IcosahedronGeometry(1, 32);
  const material = new MeshStandardMaterial({
    map: loader.load("textures/earth-daymap-4k.jpg"),
    roughness: 0.8,
    metalness: 0.1,
  });
  const earth = new Mesh(geometry, material);
  earthGroup.add(earth);

  // night lights mesh with custom shader to show only on dark side
  const nightMapTexture = loader.load("textures/earth-nightmap-4k.jpg");

  const nightLightMaterial = new ShaderMaterial({
    uniforms: {
      nightMap: { value: nightMapTexture },
      sunDirection: { value: sunLight.position.clone().normalize() }, // world‑space direction
    },
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    
    void main() {
      vUv = uv;
      // Transform normal to world space
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    
    void main() {
      // Dot product with world space sun direction
      float lightIntensity = dot(vWorldNormal, sunDirection);
      
      // Smooth transition on the dark side
      float nightVisibility = smoothstep(0.2, -0.2, lightIntensity);
      
      vec4 nightColor = texture2D(nightMap, vUv);
      gl_FragColor = vec4(nightColor.rgb, nightColor.a * nightVisibility);
    }
  `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const nightLightMesh = new Mesh(geometry, nightLightMaterial);
  earthGroup.add(nightLightMesh);
  const ambientLight = new AmbientLight(0x222244, 0.3); // dim bluish light
  scene.add(ambientLight);

  // clouds
  const cloudTexture = loader.load("textures/earth-clouds-4k.jpg");
  const cloudMaterial = new MeshStandardMaterial({
    map: cloudTexture,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const cloudMesh = new Mesh(geometry, cloudMaterial);
  cloudMesh.scale.setScalar(1.003);
  earthGroup.add(cloudMesh);

  // atmospheric glow
  const atmosphereGeometry = new IcosahedronGeometry(1.005, 32);
  const atmosphereMaterial = new ShaderMaterial({
    uniforms: {
      sunDirection: { value: sunLight.position.clone().normalize() },
    },
    vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 sunDirection;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      // Calculate view direction
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      
      // Fresnel effect - stronger glow at edges
      float fresnel = 1.0 - abs(dot(viewDirection, vWorldNormal));
      fresnel = pow(fresnel, 3.0);
      
      // Atmosphere color (blue)
      vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
      
      // Mix with transparency based on fresnel
      float alpha = fresnel * 0.3;
      
      gl_FragColor = vec4(atmosphereColor, alpha);
    }
  `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: FrontSide,
  });
  const atmosphereMesh = new Mesh(atmosphereGeometry, atmosphereMaterial);
  earthGroup.add(atmosphereMesh);

  // stars
  const stars = getStarField({ numStars: 5000 });
  scene.add(stars);

  // GUI folders and controls
  gui = new GUI({ title: "Earth Controls" });
  gui.domElement.style.left = "16px";
  gui.domElement.style.right = "auto";
  gui.domElement.style.top = "16px";
  gui.domElement.style.zIndex = "1000";
  gui.domElement.style.maxHeight = "calc(100vh - 32px)";
  gui.domElement.style.overflow = "auto";

  const settings = {
    rotation: true,
    showDayMap: true,
    showNightLights: true,
    showClouds: true,
    showAtmosphere: true,
    showStars: true,
    rotationSpeed: 0.001,
    ambientLightIntensity: 0.3,
  };
  const visibilityFolder = gui.addFolder("Visibility");
  visibilityFolder.add(settings, "showDayMap").onChange((value: boolean) => {
    earth.visible = value;
  });
  visibilityFolder
    .add(settings, "showNightLights")
    .onChange((value: boolean) => {
      nightLightMesh.visible = value;
    });
  visibilityFolder.add(settings, "showClouds").onChange((value: boolean) => {
    cloudMesh.visible = value;
  });
  visibilityFolder
    .add(settings, "showAtmosphere")
    .onChange((value: boolean) => {
      atmosphereMesh.visible = value;
    });
  visibilityFolder.add(settings, "showStars").onChange((value: boolean) => {
    stars.visible = value;
  });

  const animationFolder = gui.addFolder("Animation");
  animationFolder.add(settings, "rotation").name("Auto Rotate");
  animationFolder.add(settings, "rotationSpeed", 0, 0.02, 0.001).name("Speed");

  const lightingFolder = gui.addFolder("Lighting");
  lightingFolder
    .add(settings, "ambientLightIntensity", 0, 1, 0.01)
    .name("Ambient")
    .onChange((value: number) => {
      ambientLight.intensity = value;
    });

  // control
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.autoRotate = false;
  controls.rotateSpeed = 0.5;

  gui.close();

  // animate
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    if (settings.rotation) {
      earth.rotation.y += settings.rotationSpeed;
      nightLightMesh.rotation.y += settings.rotationSpeed;
      cloudMesh.rotation.y += settings.rotationSpeed + 0.001;
    }

    controls!.update();
    renderer!.render(scene, camera);
  };
  animate();
});
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 h-full w-full" />
</template>
