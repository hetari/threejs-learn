<script setup lang="ts">
import { useTemplateRef } from "vue";
import {
  tryOnMounted,
  tryOnUnmounted,
  useEventListener,
  useWindowSize,
} from "@vueuse/core";
import {
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Timer,
  WebGLRenderer,
  Vector3,
  EquirectangularReflectionMapping,
  PointLight,
  PCFShadowMap,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { createEarthMesh } from "../utils/earth";
import GUI from "lil-gui";

// --- Configuration ---
const { height, width } = useWindowSize();
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

interface MoonConfig {
  name: string;
  radius: number;
  distance: number;
  speed: number;
  texture?: string;
  color?: number;
}

interface PlanetConfig {
  name: string;
  radius: number;
  distance: number;
  speed: number;
  texture: string;
  moons: MoonConfig[];
}

const PLANETS_DATA: PlanetConfig[] = [
  {
    name: "Mercury",
    radius: 0.5,
    distance: 10,
    speed: 0.01,
    texture: "mercury-2k.jpg",
    moons: [],
  },
  {
    name: "Venus",
    radius: 0.8,
    distance: 15,
    speed: 0.007,
    texture: "venus-surface-2k.jpg",
    moons: [],
  },
  {
    name: "Earth",
    radius: 1,
    distance: 20,
    speed: 0.005,
    texture: "earth-daymap-4k.jpg",
    moons: [
      {
        name: "Moon",
        radius: 0.3,
        distance: 3,
        speed: 0.015,
        texture: "moon-2k.jpg",
      },
    ],
  },
  {
    name: "Mars",
    radius: 0.7,
    distance: 25,
    speed: 0.003,
    texture: "mars-2k.jpg",
    moons: [
      { name: "Phobos", radius: 0.1, distance: 2, speed: 0.02 },
      {
        name: "Deimos",
        radius: 0.2,
        distance: 3,
        speed: 0.015,
        color: 0xffffff,
      },
    ],
  },
];

// --- Scene Variables ---
let animationFrameId: number;
let renderer: WebGLRenderer;
let controls: OrbitControls;
let timer: Timer;
let scene: Scene;
let camera: PerspectiveCamera;
let gui: GUI | undefined;

// Pre-allocated scratch vectors to avoid per-frame GC pressure
const _worldPos = new Vector3();
const _sunDir = new Vector3();

tryOnMounted(() => {
  if (!canvasRef.value) return;

  timer = new Timer();
  scene = new Scene();

  // Camera setup
  camera = new PerspectiveCamera(35, width.value / height.value, 0.1, 400);
  camera.position.set(0, 50, 100);

  // Controls
  controls = new OrbitControls(camera, canvasRef.value);
  controls.enableDamping = true;

  // Lighting
  const ambientLight = new HemisphereLight(0xffffff, 0x444444, 0.05); // Dim ambient light so shadows are visible
  scene.add(ambientLight);

  const pointLight = new PointLight(0xffeedd, 450);
  pointLight.position.set(0, 0, 0);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 1024;
  pointLight.shadow.mapSize.height = 1024;
  pointLight.shadow.bias = -0.0001; // Reduce shadow acne
  scene.add(pointLight);

  // Renderer setup
  renderer = new WebGLRenderer({ canvas: canvasRef.value, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width.value, height.value);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  useEventListener("resize", () => {
    renderer.setSize(width.value, height.value);
    camera.aspect = width.value / height.value;
    camera.updateProjectionMatrix();
  });

  // Loaders
  const textureLoader = new TextureLoader();
  const sphereGeometry = new SphereGeometry(1, 32, 32);

  // stars background
  const starTexture = textureLoader.load("textures/stars-milky-way-8k.jpg");
  starTexture.mapping = EquirectangularReflectionMapping;
  starTexture.colorSpace = SRGBColorSpace;
  scene.background = starTexture;

  // Sun
  const sunTexture = textureLoader.load("textures/sun-2k.jpg");
  sunTexture.colorSpace = SRGBColorSpace;
  const sunMesh = new Mesh(
    sphereGeometry,
    new MeshBasicMaterial({ color: 0xffdd00, map: sunTexture }),
  );
  sunMesh.scale.setScalar(5);
  scene.add(sunMesh);

  // --- Creation Utilities ---
  const loadTexture = (filename?: string) => {
    if (!filename) return null;
    const tex = textureLoader.load(`textures/${filename}`);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  };

  const createMoon = (moonData: MoonConfig) => {
    const material = new MeshStandardMaterial({
      map: loadTexture(moonData.texture),
      color: moonData.color || 0xffffff,
    });
    const mesh = new Mesh(sphereGeometry, material);
    mesh.scale.setScalar(moonData.radius);
    mesh.position.x = moonData.distance;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const createPlanet = (planetData: PlanetConfig) => {
    // Reusing our custom Earth utility!
    if (planetData.name === "Earth") {
      const { earthGroup, updateSunDirection } = createEarthMesh(
        textureLoader,
        {
          radius: planetData.radius,
          sunDirection: new Vector3(-1, 0, 0), // Will be updated in animate
          showNightMap: !false,
        },
      );
      earthGroup.position.x = planetData.distance;
      earthGroup.userData = { isEarth: true, updateSunDirection };

      // Enable shadows for earth meshes
      earthGroup.children.forEach((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      return earthGroup;
    }

    const material = new MeshStandardMaterial({
      map: loadTexture(planetData.texture),
    });
    const mesh = new Mesh(sphereGeometry, material);
    mesh.scale.setScalar(planetData.radius);
    mesh.position.x = planetData.distance;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Build the Solar System
  const planetMeshes = PLANETS_DATA.map((planetData) => {
    const planetGroup = new Group(); // Wrapper for the orbit

    // 1. Create the planet itself
    const planetMesh = createPlanet(planetData);
    planetGroup.add(planetMesh);

    // 2. Create its moons
    planetData.moons.forEach((moonData) => {
      const moonMesh = createMoon(moonData);
      planetGroup.add(moonMesh);
    });

    scene.add(planetGroup);
    return { group: planetGroup, planetMesh, data: planetData };
  });

  // --- GUI Controls ---
  gui = new GUI({ title: "Solar System Controls" });
  gui.domElement.style.left = "16px";
  gui.domElement.style.right = "auto";
  gui.domElement.style.top = "16px";
  gui.domElement.style.zIndex = "1000";
  gui.domElement.style.maxHeight = "calc(100vh - 32px)";
  gui.domElement.style.overflow = "auto";

  const settings = {
    orbiting: true,
    orbitSpeed: 1,
    selfRotation: true,
    showShadows: true,
    lightIntensity: pointLight.intensity,
    lightColor: `#${pointLight.color.getHexString()}`,
    ambientIntensity: 0.05,
    showStars: true,
  };

  // Animation folder
  const animFolder = gui.addFolder("Animation");
  animFolder.add(settings, "orbiting").name("Orbit Planets");
  animFolder.add(settings, "orbitSpeed", 0.1, 5, 0.1).name("Orbit Speed");
  animFolder.add(settings, "selfRotation").name("Self Rotation");

  // Lighting folder
  const lightFolder = gui.addFolder("Lighting");
  lightFolder
    .add(settings, "lightIntensity", 0, 2000, 10)
    .name("Sun Intensity")
    .onChange((v: number) => {
      pointLight.intensity = v;
    });
  lightFolder
    .addColor(settings, "lightColor")
    .name("Sun Color")
    .onChange((v: string) => {
      pointLight.color.set(v);
    });
  lightFolder
    .add(settings, "ambientIntensity", 0, 1, 0.01)
    .name("Ambient")
    .onChange((v: number) => {
      ambientLight.intensity = v;
    });

  // Rendering folder
  const renderFolder = gui.addFolder("Rendering");
  renderFolder
    .add(settings, "showShadows")
    .name("Shadows")
    .onChange((v: boolean) => {
      renderer.shadowMap.enabled = v;
    });
  renderFolder
    .add(settings, "showStars")
    .name("Stars")
    .onChange((v: boolean) => {
      scene.background = v ? starTexture : null;
    });

  // Planets visibility folder
  const planetsFolder = gui.addFolder("Planets");
  planetMeshes.forEach(({ group, data }) => {
    planetsFolder
      .add({ visible: true }, "visible")
      .name(data.name)
      .onChange((v: boolean) => {
        group.visible = v;
      });
  });

  gui.close();

  // --- Animation Loop ---
  const animate = () => {
    timer.update();

    planetMeshes.forEach(({ group, planetMesh, data }) => {
      // 1. Orbit around the sun (rotate the wrapper group)
      if (settings.orbiting) {
        group.rotation.y += data.speed * settings.orbitSpeed;
      }

      // 2. Planet self-rotation
      if (settings.selfRotation) {
        if (planetMesh instanceof Group) {
          planetMesh.children.forEach(
            (child) => (child.rotation.y += data.speed * 2),
          );
        } else {
          planetMesh.rotation.y += data.speed * 2;
        }
      }

      // 3. Moon orbits (rotate moons around the planet)
      data.moons.forEach((moonData, index) => {
        // Planet mesh is added first, so moons start at index + 1
        const moonMesh = group.children[index + 1];
        if (moonMesh) {
          // Calculate moon position relative to planet
          const moonAngle = timer.getElapsed() * moonData.speed * 100;
          moonMesh.position.x =
            planetMesh.position.x + Math.sin(moonAngle) * moonData.distance;
          moonMesh.position.z =
            planetMesh.position.z + Math.cos(moonAngle) * moonData.distance;
          moonMesh.rotation.y += moonData.speed;
        }
      });

      // 4. Update Earth shaders for realistic night map
      if (planetMesh.userData?.isEarth) {
        planetMesh.getWorldPosition(_worldPos);
        _sunDir.set(0, 0, 0).sub(_worldPos).normalize();
        planetMesh.userData.updateSunDirection(_sunDir);
      }
    });

    controls.update();
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  };
  animate();
});

tryOnUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  gui?.destroy();

  renderer?.dispose();
  controls?.dispose();
});
</script>

<template>
  <canvas ref="canvasRef" class="fixed inset-0 h-full w-full bg-black" />
</template>
