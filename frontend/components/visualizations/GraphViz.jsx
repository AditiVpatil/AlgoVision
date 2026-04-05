/**
 * GraphViz — Interactive 3D Graph visualizer
 * BFS / DFS traversal with 3D floating nodes and edge lines
 * Sound effects, discovery animation, 2D/3D toggle
 */

import { useState, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, LayoutGrid, Box, ChevronRight } from 'lucide-react'

// ── Default graph ─────────────────────────────────────────────────────────────
const DEFAULT_GRAPH = {
  nodes: [0, 1, 2, 3, 4, 5, 6],
  edges: [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,4],[5,6]],
}

// ── Fixed 3D positions ────────────────────────────────────────────────────────
const NODE_POSITIONS = {
  0: [0,    3,    0],
  1: [-2.5, 1,    1],
  2: [2.5,  1,   -1],
  3: [-4,  -1.5,  1],
  4: [-1,  -1.5,  2],
  5: [1,   -1.5, -2],
  6: [4,   -1.5, -1],
}

// ── Traversal builders ────────────────────────────────────────────────────────
function buildBFS(graph, start) {
  const adj = {}
  graph.nodes.forEach(n => { adj[n] = [] })
  graph.edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u) })
  const visited = new Set([start])
  const queue   = [start]
  const order   = []
  while (queue.length) {
    const node = queue.shift()
    order.push(node)
    for (const nb of (adj[node] || [])) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
    }
  }
  return order
}

function buildDFS(graph, start) {
  const adj = {}
  graph.nodes.forEach(n => { adj[n] = [] })
  graph.edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u) })
  const visited = new Set()
  const order   = []
  const dfs = (n) => {
    visited.add(n); order.push(n)
    for (const nb of (adj[n] || [])) { if (!visited.has(nb)) dfs(nb) }
  }
  dfs(start)
  return order
}

// ── Web Audio ─────────────────────────────────────────────────────────────────
let _ctx = null
function playTone(freq, dur = 0.12, type = 'sine') {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = _ctx.createOscillator()
    const g   = _ctx.createGain()
    osc.connect(g); g.connect(_ctx.destination)
    osc.frequency.value = freq; osc.type = type
    g.gain.setValueAtTime(0.15, _ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur)
    osc.start(); osc.stop(_ctx.currentTime + dur)
  } catch(_) {}
}

// ── Animated node ─────────────────────────────────────────────────────────────
const NODE_COL = { default: '#1A3A7A', active: '#F59E0B', visited: '#059669', undiscovered: '#1E293B' }

function GraphNode3D({ id, position, status }) {
  const meshRef = useRef()
  const matRef  = useRef()
  const curPos  = useRef(new THREE.Vector3(...position))
  const vel     = useRef(new THREE.Vector3())

  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.05)
    const t = clock.getElapsedTime()
    // Idle float
    const floatY = Math.sin(t * 1.1 + id * 0.9) * 0.08

    const tgt = new THREE.Vector3(...position)
    tgt.y += floatY
    const diff = tgt.clone().sub(curPos.current)
    vel.current.add(diff.multiplyScalar(120 * dt)).multiplyScalar(1 - 12 * dt)
    curPos.current.add(vel.current.clone().multiplyScalar(dt))

    if (meshRef.current) meshRef.current.position.copy(curPos.current)

    const tS = status === 'active' ? 1.3 : 1.0
    const cs = meshRef.current?.scale.x ?? 1
    const ns = cs + (tS - cs) * 0.12
    meshRef.current?.scale.setScalar(ns)

    if (matRef.current) {
      const c = new THREE.Color(NODE_COL[status] || NODE_COL.default)
      matRef.current.color.lerp(c, 0.1)
      matRef.current.emissive.lerp(c.multiplyScalar(0.35), 0.1)
    }
  })

  const color = NODE_COL[status] || NODE_COL.default
  return (
    <group>
      <mesh ref={meshRef} position={position} castShadow>
        <sphereGeometry args={[0.48, 20, 20]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.65}
        />
      </mesh>
      <Text
        position={[position[0], position[1] + 0.02, position[2] + 0.5]}
        fontSize={0.34}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#00000099"
      >
        {String(id)}
      </Text>
    </group>
  )
}

function GraphScene({ graph, activeNode, visitedNodes }) {
  const getStatus = (n) => {
    if (n === activeNode)          return 'active'
    if (visitedNodes.includes(n))  return 'visited'
    return 'default'
  }

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5,10,5]} intensity={1.2} castShadow />
      <pointLight position={[-5,5,-5]} intensity={0.6} color="#7B61FF" />
      <pointLight position={[5,2,5]}  intensity={0.4} color="#F062D0" />

      {/* Edges */}
      {graph.edges.map(([u,v],i) => {
        const fromPos = NODE_POSITIONS[u] || [0,0,0]
        const toPos   = NODE_POSITIONS[v] || [0,0,0]
        const isActive = (u === activeNode || v === activeNode) &&
                         (visitedNodes.includes(u) || visitedNodes.includes(v))
        return (
          <Line
            key={i}
            points={[fromPos, toPos]}
            color={isActive ? '#F59E0B' : '#2E4A7A'}
            lineWidth={isActive ? 2.5 : 1.2}
          />
        )
      })}

      {/* Nodes */}
      {graph.nodes.map(n => (
        <GraphNode3D
          key={n}
          id={n}
          position={NODE_POSITIONS[n] || [0,0,0]}
          status={getStatus(n)}
        />
      ))}

      <OrbitControls enablePan={false} minDistance={5} maxDistance={22}
        dampingFactor={0.08} enableDamping />
    </>
  )
}

// ── 2D flat graph ─────────────────────────────────────────────────────────────
function Graph2D({ graph, activeNode, visitedNodes }) {
  const getColor = (n) => {
    if (n === activeNode)         return 'bg-[#F59E0B]/25 border-[#F59E0B]/70 text-[#FDE68A]'
    if (visitedNodes.includes(n)) return 'bg-[#059669]/20 border-[#059669]/50 text-[#6EE7B7]'
    return 'bg-[#1A3A7A]/20 border-[#1E3A8A]/40 text-[#93C5FD]'
  }
  return (
    <div className="p-4">
      <p className="text-xs text-[#64748B] mb-3 font-mono">Edges: {graph.edges.map(([u,v]) => `${u}↔${v}`).join('  ')}</p>
      <div className="flex flex-wrap gap-2">
        {graph.nodes.map(n => (
          <div key={n} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold font-mono transition-all duration-300 ${getColor(n)}`}>
            {n}
          </div>
        ))}
      </div>
    </div>
  )
}

const SPEED_MS = { slow: 1100, medium: 550, fast: 180 }

export function GraphViz({ initialGraph = DEFAULT_GRAPH }) {
  const [mode,     setMode]     = useState('bfs')
  const [viewMode, setViewMode] = useState('3d')
  const [speed,    setSpeed]    = useState('medium')
  const [playing,  setPlaying]  = useState(false)
  const [stepIdx,  setStepIdx]  = useState(-1)
  const [startNode, setStartNode] = useState(0)
  const [sound,    setSound]    = useState(true)
  const [log,      setLog]      = useState('Select traversal and press Play')
  const timerRef = useRef(null)

  const traversal = useMemo(
    () => mode === 'bfs' ? buildBFS(initialGraph, startNode) : buildDFS(initialGraph, startNode),
    [mode, startNode, initialGraph]
  )

  const activeNode   = stepIdx >= 0 ? traversal[stepIdx] : null
  const visitedNodes = traversal.slice(0, stepIdx)

  const stop = () => { clearInterval(timerRef.current); setPlaying(false) }

  const doStep = useCallback((idx) => {
    const n = traversal[idx]
    if (n === undefined) { stop(); setLog('✅ Graph traversal complete!'); return }
    setStepIdx(idx)
    setLog(`Visiting node [${n}] — step ${idx+1}/${traversal.length}`)
    if (sound) playTone(360 + n * 40 + idx * 8, 0.14, 'sine')
  }, [traversal, sound])

  const handlePlay = () => {
    if (playing) { stop(); return }
    setPlaying(true)
    let idx = stepIdx < 0 || stepIdx >= traversal.length - 1 ? 0 : stepIdx + 1
    doStep(idx)
    timerRef.current = setInterval(() => {
      idx++
      if (idx >= traversal.length) { stop(); setLog('✅ Graph traversal complete!'); return }
      doStep(idx)
    }, SPEED_MS[speed])
  }

  const handleStep = () => {
    stop()
    const next = stepIdx + 1
    if (next >= traversal.length) { setLog('✅ Complete. Reset to restart.'); return }
    doStep(next)
  }

  const handleReset = () => { stop(); setStepIdx(-1); setLog('Select traversal and press Play') }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Mode */}
        {['bfs','dfs'].map(m => (
          <button key={m} onClick={() => { handleReset(); setMode(m) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
              mode === m
                ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white'
                : 'bg-white/5 border border-white/10 text-[#64748B] hover:text-white'
            }`}>{m}</button>
        ))}

        {/* Start node picker */}
        <select
          value={startNode}
          onChange={e => { handleReset(); setStartNode(Number(e.target.value)) }}
          className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none"
        >
          {initialGraph.nodes.map(n => (
            <option key={n} value={n} className="bg-[#0A0F1E]">Start: {n}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button onClick={handlePlay} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-sm font-medium hover:opacity-90">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleStep} disabled={playing} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 disabled:opacity-40">
          <SkipForward className="w-4 h-4" /> Step
        </button>
        <button onClick={handleReset} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={() => setSound(s => !s)} className="px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
          {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#64748B]" />}
        </button>
        {['slow','medium','fast'].map(s => (
          <button key={s} onClick={() => setSpeed(s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              speed === s ? 'bg-[#7B61FF]/30 border border-[#7B61FF]/50 text-[#BFB4FF]' : 'bg-white/5 border border-white/10 text-[#64748B] hover:text-white'
            }`}>{s}</button>
        ))}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {['2d','3d'].map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === v ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white shadow' : 'text-[#64748B] hover:text-white'
              }`}>
              {v === '2d' ? <LayoutGrid className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-[#475569]">{stepIdx+1}/{traversal.length}</span>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border border-white/5"
           style={{ height: '400px', background: 'radial-gradient(ellipse at 50% 50%, #0D1F35 0%, #07111C 100%)' }}>
        {viewMode === '3d' ? (
          <Canvas shadows camera={{ position: [0, 3, 14], fov: 52 }} gl={{ antialias: true }}>
            <GraphScene graph={initialGraph} activeNode={activeNode} visitedNodes={visitedNodes} />
          </Canvas>
        ) : (
          <div className="w-full h-full overflow-auto">
            <Graph2D graph={initialGraph} activeNode={activeNode} visitedNodes={visitedNodes} />
          </div>
        )}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-[#64748B] pointer-events-none select-none whitespace-nowrap">
            🖱 Drag to orbit · Scroll to zoom
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {[{bg:'bg-[#1A3A7A]',label:'Unvisited'},{bg:'bg-[#F59E0B]',label:'Current'},{bg:'bg-[#059669]',label:'Visited'}].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.bg}`} /><span className="text-[#94A3B8]">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <ChevronRight className="w-3.5 h-3.5 text-[#7B61FF] flex-shrink-0" />
        <span className="text-xs font-mono text-[#94A3B8]">{log}</span>
      </div>
    </div>
  )
}
