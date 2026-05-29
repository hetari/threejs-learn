import {
  CanvasTexture,
  Points,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  AdditiveBlending,
} from "three";

/**
 * Creates a circular texture for star points
 * @returns {CanvasTexture} Circular gradient texture
 */
export const createCircleTexture = () => {
  // Create a small canvas to draw the circle
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;

  // Create radial gradient for soft circular dot
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // White center
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)"); // Slightly transparent
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)"); // More transparent
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Fully transparent edge

  // Fill circle with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new CanvasTexture(canvas);
};

/**
 * Creates a star field using random points on a sphere surface
 * @param {Object} options - Configuration options
 * @param {number} options.numStars - Number of stars to generate (default: 500)
 * @returns {Points} Three.js Points object representing the star field
 */
export const getStarField = ({ numStars = 500 } = {}) => {
  // Random radius between 25 and 50 units from center
  const radius = Math.random() * 25 + 25;

  // Array to store x,y,z coordinates for each star
  const vertices = [];

  // Generate random points on a sphere using spherical coordinates
  for (let i = 0; i < numStars; i++) {
    // Random latitude angle (theta): acos gives uniform distribution on sphere surface
    const theta = Math.acos(Math.random() * 2 - 1);

    // Random longitude angle (phi): 0 to 2*PI for full circle
    const phi = Math.random() * 2 * Math.PI;

    // Convert spherical coordinates to Cartesian (x,y,z)
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);

    // Add vertex position to array
    vertices.push(x, y, z);
  }

  // Create geometry and set position attribute with 3 components per vertex (x,y,z)
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices), 3),
  );

  // Create circular texture for points
  const circleTexture = createCircleTexture();

  // Create material with circular texture for round points
  const material = new PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    map: circleTexture, // Apply circular texture to make points round
    blending: AdditiveBlending, // Additive blending for glow effect
    depthWrite: false, // Don't write to depth buffer to avoid z-fighting
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true, // Points get smaller as they move away from camera
  });

  // Create the Points object combining geometry and material
  const stars = new Points(geometry, material);
  return stars;
};
