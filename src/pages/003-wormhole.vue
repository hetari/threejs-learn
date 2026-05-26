<script setup lang="ts">
import { tryOnMounted, useWindowSize } from "@vueuse/core";
import { useTemplateRef } from "vue";
import GUI from "lil-gui";
import {
  BoxGeometry,
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
  Color,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";
import spline from "../lib/spline";

const { height, width } = useWindowSize();
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

tryOnMounted(() => {
  if (!canvasRef.value) return;

  // scene, camera, renderer
  const scene = new Scene();
  scene.fog = new FogExp2(0x000000, 0.3);

  const camera = new PerspectiveCamera(
    50,
    width.value / height.value,
    0.1,
    1000,
  );
  camera.position.z = 5;

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

  // main tube
  const tubeGeo = new TubeGeometry(spline, 222, 0.65, 16, true);
  const tubeMaterial = new MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
  });
  const tube = new Mesh(tubeGeo, tubeMaterial);
  scene.add(tube);

  // boxes (inside the tube path)
  let numBoxes = 55;
  const boxSize = 0.075;
  const boxGeo = new BoxGeometry(boxSize, boxSize, boxSize);
  const boxesGroup: { mesh: Mesh; lines: LineSegments }[] = [];

  function createBoxes() {
    // remove old boxes
    boxesGroup.forEach(({ mesh, lines }) => {
      scene.remove(mesh);
      scene.remove(lines);
    });
    boxesGroup.length = 0;

    for (let i = 0; i < numBoxes; i++) {
      // spread over the whole curve with a small random jitter
      const p = (i / numBoxes + Math.random() * 0.1) % 1;
      const pos = tubeGeo.parameters.path.getPointAt(p);
      pos.x += Math.random() - 0.4;
      pos.z += Math.random() - 0.4;

      const boxMat = new MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      });
      const box = new Mesh(boxGeo, boxMat);
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
      boxesGroup.push({ mesh: box, lines: boxLines });
    }
  }
  createBoxes();

  // camera fly‑through (fixed timing)
  let loopTime = 80000; // ms – controls speed
  const updateCamera = (t: number) => {
    const p = (t % loopTime) / loopTime;
    const pos = tubeGeo.parameters.path.getPointAt(p);
    const lookAt = tubeGeo.parameters.path.getPointAt((p + 0.03) % 1);
    camera.position.copy(pos);
    camera.lookAt(lookAt);
  };

  // lil‑gui
  const gui = new GUI({ title: "Controls" });
  gui.domElement.style.left = "16px";
  gui.domElement.style.right = "auto";
  gui.domElement.style.top = "16px";
  gui.domElement.style.zIndex = "1000";
  gui.domElement.style.maxHeight = "calc(100vh - 32px)";
  gui.domElement.style.overflow = "auto";

  // tube folder
  const tubeFolder = gui.addFolder("Tube");
  tubeFolder.add(tubeMaterial, "wireframe").name("Wireframe");
  tubeFolder.addColor(tubeMaterial, "color").name("Color");
  const tubeParams = {
    radius: tubeGeo.parameters.radius,
    tubularSegments: tubeGeo.parameters.tubularSegments,
    radialSegments: tubeGeo.parameters.radialSegments,
  };
  tubeFolder.add(tubeParams, "radius", 0.1, 1.5).onChange(() => rebuildTube());
  tubeFolder
    .add(tubeParams, "tubularSegments", 50, 500, 1)
    .onChange(() => rebuildTube());
  tubeFolder
    .add(tubeParams, "radialSegments", 4, 32, 1)
    .onChange(() => rebuildTube());

  function rebuildTube() {
    const newGeo = new TubeGeometry(
      spline,
      tubeParams.tubularSegments,
      tubeParams.radius,
      tubeParams.radialSegments,
      true,
    );
    tube.geometry.dispose();
    tube.geometry = newGeo;
    // boxes need to be repositioned because the path changed?
    // (the spline is the same, so the curve is unchanged – only sampling changes)
    // We keep the same box positions, they'll still be on the same mathematical curve.
  }

  // boxes folder
  const boxFolder = gui.addFolder("Boxes");
  boxFolder
    .add({ numBoxes }, "numBoxes", 0, 200, 1)
    .onChange(() => createBoxes());

  // camera folder
  const camFolder = gui.addFolder("Camera Fly");
  camFolder
    .add({ loopTime }, "loopTime", 50000, 100000, 500)
    .name("Loop Time (ms)")
    .onChange((v: number) => (loopTime = v));
  camFolder
    .add(camera, "fov", 10, 120)
    .onChange(() => camera.updateProjectionMatrix());

  // fog folder
  const fogFolder = gui.addFolder("Fog");
  fogFolder.add(scene.fog!, "density", 0, 1).name("Density");

  // bloom folder
  const bloomFolder = gui.addFolder("Bloom");
  bloomFolder.add(bloomPass, "threshold", 0, 1).name("Threshold");
  bloomFolder.add(bloomPass, "strength", 0, 3).name("Strength");
  bloomFolder.add(bloomPass, "radius", 0, 1).name("Radius");

  // animation loop
  function animate(t = 0) {
    requestAnimationFrame(animate);
    updateCamera(t);
    composer.render();
  }
  animate();

  // resize (also update bloom pass)
  window.addEventListener("resize", () => {
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();
    renderer.setSize(width.value, height.value);
    composer.setSize(width.value, height.value);
  });
});
</script>

<template>
  <canvas ref="canvasRef" class="fixed inset-0 h-full w-full bg-black" />
</template>
