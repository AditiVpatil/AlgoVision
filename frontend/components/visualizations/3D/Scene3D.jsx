/**
 * Scene3D — Reusable base 3D engine.
 *
 * Wraps Canvas, lighting, and OrbitControls.
 * All data-structure scenes are rendered as children.
 *
 * Props:
 *   children        – scene content (meshes, lights, etc.)
 *   cameraPosition  – [x, y, z] default [0, 6, 11]
 *   cameraFov       – field of view default 50
 *   orbitTarget     – [x, y, z] orbit focus default [0, 0, 0]
 *   background      – CSS color / gradient for canvas wrapper
 *   style           – additional style for the outer div
 *   className       – additional className for the outer div
 */

import { Canvas } from '@react-three/fiber'
import { OrbitControls, GradientTexture, Plane } from '@react-three/drei'
import * as THREE from 'three'

// ── Subtle grid floor ─────────────────────────────────────────────────────────
function SceneFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial
        color="#080E1A"
        roughness={0.95}
        metalness={0.05}
        transparent
        opacity={0.92}
      />
    </mesh>
  )
}

// ── Scene-level lights ─────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* accent fill lights */}
      <pointLight position={[-7, 6, -5]}  intensity={0.7}  color="#7B61FF" />
      <pointLight position={[7, 2, 5]}   intensity={0.45} color="#F062D0" />
      <pointLight position={[0, -1, 6]}  intensity={0.3}  color="#3B82F6" />
    </>
  )
}

export function Scene3D({
  children,
  cameraPosition = [0, 6, 11],
  cameraFov      = 50,
  orbitTarget    = [0, 0, 0],
  className      = '',
  style          = {},
}) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at 50% 60%, #0D1835 0%, #07111C 100%)',
        ...style,
      }}
    >
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: 'transparent' }}
      >
        <SceneLights />
        <SceneFloor />
        {children}
        <OrbitControls
          makeDefault
          target={new THREE.Vector3(...orbitTarget)}
          enablePan={false}
          minDistance={3}
          maxDistance={24}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.05}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
