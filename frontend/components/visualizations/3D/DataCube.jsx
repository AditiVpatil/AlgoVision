/**
 * DataCube — Reusable 3D data element for the visualization system.
 *
 * Props:
 *   id           – unique key (for React)
 *   value        – displayed text
 *   targetPosition – [x, y, z] array; cube springs toward this
 *   status       – 'default' | 'active' | 'inserted' | 'removed' | 'peek'
 *   floatOffset  – phase offset for idle bob (keeps cubes out-of-sync)
 *   cubeSize     – edge length (default 1.1)
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'

// ── Colour palette ────────────────────────────────────────────────────────────
const PALETTE = {
  default:  { color: '#2563EB', emissive: '#0F2D7A', intensity: 0.18 },
  active:   { color: '#F5C518', emissive: '#6B5000', intensity: 0.55 },
  inserted: { color: '#22C55E', emissive: '#0B4D26', intensity: 0.45 },
  removed:  { color: '#EF4444', emissive: '#5C1111', intensity: 0.55 },
  peek:     { color: '#A78BFA', emissive: '#3B1F8A', intensity: 0.50 },
}

const tmpColor  = new THREE.Color()
const tmpVec    = new THREE.Vector3()
const tmpVec2   = new THREE.Vector3()

function springLerp(current, target, velocity, stiffness, damping, dt) {
  // Hooke's law spring → gives natural overshoot/bounce
  const disp = tmpVec2.copy(target).sub(current)
  const force = tmpVec.copy(disp).multiplyScalar(stiffness)
    .sub(tmpVec.copy(velocity).multiplyScalar(damping))

  velocity.addScaledVector(force, dt)
  current.addScaledVector(velocity, dt)
}

export function DataCube({
  value,
  targetPosition = [0, 0, 0],
  status = 'default',
  floatOffset = 0,
  cubeSize = 1.1,
  opacity = 1,
}) {
  const groupRef = useRef()
  const meshRef  = useRef()
  const matRef   = useRef()
  const txtRef   = useRef()

  // Spring state (mutable refs — NOT React state, updated every frame)
  const springPos = useRef(new THREE.Vector3(...targetPosition))
  const springVel = useRef(new THREE.Vector3(0, 0, 0))
  const scaleRef  = useRef(new THREE.Vector3(1, 1, 1))
  const scaleVel  = useRef(0)

  // Random float phase so each cube bobs at a different phase
  const phase = useMemo(() => floatOffset, [floatOffset])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05) // guard against tab-sleep spikes
    const t  = clock.getElapsedTime()

    // ── Spring position toward targetPosition ─────────────────────────────
    const tPos = tmpVec.set(...targetPosition)
    springLerp(springPos.current, tPos, springVel.current, 220, 18, dt)

    // ── Gentle idle float ─────────────────────────────────────────────────
    const floatY = Math.sin(t * 1.15 + phase) * 0.035

    if (groupRef.current) {
      groupRef.current.position.copy(springPos.current)
      groupRef.current.position.y += floatY
    }

    // ── Pulse scale when active / inserted ─────────────────────────────────
    const targetScale = (status === 'active' || status === 'inserted' || status === 'removed')
      ? 1.1 : 1.0
    const sCurr = scaleRef.current.x
    const sVel  = scaleVel.current
    const sForce = (targetScale - sCurr) * 180 - sVel * 16
    scaleVel.current  += sForce * dt
    const newS = sCurr + scaleVel.current * dt
    scaleRef.current.setScalar(newS)
    if (groupRef.current) groupRef.current.scale.setScalar(newS)

    // ── Smooth colour transition ──────────────────────────────────────────
    if (matRef.current) {
      const p = PALETTE[status] || PALETTE.default
      tmpColor.set(p.color)
      matRef.current.color.lerp(tmpColor, 0.1)
      tmpColor.set(p.emissive)
      matRef.current.emissive.lerp(tmpColor, 0.1)
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity, p.intensity, 0.1
      )
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, opacity, 0.1)
    }
  })

  const { color, emissive, intensity } = PALETTE[status] || PALETTE.default
  const half = cubeSize / 2

  return (
    <group ref={groupRef} position={targetPosition}>
      {/* Main cube mesh */}
      <RoundedBox
        ref={meshRef}
        args={[cubeSize, cubeSize, cubeSize]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={intensity}
          roughness={0.25}
          metalness={0.65}
          transparent
          opacity={opacity}
        />
      </RoundedBox>

      {/* Value – top face label */}
      <Text
        ref={txtRef}
        position={[0, half + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.32}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#00000099"
      >
        {String(value)}
      </Text>

      {/* Active glow ring on base */}
      {(status === 'active' || status === 'inserted' || status === 'peek') && (
        <mesh position={[0, -(half + 0.01), 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[half * 0.6, half * 1.05, 32]} />
          <meshBasicMaterial
            color={PALETTE[status]?.color || '#FFFFFF'}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
