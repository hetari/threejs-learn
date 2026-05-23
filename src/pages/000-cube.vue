<script setup lang="ts">
import {
  BoxGeometry,
  Color,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
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
let resize: (() => void) | undefined;
let animationFrameId = 0;

tryOnUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  resize && removeEventListener("resize", resize);
  controls?.dispose();
  gui?.destroy();
  renderer?.dispose();
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
  camera.position.z = 3;

  // renderer
  renderer = new WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
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
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = true;

  // gui
  gui = new GUI({ title: "Cube Controls" });
  gui.add(cube.rotation, "x", 0, Math.PI * 2, 0.01);
  gui.add(cube.rotation, "y", 0, Math.PI * 2, 0.01);
  gui.add(cube.rotation, "z", 0, Math.PI * 2, 0.01);

  gui.add(cube.position, "x", -3, 3, 0.01);
  gui.add(cube.position, "y", -3, 3, 0.01);
  gui.add(cube.position, "z", -3, 3, 0.01);

  gui.add(cube.scale, "x", 0.2, 4, 0.01).name("scaleX");
  gui.add(cube.scale, "y", 0.2, 4, 0.01).name("scaleY");
  gui.add(cube.scale, "z", 0.2, 4, 0.01).name("scaleZ");

  gui.addColor(material, "color").name("cubeColor");
  gui.add(hemiLight, "intensity", 0, 2, 0.01);
  gui.add(controls, "autoRotate");
  gui.add(controls, "autoRotateSpeed", 0, 20, 0.01);
  gui.close();

  // resize
  resize = () => {
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();

    renderer!.setSize(width.value, height.value);
  };

  addEventListener("resize", resize);

  // animate
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    controls!.update();
    renderer!.render(scene, camera);
  };
  animate();
});
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 h-full w-full bg-black" />
</template>
