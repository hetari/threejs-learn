<script setup lang="ts">
import {
  BoxGeometry,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { tryOnMounted, useWindowSize } from "@vueuse/core";
import { useTemplateRef } from "vue";

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const { width, height } = useWindowSize();

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
  const renderer = new WebGLRenderer({
    canvas: canvas.value,
  });
  renderer.setSize(width.value, height.value);

  // geometry
  const geometry = new BoxGeometry();
  const material = new MeshStandardMaterial({
    color: 0xffff00,
  });

  // shape (cube)
  const cube = new Mesh(geometry, material);
  scene.add(cube);

  // light
  const hemiLight = new HemisphereLight(0xffffff, 0x080820, 0.5);
  scene.add(hemiLight);

  // control
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = true;

  // animate
  const animate = () => {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  };
  animate();
});
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 h-full w-full bg-black" />
</template>
