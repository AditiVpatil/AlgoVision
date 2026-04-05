/**
 * TreeViz3D — Interactive 3D Binary Tree visualizer
 *
 * Features:
 *  - 3D spherical nodes connected by tapered cylinder edges
 *  - BFS / DFS (Inorder, Preorder, Postorder) traversal modes
 *  - Sound effects via Web Audio API (no external dep)
 *  - Step-by-step or Auto-play animation
 *  - 2D / 3D toggle
 *  - Node values rendered as 3D text labels
 */

import { useState, useRef, useCallback, useMemo, lazy, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX,
  LayoutGrid, Box, ChevronRight
} from 'lucide-react'

// ── Default BST ───────────────────────────────────────────────────────────────
const DEFAULT_TREE = {
  val: 8,
  left: {
    val: 4,
    left: { val: 2, left: { val: 1, left: null, right: null }, right: { val: 3, left: null, right: null } },
    right: { val: 6, left: { val: 5, left: null, right: null }, right: { val: 7, left: null, right: null } }
  },
  right: {
    val: 12,
    left: { val: 10, left: { val: 9, left: null, right: null }, right: { val: 11, left: null, right: null } },
    right: { val: 14, left: { val: 13, left: null, right: null }, right: { val: 15, left: null, right: null } }
  }
}

// ── Traversal builders ────────────────────────────────────────────────────────
function buildTraversal(root, mode) {
  const order = []
  if (mode === 'bfs') {
    const queue = [root]
    while (queue.length) {
      const node = queue.shift()
      if (!node) continue
      order.push(node.val)
      if (node.left)  queue.push(node.left)
      if (node.right) queue.push(node.right)
    }
  } else if (mode === 'inorder') {
    const dfs = (n) => { if (!n) return; dfs(n.left); order.push(n.val); dfs(n.right) }
    dfs(root)
  } else if (mode === 'preorder') {
    const dfs = (n) => { if (!n) return; order.push(n.val); dfs(n.left); dfs(n.right) }
    dfs(root)
  } else {
    const dfs = (n) => { if (!n) return; dfs(n.left); dfs(n.right); order.push(n.val) }
    dfs(root)
  }
  return order
}

// ── Layout: assign (x, y, z) to every node ───────────────────────────────────
function layoutTree(root) {
  const positions = {}
  const H_SPREAD = 3.0
  const V_STEP   = 2.2

  function assign(node, depth, left, right) {
    if (!node) return
    const x = (left + right) / 2
    const y = -depth * V_STEP
    positions[node.val] = [x, y, 0]
    if (node.left)  assign(node.left,  depth + 1, left,       x)
    if (node.right) assign(node.right, depth + 1, x,         right)
  }

  // Compute tree width
  let leafCount = 0
  const countLeaves = (n, d) => {
    if (!n) return
    if (!n.left && !n.right) { leafCount++; return }
    countLeaves(n.left,  d + 1)
    countLeaves(n.right, d + 1)
  }
  countLeaves(root, 0)
  const width = Math.max(leafCount * H_SPREAD, 12)

  assign(root, 0, -width / 2, width / 2)
  return positions
}

// ── Build flat node list for edges ───────────────────────────────────────────
function flatNodes(root) {
  const list = []
  const walk = (n, parent) => {
    if (!n) return
    list.push({ val: n.val, parentVal: parent?.val ?? null })
    walk(n.left,  n)
    walk(n.right, n)
  }
  walk(root, null)
  return list
}

// ── Web Audio tones ───────────────────────────────────────────────────────────
let audioCtx = null
function playTone(freq = 440, dur = 0.12, type = 'sine') {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = freq
    osc.type = type
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur)
    osc.start()
    osc.stop(audioCtx.currentTime + dur)
  } catch (_) {}
}

// ── Node status colours ───────────────────────────────────────────────────────
const NODE_COLORS = {
  default:  '#1E3A8A',
  active:   '#F59E0B',
  visited:  '#059669',
  queued:   '#6B4FBF',
}

// ── 3D Node sphere ────────────────────────────────────────────────────────────
function TreeNode3D({ val, position, status }) {
  const meshRef = useRef()
  const matRef  = useRef()
  const curPos  = useRef(new THREE.Vector3(...position))
  const vel     = useRef(new THREE.Vector3())
  const scaleV  = useRef(0)
  const scale   = useRef(1)

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const tgt = new THREE.Vector3(...position)
    const diff = tgt.clone().sub(curPos.current)
    vel.current.add(diff.multiplyScalar(200 * dt)).multiplyScalar(1 - 16 * dt)
    curPos.current.add(vel.current.clone().multiplyScalar(dt))

    if (meshRef.current) meshRef.current.position.copy(curPos.current)

    const tS = (status === 'active') ? 1.25 : 1.0
    const sF = (tS - scale.current) * 180 - scaleV.current * 16
    scaleV.current += sF * dt
    scale.current  += scaleV.current * dt
    if (meshRef.current) meshRef.current.scale.setScalar(scale.current)

    if (matRef.current) {
      const c = new THREE.Color(NODE_COLORS[status] || NODE_COLORS.default)
      matRef.current.color.lerp(c, 0.12)
      matRef.current.emissive.lerp(c.clone().multiplyScalar(0.4), 0.12)
    }
  })

  const color = NODE_COLORS[status] || NODE_COLORS.default

  return (
    <group>
      <mesh ref={meshRef} position={position} castShadow>
        <sphereGeometry args={[0.52, 20, 20]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>
      <Text
        position={[position[0], position[1] + 0.02, position[2] + 0.55]}
        fontSize={0.36}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000AA"
      >
        {String(val)}
      </Text>
    </group>
  )
}

// ── Edge between parent → child ───────────────────────────────────────────────
function TreeEdge({ from, to, active }) {
  const color = active ? '#F59E0B' : '#1E3A5F'
  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={active ? 2.5 : 1.2}
    />
  )
}

// ── Full 3D scene ─────────────────────────────────────────────────────────────
function TreeScene({ positions, nodes, activeVal, visitedVals, queuedVals }) {
  const getStatus = (val) => {
    if (val === activeVal)         return 'active'
    if (visitedVals.includes(val)) return 'visited'
    if (queuedVals.includes(val))  return 'queued'
    return 'default'
  }

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 10, 5]} intensity={1.3} castShadow />
      <pointLight position={[-6, 5, -4]} intensity={0.7} color="#7B61FF" />
      <pointLight position={[6, 2,  5]} intensity={0.5} color="#F062D0" />

      {/* Edges */}
      {nodes.map(({ val, parentVal }) => {
        if (parentVal === null) return null
        const from = positions[parentVal]
        const to   = positions[val]
        if (!from || !to) return null
        const isActive = val === activeVal || parentVal === activeVal
        return (
          <TreeEdge
            key={`${parentVal}-${val}`}
            from={from}
            to={to}
            active={isActive}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map(({ val }) => (
        <TreeNode3D
          key={val}
          val={val}
          position={positions[val] || [0, 0, 0]}
          status={getStatus(val)}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={35}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}

// ── 2D flat view ──────────────────────────────────────────────────────────────
function Tree2D({ root, activeVal, visitedVals }) {
  function renderNode(node, depth = 0) {
    if (!node) return null
    const isActive  = node.val === activeVal
    const isVisited = visitedVals.includes(node.val)
    const bg = isActive ? 'bg-[#F59E0B]/25 border-[#F59E0B]/70 text-[#FDE68A]'
             : isVisited ? 'bg-[#059669]/20 border-[#059669]/50 text-[#6EE7B7]'
             : 'bg-[#1E3A8A]/20 border-[#1E3A8A]/40 text-[#93C5FD]'
    return (
      <div key={node.val} className="flex flex-col items-center gap-1">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold font-mono transition-all duration-300 ${bg}`}>
          {node.val}
        </div>
        {(node.left || node.right) && (
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {node.left  && <div className="w-px h-3 bg-white/20" />}
              {renderNode(node.left,  depth + 1)}
            </div>
            <div className="flex flex-col items-center">
              {node.right && <div className="w-px h-3 bg-white/20" />}
              {renderNode(node.right, depth + 1)}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex justify-center items-start py-4 overflow-auto min-h-[260px]">
      {renderNode(root)}
    </div>
  )
}

// ── SPEED map ─────────────────────────────────────────────────────────────────
const SPEED_MS = { slow: 1200, medium: 600, fast: 200 }
const TONE_MAP  = { bfs: 520, inorder: 440, preorder: 380, postorder: 620 }

// ── Master component ──────────────────────────────────────────────────────────
export function TreeViz({ initialTree = DEFAULT_TREE }) {
  const positions = useMemo(() => layoutTree(initialTree), [initialTree])
  const nodes     = useMemo(() => flatNodes(initialTree),  [initialTree])

  const [mode,      setMode]      = useState('inorder')
  const [viewMode,  setViewMode]  = useState('3d')
  const [speed,     setSpeed]     = useState('medium')
  const [playing,   setPlaying]   = useState(false)
  const [stepIdx,   setStepIdx]   = useState(-1)
  const [sound,     setSound]     = useState(true)
  const [log,       setLog]       = useState('Pick a traversal mode and press Play')
  const timerRef = useRef(null)

  const traversal = useMemo(() => buildTraversal(initialTree, mode), [initialTree, mode])

  const activeVal  = stepIdx >= 0 && stepIdx < traversal.length ? traversal[stepIdx] : null
  const visitedVals = traversal.slice(0, stepIdx)
  const queuedVals  = mode === 'bfs' ? traversal.slice(stepIdx + 1, stepIdx + 4) : []

  const stop = () => { clearInterval(timerRef.current); setPlaying(false) }

  const doStep = useCallback((idx) => {
    const val = traversal[idx]
    if (val === undefined) { stop(); setLog('✅ Traversal complete!'); return }
    setStepIdx(idx)
    setLog(`Visiting node [${val}] — step ${idx + 1}/${traversal.length}`)
    if (sound) playTone(TONE_MAP[mode] + idx * 12, 0.13, 'triangle')
  }, [traversal, sound, mode])

  const handlePlay = () => {
    if (playing) { stop(); return }
    setPlaying(true)
    let idx = stepIdx < 0 || stepIdx >= traversal.length - 1 ? 0 : stepIdx + 1
    doStep(idx)
    timerRef.current = setInterval(() => {
      idx++
      if (idx >= traversal.length) { stop(); setLog('✅ Traversal complete!'); return }
      doStep(idx)
    }, SPEED_MS[speed])
  }

  const handleStep = () => {
    stop()
    const next = stepIdx + 1
    if (next >= traversal.length) { setLog('✅ Already complete. Reset to restart.'); return }
    doStep(next)
  }

  const handleReset = () => {
    stop()
    setStepIdx(-1)
    setLog('Pick a traversal mode and press Play')
  }

  const handleModeChange = (m) => { handleReset(); setMode(m) }

  const MODE_LABELS = { bfs: 'BFS', inorder: 'Inorder', preorder: 'Preorder', postorder: 'Postorder' }

  return (
    <div className="space-y-4">
      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Traversal mode */}
        <div className="flex gap-1 flex-wrap">
          {Object.entries(MODE_LABELS).map(([k, label]) => (
            <button
              key={k}
              onClick={() => handleModeChange(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === k
                  ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white'
                  : 'bg-white/5 border border-white/10 text-[#64748B] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Play / Pause */}
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-sm font-medium hover:opacity-90"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Pause' : 'Play'}
        </button>

        {/* Step */}
        <button
          onClick={handleStep}
          disabled={playing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 disabled:opacity-40"
        >
          <SkipForward className="w-4 h-4" /> Step
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Sound */}
        <button
          onClick={() => setSound(s => !s)}
          className="px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
          title={sound ? 'Mute' : 'Unmute'}
        >
          {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#64748B]" />}
        </button>

        {/* Speed */}
        {['slow','medium','fast'].map(s => (
          <button key={s} onClick={() => setSpeed(s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              speed === s
                ? 'bg-[#7B61FF]/30 border border-[#7B61FF]/50 text-[#BFB4FF]'
                : 'bg-white/5 border border-white/10 text-[#64748B] hover:text-white'
            }`}>{s}</button>
        ))}

        {/* 2D / 3D toggle */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {['2d','3d'].map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === v
                  ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white shadow'
                  : 'text-[#64748B] hover:text-white'
              }`}>
              {v === '2d' ? <LayoutGrid className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
              {v.toUpperCase()}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-[#475569]">
          {stepIdx + 1}/{traversal.length}
        </span>
      </div>

      {/* ── Viz area ── */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/5"
           style={{ height: '420px', background: 'radial-gradient(ellipse at 50% 40%, #0D1F35 0%, #07111C 100%)' }}>
        {viewMode === '3d' ? (
          <Canvas shadows camera={{ position: [0, -2, 22], fov: 52 }} gl={{ antialias: true }}>
            <TreeScene
              positions={positions}
              nodes={nodes}
              activeVal={activeVal}
              visitedVals={visitedVals}
              queuedVals={queuedVals}
            />
          </Canvas>
        ) : (
          <div className="w-full h-full overflow-auto">
            <Tree2D root={initialTree} activeVal={activeVal} visitedVals={visitedVals} />
          </div>
        )}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-[#64748B] pointer-events-none select-none whitespace-nowrap">
            🖱 Drag to orbit · Scroll to zoom
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { bg: 'bg-[#1E3A8A]', label: 'Unvisited' },
          { bg: 'bg-[#F59E0B]', label: 'Current'   },
          { bg: 'bg-[#059669]', label: 'Visited'   },
          { bg: 'bg-[#6B4FBF]', label: 'Queued'    },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.bg}`} />
            <span className="text-[#94A3B8]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Log ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <ChevronRight className="w-3.5 h-3.5 text-[#7B61FF] flex-shrink-0" />
        <span className="text-xs font-mono text-[#94A3B8]">{log}</span>
      </div>
    </div>
  )
}
