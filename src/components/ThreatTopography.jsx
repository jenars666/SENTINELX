import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const GRID = 20;
const COUNT = GRID * GRID;

const PALETTE = {
  nominal:  new THREE.Color('#00f3ff'),
  warning:  new THREE.Color('#ff9d00'),
  critical: new THREE.Color('#ff2a5f'),
};

const FOG_COLOR = {
  nominal:  '#020a0c',
  warning:  '#0c0800',
  critical: '#0c0005',
};

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Floating energy particles
const ParticleField = ({ state }) => {
  const ref = useRef();
  const color = useMemo(() => PALETTE[state] ?? PALETTE.nominal, [state]);
  const positions = useMemo(() => {
    const p = new Float32Array(1800 * 3);
    for (let i = 0; i < 1800; i++) {
      p[i * 3]     = (seededRandom(i + 1) - 0.5) * 50;
      p[i * 3 + 1] = (seededRandom(i + 1801) - 0.5) * 30;
      p[i * 3 + 2] = (seededRandom(i + 3601) - 0.5) * 50;
    }
    return p;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={1800} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06} color={color} transparent opacity={0.35}
        sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </points>
  );
};

export const ThreatTopography = ({ state = 'nominal', shakeTrigger = 0, hasInteracted = false }) => {
  const meshRef     = useRef();
  const wireRef     = useRef();
  const { camera, scene } = useThree();

  const shakeRef    = useRef(0);
  const camOrigin   = useMemo(() => new THREE.Vector3(15, 12, 15), []);
  const tempObj     = useMemo(() => new THREE.Object3D(), []);
  const tempColor   = useMemo(() => new THREE.Color(), []);
  const heightsRef  = useRef(new Float32Array(COUNT));
  const targetColor = useMemo(() => PALETTE[state] ?? PALETTE.nominal, [state]);

  // Trigger shake on critical / file drop
  useEffect(() => {
    if (shakeTrigger > 0) shakeRef.current = state === 'critical' ? 1.0 : 0.45;
  }, [shakeTrigger, state]);

  // Update fog color per state
  useEffect(() => {
    if (scene.fog) scene.fog.color.set(FOG_COLOR[state] ?? FOG_COLOR.nominal);
  }, [state, scene]);

  // Seed initial matrices
  useEffect(() => {
    if (!meshRef.current || !wireRef.current) return;
    let i = 0;
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        tempObj.position.set(x - GRID / 2, 0.5, z - GRID / 2);
        tempObj.scale.set(0.88, 1, 0.88);
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
        wireRef.current.setMatrixAt(i, tempObj.matrix);
        meshRef.current.setColorAt(i, targetColor);
        i++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    wireRef.current.instanceMatrix.needsUpdate = true;
  }, []); // eslint-disable-line

  useFrame(({ clock }) => {
    if (!meshRef.current || !wireRef.current) return;
    const t = clock.getElapsedTime();

    // ── Camera shake ──
    if (shakeRef.current > 0.01) {
      const s = shakeRef.current;
      camera.position.set(
        camOrigin.x + (Math.random() - 0.5) * s,
        camOrigin.y + (Math.random() - 0.5) * s * 0.5,
        camOrigin.z + (Math.random() - 0.5) * s,
      );
      camera.lookAt(0, 0, 0);
      shakeRef.current = THREE.MathUtils.lerp(shakeRef.current, 0, 0.06);
    } else {
      camera.position.lerp(camOrigin, 0.08);
      camera.lookAt(0, 0, 0);
    }

    // ── Terrain animation ──
    const heights = heightsRef.current;
    let i = 0;
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        const dist = Math.hypot(x - GRID / 2, z - GRID / 2);
        let target = 1;
        
        // Only animate if user has interacted (uploaded file or clicked button)
        if (hasInteracted) {
          if (state === 'warning')  target = 2   + Math.sin(t * 3   + dist * 0.8) * 1.5;
          else if (state === 'critical') target = 4.5 + Math.sin(t * 9   + dist * 1.3) * 3.5;
          else if (state === 'nominal') target = 0.8 + Math.sin(t * 1.4 + dist * 0.35) * 0.5;
        } else {
          // Static flat terrain before interaction
          target = 0.5;
        }

        heights[i] = THREE.MathUtils.lerp(heights[i], target, 0.09);
        const h = heights[i];

        tempObj.position.set(x - GRID / 2, h / 2, z - GRID / 2);
        tempObj.scale.set(0.88, h, 0.88);
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
        wireRef.current.setMatrixAt(i, tempObj.matrix);

        const bright = Math.min(h / 7, 1);
        tempColor.lerpColors(targetColor, new THREE.Color('#ffffff'), bright * 0.25);
        meshRef.current.setColorAt(i, tempColor);
        i++;
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    wireRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <fog attach="fog" args={[FOG_COLOR[state] ?? '#020203', 12, 55]} />
      <ParticleField state={state} />

      {/* Solid instanced terrain */}
      <instancedMesh ref={meshRef} args={[null, null, COUNT]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.85} roughness={0.15} transparent opacity={0.65} />
      </instancedMesh>

      {/* Wireframe overlay */}
      <instancedMesh ref={wireRef} args={[null, null, COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={targetColor} wireframe transparent opacity={0.12} depthWrite={false} />
      </instancedMesh>

      {/* Ground plane glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[GRID + 4, GRID + 4]} />
        <meshStandardMaterial color="#020203" metalness={0.9} roughness={0.4} />
      </mesh>
    </>
  );
};
