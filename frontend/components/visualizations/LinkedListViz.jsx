/**
 * LinkedListViz — Interactive 3D Linked List visualizer
 * Nodes as 3D cubes connected by animated arrow beams
 * Insert-front, delete, reverse operations, 2D/3D toggle, traversal
 */

import { useState, useRef, useCallback, lazy, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Play, RotateCcw, LayoutGrid, Box, ChevronRight, PlusCircle, Trash2, GitBranch } from 'lucide-react'

// ── Sound ─────────────────────────────────────────────────────────────────────
let _actx = null
function beep(freq = 440, dur = 0.1, type = 'triangle') {
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)()
    const o = _actx.createOscillator(), g = _actx.createGain()
    o.connect(g); g.connect(_actx.destination)
    o.frequency.value = freq; o.type = type
    g.gain.setValueAtTime(0.12, _actx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, _actx.currentTime + dur)
    o.start(); o.stop(_actx.currentTime + dur)
  } catch(_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
const GAP    = 2.2
const CUBE_W = 1.1

// Status colours
const COL = {
  default:  '#1E40AF',
  active:   '#F59E0B',
  inserted: '#22C55E',
  removed:  '#EF4444',
  visited:  '#6B4FBF',
}

function LLNode3D({ value, index, totalCount, status, isHead, isNull }) {
  const meshRef = useRef()
  const matRef  = useRef()
  const curX    = useRef((index - (totalCount-1)/2) * GAP)
  const velX    = useRef(0)

  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.05)
    const targetX = (index - (totalCount-1)/2) * GAP
    const diff = targetX - curX.current
    const force = diff * 180 - velX.current * 16
    velX.current += force * dt
    curX.current += velX.current * dt
    if (meshRef.current) meshRef.current.position.x = curX.current

    const tS = (status === 'active' || status === 'inserted') ? 1.15 : 1.0
    const cs = meshRef.current?.scale.x ?? 1
    meshRef.current?.scale.setScalar(cs + (tS - cs) * 0.12)

    if (matRef.current) {
      const c = new THREE.Color(COL[status] ?? COL.default)
      matRef.current.color.lerp(c, 0.1)
      matRef.current.emissive.lerp(c.clone().multiplyScalar(0.35), 0.1)
    }
  })

  const x = (index - (totalCount-1)/2) * GAP
  const color = COL[status] ?? COL.default

  // NULL node (end sentinel)
  if (isNull) {
    return (
      <group position={[x, 0, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.3} color="#334155" anchorX="center" anchorY="middle">
          NULL
        </Text>
      </group>
    )
  }

  return (
    <group>
      <RoundedBox ref={meshRef} args={[CUBE_W, CUBE_W, CUBE_W]} radius={0.08} smoothness={4}
        position={[x, 0, 0]} castShadow>
        <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.25}
          roughness={0.25} metalness={0.65} />
      </RoundedBox>
      {/* value label */}
      <Text position={[x, 0.02, 0.57]} fontSize={0.32} color="#fff" anchorX="center" anchorY="middle"
        outlineWidth={0.015} outlineColor="#000000AA">{String(value)}</Text>
      {/* HEAD label */}
      {isHead && (
        <Text position={[x, 0.9, 0]} fontSize={0.2} color="#F59E0B" anchorX="center" anchorY="middle">
          HEAD
        </Text>
      )}
    </group>
  )
}

// Arrow connector between node i and i+1
function LLArrow({ fromIdx, toIdx, totalCount }) {
  const fromX  = (fromIdx - (totalCount-1)/2) * GAP + CUBE_W/2
  const toX    = (toIdx   - (totalCount-1)/2) * GAP - CUBE_W/2
  const midX   = (fromX + toX) / 2
  const pts    = [
    new THREE.Vector3(fromX, 0,    0),
    new THREE.Vector3(midX,  0.15, 0),
    new THREE.Vector3(toX,   0,    0),
  ]
  return (
    <group>
      <Line points={pts} color="#3B5BDB" lineWidth={1.6} />
      {/* arrowhead cone */}
      <mesh position={[toX + 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.22, 8]} />
        <meshStandardMaterial color="#3B5BDB" emissive="#1A2D7A" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function LinkedListScene({ nodes, activeIdx }) {
  const total = nodes.length + 1 // +1 for NULL node
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5,10,5]} intensity={1.2} castShadow />
      <pointLight position={[-5,5,-5]} intensity={0.6} color="#7B61FF" />
      <pointLight position={[5,2,5]}  intensity={0.4} color="#F062D0" />

      {/* Ground */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.9,0]} receiveShadow>
        <planeGeometry args={[40,20]} /><meshStandardMaterial color="#080E1A" roughness={0.95} />
      </mesh>

      {/* Nodes */}
      {nodes.map((n, i) => (
        <LLNode3D
          key={n.id}
          value={n.value}
          index={i}
          totalCount={total}
          status={i === activeIdx ? 'active' : n.status}
          isHead={i === 0}
        />
      ))}

      {/* NULL sentinel */}
      <LLNode3D
        key="null"
        value="NULL"
        index={nodes.length}
        totalCount={total}
        status="default"
        isNull
      />

      {/* Arrows */}
      {nodes.map((_, i) => (
        <LLArrow key={i} fromIdx={i} toIdx={i+1} totalCount={total} />
      ))}

      <OrbitControls enablePan={false} minDistance={4} maxDistance={22}
        minPolarAngle={0.2} maxPolarAngle={Math.PI/2.1} dampingFactor={0.08} enableDamping />
    </>
  )
}

// ── 2D flat view ──────────────────────────────────────────────────────────────
function LinkedList2D({ nodes, activeIdx }) {
  return (
    <div className="flex items-center justify-start gap-2 overflow-x-auto py-8 px-4 min-h-[200px]">
      {nodes.map((n, i) => {
        const isAct = i === activeIdx
        const bg = isAct ? 'bg-[#F59E0B]/25 border-[#F59E0B]/70 text-[#FDE68A]'
          : n.status === 'inserted' ? 'bg-[#22C55E]/20 border-[#22C55E]/50 text-[#86EFAC]'
          : n.status === 'removed'  ? 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#FCA5A5]'
          : 'bg-[#1E40AF]/20 border-[#1E40AF]/40 text-[#93C5FD]'
        return (
          <div key={n.id} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center">
              {i === 0 && <span className="text-[9px] text-[#F59E0B] font-mono mb-0.5">HEAD</span>}
              <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-sm font-bold font-mono transition-all duration-300 ${bg}`}>
                {n.value}
              </div>
            </div>
            <span className="text-[#3B5BDB] font-mono text-lg">→</span>
          </div>
        )
      })}
      <div className="text-[#334155] font-mono text-sm flex-shrink-0">NULL</div>
    </div>
  )
}

// ── State management ──────────────────────────────────────────────────────────
let _nid = 1
const mkNode = (v, status='default') => ({ id: `ll-${_nid++}`, value: v, status })

const INITIAL_NODES = [10, 20, 30, 40].map(v => mkNode(v))
const SPEED_MS = { slow: 900, medium: 450, fast: 150 }

export function LinkedListViz() {
  const [nodes,    setNodes]    = useState(INITIAL_NODES)
  const [input,    setInput]    = useState('')
  const [viewMode, setViewMode] = useState('3d')
  const [speed,    setSpeed]    = useState('medium')
  const [activeIdx, setActiveIdx] = useState(-1)
  const [log,      setLog]      = useState('Insert or traverse the linked list')
  const [busy,     setBusy]     = useState(false)
  const timerRef = useRef(null)

  const delay = (ms) => new Promise(r => setTimeout(r, ms))

  // Insert at front
  const handleInsertFront = useCallback(async () => {
    const val = input.trim(); if (!val || busy) return
    setBusy(true)
    const node = mkNode(val, 'inserted')
    setNodes(prev => [node, ...prev])
    setLog(`Inserted "${val}" at front`)
    beep(520, 0.13, 'triangle')
    await delay(SPEED_MS[speed] + 300)
    setNodes(prev => prev.map(n => n.id === node.id ? {...n, status: 'default'} : n))
    setInput('')
    setBusy(false)
  }, [input, busy, speed])

  // Insert at end
  const handleInsertEnd = useCallback(async () => {
    const val = input.trim(); if (!val || busy) return
    setBusy(true)
    const node = mkNode(val, 'inserted')
    setNodes(prev => [...prev, node])
    setLog(`Inserted "${val}" at end`)
    beep(440, 0.13, 'triangle')
    await delay(SPEED_MS[speed] + 300)
    setNodes(prev => prev.map(n => n.id === node.id ? {...n, status: 'default'} : n))
    setInput('')
    setBusy(false)
  }, [input, busy, speed])

  // Delete head
  const handleDeleteHead = useCallback(async () => {
    if (!nodes.length || busy) return
    setBusy(true)
    const headId = nodes[0].id
    setNodes(prev => prev.map(n => n.id === headId ? {...n, status: 'removed'} : n))
    setLog(`Deleted head "${nodes[0].value}"`)
    beep(220, 0.18, 'sawtooth')
    await delay(SPEED_MS[speed] + 400)
    setNodes(prev => prev.filter(n => n.id !== headId))
    setBusy(false)
  }, [nodes, busy, speed])

  // Traverse
  const handleTraverse = useCallback(async () => {
    if (busy) return; setBusy(true)
    setLog('Traversing...')
    for (let i = 0; i < nodes.length; i++) {
      setActiveIdx(i)
      setLog(`Visiting node [${i}]: value = ${nodes[i].value}`)
      beep(300 + i * 35, 0.1, 'sine')
      await delay(SPEED_MS[speed])
    }
    setActiveIdx(-1)
    setLog('✅ Traversal complete!')
    setBusy(false)
  }, [nodes, busy, speed])

  // Reverse
  const handleReverse = useCallback(async () => {
    if (busy) return; setBusy(true)
    setLog('Reversing list...')
    beep(600, 0.2, 'triangle')
    await delay(300)
    setNodes(prev => [...prev].reverse())
    await delay(500)
    setLog('✅ List reversed!')
    setBusy(false)
  }, [busy])

  const handleReset = () => {
    clearInterval(timerRef.current)
    setNodes(INITIAL_NODES.map(n => ({...n})))
    setActiveIdx(-1)
    setBusy(false)
    setLog('Insert or traverse the linked list')
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInsertFront()}
          maxLength={5} placeholder="Value…"
          className="w-24 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#475569] text-sm font-mono outline-none focus:border-[#7B61FF]/60 transition-all" />

        <button onClick={handleInsertFront} disabled={busy||!input.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40">
          <PlusCircle className="w-3.5 h-3.5" /> Front
        </button>
        <button onClick={handleInsertEnd} disabled={busy||!input.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40">
          <PlusCircle className="w-3.5 h-3.5" /> End
        </button>
        <button onClick={handleDeleteHead} disabled={busy||!nodes.length}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40">
          <Trash2 className="w-3.5 h-3.5" /> Del Head
        </button>
        <button onClick={handleTraverse} disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40">
          <Play className="w-3.5 h-3.5" /> Traverse
        </button>
        <button onClick={handleReverse} disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 disabled:opacity-40">
          <GitBranch className="w-3.5 h-3.5" /> Reverse
        </button>
        <button onClick={handleReset}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex-1" />
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
        <span className="text-xs font-mono text-[#475569]">n={nodes.length}</span>
      </div>

      {/* Viz area */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/5"
           style={{ height: '320px', background: 'radial-gradient(ellipse at 50% 60%, #0D1835 0%, #07111C 100%)' }}>
        {viewMode === '3d' ? (
          <Canvas shadows camera={{ position: [0, 3, 12], fov: 50 }} gl={{ antialias: true }}>
            <LinkedListScene nodes={nodes} activeIdx={activeIdx} />
          </Canvas>
        ) : (
          <div className="w-full h-full overflow-auto">
            <LinkedList2D nodes={nodes} activeIdx={activeIdx} />
          </div>
        )}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-[#64748B] pointer-events-none select-none whitespace-nowrap">
            🖱 Drag to orbit · Scroll to zoom
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <ChevronRight className="w-3.5 h-3.5 text-[#7B61FF] flex-shrink-0" />
        <span className="text-xs font-mono text-[#94A3B8]">{log}</span>
      </div>
    </div>
  )
}
