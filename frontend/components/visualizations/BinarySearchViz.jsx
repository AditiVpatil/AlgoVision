/**
 * BinarySearchViz — Interactive Binary Search visualizer
 *
 * 3D mode: horizontal 3D cubes with animated LEFT / MID / RIGHT pointer arrows
 * 2D mode: themed card row matching stack/queue UI style
 * Supports: step-by-step, auto-play, sound effects
 */

import { useState, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  Play, Pause, SkipForward, RotateCcw,
  Volume2, VolumeX, LayoutGrid, Box, ChevronRight
} from 'lucide-react'

const DEFAULT_ARR = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
const DEFAULT_TGT = 23

// ── Step builder ──────────────────────────────────────────────────────────────
function buildSteps(arr, target) {
  const steps = []
  let left = 0, right = arr.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    steps.push({ left, right, mid, found: arr[mid] === target, target })
    if (arr[mid] === target) break
    if (arr[mid] < target) left = mid + 1
    else right = mid - 1
  }
  if (steps.length === 0 || !steps[steps.length - 1].found) {
    steps.push({ left, right: right, mid: -1, notFound: true, target })
  }
  return steps
}

// ── Sound ─────────────────────────────────────────────────────────────────────
let _bsctx = null
function tone(freq, dur = 0.1, type = 'sine') {
  try {
    if (!_bsctx) _bsctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = _bsctx.createOscillator(), g = _bsctx.createGain()
    o.connect(g); g.connect(_bsctx.destination)
    o.frequency.value = freq; o.type = type
    g.gain.setValueAtTime(0.12, _bsctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, _bsctx.currentTime + dur)
    o.start(); o.stop(_bsctx.currentTime + dur)
  } catch (_) {}
}

// ── Colours ───────────────────────────────────────────────────────────────────
const CUBE_COL = {
  default:     { color: '#2563EB', emissive: '#0F2D7A', ei: 0.18 },
  mid:         { color: '#F5C518', emissive: '#6B5000', ei: 0.55 },
  found:       { color: '#22C55E', emissive: '#0B4D26', ei: 0.45 },
  eliminated:  { color: '#64748B', emissive: '#334155', ei: 0.15 },
  inRange:     { color: '#3B5BDB', emissive: '#1A2A7A', ei: 0.22 },
}

// ── Single 3D cube ────────────────────────────────────────────────────────────
const GAP = 1.55
function BsCube({ value, index, totalCount, colorKey }) {
  const meshRef = useRef()
  const matRef  = useRef()

  const x = (index - (totalCount - 1) / 2) * GAP

  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.05)
    const t  = clock.getElapsedTime()
    const isActive = colorKey === 'mid' || colorKey === 'found'
    const floatY = Math.sin(t * 1.1 + index * 0.7) * (isActive ? 0.06 : 0.025)
    if (meshRef.current) meshRef.current.position.y = floatY

    const tS = isActive ? 1.12 : 1.0
    const cs = meshRef.current?.scale.x ?? 1
    meshRef.current?.scale.setScalar(cs + (tS - cs) * 0.1)

    if (matRef.current) {
      const p = CUBE_COL[colorKey] ?? CUBE_COL.default
      matRef.current.color.lerp(new THREE.Color(p.color), 0.1)
      matRef.current.emissive.lerp(new THREE.Color(p.emissive), 0.1)
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity, p.ei, 0.1
      )
    }
  })

  const p = CUBE_COL[colorKey] ?? CUBE_COL.default

  return (
    <group position={[x, 0, 0]}>
      <RoundedBox ref={meshRef} args={[1.1, 1.1, 1.1]} radius={0.08} smoothness={4} castShadow>
        <meshStandardMaterial ref={matRef} color={p.color} emissive={p.emissive}
          emissiveIntensity={p.ei} roughness={0.25} metalness={0.65} />
      </RoundedBox>

      {/* Value label top face */}
      <Text position={[0, 0.62, 0.01]} rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.30} color="#ffffff" anchorX="center" anchorY="middle"
        outlineWidth={0.012} outlineColor="#000000AA">
        {value}
      </Text>

      {/* Index label below */}
      <Text position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.18} color="#475569" anchorX="center" anchorY="middle">
        [{index}]
      </Text>
    </group>
  )
}

// ── Pointer arrow (Left / Mid / Right) ───────────────────────────────────────
function BsPointer({ index, totalCount, label, color, yOffset = -1.2 }) {
  const ref     = useRef()
  const targetX = useRef((index - (totalCount - 1) / 2) * GAP)

  useFrame(({ clock }, dt) => {
    const newX = (index - (totalCount - 1) / 2) * GAP
    targetX.current = newX
    if (ref.current) {
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, newX, 1 - Math.pow(0.01, dt))
      ref.current.position.y = yOffset + Math.sin(clock.getElapsedTime() * 2.5 + index) * 0.04
    }
  })

  if (index < 0) return null
  const x = (index - (totalCount - 1) / 2) * GAP

  return (
    <group ref={ref} position={[x, yOffset, 0]}>
      {/* Stem */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.36, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {/* Cone tip pointing up */}
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.1, 0.22, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {/* Label */}
      <Text position={[0, -0.04, 0]} fontSize={0.22} color={color} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

// ── Full 3D scene ─────────────────────────────────────────────────────────────
function BsScene({ arr, step }) {
  const n    = arr.length
  const left = step?.left ?? 0
  const right = step?.right ?? n - 1
  const mid  = step?.mid ?? -1

  const getKey = (i) => {
    if (step?.found && i === mid)   return 'found'
    if (i === mid)                   return 'mid'
    if (i < left || i > right)       return 'eliminated'
    return 'inRange'
  }

  const totalWidth = (n - 1) * GAP
  const camZ = Math.max(12, totalWidth * 0.7 + 8)

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5,10,5]} intensity={1.3} castShadow />
      <pointLight position={[-5,5,-4]} intensity={0.7} color="#7B61FF" />
      <pointLight position={[5,2,4]}  intensity={0.4} color="#F062D0" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial color="#080E1A" roughness={0.95} />
      </mesh>

      {/* Cubes */}
      {arr.map((val, i) => (
        <BsCube key={i} value={val} index={i} totalCount={n} colorKey={getKey(i)} />
      ))}

      {/* Pointer arrows */}
      {!step?.notFound && (
        <>
          <BsPointer index={left}  totalCount={n} label="L" color="#3B82F6" yOffset={-1.3} />
          <BsPointer index={right} totalCount={n} label="R" color="#3B82F6" yOffset={-1.3} />
          {mid >= 0 && (
            <BsPointer index={mid} totalCount={n}
              label={step?.found ? '✓' : 'M'}
              color={step?.found ? '#22C55E' : '#F062D0'}
              yOffset={-1.6}
            />
          )}
        </>
      )}

      <OrbitControls enablePan={false} minDistance={6} maxDistance={30}
        minPolarAngle={0.1} maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.08} enableDamping />
    </>
  )
}

// ── 2D themed view ────────────────────────────────────────────────────────────
function BsView2D({ arr, step }) {
  const left  = step?.left  ?? 0
  const right = step?.right ?? arr.length - 1
  const mid   = step?.mid   ?? -1

  const getStyle = (i) => {
    if (step?.found && i === mid)
      return { box: 'bg-[#22C55E]/20 border-[#22C55E]/70 text-[#86EFAC] shadow-green-500/25 shadow-lg scale-110', label: '✓' }
    if (i === mid)
      return { box: 'bg-[#F062D0]/20 border-[#F062D0]/70 text-[#FDA4D8] shadow-pink-500/25 shadow-lg scale-110', label: 'M' }
    if (i < left || i > right)
      return { box: 'bg-[#0F172A]/60 border-white/5 text-[#334155]', label: '' }
    if (i === left || i === right)
      return { box: 'bg-[#3B5BDB]/20 border-[#3B5BDB]/60 text-[#93C5FD]', label: i === left ? 'L' : 'R' }
    return { box: 'bg-[#1E3A8A]/20 border-[#1E3A8A]/40 text-[#93C5FD]', label: '' }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6 overflow-x-auto">
      {/* Pointer labels row */}
      <div className="flex gap-1.5 flex-wrap items-end justify-center">
        {arr.map((_, i) => {
          const isL = i === left, isR = i === right, isM = i === mid
          return (
            <div key={i} className="flex flex-col items-center" style={{ width: '44px' }}>
              {(isL || isR || isM) && (
                <span className={`text-[10px] font-mono font-bold mb-0.5 ${
                  isM ? (step?.found ? 'text-[#22C55E]' : 'text-[#F062D0]') : 'text-[#3B82F6]'
                }`}>
                  {isM ? (step?.found ? '✓' : 'MID') : isL ? 'L' : 'R'}
                </span>
              )}
              {!isL && !isR && !isM && <div className="h-4" />}
            </div>
          )
        })}
      </div>

      {/* Array cells */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {arr.map((val, i) => {
          const { box } = getStyle(i)
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-sm font-bold font-mono transition-all duration-400 ${box}`}>
                {val}
              </div>
              <span className="text-[9px] text-[#334155] font-mono">[{i}]</span>
            </div>
          )
        })}
      </div>

      {/* Range bar */}
      <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
        <span className="text-[#3B82F6]">L={left}</span>
        <span>·</span>
        <span className="text-[#F062D0]">M={mid >= 0 ? mid : '—'}</span>
        <span>·</span>
        <span className="text-[#3B82F6]">R={right}</span>
        {step?.found && <span className="text-[#22C55E] font-bold ml-2">TARGET FOUND ✓</span>}
        {step?.notFound && <span className="text-[#EF4444] font-bold ml-2">NOT FOUND ✗</span>}
      </div>
    </div>
  )
}

// ── Speed ─────────────────────────────────────────────────────────────────────
const SPEED_MS = { slow: 1400, medium: 700, fast: 250 }

// ── Main component ────────────────────────────────────────────────────────────
export function BinarySearchViz({
  initialArray = DEFAULT_ARR,
  target       = DEFAULT_TGT,
}) {
  const arr   = useMemo(() => initialArray, [initialArray])
  const steps = useMemo(() => buildSteps(arr, target), [arr, target])

  const [viewMode, setViewMode] = useState('3d')
  const [speed,    setSpeed]    = useState('medium')
  const [stepIdx,  setStepIdx]  = useState(0)
  const [playing,  setPlaying]  = useState(false)
  const [sound,    setSound]    = useState(true)
  const [log,      setLog]      = useState(`Searching for target: ${target}`)
  const timerRef = useRef(null)

  const curStep = steps[Math.min(stepIdx, steps.length - 1)]

  const stop = () => { clearInterval(timerRef.current); setPlaying(false) }

  const applyStep = useCallback((idx) => {
    const s = steps[idx]
    if (!s) return
    setStepIdx(idx)
    if (s.found) {
      setLog(`🎯 FOUND! Target ${target} at index [${s.mid}] — arr[${s.mid}] = ${arr[s.mid]}`)
      if (sound) tone(880, 0.3, 'sine')
    } else if (s.notFound) {
      setLog(`❌ Target ${target} not found — search space exhausted`)
      if (sound) tone(150, 0.3, 'sawtooth')
    } else {
      const dir = arr[s.mid] < target ? 'right half' : 'left half'
      setLog(`Step ${idx+1}: mid=${s.mid} → arr[${s.mid}]=${arr[s.mid]} ${arr[s.mid] < target ? '<' : '>'} ${target} → search ${dir}`)
      if (sound) tone(300 + (arr[s.mid] / 100) * 400, 0.1, 'triangle')
    }
  }, [steps, arr, target, sound])

  const handlePlay = () => {
    if (playing) { stop(); return }
    const startIdx = stepIdx >= steps.length - 1 ? 0 : stepIdx + 1
    setPlaying(true)
    let idx = startIdx
    applyStep(idx)
    timerRef.current = setInterval(() => {
      idx++
      if (idx >= steps.length) { stop(); return }
      applyStep(idx)
      const s = steps[idx]
      if (s?.found || s?.notFound) { setTimeout(stop, 500) }
    }, SPEED_MS[speed])
  }

  const handleStep = () => {
    stop()
    const next = stepIdx + 1
    if (next >= steps.length) return
    applyStep(next)
  }

  const handleReset = () => {
    stop()
    setStepIdx(0)
    setLog(`Searching for target: ${target}`)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Target display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-[#64748B]">Target:</span>
          <span className="text-sm font-bold font-mono text-[#F062D0]">{target}</span>
        </div>

        <div className="flex-1" />

        <button onClick={handlePlay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-sm font-medium hover:opacity-90">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleStep} disabled={playing || stepIdx >= steps.length - 1}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 disabled:opacity-40">
          <SkipForward className="w-4 h-4" /> Step
        </button>
        <button onClick={handleReset}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={() => setSound(s => !s)}
          className="px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
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
        <span className="text-xs font-mono text-[#475569]">{stepIdx + 1}/{steps.length}</span>
      </div>

      {/* Viz area */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/5"
           style={{ height: '340px', background: 'radial-gradient(ellipse at 50% 60%, #0D1835 0%, #07111C 100%)' }}>
        {viewMode === '3d' ? (
          <Canvas shadows camera={{ position: [0, 3, 16], fov: 50 }} gl={{ antialias: true }}>
            <BsScene arr={arr} step={curStep} />
          </Canvas>
        ) : (
          <div className="w-full h-full overflow-auto flex items-center justify-center">
            <BsView2D arr={arr} step={curStep} />
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
          { bg: 'bg-[#1E3A8A]',  label: 'Search Range' },
          { bg: 'bg-[#3B5BDB]',  label: 'In Range'     },
          { bg: 'bg-[#F062D0]',  label: 'Mid'          },
          { bg: 'bg-[#22C55E]',  label: 'Found!'       },
          { bg: 'bg-[#1E293B]',  label: 'Eliminated'   },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded ${l.bg}`} />
            <span className="text-[#94A3B8]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Log */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <ChevronRight className="w-3.5 h-3.5 text-[#7B61FF] flex-shrink-0" />
        <span className="text-xs font-mono text-[#94A3B8]">{log}</span>
      </div>
    </div>
  )
}
