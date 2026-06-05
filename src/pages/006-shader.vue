<script setup lang="ts">
import {
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  IcosahedronGeometry,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  Vector2,
  ACESFilmicToneMapping,
  WebGLRenderTarget,
  HalfFloatType,
} from "three";
import {
  EffectComposer,
  OrbitControls,
  RenderPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";
import {
  tryOnMounted,
  tryOnUnmounted,
  useWindowSize,
  useEventListener,
} from "@vueuse/core";
import { useTemplateRef } from "vue";
import { inject } from "vue";
import type Stats from "stats.js";

import vertexParse from "../shader/006/vertix_parse.vert?raw";
import vertexMain from "../shader/006/vertix_main.vert?raw";
import fragmentParse from "../shader/006/fragment_parse.frag?raw";
import fragmentMain from "../shader/006/fragment_main.frag?raw";

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
  camera.position.z = 5;

  // renderer
  renderer = new WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
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

  const dirLight = new DirectionalLight("#526cff", 0.6);
  dirLight.position.set(2, 2, 2);

  const ambientLight = new AmbientLight("#4255ff", 0.5);
  scene.add(dirLight, ambientLight);

  // shape (plane)
  const geometry = new IcosahedronGeometry(1, 150);
  const material = new MeshStandardMaterial();

  material.onBeforeCompile = (shader) => {
    material.userData.shader = shader;
    shader.uniforms.uTime = { value: 0 };

    const parseVertixString = `#include <displacementmap_pars_vertex>`;
    shader.vertexShader = shader.vertexShader.replace(
      parseVertixString,
      `\n${parseVertixString}\n${vertexParse}\n`,
    );

    const mainVertixString = `#include <displacementmap_vertex>`;
    shader.vertexShader = shader.vertexShader.replace(
      mainVertixString,
      `\n${mainVertixString}\n${vertexMain}\n`,
    );

    const parseFragmentString = `#include <bumpmap_pars_fragment>`;
    shader.fragmentShader = shader.fragmentShader.replace(
      parseFragmentString,
      `\n${parseFragmentString}\n${fragmentParse}\n`,
    );

    const mainFragmentString = `#include <normal_fragment_maps>`;
    shader.fragmentShader = shader.fragmentShader.replace(
      mainFragmentString,
      `\n${mainFragmentString}\n${fragmentMain}\n`,
    );

    const emissiveFragmentString = `#include <emissivemap_fragment>`;
    shader.fragmentShader = shader.fragmentShader.replace(
      emissiveFragmentString,
      `\n${emissiveFragmentString}\n
      // custom glow
      vec3 glowColor = vec3(0.05, 0.3, 0.8);
      float peakGlow = pow(vDisplacement, 4.0) * 0.5;
      float fresnel = pow(1.0 - max(dot(normalize(vViewPosition), normal), 0.0), 4.0) * 0.1;
      totalEmissiveRadiance += glowColor * (peakGlow + fresnel);
      \n`,
    );
  };

  const ico = new Mesh(geometry, material);
  scene.add(ico);

  // post processing
  const renderTarget = new WebGLRenderTarget(width.value, height.value, {
    type: HalfFloatType,
  });
  const effectComposer = new EffectComposer(renderer, renderTarget);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new Vector2(width.value, height.value),
    0.5, // strength
    0.4, // radius
    0.3, // threshold
  );
  effectComposer.addPass(renderPass);
  effectComposer.addPass(bloomPass);

  // animate
  const onResize = () => {
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();

    renderer.setSize(width.value, height.value);
    effectComposer.setSize(width.value, height.value);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    effectComposer.setPixelRatio?.(Math.min(window.devicePixelRatio, 2));
  };
  useEventListener("resize", onResize);

  const animate = (t = 0) => {
    stats?.begin();

    controls.update();
    // renderer.render(scene, camera);
    effectComposer.render();
    stats?.end();
    animationFrameId = requestAnimationFrame(animate);

    const time = t / 5000; //Date.now() / 1000;
    if (material.userData.shader) {
      material.userData.shader.uniforms.uTime.value = time;
    }
  };

  animate();
});
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 h-full w-full" />
</template>
