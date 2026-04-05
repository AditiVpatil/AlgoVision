import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// ─── Color constants ───────────────────────────────────────────────────────────
const COLOR_DEFAULT  = new THREE.Color('#3B5BDB') // blue
const COLOR_TRAVERSE = new THREE.Color('#F5C518') // yellow
const COLOR_MATCH    = new THREE.Color('#22C55E') // green
const COLOR_VISITED  = new THREE.Color('#6C4FBF') // dim purple (already visited)

const EMISSIVE_DEFAULT  = new THREE.Color('#1A2880')
const EMISSIVE_TRAVERSE = new THREE.Color('#7A6000')
const EMISSIVE_MATCH    = new THREE.Color('#0F6030')
const EMISSIVE_VISITED  = new THREE.Color('#2E1F60')

function getColors(status) {
  if (status === 'traverse') return { color: COLOR_TRAVERSE, emissive: EMISSIVE_TRAVERSE, intensity: 0.5 }
  if (status === 'match')    return { color: COLOR_MATCH,    emissive: EMISSIVE_MATCH,    intensity: 0.4 }
  if (status === 'visited')  return { color: COLOR_VISITED,  emissive: EMISSIVE_VISITED,  intensity: 0.1 }
  return                            { color: COLOR_DEFAULT,  emissive: EMISSIVE_DEFAULT,  intensity: 0.15 }
}

// ─── Single animated cube ──────────────────────────────────────────────────────
function ArrayCube({ value, index, totalCount, status, floatOffset }) {
  const meshRef   = useRef()
  const matRef    = useRef()
  const isActive  = status === 'traverse' || status === 'match'

  // Spacing — center array around origin
  const spacing = 1.6
  const x = (index - (totalCount - 1) / 2) * spacing

  // Subtle floating animation, phase offset per cube
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    const baseY = 0
    const floatY = Math.sin(t * 1.1 + floatOffset) * 0.06
    meshRef.current.position.y = baseY + floatY

    // Scale pulse when active
    const targetScale = isActive ? 1.12 : 1
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.08
    )

    // Smooth color transition
    if (matRef.current) {
      const { color, emissive, intensity } = getColors(status)
      matRef.current.color.lerp(color, 0.1)
      matRef.current.emissive.lerp(emissive, 0.1)
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity, intensity, 0.1
      )
    }
  })

  const { color, emissive, intensity } = getColors(status)

  return (
    <group position={[x, 0, 0]}>
      <RoundedBox
        ref={meshRef}
        args={[1.2, 1.2, 1.2]}
        radius={0.1}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={intensity}
          roughness={0.3}
          metalness={0.6}
          envMapIntensity={1}
        />
      </RoundedBox>

      {/* Value label on top face */}
      <Text
        position={[0, 0.85, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.36}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        font={undefined}
        outlineWidth={0.01}
        outlineColor="#00000080"
      >
        {value}
      </Text>

      {/* Index label below */}
      <Text
        position={[0, -0.82, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.22}
        color={isActive ? '#FFD700' : '#8899BB'}
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Bottom glow plane when active */}
      {isActive && (
        <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial
            color={status === 'match' ? '#22C55E' : '#F5C518'}
            transparent
            opacity={0.18}
          />
        </mesh>
      )}
    </group>
  )
}

// ─── Pointer Arrow above active cube ──────────────────────────────────────────
function TraversalPointer({ index, totalCount }) {
  const ref = useRef()
  const spacing = 1.6
  const targetX = (index - (totalCount - 1) / 2) * spacing

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.1)
    const t = clock.getElapsedTime()
    ref.current.position.y = 1.5 + Math.sin(t * 3) * 0.08
  })

  return (
    <mesh ref={ref} position={[targetX, 1.5, 0]}>
      <coneGeometry args={[0.12, 0.3, 8]} />
      <meshStandardMaterial color="#F5C518" emissive="#7A5A00" emissiveIntensity={0.6} />
    </mesh>
  )
}

// ─── Scene ─────────────────────────────────────────────────────────────────────
function ArrayScene({ array, currentIndex, targetIndex }) {
  const floatOffsets = useMemo(() => array.map(() => Math.random() * Math.PI * 2), [array])

  const getStatus = (i) => {
    if (i === currentIndex && i === targetIndex) return 'match'
    if (i === currentIndex) return 'traverse'
    if (i === targetIndex && targetIndex !== null && targetIndex !== undefined) return 'match'
    if (currentIndex > i) return 'visited'
    return 'default'
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.6} color="#7B61FF" />
      <pointLight position={[5, -3, 5]}  intensity={0.4} color="#F062D0" />

      {/* Ground reflection plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial
          color="#0A0F20"
          roughness={0.9}
          metalness={0.05}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Cubes */}
      {array.map((val, i) => (
        <ArrayCube
          key={i}
          value={val}
          index={i}
          totalCount={array.length}
          status={getStatus(i)}
          floatOffset={floatOffsets[i]}
        />
      ))}

      {/* Pointer arrow */}
      {currentIndex >= 0 && currentIndex < array.length && (
        <TraversalPointer index={currentIndex} totalCount={array.length} />
      )}

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={18}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </>
  )
}

// ─── 3D Wrapper exported ───────────────────────────────────────────────────────
export function ArrayViz3D({ array, currentIndex, targetIndex }) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 4, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ArrayScene
          array={array}
          currentIndex={currentIndex}
          targetIndex={targetIndex}
        />
      </Canvas>
    </div>
  )
}
