'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface HolographicOrbProps {
  size?: number;
  className?: string;
}

// Shader for inner energy core
const coreVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coreFragmentShader = `
  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uCoreColor;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Distance from center for radial falloff
    float dist = length(vPosition);

    // Multi-layered noise for organic movement
    float noise1 = snoise(vPosition * 2.0 + uTime * 0.15) * 0.5 + 0.5;
    float noise2 = snoise(vPosition * 4.0 - uTime * 0.1) * 0.5 + 0.5;
    float noise3 = snoise(vPosition * 1.0 + uTime * 0.05) * 0.5 + 0.5;

    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

    // Soft pulse (0.1-0.25 Hz range)
    float pulse = sin(uTime * 0.8) * 0.15 + sin(uTime * 1.2) * 0.1 + 1.0;
    pulse *= uPulse;

    // Volumetric falloff - soft at edges
    float falloff = 1.0 - smoothstep(0.0, 1.0, dist);
    falloff = pow(falloff, 1.5);

    // Core glow with noise modulation
    float glow = falloff * combinedNoise * pulse;

    // Slightly warmer core color
    vec3 color = uCoreColor * (1.0 + combinedNoise * 0.3);

    // Micro-noise to prevent static appearance
    float microNoise = snoise(vPosition * 20.0 + uTime * 2.0) * 0.05 + 0.95;

    gl_FragColor = vec4(color * glow * microNoise, glow * uOpacity * 0.8);
  }
`;

// Shader for outer halo with fresnel and chromatic aberration
const haloVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const haloFragmentShader = `
  uniform float uTime;
  uniform vec3 uHaloColor;
  uniform float uOpacity;
  uniform float uFresnelPower;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel for edge brightness at grazing angles
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), uFresnelPower);

    // Chromatic aberration simulation
    float chromaticOffset = fresnel * 0.1;
    vec3 color = uHaloColor;
    color.r *= 1.0 + chromaticOffset;
    color.b *= 1.0 - chromaticOffset * 0.5;

    // Subtle flicker
    float flicker = sin(uTime * 1.5) * 0.05 + sin(uTime * 2.3) * 0.03 + 0.92;

    // Thin shell effect
    float shellOpacity = fresnel * flicker * uOpacity;

    gl_FragColor = vec4(color, shellOpacity * 0.6);
  }
`;

// Particle shader for mid-layer shell
const particleVertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aPhase;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vPhase;

  void main() {
    vAlpha = aAlpha;
    vPhase = aPhase;

    // Subtle drift animation
    vec3 pos = position;
    float drift = sin(uTime * 0.3 + aPhase) * 0.02;
    pos += normalize(position) * drift;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation
    float size = aSize * uPixelRatio * (200.0 / -mvPosition.z);

    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  uniform float uTime;
  uniform vec3 uParticleColor;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vPhase;

  void main() {
    // Soft circular particle
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 2.0);

    // Gentle flicker per particle
    float flicker = sin(uTime * 0.5 + vPhase * 6.28) * 0.15 + 0.85;

    gl_FragColor = vec4(uParticleColor, alpha * vAlpha * flicker * uOpacity);
  }
`;

// Ambient scatter shader
const scatterVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const scatterFragmentShader = `
  uniform float uTime;
  uniform vec3 uScatterColor;
  uniform float uOpacity;
  uniform vec3 uCameraPosition;

  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    float dist = length(vPosition);

    // Very soft volumetric falloff
    float scatter = 1.0 - smoothstep(0.0, 2.5, dist);
    scatter = pow(scatter, 3.0);

    // Subtle movement reaction
    float motion = sin(uTime * 0.2) * 0.1 + 0.9;

    gl_FragColor = vec4(uScatterColor, scatter * motion * uOpacity * 0.15);
  }
`;

export default function HolographicOrb({ size = 400, className = '' }: HolographicOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const createParticleSystem = useCallback((scene: THREE.Scene) => {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const alphas = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Spherical distribution with density increasing at edges
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.6 + Math.random() * 0.3; // Shell between 0.6-0.9

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = Math.random() * 3 + 1;
      alphas[i] = Math.random() * 0.5 + 0.3;
      phases[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uParticleColor: { value: new THREE.Color(0.4, 0.7, 1.0) },
        uOpacity: { value: 1.0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData.type = 'particles';
    scene.add(particles);

    return particles;
  }, []);

  const createOrbLayers = useCallback((scene: THREE.Scene) => {
    // Layer 1: Inner Energy Core
    const coreGeometry = new THREE.IcosahedronGeometry(0.5, 4);
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 1.0 },
        uCoreColor: { value: new THREE.Color(0.5, 0.8, 1.0) },
        uOpacity: { value: 1.0 },
      },
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.userData.type = 'core';
    scene.add(core);

    // Layer 2: Outer Diffraction Halo
    const haloGeometry = new THREE.SphereGeometry(0.85, 64, 64);
    const haloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHaloColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
        uOpacity: { value: 1.0 },
        uFresnelPower: { value: 3.0 },
      },
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.userData.type = 'halo';
    scene.add(halo);

    // Layer 3: Ambient Light Scatter
    const scatterGeometry = new THREE.SphereGeometry(2.0, 32, 32);
    const scatterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScatterColor: { value: new THREE.Color(0.2, 0.5, 0.9) },
        uOpacity: { value: 1.0 },
        uCameraPosition: { value: new THREE.Vector3() },
      },
      vertexShader: scatterVertexShader,
      fragmentShader: scatterFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const scatter = new THREE.Mesh(scatterGeometry, scatterMaterial);
    scatter.userData.type = 'scatter';
    scene.add(scatter);

    return { core, halo, scatter };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create layers
    const layers = createOrbLayers(scene);
    const particles = createParticleSystem(scene);

    // Mouse movement tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = 0.016; // ~60fps
      timeRef.current += delta;
      const time = timeRef.current;

      // Smooth mouse following with lag (focus lag after camera movement)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Camera orbit based on mouse (slow, subtle)
      const orbitRadius = 3.5;
      const orbitSpeed = 0.1;
      camera.position.x = Math.sin(time * orbitSpeed + mouseRef.current.x * 0.5) * orbitRadius * 0.3;
      camera.position.y = mouseRef.current.y * 0.5;
      camera.position.z = Math.cos(time * orbitSpeed) * orbitRadius * 0.1 + orbitRadius;
      camera.lookAt(0, 0, 0);

      // Update all shader uniforms
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          const material = child.material as THREE.ShaderMaterial;
          if (material.uniforms?.uTime) {
            material.uniforms.uTime.value = time;
          }
          if (material.uniforms?.uCameraPosition) {
            material.uniforms.uCameraPosition.value.copy(camera.position);
          }
        }

        // Differential layer movement for parallax
        if (child.userData.type === 'core') {
          child.rotation.y = time * 0.05;
          child.rotation.x = Math.sin(time * 0.03) * 0.1;
        } else if (child.userData.type === 'halo') {
          child.rotation.y = -time * 0.02;
          child.scale.setScalar(1 + Math.sin(time * 0.5) * 0.02);
        } else if (child.userData.type === 'particles') {
          child.rotation.y = time * 0.03;
          child.rotation.z = time * 0.01;
        } else if (child.userData.type === 'scatter') {
          child.rotation.y = time * 0.01;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      container.removeChild(renderer.domElement);

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    };
  }, [size, createOrbLayers, createParticleSystem]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        cursor: 'crosshair',
      }}
    />
  );
}
