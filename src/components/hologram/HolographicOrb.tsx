'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HolographicOrbProps {
  size?: number;
  className?: string;
}

// Simplex noise - retained for organic motion
class SimplexNoise {
  p: Uint8Array;
  perm: Uint8Array;
  permMod12: Uint8Array;
  grad3: number[][];
  F3: number;
  G3: number;

  constructor() {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    this.F3 = 1/3;
    this.G3 = 1/6;
  }

  noise3D(x: number, y: number, z: number): number {
    const { perm, permMod12, grad3, F3, G3 } = this;
    let n0, n1, n2, n3;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const X0 = i - t, Y0 = j - t, Z0 = k - t;
    const x0 = x - X0, y0 = y - Y0, z0 = z - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
    const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 < 0) n0 = 0;
    else { const gi0 = permMod12[ii + perm[jj + perm[kk]]]; t0 *= t0; n0 = t0 * t0 * (grad3[gi0][0]*x0 + grad3[gi0][1]*y0 + grad3[gi0][2]*z0); }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 < 0) n1 = 0;
    else { const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]; t1 *= t1; n1 = t1 * t1 * (grad3[gi1][0]*x1 + grad3[gi1][1]*y1 + grad3[gi1][2]*z1); }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 < 0) n2 = 0;
    else { const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]; t2 *= t2; n2 = t2 * t2 * (grad3[gi2][0]*x2 + grad3[gi2][1]*y2 + grad3[gi2][2]*z2); }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 < 0) n3 = 0;
    else { const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]; t3 *= t3; n3 = t3 * t3 * (grad3[gi3][0]*x3 + grad3[gi3][1]*y3 + grad3[gi3][2]*z3); }
    return 32 * (n0 + n1 + n2 + n3);
  }
}

// SUBTRACTED: Removed scanlines, sweep effect, flicker
// RETAINED: Vignette (supports depth), grain (minimal), chromatic aberration (subtle)
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainIntensity: { value: 0.015 }, // Reduced 60%
    uVignetteIntensity: { value: 0.5 }, // Increased for darkness
    uChromaticAberration: { value: 0.001 } // Halved
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrainIntensity;
    uniform float uVignetteIntensity;
    uniform float uChromaticAberration;
    varying vec2 vUv;

    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      float distFromCenter = length(uv - 0.5);
      float aberrationAmount = uChromaticAberration * distFromCenter * distFromCenter;

      vec4 color;
      color.r = texture2D(tDiffuse, uv + vec2(aberrationAmount, 0.0)).r;
      color.g = texture2D(tDiffuse, uv).g;
      color.b = texture2D(tDiffuse, uv - vec2(aberrationAmount, 0.0)).b;
      color.a = 1.0;

      // Minimal grain
      float grain = random(uv + fract(uTime * 0.1)) * 2.0 - 1.0;
      color.rgb += grain * uGrainIntensity;

      // Strong vignette - darkness is allowed
      float vignette = 1.0 - distFromCenter * distFromCenter * uVignetteIntensity * 2.5;
      vignette = smoothstep(0.0, 1.0, vignette);
      color.rgb *= vignette;

      gl_FragColor = color;
    }
  `
};

// SUBTRACTED: 60% particle reduction (45000 → 18000)
// SUBTRACTED: Removed atmosphere particles entirely
// SUBTRACTED: Removed ground fog
const CORE_PARTICLE_COUNT = 18000;

export default function HolographicOrb({ size = 400, className = '' }: HolographicOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    composer: any | null;
    cinematicPass: any | null;
    coreParticles: THREE.Points | null;
    noise: SimplexNoise;
    time: number;
    frameId: number;
    cameraDrift: {
      targetTheta: number;
      currentTheta: number;
      driftSpeed: number;
      smoothing: number;
    };
  }>({
    renderer: null,
    scene: null,
    camera: null,
    composer: null,
    cinematicPass: null,
    coreParticles: null,
    noise: new SimplexNoise(),
    time: 0,
    frameId: 0,
    // SUBTRACTED: Removed phi/radius animation - only theta drift remains (one motion type)
    cameraDrift: {
      targetTheta: 0,
      currentTheta: 0,
      driftSpeed: 0.00003, // Reduced 70% - stillness equals confidence
      smoothing: 0.008 // Slower easing
    }
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const state = stateRef.current;

    Promise.all([
      import('three/examples/jsm/postprocessing/EffectComposer.js'),
      import('three/examples/jsm/postprocessing/RenderPass.js'),
      import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
      import('three/examples/jsm/postprocessing/ShaderPass.js')
    ]).then(([
      { EffectComposer },
      { RenderPass },
      { UnrealBloomPass },
      { ShaderPass }
    ]) => {
      const scene = new THREE.Scene();
      state.scene = scene;

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
      camera.position.set(0, 1.5, 9); // Static vertical position
      state.camera = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      state.renderer = renderer;

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      // SUBTRACTED: Bloom reduced significantly
      // Smaller radius, faster falloff, lower strength
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size, size),
        0.25,  // strength: 0.45 → 0.25
        0.6,   // radius: 1.2 → 0.6
        0.85   // threshold: 0.78 → 0.85 (higher = less bloom)
      );
      composer.addPass(bloomPass);

      const cinematicPass = new ShaderPass(CinematicShader);
      composer.addPass(cinematicPass);
      state.composer = composer;
      state.cinematicPass = cinematicPass;

      createCoreParticles(scene, state);

      const animate = () => {
        state.frameId = requestAnimationFrame(animate);

        const deltaTime = 0.016;
        state.time += deltaTime;

        updateCameraDrift(state);

        if (state.cinematicPass) {
          state.cinematicPass.uniforms.uTime.value = state.time;
        }

        updateParticles(state);

        if (state.composer) {
          state.composer.render();
        }
      };

      animate();
    });

    return () => {
      cancelAnimationFrame(state.frameId);
      if (state.renderer) {
        state.renderer.dispose();
        if (container.contains(state.renderer.domElement)) {
          container.removeChild(state.renderer.domElement);
        }
      }
      if (state.scene) {
        state.scene.traverse((child) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function createCoreParticles(scene: THREE.Scene, state: any) {
  const positions = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const colors = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const sizes = new Float32Array(CORE_PARTICLE_COUNT);
  const basePositions = new Float32Array(CORE_PARTICLE_COUNT * 3);

  for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    // Non-uniform distribution - ±5% imperfection
    const imperfection = 0.95 + Math.random() * 0.1;
    const rawRadius = Math.pow(Math.random(), 0.55) * 2.2 * imperfection;

    const x = rawRadius * Math.sin(phi) * Math.cos(theta);
    const y = rawRadius * Math.sin(phi) * Math.sin(theta);
    const z = rawRadius * Math.cos(phi);

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    // Increased size variance for visible gaps
    sizes[i] = 0.15 + Math.random() * 0.8;

    // RESTRICTED: Single hue family (cyan/teal) with desaturated accents
    const distFromCenter = rawRadius / 2.2;
    const brightness = 0.4 + distFromCenter * 0.5; // Brighter at edges

    // Primary: Cyan-teal (one hue family)
    colors[i3] = 0.15 + Math.random() * 0.15;     // R: low
    colors[i3 + 1] = 0.5 + brightness * 0.4;      // G: medium-high
    colors[i3 + 2] = 0.7 + brightness * 0.25;     // B: high

    // Core is slightly warmer (accent) but still restrained
    if (distFromCenter < 0.3) {
      colors[i3] = 0.35 + Math.random() * 0.15;   // Slight warmth
      colors[i3 + 1] = 0.45;
      colors[i3 + 2] = 0.6;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  (geometry as any).userData = { basePositions };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: Math.min(window.devicePixelRatio, 2) },
      uBreathPhase: { value: 0 }
    },
    vertexShader: `
      attribute vec3 color;
      attribute float size;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uScale;
      uniform float uBreathPhase;

      void main() {
        vColor = color;

        // Single motion type: gentle breathing only
        float breathScale = 1.0 + sin(uBreathPhase) * 0.012; // Reduced 50%
        vec3 breathedPos = position * breathScale;

        vec4 mvPos = modelViewMatrix * vec4(breathedPos, 1.0);
        gl_Position = projectionMatrix * mvPos;

        float depthFactor = 1.0 / (-mvPos.z * 0.08 + 1.0);
        gl_PointSize = size * uScale * depthFactor * 35.0;
        gl_PointSize = clamp(gl_PointSize, 0.3, 3.0);

        // Hero depth plane: particles at 0.6-0.9 radius are brightest
        float dist = length(position);
        float heroZone = smoothstep(1.3, 1.8, dist) * smoothstep(2.2, 1.9, dist);
        vAlpha = smoothstep(2.4, 0.3, dist) * 0.6;
        vAlpha *= (0.5 + heroZone * 0.5); // Hero plane 50% brighter

        // Rim glow retained but reduced
        float rimFactor = 1.0 - abs(dot(normalize(position), normalize(cameraPosition - breathedPos)));
        vAlpha *= (1.0 + rimFactor * 0.15);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;

        // Increased contrast instead of density
        alpha = pow(alpha, 0.85);

        gl_FragColor = vec4(vColor, alpha * 0.5);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  state.coreParticles = new THREE.Points(geometry, material);
  scene.add(state.coreParticles);
}

// SUBTRACTED: Only theta drift remains (removed phi, radius oscillation)
function updateCameraDrift(state: any) {
  const drift = state.cameraDrift;

  drift.targetTheta += drift.driftSpeed;
  drift.currentTheta += (drift.targetTheta - drift.currentTheta) * drift.smoothing;

  if (state.camera) {
    const radius = 9; // Fixed radius
    state.camera.position.x = radius * Math.sin(drift.currentTheta) * 0.3;
    state.camera.position.z = radius * Math.cos(drift.currentTheta) * 0.1 + radius;
    state.camera.lookAt(0, 0, 0);
  }
}

function updateParticles(state: any) {
  if (!state.coreParticles) return;

  const time = state.time;

  // Single motion: breathing only (reduced speed 50%)
  const breathPhase = time * 0.25;

  const material = state.coreParticles.material as THREE.ShaderMaterial;
  material.uniforms.uTime.value = time;
  material.uniforms.uBreathPhase.value = breathPhase;

  // Noise-based drift - slowed 50%
  const positions = state.coreParticles.geometry.attributes.position.array;
  const userData = state.coreParticles.geometry.userData;
  const basePositions = userData.basePositions;

  for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    const noiseScale = 0.3;
    const noiseSpeed = 0.06; // Reduced from 0.18

    const nx = state.noise.noise3D(
      basePositions[i3] * noiseScale + time * noiseSpeed,
      basePositions[i3 + 1] * noiseScale,
      basePositions[i3 + 2] * noiseScale
    );
    const ny = state.noise.noise3D(
      basePositions[i3] * noiseScale,
      basePositions[i3 + 1] * noiseScale + time * noiseSpeed,
      basePositions[i3 + 2] * noiseScale + 100
    );
    const nz = state.noise.noise3D(
      basePositions[i3] * noiseScale + 200,
      basePositions[i3 + 1] * noiseScale,
      basePositions[i3 + 2] * noiseScale + time * noiseSpeed
    );

    const displacement = 0.06; // Reduced from 0.12
    positions[i3] = basePositions[i3] + nx * displacement;
    positions[i3 + 1] = basePositions[i3 + 1] + ny * displacement;
    positions[i3 + 2] = basePositions[i3 + 2] + nz * displacement;
  }

  state.coreParticles.geometry.attributes.position.needsUpdate = true;
}
