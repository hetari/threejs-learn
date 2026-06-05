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
import GUI from "lil-gui";

import vertexParse from "../shader/006/vertix_parse.vert?raw";
import vertexMain from "../shader/006/vertix_main.vert?raw";
import fragmentParse from "../shader/006/fragment_parse.frag?raw";
import fragmentMain from "../shader/006/fragment_main.frag?raw";

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const { width, height } = useWindowSize();
let gui: GUI | undefined;
let controls: OrbitControls;
let renderer: WebGLRenderer;
const stats = inject<Stats & { reset: () => void }>("stats");

let animationFrameId = 0;

tryOnUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  controls?.dispose();
  gui?.destroy();
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
    shader.uniforms.uDisplacementScale = { value: 0.22 };
    shader.uniforms.uGlowColor = { value: new Color(0.05, 0.3, 0.8) };
    shader.uniforms.uGlowIntensity = { value: 1.0 };

    const parseVertixString = `#include <displacementmap_pars_vertex>`;
    shader.vertexShader = shader.vertexShader.replace(
      parseVertixString,
      `\n${parseVertixString}\nuniform float uDisplacementScale;\n${vertexParse}\n`,
    );

    const mainVertixString = `#include <displacementmap_vertex>`;
    const modifiedVertexMain = vertexMain.replace(
      "vDisplacement / 4.5",
      "vDisplacement * uDisplacementScale"
    );
    shader.vertexShader = shader.vertexShader.replace(
      mainVertixString,
      `\n${mainVertixString}\n${modifiedVertexMain}\n`,
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
      float peakGlow = pow(vDisplacement, 4.0) * 0.5;
      float fresnel = pow(1.0 - max(dot(normalize(vViewPosition), normal), 0.0), 4.0) * 0.1;
      totalEmissiveRadiance += uGlowColor * (peakGlow + fresnel) * uGlowIntensity;
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

  // --- GUI Controls ---
  gui = new GUI({ title: "Shader Globe Controls" });
  gui.domElement.style.left = "16px";
  gui.domElement.style.right = "auto";
  gui.domElement.style.top = "16px";
  gui.domElement.style.zIndex = "1000";
  gui.domElement.style.maxHeight = "calc(100vh - 32px)";
  gui.domElement.style.overflow = "auto";

  const settings = {
    // Shader settings
    displacementScale: 0.22,
    glowColor: "#0d4ccc",
    glowIntensity: 1.0,

    // Material settings
    color: `#${material.color.getHexString()}`,
    roughness: material.roughness,
    metalness: material.metalness,
    wireframe: material.wireframe,
    flatShading: material.flatShading,

    // Lighting settings
    dirLightColor: `#${dirLight.color.getHexString()}`,
    dirLightIntensity: dirLight.intensity,
    ambientColor: `#${ambientLight.color.getHexString()}`,
    ambientIntensity: ambientLight.intensity,

    // Bloom settings
    bloomStrength: bloomPass.strength,
    bloomRadius: bloomPass.radius,
    bloomThreshold: bloomPass.threshold,

    // Controls
    autoRotate: controls.autoRotate,
    autoRotateSpeed: controls.autoRotateSpeed,
    exposure: renderer.toneMappingExposure,
  };

  const shaderFolder = gui.addFolder("Shader / Globe");
  shaderFolder
    .add(settings, "displacementScale", 0, 1.0, 0.01)
    .name("Displacement")
    .onChange((v: number) => {
      if (material.userData.shader) {
        material.userData.shader.uniforms.uDisplacementScale.value = v;
      }
    });

  shaderFolder
    .addColor(settings, "glowColor")
    .name("Glow Color")
    .onChange((v: string) => {
      if (material.userData.shader) {
        material.userData.shader.uniforms.uGlowColor.value.set(v);
      }
    });

  shaderFolder
    .add(settings, "glowIntensity", 0, 5, 0.05)
    .name("Glow Intensity")
    .onChange((v: number) => {
      if (material.userData.shader) {
        material.userData.shader.uniforms.uGlowIntensity.value = v;
      }
    });

  const matFolder = gui.addFolder("Material");
  matFolder
    .addColor(settings, "color")
    .name("Base Color")
    .onChange((v: string) => {
      material.color.set(v);
    });

  matFolder
    .add(settings, "roughness", 0, 1, 0.01)
    .onChange((v: number) => {
      material.roughness = v;
    });

  matFolder
    .add(settings, "metalness", 0, 1, 0.01)
    .onChange((v: number) => {
      material.metalness = v;
    });

  matFolder
    .add(settings, "wireframe")
    .onChange((v: boolean) => {
      material.wireframe = v;
    });

  matFolder
    .add(settings, "flatShading")
    .name("Flat Shading")
    .onChange((v: boolean) => {
      material.flatShading = v;
      material.needsUpdate = true;
    });

  const lightFolder = gui.addFolder("Lighting");
  lightFolder
    .addColor(settings, "dirLightColor")
    .name("Dir Light Color")
    .onChange((v: string) => {
      dirLight.color.set(v);
    });
  lightFolder
    .add(settings, "dirLightIntensity", 0, 5, 0.05)
    .name("Dir Intensity")
    .onChange((v: number) => {
      dirLight.intensity = v;
    });
  lightFolder
    .addColor(settings, "ambientColor")
    .name("Ambient Color")
    .onChange((v: string) => {
      ambientLight.color.set(v);
    });
  lightFolder
    .add(settings, "ambientIntensity", 0, 5, 0.05)
    .name("Ambient Intensity")
    .onChange((v: number) => {
      ambientLight.intensity = v;
    });

  const bloomFolder = gui.addFolder("Bloom Glow");
  bloomFolder
    .add(settings, "bloomStrength", 0, 3, 0.05)
    .name("Strength")
    .onChange((v: number) => {
      bloomPass.strength = v;
    });
  bloomFolder
    .add(settings, "bloomRadius", 0, 2, 0.05)
    .name("Radius")
    .onChange((v: number) => {
      bloomPass.radius = v;
    });
  bloomFolder
    .add(settings, "bloomThreshold", 0, 1, 0.05)
    .name("Threshold")
    .onChange((v: number) => {
      bloomPass.threshold = v;
    });

  const controlFolder = gui.addFolder("Controls & Camera");
  controlFolder
    .add(settings, "autoRotate")
    .name("Auto Rotate")
    .onChange((v: boolean) => {
      controls.autoRotate = v;
    });
  controlFolder
    .add(settings, "autoRotateSpeed", 0, 20, 0.05)
    .name("Rotate Speed")
    .onChange((v: number) => {
      controls.autoRotateSpeed = v;
    });
  controlFolder
    .add(settings, "exposure", 0, 3, 0.05)
    .name("Exposure")
    .onChange((v: number) => {
      renderer.toneMappingExposure = v;
    });

  gui.close();

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
