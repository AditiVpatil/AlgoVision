/**
 * StackScene3D — 3D Stack with dynamic camera rig.
 * Camera follows the top of the stack so all elements stay visible.
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Box, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { DataCube } from './DataCube'

const CUBE_SIZE   = 1.0
const SPACING     = 1.45   // generous gap — elements never overlap
const CONTAINER_W = 1.5
const CONTAINER_D = 1.5

// ── Camera rig: smoothly follows the stack height ─────────────────────────────
function StackCameraRig({ nonRemovedCount }) {
  const { camera, controls } = useThree()

  useFrame((_, delta) => {
    if (!controls) return
    const count      = Math.max(1, nonRemovedCount)
    const stackTopY  = (count - 1) * SPACING          // y of top cube centre
    const lookAtY    = stackTopY * 0.6                 // look slightly below top
    const needZ      = Math.max(12, count * SPACING * 1.5 + 8) // pull back more
    const needCamY   = stackTopY + 6                  // look down from above top

    const t = 1 - Math.pow(0.004, delta)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, needCamY, t)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, needZ,    t)
    // Keep x at angle so stack looks 3D
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 3.5, t)
    
    controls.target.y = THREE.MathUtils.lerp(controls.target.y, lookAtY, t)
    controls.update()
  })
  return null
}

// ── Animated wireframe container ──────────────────────────────────────────────
function StackContainer({ count }) {
  const groupRef = useRef()
  const currH    = useRef(Math.max(1, count) * SPACING + 0.7)

  useFrame((_, delta) => {
    const target = Math.max(1, count) * SPACING + 0.7
    currH.current = THREE.MathUtils.lerp(currH.current, target, 1 - Math.pow(0.01, delta))
    if (groupRef.current) {
      // Scale the container to current animated height
      groupRef.current.children[0].scale.y = currH.current / (Math.max(1,count) * SPACING + 0.7)
    }
  })

  const h = Math.max(1, count) * SPACING + 0.7

  return (
    <group ref={groupRef} position={[0, h / 2 - 0.3, 0]}>
      <Box args={[CONTAINER_W + 0.35, h, CONTAINER_D + 0.35]}>
        <meshBasicMaterial transparent opacity={0} />
        <Edges color="#7B61FF" linewidth={1.8} threshold={1} />
      </Box>
    </group>
  )
}

// ── TOP arrow pointer ─────────────────────────────────────────────────────────
function TopArrow({ y }) {
  const ref = useRef()

  useFrame(({ clock }, delta) => {
    if (!ref.current) return
    const bobY = y + 1.5 + Math.sin(clock.getElapsedTime() * 3) * 0.08
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y, bobY, 1 - Math.pow(0.01, delta)
    )
  })

  return (
    <group ref={ref} position={[CONTAINER_W + 0.55, y + 1.5, 0]}>
      <mesh>
        <boxGeometry args={[0.5, 0.06, 0.06]} />
        <meshStandardMaterial color="#F5C518" emissive="#7A5A00" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[-0.32, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.22, 8]} />
        <meshStandardMaterial color="#F5C518" emissive="#7A5A00" emissiveIntensity={0.7} />
      </mesh>
      <Text position={[0.38, 0, 0]} fontSize={0.22} color="#F5C518" anchorX="left" anchorY="middle">
        TOP
      </Text>
    </group>
  )
}

// ── Main scene export ─────────────────────────────────────────────────────────
export function StackScene3D({ items }) {
  const floatOffsets = useMemo(() => {
    const map = {}
    items.forEach(({ id }) => { if (!(id in map)) map[id] = Math.random() * Math.PI * 2 })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nonRemoved = items.filter(it => it.status !== 'removed')
  const topItem    = nonRemoved[nonRemoved.length - 1]
  const topY       = topItem ? (nonRemoved.length - 1) * SPACING : 0

  const yFor = (rank) => rank * SPACING

  return (
    <>
      {/* Dynamic camera rig */}
      <StackCameraRig nonRemovedCount={nonRemoved.length} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.3} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.7} color="#7B61FF" />
      <pointLight position={[5, 2, 5]}  intensity={0.4} color="#F062D0" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#080E1A" roughness={0.95} transparent opacity={0.9} />
      </mesh>

      {/* Bottom platform */}
      <mesh position={[0, -0.11, 0]} receiveShadow>
        <boxGeometry args={[CONTAINER_W + 0.5, 0.1, CONTAINER_D + 0.5]} />
        <meshStandardMaterial color="#1E2A4A" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Container wireframe */}
      <StackContainer count={nonRemoved.length} />

      {/* EMPTY label */}
      {items.length === 0 && (
        <Text position={[0, 0.5, 0]} fontSize={0.28} color="#334155" anchorX="center" anchorY="middle">
          STACK EMPTY
        </Text>
      )}

      {/* TOP pointer */}
      {topItem && <TopArrow y={topY} />}

      {/* Cubes — each springs to its stack slot */}
      {items.map(item => {
        const rank    = nonRemoved.findIndex(it => it.id === item.id)
        const targetY = item.status === 'removed'
          ? (nonRemoved.length + 3) * SPACING + 2   // fly up
          : yFor(rank)

        return (
          <DataCube
            key={item.id}
            value={item.value}
            targetPosition={[0, targetY, 0]}
            status={item.status}
            floatOffset={floatOffsets[item.id] ?? 0}
            cubeSize={CUBE_SIZE}
            opacity={item.status === 'removed' ? 0 : 1}
          />
        )
      })}
    </>
  )
}
