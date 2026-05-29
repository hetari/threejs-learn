<script setup lang="ts">
import { useTemplateRef } from "vue";
import {
  tryOnMounted,
  tryOnUnmounted,
  useEventListener,
  useWindowSize,
} from "@vueuse/core";
import {
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

const { height, width } = useWindowSize();
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

let animationFrameId: number;
let renderer: WebGLRenderer;
let controls: OrbitControls;

tryOnMounted(() => {
  if (!canvasRef.value) return;

  // scene
  const scene = new Scene();

  // camera
  const aspect = width.value / height.value;
  const camera = new PerspectiveCamera(45, aspect, 0.1, 200);
  camera.position.z = 5;

  // controls
  controls = new OrbitControls(camera, canvasRef.value);
  controls.enableDamping = true;

  // light
  const light = new HemisphereLight(0xffffff, 0x444444);
  scene.add(light);

  // renderer with pixel ratio
  renderer = new WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  });

  // Set pixel ratio - Math.min(2, device pixel ratio)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width.value, height.value);

  // on resize
  const onResize = () => {
    const newWidth = width.value;
    const newHeight = height.value;

    renderer.setSize(newWidth, newHeight);
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
  };
  useEventListener("resize", onResize);

  // animate
  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  };
  animate();
});
tryOnUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  renderer.dispose();
  controls.dispose();
});
</script>

<template>
  <canvas ref="canvasRef" class="fixed inset-0 h-full w-full bg-black" />
</template>
