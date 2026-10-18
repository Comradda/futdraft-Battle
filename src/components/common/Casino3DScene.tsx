import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Casino3DSceneProps {
  variant?: 'hero' | 'compact-badge';
  accentColor?: 'gold' | 'emerald' | 'crimson' | 'blue';
  className?: string;
  onInteract?: () => void;
}

/**
 * Generates a high-resolution procedural texture for a 3D Casino Chip face
 */
function createChipFaceTexture(
  label: string,
  primaryHex: string,
  accentHex: string,
  textHex: string = '#ffffff'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = 128;
    const cy = 128;

    // Outer base
    ctx.fillStyle = primaryHex;
    ctx.beginPath();
    ctx.arc(cx, cy, 126, 0, Math.PI * 2);
    ctx.fill();

    // 8 Casino edge stripes
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillRect(-14, -126, 28, 26);
      ctx.restore();
    }

    // Inner metallic ring
    ctx.beginPath();
    ctx.arc(cx, cy, 96, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0e14';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = accentHex;
    ctx.stroke();

    // Dashed inner casino rim
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([10, 8]);
    ctx.arc(cx, cy, 82, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = accentHex;
    ctx.stroke();
    ctx.restore();

    // Center medallion glow
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 74);
    grad.addColorStop(0, primaryHex);
    grad.addColorStop(1, '#090c12');
    ctx.beginPath();
    ctx.arc(cx, cy, 74, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Top & bottom micro text
    ctx.fillStyle = accentHex;
    ctx.font = '900 15px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROYALBET', cx, cy - 42);
    ctx.fillText('VIP 3D', cx, cy + 44);

    // Main denomination
    ctx.fillStyle = textHex;
    ctx.font = '900 44px Inter, Arial, sans-serif';
    ctx.fillText(label, cx, cy + 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates edge stripe texture for cylinder side of a 3D casino chip
 */
function createChipEdgeTexture(primaryHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = primaryHex;
    ctx.fillRect(0, 0, 256, 32);
    ctx.fillStyle = '#f8fafc';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 32 + 8, 0, 12, 32);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a 3D Die face texture with pips (1 to 6)
 */
function createDieFaceTexture(pips: number, bgHex: string, pipHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 128, 128);

    // Subtle border bevel
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 122, 122);

    ctx.fillStyle = pipHex;
    const r = 11;
    const coords: Record<number, [number, number][]> = {
      1: [[64, 64]],
      2: [[34, 34], [94, 94]],
      3: [[32, 32], [64, 64], [96, 96]],
      4: [[34, 34], [94, 34], [34, 94], [94, 94]],
      5: [[32, 32], [96, 32], [64, 64], [32, 96], [96, 96]],
      6: [[34, 28], [94, 28], [34, 64], [94, 64], [34, 100], [94, 100]],
    };

    for (const [x, y] of coords[pips] || coords[1]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const Casino3DScene: React.FC<Casino3DSceneProps> = ({
  variant = 'hero',
  className = '',
  onInteract,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const spinBoostRef = useRef<number>(0);
  const pointerTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 180;

    // Cap DPR at 2 for silky 60fps on iOS Safari & Android Chrome
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Clear container and mount canvas
    container.innerHTML = '';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'manipulation';
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.4, variant === 'compact-badge' ? 5.2 : 7.2);

    // Studio Lighting (Gold Warmth + Emerald Rim + Cool Key Light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.6);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const emeraldRimLight = new THREE.PointLight(0x00e701, 2.2, 14);
    emeraldRimLight.position.set(-4, -2, 3);
    scene.add(emeraldRimLight);

    const crimsonRimLight = new THREE.PointLight(0xe60012, 2.0, 14);
    crimsonRimLight.position.set(4, -3, 2);
    scene.add(crimsonRimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Track disposable resources for clean unmount on mobile
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    // Helper to build a 3D Casino Chip Mesh
    const buildChipMesh = (
      label: string,
      primaryHex: string,
      accentHex: string,
      radius = 1.15
    ) => {
      const geo = new THREE.CylinderGeometry(radius, radius, 0.2, 40);
      geometries.push(geo);

      const faceTex = createChipFaceTexture(label, primaryHex, accentHex);
      const edgeTex = createChipEdgeTexture(primaryHex);
      textures.push(faceTex, edgeTex);

      const sideMat = new THREE.MeshStandardMaterial({
        map: edgeTex,
        roughness: 0.3,
        metalness: 0.4,
      });
      const faceMat = new THREE.MeshStandardMaterial({
        map: faceTex,
        roughness: 0.22,
        metalness: 0.65,
      });
      materials.push(sideMat, faceMat);

      return new THREE.Mesh(geo, [sideMat, faceMat, faceMat]);
    };

    // 1. Center Hero $1M Gold VIP Chip
    const mainGoldChip = buildChipMesh('1M', '#d97706', '#fde047', variant === 'compact-badge' ? 1.35 : 1.28);
    mainGoldChip.rotation.x = Math.PI * 0.35;
    mainGoldChip.rotation.z = -Math.PI * 0.12;
    rootGroup.add(mainGoldChip);

    let emeraldChip: THREE.Mesh | null = null;
    let crimsonChip: THREE.Mesh | null = null;
    let dieMesh: THREE.Mesh | null = null;
    let goldRing: THREE.Mesh | null = null;

    if (variant === 'hero') {
      // 2. Rainbet Neon Emerald $100K Chip (Left)
      emeraldChip = buildChipMesh('100K', '#059669', '#00e701', 0.96);
      emeraldChip.position.set(-2.05, 0.55, -0.6);
      emeraldChip.rotation.set(Math.PI * 0.42, 0.3, Math.PI * 0.18);
      rootGroup.add(emeraldChip);

      // 3. Caliente Crimson $500K Chip (Right)
      crimsonChip = buildChipMesh('500K', '#b91c1c', '#fbbf24', 1.0);
      crimsonChip.position.set(2.05, -0.45, -0.4);
      crimsonChip.rotation.set(Math.PI * 0.3, -0.4, -Math.PI * 0.22);
      rootGroup.add(crimsonChip);

      // 4. 3D Crimson & Gold Casino Die
      const dieGeo = new THREE.BoxGeometry(0.88, 0.88, 0.88);
      geometries.push(dieGeo);
      const dieMats = [1, 2, 3, 4, 5, 6].map((n) => {
        const t = createDieFaceTexture(n, '#dc2626', '#fef08a');
        textures.push(t);
        const m = new THREE.MeshStandardMaterial({
          map: t,
          roughness: 0.15,
          metalness: 0.35,
        });
        materials.push(m);
        return m;
      });
      dieMesh = new THREE.Mesh(dieGeo, dieMats);
      dieMesh.position.set(1.55, 0.95, 0.45);
      rootGroup.add(dieMesh);

      // 5. 3D Golden Orbital Roulette Ring
      const ringGeo = new THREE.TorusGeometry(2.15, 0.045, 16, 72);
      geometries.push(ringGeo);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.15,
      });
      materials.push(ringMat);
      goldRing = new THREE.Mesh(ringGeo, ringMat);
      goldRing.rotation.x = Math.PI * 0.38;
      goldRing.position.set(0, 0, -1.1);
      rootGroup.add(goldRing);
    }

    // Resize Observer for responsive mobile orientation changes
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 180;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();

      // Decay spin boost smoothly
      if (spinBoostRef.current > 0.001) {
        spinBoostRef.current *= 0.94;
      } else {
        spinBoostRef.current = 0;
      }

      const boost = spinBoostRef.current;

      // Rotate main 3D gold chip
      mainGoldChip.rotation.y += 0.014 + boost;
      mainGoldChip.position.y = Math.sin(elapsed * 2.1) * 0.12;

      if (emeraldChip) {
        emeraldChip.rotation.y -= 0.012 + boost * 0.8;
        emeraldChip.rotation.z = Math.PI * 0.18 + Math.sin(elapsed * 1.5) * 0.1;
        emeraldChip.position.y = 0.55 + Math.cos(elapsed * 1.8) * 0.14;
      }

      if (crimsonChip) {
        crimsonChip.rotation.y += 0.015 + boost * 0.9;
        crimsonChip.position.y = -0.45 + Math.sin(elapsed * 1.9 + 1) * 0.14;
      }

      if (dieMesh) {
        dieMesh.rotation.x += 0.012 + boost;
        dieMesh.rotation.y += 0.016 + boost;
        dieMesh.position.y = 0.95 + Math.sin(elapsed * 2.4) * 0.12;
      }

      if (goldRing) {
        goldRing.rotation.z = elapsed * 0.35;
        goldRing.rotation.x = Math.PI * 0.38 + Math.sin(elapsed * 0.8) * 0.08;
      }

      // Smooth interactive tilt toward pointer/touch
      rootGroup.rotation.y += (pointerTargetRef.current.x * 0.45 - rootGroup.rotation.y) * 0.08;
      rootGroup.rotation.x += (pointerTargetRef.current.y * 0.3 - rootGroup.rotation.x) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, [variant]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerTargetRef.current = { x: nx, y: ny };
  };

  const handleTapBoost = () => {
    spinBoostRef.current = 0.26;
    if (onInteract) onInteract();
  };

  if (!webglSupported) {
    return null;
  }

  return (
    <div
      ref={mountRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerTargetRef.current = { x: 0, y: 0 };
      }}
      onClick={handleTapBoost}
      className={`relative select-none cursor-grab active:cursor-grabbing ${className}`}
      title="Toca o desliza para girar en 3D"
    />
  );
};
