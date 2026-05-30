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
  EquirectangularReflectionMapping,
  SRGBColorSpace,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import {
  tryOnMounted,
  tryOnUnmounted,
  useWindowSize,
  useEventListener,
} from "@vueuse/core";
import { useTemplateRef } from "vue";
import GUI from "lil-gui";
import { createEarthMesh } from "../utils/earth";

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

  const loader = new TextureLoader();

  const {
    earthGroup,
    earthMesh: earth,
    nightLightMesh,
    cloudMesh,
    atmosphereMesh,
  } = createEarthMesh(loader, {
    radius: 1,
    sunDirection: sunLight.position.clone().normalize(),
  });
  scene.add(earthGroup);

  const ambientLight = new AmbientLight(0x222244, 0.3); // dim bluish light
  scene.add(ambientLight);

  // stars background
  const starTexture = loader.load("textures/stars-milky-way-8k.jpg");
  starTexture.mapping = EquirectangularReflectionMapping;
  starTexture.colorSpace = SRGBColorSpace;
  scene.background = starTexture;

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
      nightLightMesh!.visible = value;
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
    scene.background = value ? starTexture : null;
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

  // resize
  const onResize = () => {
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();
    renderer!.setSize(width.value, height.value);
  };
  useEventListener("resize", onResize);

  // animate
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    if (settings.rotation) {
      earth.rotation.y += settings.rotationSpeed;
      nightLightMesh!.rotation.y += settings.rotationSpeed;
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
