'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HolographicOrbProps {
  size?: number;
  className?: string;
}

// Simplex noise implementation
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

// Cinematic post-processing shader
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainIntensity: { value: 0.035 },
    uVignetteIntensity: { value: 0.4 },
    uScanlineIntensity: { value: 0.04 },
    uChromaticAberration: { value: 0.002 },
    uFlickerIntensity: { value: 0 }
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
    uniform float uScanlineIntensity;
    uniform float uChromaticAberration;
    uniform float uFlickerIntensity;
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

      float scanline = sin(uv.y * 800.0 + uTime * 2.0) * 0.5 + 0.5;
      scanline = pow(scanline, 8.0);
      color.rgb -= scanline * uScanlineIntensity;

      float sweep = sin(uTime * 0.3) * 0.5 + 0.5;
      float sweepLine = smoothstep(sweep - 0.002, sweep, uv.y) - smoothstep(sweep, sweep + 0.002, uv.y);
      color.rgb += sweepLine * 0.1 * vec3(0.6, 0.8, 1.0);

      float grain = random(uv + fract(uTime)) * 2.0 - 1.0;
      color.rgb += grain * uGrainIntensity;

      float vignette = 1.0 - distFromCenter * distFromCenter * uVignetteIntensity * 2.0;
      vignette = smoothstep(0.0, 1.0, vignette);
      color.rgb *= vignette;

      vec3 shadows = vec3(0.1, 0.15, 0.2);
      vec3 highlights = vec3(1.05, 1.0, 0.95);
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(color.rgb * (1.0 + shadows * 0.5), color.rgb * highlights, luminance);

      color.rgb *= (1.0 - uFlickerIntensity * random(vec2(uTime * 10.0, 0.0)));

      gl_FragColor = color;
    }
  `
};

const CORE_PARTICLE_COUNT = 45000;
const ATMOSPHERE_PARTICLE_COUNT = 3000;

export default function HolographicOrb({ size = 400, className = '' }: HolographicOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    composer: any | null;
    cinematicPass: any | null;
    coreParticles: THREE.Points | null;
    atmosphereParticles: THREE.Points | null;
    groundFog: THREE.Mesh | null;
    noise: SimplexNoise;
    time: number;
    frameId: number;
    cameraDrift: {
      targetTheta: number;
      targetPhi: number;
      targetRadius: number;
      currentTheta: number;
      currentPhi: number;
      currentRadius: number;
      driftSpeed: number;
      smoothing: number;
    };
    narrativeState: {
      deepBreathTimer: number;
      deepBreathInterval: number;
      deepBreathActive: boolean;
      deepBreathPhase: number;
    };
  }>({
    renderer: null,
    scene: null,
    camera: null,
    composer: null,
    cinematicPass: null,
    coreParticles: null,
    atmosphereParticles: null,
    groundFog: null,
    noise: new SimplexNoise(),
    time: 0,
    frameId: 0,
    cameraDrift: {
      targetTheta: 0,
      targetPhi: Math.PI / 6,
      targetRadius: 8,
      currentTheta: 0,
      currentPhi: Math.PI / 6,
      currentRadius: 8,
      driftSpeed: 0.00009,
      smoothing: 0.018
    },
    narrativeState: {
      deepBreathTimer: 0,
      deepBreathInterval: 25,
      deepBreathActive: false,
      deepBreathPhase: 0
    }
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const state = stateRef.current;

    // Dynamic imports for post-processing
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
      // Scene
      const scene = new THREE.Scene();
      state.scene = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
      camera.position.set(0, 2, 8);
      state.camera = camera;

      // Renderer
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

      // Post-processing
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size, size),
        0.45, 1.2, 0.78
      );
      composer.addPass(bloomPass);

      const cinematicPass = new ShaderPass(CinematicShader);
      composer.addPass(cinematicPass);
      state.composer = composer;
      state.cinematicPass = cinematicPass;

      // Create atmospheric particles
      createAtmosphericParticles(scene, state);

      // Create core particle field
      createCoreParticles(scene, state);

      // Create ground fog
      createGroundFog(scene, state);

      // Animation loop
      const animate = () => {
        state.frameId = requestAnimationFrame(animate);

        const deltaTime = 0.016;
        state.time += deltaTime;

        // Update camera drift
        updateCameraDrift(state);

        // Update narrative tension (breathing)
        updateNarrativeTension(deltaTime, state);

        // Update cinematic shader
        if (state.cinematicPass) {
          state.cinematicPass.uniforms.uTime.value = state.time;
          const flickerChance = Math.random();
          state.cinematicPass.uniforms.uFlickerIntensity.value = flickerChance > 0.995 ? 0.3 : 0;
        }

        // Update particles
        updateParticles(state);

        // Render
        if (state.composer) {
          state.composer.render();
        }
      };

      animate();
    });

    // Cleanup
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

function createAtmosphericParticles(scene: THREE.Scene, state: any) {
  const positions = new Float32Array(ATMOSPHERE_PARTICLE_COUNT * 3);
  const sizes = new Float32Array(ATMOSPHERE_PARTICLE_COUNT);
  const alphas = new Float32Array(ATMOSPHERE_PARTICLE_COUNT);

  for (let i = 0; i < ATMOSPHERE_PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 15;
    positions[i3 + 1] = (Math.random() - 0.5) * 10 - 1;
    positions[i3 + 2] = (Math.random() - 0.5) * 15;
    sizes[i] = 0.5 + Math.random() * 2.0;
    alphas[i] = 0.02 + Math.random() * 0.04;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: Math.min(window.devicePixelRatio, 2) }
    },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      uniform float uScale;
      void main() {
        vAlpha = alpha;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = size * uScale * 30.0 / -mvPos.z;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(0.6, 0.5, 0.7, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  state.atmosphereParticles = new THREE.Points(geometry, material);
  scene.add(state.atmosphereParticles);
}

function createCoreParticles(scene: THREE.Scene, state: any) {
  const positions = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const colors = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const sizes = new Float32Array(CORE_PARTICLE_COUNT);
  const basePositions = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const velocities = new Float32Array(CORE_PARTICLE_COUNT * 3);
  const phases = new Float32Array(CORE_PARTICLE_COUNT);
  const lifetimes = new Float32Array(CORE_PARTICLE_COUNT);

  for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const rawRadius = Math.pow(Math.random(), 0.55) * 2.4;

    const x = rawRadius * Math.sin(phi) * Math.cos(theta);
    const y = rawRadius * Math.sin(phi) * Math.sin(theta);
    const z = rawRadius * Math.cos(phi);

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    velocities[i3] = (Math.random() - 0.5) * 0.001;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.001;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.001;

    phases[i] = Math.random() * Math.PI * 2;
    lifetimes[i] = Math.random();

    sizes[i] = 0.25 + Math.random() * 0.6;

    // Color gradient based on distance from center
    const distFromCenter = rawRadius / 2.4;
    if (distFromCenter > 0.65) {
      // Outer - cyan/teal
      colors[i3] = 0.5 + Math.random() * 0.35;
      colors[i3 + 1] = 0.75 + Math.random() * 0.2;
      colors[i3 + 2] = 0.85 + Math.random() * 0.1;
    } else if (distFromCenter > 0.35) {
      // Mid - purple/magenta
      colors[i3] = 0.65 + Math.random() * 0.25;
      colors[i3 + 1] = 0.35 + Math.random() * 0.3;
      colors[i3 + 2] = 0.55 + Math.random() * 0.25;
    } else {
      // Core - warm pink/red
      colors[i3] = 0.7 + Math.random() * 0.25;
      colors[i3 + 1] = 0.12 + Math.random() * 0.2;
      colors[i3 + 2] = 0.35 + Math.random() * 0.3;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
  (geometry as any).userData = { basePositions, velocities, phases };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: Math.min(window.devicePixelRatio, 2) },
      uBreathPhase: { value: 0 },
      uDeepBreath: { value: 0 },
      uPulseIntensity: { value: 0 }
    },
    vertexShader: `
      attribute vec3 color;
      attribute float size;
      attribute float lifetime;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vLifetime;
      uniform float uScale;
      uniform float uTime;
      uniform float uBreathPhase;
      uniform float uDeepBreath;
      uniform float uPulseIntensity;

      void main() {
        vColor = color;
        vLifetime = lifetime;

        float breathScale = 1.0 + sin(uBreathPhase) * 0.025;
        breathScale += uDeepBreath * 0.08;
        vec3 breathedPos = position * breathScale;

        vec4 mvPos = modelViewMatrix * vec4(breathedPos, 1.0);
        gl_Position = projectionMatrix * mvPos;

        float depthFactor = 1.0 / (-mvPos.z * 0.07 + 1.0);
        gl_PointSize = size * uScale * depthFactor * 40.0;
        gl_PointSize = clamp(gl_PointSize, 0.4, 3.5);

        float dist = length(position);
        vAlpha = smoothstep(2.6, 0.4, dist) * 0.8;
        vAlpha *= (1.0 + uPulseIntensity * 0.12);

        float rimFactor = 1.0 - abs(dot(normalize(position), normalize(cameraPosition - breathedPos)));
        vAlpha *= (1.0 + rimFactor * 0.3);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vLifetime;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
        alpha *= 0.7 + vLifetime * 0.3;
        gl_FragColor = vec4(vColor, alpha * 0.55);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  state.coreParticles = new THREE.Points(geometry, material);
  scene.add(state.coreParticles);
}

function createGroundFog(scene: THREE.Scene, state: any) {
  const geometry = new THREE.PlaneGeometry(20, 20);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        float distFromCenter = length(vUv - 0.5);
        float glow = 1.0 - smoothstep(0.0, 0.4, distFromCenter);
        glow *= glow;
        glow *= 0.8 + sin(uTime * 0.5) * 0.2;
        vec3 color = mix(vec3(0.4, 0.2, 0.5), vec3(0.3, 0.6, 0.7), distFromCenter);
        gl_FragColor = vec4(color, glow * 0.15);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  state.groundFog = new THREE.Mesh(geometry, material);
  state.groundFog.rotation.x = -Math.PI / 2;
  state.groundFog.position.y = -2.5;
  scene.add(state.groundFog);
}

function updateCameraDrift(state: any) {
  const drift = state.cameraDrift;
  const time = state.time;

  drift.targetTheta += drift.driftSpeed;
  drift.targetPhi = Math.PI / 6 + Math.sin(time * 0.06) * 0.09;
  drift.targetRadius = 8 + Math.sin(time * 0.0375) * 0.6;

  drift.currentTheta += (drift.targetTheta - drift.currentTheta) * drift.smoothing;
  drift.currentPhi += (drift.targetPhi - drift.currentPhi) * drift.smoothing;
  drift.currentRadius += (drift.targetRadius - drift.currentRadius) * drift.smoothing;

  if (state.camera) {
    state.camera.position.x = drift.currentRadius * Math.sin(drift.currentPhi) * Math.cos(drift.currentTheta);
    state.camera.position.y = drift.currentRadius * Math.cos(drift.currentPhi) + 1.5;
    state.camera.position.z = drift.currentRadius * Math.sin(drift.currentPhi) * Math.sin(drift.currentTheta);
    state.camera.lookAt(0, 0, 0);
  }
}

function updateNarrativeTension(deltaTime: number, state: any) {
  const ns = state.narrativeState;

  ns.deepBreathTimer += deltaTime;
  if (ns.deepBreathTimer > ns.deepBreathInterval && !ns.deepBreathActive) {
    ns.deepBreathActive = true;
    ns.deepBreathPhase = 0;
    ns.deepBreathTimer = 0;
  }

  if (ns.deepBreathActive) {
    ns.deepBreathPhase += deltaTime * 0.75;
    if (ns.deepBreathPhase > Math.PI * 2) {
      ns.deepBreathActive = false;
    }
  }
}

function updateParticles(state: any) {
  if (!state.coreParticles) return;

  const time = state.time;
  const breathPhase = time * 0.525;
  const pulseIntensity = Math.sin(time * 1.05) * 0.5 + 0.5;

  const deepBreathValue = state.narrativeState.deepBreathActive
    ? Math.sin(state.narrativeState.deepBreathPhase) * (1 - state.narrativeState.deepBreathPhase / (Math.PI * 2))
    : 0;

  const material = state.coreParticles.material as THREE.ShaderMaterial;
  material.uniforms.uTime.value = time;
  material.uniforms.uBreathPhase.value = breathPhase;
  material.uniforms.uDeepBreath.value = deepBreathValue;
  material.uniforms.uPulseIntensity.value = pulseIntensity;

  // Animate particle positions with noise
  const positions = state.coreParticles.geometry.attributes.position.array;
  const userData = state.coreParticles.geometry.userData;
  const basePositions = userData.basePositions;
  const phases = userData.phases;

  for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    const noiseScale = 0.35;
    const noiseSpeed = 0.18;

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

    const displacement = 0.12;
    positions[i3] = basePositions[i3] + nx * displacement;
    positions[i3 + 1] = basePositions[i3 + 1] + ny * displacement;
    positions[i3 + 2] = basePositions[i3 + 2] + nz * displacement;
  }

  state.coreParticles.geometry.attributes.position.needsUpdate = true;

  // Update ground fog
  if (state.groundFog) {
    (state.groundFog.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
  }
}
