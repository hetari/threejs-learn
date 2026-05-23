<script setup lang="ts">
import {
  ACESFilmicToneMapping,
  AxesHelper,
  Color,
  DoubleSide,
  GridHelper,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useTemplateRef } from "vue";
import { tryOnMounted, useWindowSize } from "@vueuse/core";
import GUI from "lil-gui";

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const { width, height } = useWindowSize();

tryOnMounted(() => {
  if (!canvas.value) return;

  // renderer
  const renderer = new WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  });

  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(width.value, height.value);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // scene
  const scene = new Scene();
  scene.background = new Color("#0a0a0f");

  // camera
  const camera = new PerspectiveCamera(
    75,
    width.value / height.value,
    0.1,
    100,
  );

  camera.position.z = 3;

  // geometry
  let detail = 2;
  let radius = 1;

  const createGeo = () => new IcosahedronGeometry(radius, detail);

  // material
  const mat = new MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.5,
    metalness: 0.2,
    flatShading: true,
  });

  // mesh
  const mesh = new Mesh(createGeo(), mat);
  scene.add(mesh);

  // wire
  const wire = new Mesh(
    mesh.geometry.clone(),
    new MeshBasicMaterial({
      color: "#ffffff",
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    }),
  );

  wire.scale.setScalar(1.001);
  mesh.add(wire);

  // light
  const light = new HemisphereLight("#0099ff", "#aa5500", 1.5);
  scene.add(light);

  // helpers
  const axes = new AxesHelper(3);
  const grid = new GridHelper(10, 10);

  axes.visible = false;
  grid.visible = false;

  scene.add(axes, grid);

  // controls
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.autoRotate = true;

  // resize
  const resize = () => {
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();

    renderer.setSize(width.value, height.value);
  };

  addEventListener("resize", resize);

  // rebuild geometry
  const rebuild = () => {
    mesh.geometry.dispose();
    wire.geometry.dispose();

    mesh.geometry = createGeo();
    wire.geometry = mesh.geometry.clone();
  };

  // gui
  const gui = new GUI();

  gui.add(mesh.rotation, "x", 0, Math.PI * 2, 0.01);
  gui.add(mesh.rotation, "y", 0, Math.PI * 2, 0.01);
  gui.add(mesh.rotation, "z", 0, Math.PI * 2, 0.01);

  gui.add(mesh.position, "x", -3, 3, 0.01);
  gui.add(mesh.position, "y", -3, 3, 0.01);
  gui.add(mesh.position, "z", -3, 3, 0.01);

  gui.add(mesh.scale, "x", 0.1, 4, 0.01).name("scaleX");
  gui.add(mesh.scale, "y", 0.1, 4, 0.01).name("scaleY");
  gui.add(mesh.scale, "z", 0.1, 4, 0.01).name("scaleZ");

  gui.addColor(mat, "color");

  gui.add(mat, "roughness", 0, 1, 0.01);
  gui.add(mat, "metalness", 0, 1, 0.01);
  gui.add(mat, "wireframe");

  gui.add(mat, "flatShading").onChange(() => (mat.needsUpdate = true));

  gui.add(mat, "transparent");
  gui.add(mat, "opacity", 0, 1, 0.01);

  gui
    .add(mat, "side", {
      front: 0,
      back: 1,
      double: DoubleSide,
    })
    .onChange(() => (mat.needsUpdate = true));

  gui.add(light, "intensity", 0, 5, 0.01);
  gui.addColor(light, "color").name("sky");
  gui.addColor(light, "groundColor").name("ground");

  gui.add(camera.position, "z", 1, 10, 0.01).name("zoom");

  gui.add(controls, "autoRotate");
  gui.add(controls, "autoRotateSpeed", 0, 20, 0.01);

  gui.add(renderer, "toneMappingExposure", 0, 3, 0.01);

  gui.add({ axes: false }, "axes").onChange((v: boolean) => {
    axes.visible = v;
  });

  gui.add({ grid: false }, "grid").onChange((v: boolean) => {
    grid.visible = v;
  });

  gui.add({ detail }, "detail", 0, 5, 1).onChange((v: number) => {
    detail = v;
    rebuild();
  });

  gui.add({ radius }, "radius", 0.2, 3, 0.01).onChange((v: number) => {
    radius = v;
    rebuild();
  });

  gui.close();
  // render
  const render = () => {
    controls.update();
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  };

  render();
});
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 h-full w-full bg-black" />
</template>
