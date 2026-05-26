<script setup lang="ts">
import { tryOnMounted, useWindowSize } from "@vueuse/core";
import { onUpdated, useTemplateRef } from "vue";
import {
  BoxGeometry,
  BoxHelper,
  Color,
  EdgesGeometry,
  FogExp2,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

import spline from "../lib/spline";
import {
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";

const { height, width } = useWindowSize();
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

tryOnMounted(() => {
  if (!canvasRef.value) return;

  // scene
  const scene = new Scene();
  scene.fog = new FogExp2(0x000000, 0.3);

  // camera – set aspect immediately
  const camera = new PerspectiveCamera(
    50, // Field of view
    width.value / height.value, // correct initial aspect
    0.1, // Near clipping plane
    1000, // Far clipping plane
  );
  camera.position.z = 5;

  // renderer
  const renderer = new WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  });
  renderer.setSize(width.value, height.value);
  renderer.outputColorSpace = SRGBColorSpace;

  // post processing
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new Vector2(width.value, height.value),
    3.5,
    0.4,
    100,
  );
  bloomPass.threshold = 0.002;
  bloomPass.strength = 0.5;
  bloomPass.radius = 0;
  const composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  const tubeGeo = new TubeGeometry(
    spline,
    222, // segments
    0.65, // radius
    16, // radial segments
    true, // closed
  );
  const tubeMaterial = new MeshBasicMaterial({
    color: 0xff0000,
    // side: DoubleSide,   // wireframe is already visible from both sides
    wireframe: true,
  });
  const tube = new Mesh(tubeGeo, tubeMaterial);
  scene.add(tube);

  // Add boxes
  const numBoxes = 55;
  const size = 0.075;
  const boxGeo = new BoxGeometry(size, size, size);
  for (let i = 0; i < numBoxes; i += 1) {
    const boxMat = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    });
    const box = new Mesh(boxGeo, boxMat);
    const p = (i / numBoxes + Math.random() * 0.1) % 1;
    const pos = tubeGeo.parameters.path.getPointAt(p);
    pos.x += Math.random() - 0.4;
    pos.z += Math.random() - 0.4;
    box.position.copy(pos);

    const rote = new Vector3(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    box.rotation.set(rote.x, rote.y, rote.z);

    const edges = new EdgesGeometry(boxGeo, 0.2);
    const color = new Color().setHSL(0.7 - p, 1, 0.5);
    const lineMat = new LineBasicMaterial({ color });
    const boxLines = new LineSegments(edges, lineMat);
    boxLines.position.copy(pos);
    boxLines.rotation.set(rote.x, rote.y, rote.z);
    scene.add(box);
    scene.add(boxLines);
  }

  // camera fly‑thru – corrected timing
  const updateCamera = (t: number) => {
    const time = t * 0.1;
    const looptime = 8 * 1000;
    const p = (time % looptime) / looptime;
    const pos = tubeGeo.parameters.path.getPointAt(p);
    const lookAt = tubeGeo.parameters.path.getPointAt((p + 0.03) % 1);

    camera.position.copy(pos);
    camera.lookAt(lookAt);
  };

  // animate
  function animate(t = 0) {
    requestAnimationFrame(animate);
    updateCamera(t);
    composer.render();
  }
  animate();

  // resize – already correct, but now camera has proper initial aspect
  window.addEventListener("resize", () => {
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();
    renderer.setSize(width.value, height.value);
  });
});
</script>

<template>
  <canvas ref="canvasRef" class="fixed inset-0 h-full w-full bg-black" />
</template>
