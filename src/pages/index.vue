<script setup lang="ts">
import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Mesh,
  HemisphereLight,
  MeshBasicMaterial,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { tryOnMounted, useWindowSize } from "@vueuse/core";
import { useTemplateRef } from "vue";
import GUI from "lil-gui";

const threeRef = useTemplateRef<HTMLCanvasElement>("threeRef");
const { height, width } = useWindowSize();

function setupGui(
  mesh: Mesh,
  mat: MeshStandardMaterial,
  camera: PerspectiveCamera,
  light: HemisphereLight,
): GUI {
  const gui = new GUI({
    title: "Controls",
    autoPlace: true,
    closeFolders: true,
  });

  // Mesh position controls
  const positionFolder = gui.addFolder("Position");
  positionFolder.add(mesh.position, "x", -3, 3, 0.01).name("X");
  positionFolder.add(mesh.position, "y", -3, 3, 0.01).name("Y");
  positionFolder.add(mesh.position, "z", -3, 3, 0.01).name("Z");

  // Mesh rotation controls
  const rotationFolder = gui.addFolder("Rotation");
  rotationFolder.add(mesh.rotation, "x", 0, Math.PI * 2, 0.01).name("X");
  rotationFolder.add(mesh.rotation, "y", 0, Math.PI * 2, 0.01).name("Y");
  rotationFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.01).name("Z");

  // Material controls
  const materialFolder = gui.addFolder("Material");
  materialFolder.addColor(mat, "color").name("Color");
  materialFolder.add(mat, "wireframe").name("Wireframe");
  materialFolder
    .add(mat, "flatShading")
    .name("Flat Shading")
    .onChange(() => {
      mat.needsUpdate = true;
    });

  // Camera controls
  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "z", 0.5, 5, 0.1).name("Zoom");

  // Light controls
  const lightFolder = gui.addFolder("Hemisphere Light");
  lightFolder.addColor(light, "color").name("Sky Color");
  lightFolder.addColor(light, "groundColor").name("Ground Color");
  lightFolder.add(light, "intensity", 0, 2, 0.01).name("Intensity");

  // Geometry controls
  const geometryFolder = gui.addFolder("Geometry");
  geometryFolder
    .add({ detail: 2 }, "detail", 0, 5, 1)
    .name("Detail")
    .onChange((value: number) => {
      mesh.geometry.dispose();
      mesh.geometry = new IcosahedronGeometry(1.0, value);
    });

  return gui;
}

tryOnMounted(() => {
  // setup
  if (!threeRef.value) return;

  const renderer = new WebGLRenderer({
    canvas: threeRef.value,
  });
  renderer.setSize(width.value, height.value);

  const fov = 75;
  const aspect = width.value / height.value;
  const near = 0.1;
  const far = 10;
  const camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  const scene = new Scene();

  // geo
  const geo = new IcosahedronGeometry(1, 2);
  const mat = new MeshStandardMaterial({
    color: 0xffffff,
    // color: 0xe9573,
    flatShading: true,
  });
  const mesh = new Mesh(geo, mat);
  scene.add(mesh);

  //
  const wireMat = new MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  const wireMesh = new Mesh(geo, wireMat);
  wireMesh.scale.setScalar(1.001);
  mesh.add(wireMesh);

  // light
  const hemilight = new HemisphereLight(0x0099ff, 0xaa5500);
  scene.add(hemilight);

  // controlls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.02;
  controls.enableZoom = true;
  // controls.enablePan = true;

  // Setup GUI
  setupGui(mesh, mat, camera, hemilight);

  function render(t: number = 0) {
    renderer.render(scene, camera);
    controls.update();
    mesh.rotation.y = t * 0.0002;
    requestAnimationFrame(render);
  }
  render();
});
</script>

<template>
  <canvas ref="threeRef" />
</template>
