/**
 * QueueViz — Interactive 3D Queue visualizer (FIFO)
 *
 * 3D mode: cubes in a horizontal channel; enqueue enters from right, dequeue exits left
 * 2D mode: themed horizontal card row with FRONT/REAR markers
 * Operations: Enqueue, Dequeue, Peek, Reset
 * Sound, speed control, 2D/3D toggle
 */

import { useState, useRef, useCallback, useMemo, Suspense, lazy } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Box, Edges } from '@react-three/drei'
import * as THREE from 'three'
import {
  ArrowRightFromLine, ArrowLeftFromLine, Eye, RotateCcw,
  LayoutGrid, Box as BoxIcon, ChevronRight, Layers
} from 'lucide-react'

// ── Sound ─────────────────────────────────────────────────────────────────────
let _qctx = null
function qbeep(freq = 440, dur = 0.1, type = 'sine') {
  try {
    if (!_qctx) _qctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = _qctx.createOscillator(), g = _qctx.createGain()
    o.connect(g); g.connect(_qctx.destination)
    o.frequency.value = freq; o.type = type
    g.gain.setValueAtTime(0.12, _qctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, _qctx.currentTime + dur)
    o.start(); o.stop(_qctx.currentTime + dur)
  } catch (_) {}
}

// ── Layout constants ──────────────────────────────────────────────────────────
const CUBE_SZ  = 1.0
const Q_GAP    = 1.45   // horizontal spacing between cubes
const CHANNEL_H = 1.3
const CHANNEL_D = 1.3

// ── Status colours ────────────────────────────────────────────────────────────
const Q_COL = {
  default:  { color: '#1D4ED8', emissive: '#0D2464', ei: 0.18 },
  inserted: { color: '#22C55E', emissive: '#0B5E2A', ei: 0.5  },
  removed:  { color: '#EF4444', emissive: '#5C1111', ei: 0.5  },
  active:   { color: '#F5C518', emissive: '#6B5000', ei: 0.5  },
  peek:     { color: '#A78BFA', emissive: '#3B1F8A', ei: 0.5  },
}

// ── Single 3D queue cube ──────────────────────────────────────────────────────
function QueueCube({ value, rank, totalVisible, status, floatOffset }) {
  const groupRef = useRef()
  const matRef  = useRef()
  const curX    = useRef(null)
  const velX    = useRef(0)

  const targetX = (rank - (totalVisible - 1) / 2) * Q_GAP

  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.05)
    if (curX.current === null) curX.current = targetX

    const diff = targetX - curX.current
    const force = diff * 220 - velX.current * 18
    velX.current += force * dt
    curX.current += velX.current * dt

    const t = clock.getElapsedTime()
    const floatY = Math.sin(t * 1.2 + floatOffset) * 0.04

    if (groupRef.current) {
      groupRef.current.position.x = curX.current
      groupRef.current.position.y = floatY
      
      const tS = (status === 'inserted' || status === 'active' || status === 'peek') ? 1.1 : 1.0
      const cs = groupRef.current.scale.x
      groupRef.current.scale.setScalar(cs + (tS - cs) * 0.12)
    }

    if (matRef.current) {
      const p = Q_COL[status] ?? Q_COL.default
      matRef.current.color.lerp(new THREE.Color(p.color), 0.1)
      matRef.current.emissive.lerp(new THREE.Color(p.emissive), 0.1)
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(matRef.current.emissiveIntensity, p.ei, 0.1)
    }
  })

  const p = Q_COL[status] ?? Q_COL.default

  return (
    <group ref={groupRef} position={[targetX, 0, 0]}>
      <RoundedBox args={[CUBE_SZ, CUBE_SZ, CUBE_SZ]} radius={0.08} smoothness={4} castShadow>
        <meshStandardMaterial ref={matRef} color={p.color} emissive={p.emissive}
          emissiveIntensity={p.ei} roughness={0.25} metalness={0.65} />
      </RoundedBox>
      {/* Top face text */}
      <Text position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.3} color="#FFFFFF"
        anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#000000AA">
        {String(value)}
      </Text>
      {/* Front face text */}
      <Text position={[0, 0, 0.51]} fontSize={0.3} color="#FFFFFF"
        anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#000000AA">
        {String(value)}
      </Text>
    </group>
  )
}

// ── FRONT / REAR label arrows ─────────────────────────────────────────────────
function QueuePointer({ x, label, color, side = 'front' }) {
  const ref = useRef()
  const curX = useRef(x)

  useFrame(({ clock }, dt) => {
    curX.current = THREE.MathUtils.lerp(curX.current, x, 1 - Math.pow(0.01, dt))
    if (ref.current) {
      ref.current.position.x = curX.current
      ref.current.position.y = -1.2 + Math.sin(clock.getElapsedTime() * 2.5 + (side === 'front' ? 0 : Math.PI)) * 0.04
    }
  })

  const dir = side === 'front' ? 1 : -1  // cone points toward the queue

  return (
    <group ref={ref} position={[x, -1.2, 0]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.1, 0.22, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, -0.06, 0]} fontSize={0.22} color={color} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

// ── Horizontal channel frame ──────────────────────────────────────────────────
function QueueChannel({ count }) {
  const w = Math.max(2, count) * Q_GAP + 0.5
  return (
    <Box args={[w, CHANNEL_H, CHANNEL_D]}>
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      <Edges color="#7B61FF" linewidth={1.6} threshold={1} />
    </Box>
  )
}

// ── 3D Scene ──────────────────────────────────────────────────────────────────
function QueueScene({ items }) {
  const floatOffsets = useMemo(() => {
    const map = {}
    items.forEach(({ id }) => { if (!(id in map)) map[id] = Math.random() * Math.PI * 2 })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = items.filter(it => it.status !== 'removed')
  const n = visible.length

  // front = leftmost (rank 0), rear = rightmost
  const frontX = n > 0 ? (0 - (n - 1) / 2) * Q_GAP : 0
  const rearX  = n > 0 ? ((n - 1) - (n - 1) / 2) * Q_GAP : 0

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.3} castShadow />
      <pointLight position={[-5, 5, -4]} intensity={0.7} color="#7B61FF" />
      <pointLight position={[5, 2, 4]}  intensity={0.4} color="#F062D0" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[50, 20]} />
        <meshStandardMaterial color="#080E1A" roughness={0.95} />
      </mesh>

      {/* Channel frame */}
      <QueueChannel count={n} />

      {/* Empty label */}
      {items.length === 0 && (
        <Text position={[0, 0, 0]} fontSize={0.28} color="#334155" anchorX="center" anchorY="middle">
          QUEUE EMPTY
        </Text>
      )}

      {/* Cubes */}
      {items.map(item => {
        const rank = visible.findIndex(it => it.id === item.id)
        return (
          <QueueCube
            key={item.id}
            value={item.value}
            rank={rank >= 0 ? rank : n}   // fading-out items go off-screen right
            totalVisible={n}
            status={item.status}
            floatOffset={floatOffsets[item.id] ?? 0}
          />
        )
      })}

      {/* FRONT / REAR pointers */}
      {n > 0 && (
        <>
          <QueuePointer x={frontX} label="FRONT" color="#22C55E" side="front" />
          <QueuePointer x={rearX}  label="REAR"  color="#F59E0B" side="rear"  />
        </>
      )}

      <OrbitControls enablePan={false} minDistance={5} maxDistance={25}
        minPolarAngle={0.15} maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.08} enableDamping />
    </>
  )
}

// ── 2D themed view ────────────────────────────────────────────────────────────
function Queue2D({ items }) {
  const visible = items.filter(it => it.status !== 'removed')

  const statusStyle = {
    default:  { box: 'bg-[#1D4ED8]/20 border-[#1D4ED8]/40 text-[#93C5FD]', dot: 'bg-[#1D4ED8]' },
    inserted: { box: 'bg-[#22C55E]/20 border-[#22C55E]/60 text-[#86EFAC] shadow-green-500/20 shadow-lg', dot: 'bg-[#22C55E]' },
    removed:  { box: 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#FCA5A5] shadow-red-500/20 shadow-lg',   dot: 'bg-[#EF4444]' },
    active:   { box: 'bg-[#F5C518]/20 border-[#F5C518]/60 text-[#FDE68A] shadow-yellow-400/20 shadow-lg', dot: 'bg-[#F5C518]' },
    peek:     { box: 'bg-[#A78BFA]/20 border-[#A78BFA]/60 text-[#DDD6FE] shadow-violet-400/20 shadow-lg', dot: 'bg-[#A78BFA]' },
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-[#334155] text-sm gap-2">
        <Layers className="w-8 h-8 opacity-30" />
        <span>Queue is empty</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6 min-h-[220px] justify-center">
      {/* Direction label */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-[#475569]">
        <span className="text-[#22C55E] font-bold">DEQUEUE ←</span>
        <span className="flex-1 h-px bg-white/10 w-20" />
        <span className="text-[#F59E0B] font-bold">→ ENQUEUE</span>
      </div>

      {/* Queue row */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* FRONT label */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-[10px] font-mono text-[#22C55E] font-bold">FRONT</span>
          <span className="text-[#22C55E]">▼</span>
        </div>

        {visible.map((item, i) => {
          const st = statusStyle[item.status] || statusStyle.default
          const isFront = i === 0
          const isRear  = i === visible.length - 1
          return (
            <div key={item.id} className="flex items-center gap-1 flex-shrink-0">
              <div className={`
                relative flex items-center justify-between px-3 py-2.5 w-14 flex-col
                rounded-xl border-2 transition-all duration-300 ${st.box}
                ${isFront || isRear ? 'scale-105 origin-center' : ''}
              `}>
                <div className={`w-1.5 h-1.5 rounded-full ${st.dot} mb-1`} />
                <span className="font-mono font-bold text-sm">{item.value}</span>
                <span className="text-[9px] opacity-40 mt-1">[{i}]</span>
              </div>
              {i < visible.length - 1 && (
                <span className="text-[#334155] text-lg font-mono">→</span>
              )}
            </div>
          )
        })}

        {/* REAR label */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-[10px] font-mono text-[#F59E0B] font-bold">REAR</span>
          <span className="text-[#F59E0B]">▼</span>
        </div>
      </div>

      {/* Size indicator */}
      <div className="text-xs font-mono text-[#475569]">
        Size: <span className="text-white font-bold">{visible.length}</span>
      </div>
    </div>
  )
}

// ── State management ──────────────────────────────────────────────────────────
let _qid = 1
const mkQItem = (v, status = 'default') => ({ id: `q-${_qid++}`, value: v, status })
const INITIAL_Q = [10, 20, 30].map(v => mkQItem(v))
const SPEED_MS  = { slow: 900, medium: 450, fast: 150 }

export function QueueViz({ maxSize = 8 }) {
  const [items,    setItems]    = useState(INITIAL_Q)
  const [input,    setInput]    = useState('')
  const [viewMode, setViewMode] = useState('3d')
  const [speed,    setSpeed]    = useState('medium')
  const [log,      setLog]      = useState('Enqueue a value to add to the rear')
  const [busy,     setBusy]     = useState(false)
  const timerRef = useRef(null)

  const delay = ms => new Promise(r => setTimeout(r, ms))
  const visible = items.filter(it => it.status !== 'removed')

  // ── ENQUEUE ─────────────────────────────────────────────────────────────────
  const handleEnqueue = useCallback(async () => {
    const val = input.trim()
    if (!val || busy) return
    if (visible.length >= maxSize) { setLog(`❌ Queue full (max ${maxSize})`); return }
    setBusy(true)
    const item = mkQItem(val, 'inserted')
    setItems(prev => [...prev, item])
    setLog(`Enqueued "${val}" at REAR — size: ${visible.length + 1}`)
    qbeep(520, 0.13, 'triangle')
    await delay(SPEED_MS[speed] + 200)
    setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'default' } : it))
    setInput('')
    setBusy(false)
  }, [input, busy, visible.length, maxSize, speed])

  // ── DEQUEUE ─────────────────────────────────────────────────────────────────
  const handleDequeue = useCallback(async () => {
    if (!visible.length || busy) return
    setBusy(true)
    const front = visible[0]
    setItems(prev => prev.map(it => it.id === front.id ? { ...it, status: 'active' } : it))
    await delay(SPEED_MS[speed])
    setItems(prev => prev.map(it => it.id === front.id ? { ...it, status: 'removed' } : it))
    setLog(`Dequeued "${front.value}" from FRONT — size: ${visible.length - 1}`)
    qbeep(220, 0.18, 'sawtooth')
    await delay(SPEED_MS[speed] + 300)
    setItems(prev => prev.filter(it => it.id !== front.id))
    setBusy(false)
  }, [visible, busy, speed])

  // ── PEEK ────────────────────────────────────────────────────────────────────
  const handlePeek = useCallback(async () => {
    if (!visible.length || busy) return
    setBusy(true)
    const front = visible[0]
    setItems(prev => prev.map(it => it.id === front.id ? { ...it, status: 'peek' } : it))
    setLog(`Peek → FRONT is "${front.value}"`)
    qbeep(680, 0.12, 'triangle')
    await delay(SPEED_MS[speed] + 600)
    setItems(prev => prev.map(it => it.id === front.id ? { ...it, status: 'default' } : it))
    setBusy(false)
  }, [visible, busy, speed])

  const handleReset = () => {
    clearTimeout(timerRef.current); setBusy(false)
    setItems(INITIAL_Q.map(n => ({ ...n })))
    setLog('Enqueue a value to add to the rear')
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEnqueue()}
          maxLength={5} placeholder="Value…"
          className="w-24 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#475569] text-sm font-mono outline-none focus:border-[#7B61FF]/60 transition-all" />

        <button onClick={handleEnqueue} disabled={busy || !input.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40">
          <ArrowRightFromLine className="w-4 h-4" /> Enqueue
        </button>
        <button onClick={handleDequeue} disabled={busy || !visible.length}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40">
          <ArrowLeftFromLine className="w-4 h-4" /> Dequeue
        </button>
        <button onClick={handlePeek} disabled={busy || !visible.length}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A78BFA] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40">
          <Eye className="w-4 h-4" /> Peek
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10">
          <RotateCcw className="w-4 h-4" /> Reset
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
              {v === '2d' ? <LayoutGrid className="w-3.5 h-3.5" /> : <BoxIcon className="w-3.5 h-3.5" />}
              {v.toUpperCase()}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-[#475569]">{visible.length}/{maxSize}</span>
      </div>

      {/* Viz area */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/5"
           style={{ height: '340px', background: 'radial-gradient(ellipse at 50% 60%, #0D1835 0%, #07111C 100%)' }}>
        {viewMode === '3d' ? (
          <Canvas shadows camera={{ position: [0, 3.5, 11], fov: 50 }} gl={{ antialias: true }}>
            <QueueScene items={items} />
          </Canvas>
        ) : (
          <div className="w-full h-full overflow-auto flex items-center justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Queue2D items={items} />
          </div>
        )}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-[#64748B] pointer-events-none select-none whitespace-nowrap">
            🖱 Drag to orbit · Scroll to zoom
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { bg: 'bg-[#1D4ED8]', label: 'Default'  },
          { bg: 'bg-[#22C55E]', label: 'Enqueued / FRONT' },
          { bg: 'bg-[#F59E0B]', label: 'REAR'     },
          { bg: 'bg-[#A78BFA]', label: 'Peek'     },
          { bg: 'bg-[#EF4444]', label: 'Dequeued' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded ${l.bg}`} />
            <span className="text-[#94A3B8]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Log */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <ChevronRight className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
        <span className="text-xs font-mono text-[#94A3B8]">{log}</span>
      </div>
    </div>
  )
}
