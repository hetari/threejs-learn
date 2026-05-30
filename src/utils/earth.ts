import {
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  TextureLoader,
  ShaderMaterial,
  AdditiveBlending,
  FrontSide,
  Vector3
} from "three";

export interface EarthOptions {
  radius?: number;
  sunDirection?: Vector3;
  showNightMap?: boolean;
}

export function createEarthMesh(loader: TextureLoader, options: EarthOptions = {}) {
  const { 
    radius = 1,
    sunDirection = new Vector3(2, -0.5, 1.5).normalize(),
    showNightMap = true
  } = options;

  const earthGroup = new Group();
  earthGroup.rotation.z = (-23.4 * Math.PI) / 180;

  const geometry = new IcosahedronGeometry(radius, 32);
  
  // 1. Earth Day Mesh
  const earthMaterial = new MeshStandardMaterial({
    map: loader.load("textures/earth-daymap-4k.jpg"),
    roughness: 0.8,
    metalness: 0.1,
  });
  const earth = new Mesh(geometry, earthMaterial);
  earthGroup.add(earth);

  // 2. Earth Night Mesh
  let nightLightMesh: Mesh | undefined;
  let nightLightMaterial: ShaderMaterial | undefined;
  
  if (showNightMap) {
    const nightMapTexture = loader.load("textures/earth-nightmap-4k.jpg");
    nightLightMaterial = new ShaderMaterial({
      uniforms: {
        nightMap: { value: nightMapTexture },
        sunDirection: { value: sunDirection },
      },
      vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      uniform sampler2D nightMap;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      
      void main() {
        float lightIntensity = dot(vWorldNormal, sunDirection);
        float nightVisibility = smoothstep(0.2, -0.2, lightIntensity);
        vec4 nightColor = texture2D(nightMap, vUv);
        gl_FragColor = vec4(nightColor.rgb, nightColor.a * nightVisibility);
      }
    `,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    nightLightMesh = new Mesh(geometry, nightLightMaterial);
    earthGroup.add(nightLightMesh);
  }

  // 3. Clouds
  const cloudTexture = loader.load("textures/earth-clouds-4k.jpg");
  const cloudMaterial = new MeshStandardMaterial({
    map: cloudTexture,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const cloudMesh = new Mesh(geometry, cloudMaterial);
  // Scale clouds slightly larger than radius
  cloudMesh.scale.setScalar(1.003);
  earthGroup.add(cloudMesh);

  // 4. Atmosphere Glow
  // Scale atmosphere even larger
  const atmosphereGeometry = new IcosahedronGeometry(radius * 1.005, 32);
  const atmosphereMaterial = new ShaderMaterial({
    uniforms: {
      sunDirection: { value: sunDirection },
    },
    vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 sunDirection;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = 1.0 - abs(dot(viewDirection, vWorldNormal));
      fresnel = pow(fresnel, 3.0);
      vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
      float alpha = fresnel * 0.3;
      gl_FragColor = vec4(atmosphereColor, alpha);
    }
  `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: FrontSide,
  });
  const atmosphereMesh = new Mesh(atmosphereGeometry, atmosphereMaterial);
  earthGroup.add(atmosphereMesh);

  return {
    earthGroup,
    earthMesh: earth,
    nightLightMesh,
    cloudMesh,
    atmosphereMesh,
    updateSunDirection: (newSunDirection: Vector3) => {
      if (nightLightMaterial) {
        nightLightMaterial.uniforms.sunDirection.value.copy(newSunDirection);
      }
      atmosphereMaterial.uniforms.sunDirection.value.copy(newSunDirection);
    }
  };
}
