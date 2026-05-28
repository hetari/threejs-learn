<script setup lang="ts">
import { useTemplateRef } from "vue";
import { tryOnMounted, useWindowSize } from "@vueuse/core";
import {
  BoxGeometry,
  SphereGeometry,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

const { height, width } = useWindowSize();

// Refs for the two canvas elements
const leftCanvasRef = useTemplateRef<HTMLCanvasElement>("leftCanvasRef");
const rightCanvasRef = useTemplateRef<HTMLCanvasElement>("rightCanvasRef");

// Store camera and controls references for sync functionality
let leftCamera: PerspectiveCamera | OrthographicCamera | null = null;
let rightCamera: PerspectiveCamera | OrthographicCamera | null = null;
let leftControls: OrbitControls | null = null;
let rightControls: OrbitControls | null = null;

// Sync function - makes right camera match left camera's position and target
const syncCameras = () => {
  if (!leftCamera || !rightCamera || !leftControls || !rightControls) return;

  // Copy position
  rightCamera.position.copy(leftCamera.position);

  // Copy rotation/quaternion
  rightCamera.quaternion.copy(leftCamera.quaternion);

  // Update right camera's controls target to match left's target
  rightControls.target.copy(leftControls.target);

  // Update the right camera's projection matrix
  rightCamera.updateProjectionMatrix();

  // Force controls to update
  rightControls.update();
};

tryOnMounted(() => {
  if (!leftCanvasRef.value || !rightCanvasRef.value) return;

  // ----- Shared scene with two different meshes -----
  const scene = new Scene();

  // Red cube
  const cubeGeometry = new BoxGeometry(1, 1, 1);
  const cubeMaterial = new MeshStandardMaterial({ color: "red" });
  const cube = new Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(-1.2, 0, 0);
  scene.add(cube);

  // Blue sphere
  const sphereGeometry = new SphereGeometry(0.6, 32, 32);
  const sphereMaterial = new MeshStandardMaterial({ color: "royalblue" });
  const sphere = new Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(1.2, 0, 0);
  scene.add(sphere);

  // Lighting
  const light = new HemisphereLight(0xffffff, 0x444444);
  scene.add(light);

  // ----- Helper to set up a renderer + camera + controls -----
  const setupView = (
    canvas: HTMLCanvasElement,
    cameraType: "perspective" | "orthographic",
    aspect: number,
  ) => {
    const renderer = new WebGLRenderer({ canvas });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    let camera: PerspectiveCamera | OrthographicCamera;
    if (cameraType === "perspective") {
      camera = new PerspectiveCamera(45, aspect, 0.1, 50);
      camera.position.set(3, 2, 4);
      camera.lookAt(0, 0, 0);
    } else {
      const orthoSize = 2.5;
      camera = new OrthographicCamera(
        -orthoSize * aspect,
        orthoSize * aspect,
        orthoSize,
        -orthoSize,
        0.1,
        50,
      );
      camera.position.set(3, 2, 4);
      camera.lookAt(0, 0, 0);
    }

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controls.enableZoom = true;

    return { renderer, camera, controls };
  };

  // Initial aspect ratio for each view (half of total width)
  const getAspect = () => width.value / 2 / height.value;

  // Setup left (Perspective) and right (Orthographic)
  const left = setupView(leftCanvasRef.value, "perspective", getAspect());
  const right = setupView(rightCanvasRef.value, "orthographic", getAspect());

  // Store references for sync
  leftCamera = left.camera;
  rightCamera = right.camera;
  leftControls = left.controls;
  rightControls = right.controls;

  // Animation loop
  let animationFrameId: number;
  const animate = () => {
    left.controls.update();
    right.controls.update();

    left.renderer.render(scene, left.camera);
    right.renderer.render(scene, right.camera);

    animationFrameId = requestAnimationFrame(animate);
  };
  animate();

  // Resize handler – update camera aspect ratios and renderer sizes
  const handleResize = () => {
    const newWidthHalf = width.value / 2;
    const newAspect = newWidthHalf / height.value;

    // Update Perspective camera
    if (left.camera instanceof PerspectiveCamera) {
      left.camera.aspect = newAspect;
      left.camera.updateProjectionMatrix();
    }

    // Update Orthographic camera frustum
    if (right.camera instanceof OrthographicCamera) {
      const orthoSize = 2.5;
      right.camera.left = -orthoSize * newAspect;
      right.camera.right = orthoSize * newAspect;
      right.camera.top = orthoSize;
      right.camera.bottom = -orthoSize;
      right.camera.updateProjectionMatrix();
    }

    // Update renderer sizes
    left.renderer.setSize(newWidthHalf, height.value);
    right.renderer.setSize(newWidthHalf, height.value);
  };

  window.addEventListener("resize", handleResize);
  // Call once to set initial sizes based on actual client dimensions
  handleResize();

  // Cleanup
  tryOnMounted(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    left.renderer.dispose();
    right.renderer.dispose();
    left.controls.dispose();
    right.controls.dispose();
  });
});
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <!-- Left Canvas with Perspective Camera -->
    <div class="absolute left-0 top-0 h-full w-1/2">
      <div
        class="absolute left-4 top-4 z-10 rounded-lg bg-black/70 px-3 py-1.5 font-mono text-sm font-semibold text-white backdrop-blur-sm"
      >
        🎥 PERSPECTIVE CAMERA
      </div>
      <canvas
        ref="leftCanvasRef"
        class="h-full w-full bg-black outline outline-1 outline-gray-700"
      />
    </div>

    <!-- Right Canvas with Orthographic Camera -->
    <div class="absolute right-0 top-0 h-full w-1/2">
      <div
        class="absolute right-4 top-4 z-10 rounded-lg bg-black/70 px-3 py-1.5 font-mono text-sm font-semibold text-white backdrop-blur-sm"
      >
        📐 ORTHOGRAPHIC CAMERA
      </div>
      <canvas
        ref="rightCanvasRef"
        class="h-full w-full bg-black outline outline-1 outline-gray-700"
      />
    </div>

    <!-- Sync Button -->
    <button
      @click="syncCameras"
      class="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 transform rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-mono text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
    >
      🔄 SYNC CAMERA POSITION (Copy from Left)
    </button>
  </div>
</template>
