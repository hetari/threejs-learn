<script setup lang="ts">
import {
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  PlaneGeometry,
  TextureLoader,
  SphereGeometry,
  IcosahedronGeometry,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import {
  tryOnMounted,
  tryOnUnmounted,
  useWindowSize,
  useEventListener,
} from "@vueuse/core";
import { useTemplateRef } from "vue";
import vertexShader from "../shader/006/vertix.vert?raw";
import fragmentShader from "../shader/006/fragment.frag?raw";
import { inject } from "vue";
import type Stats from "stats.js";

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const { width, height } = useWindowSize();
let controls: OrbitControls;
let renderer: WebGLRenderer;
const stats = inject<Stats & { reset: () => void }>("stats");

let animationFrameId = 0;

tryOnUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  controls?.dispose();
  renderer?.dispose();
  stats?.reset();
});

tryOnMounted(() => {
  if (!canvas.value) return;

  // scene
  const scene = new Scene();
  scene.background = new Color("#050816");

  // camera
  const camera = new PerspectiveCamera(
    75,
    width.value / height.value,
    0.1,
    1000,
  );
  camera.position.z = 4;

  // renderer
  renderer = new WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width.value, height.value);

  // light
  // const directionalLight = new DirectionalLight("#ffffff", 0.75);
  // scene.add(directionalLight);
  // const ambientLight = new AmbientLight("#ffffff", 0.2);
  // scene.add(ambientLight);

  // control
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = true;

  // resize
  const onResize = () => {
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();

    renderer.setSize(width.value, height.value);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  useEventListener("resize", onResize);

  //   // light
  //   const light = new AmbientLight(0xffffff, 0.8);
  //   scene.add(light);

  // shape (plane)
  const geometry = new IcosahedronGeometry(1, 124);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
  });

  material.uniforms.uTime = { value: 0 };

  const ico = new Mesh(geometry, material);
  scene.add(ico);

  // animate
  const animate = (t = 0) => {
    stats?.begin();

    controls!.update();
    renderer!.render(scene, camera);
    stats?.end();
    animationFrameId = requestAnimationFrame(animate);

    const time = t / 7500; //Date.now() / 1000;
    material.uniforms.uTime.value = time;
  };
  animate();
});
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 h-full w-full" />
</template>
