/**
 * SortingViz3D — Interactive 3D Sorting visualizer
 * 3D bars (cylinders) that animate sorting steps with sounds
 * Supports: Bubble Sort, Selection Sort, Insertion Sort
 * 2D/3D toggle, speed control, swap highlighting
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { Play, Pause, RotateCcw, LayoutGrid, Box, ChevronRight, Shuffle } from 'lucide-react'

const DEFAULT_ARR = [64, 34, 25, 12, 78, 11, 45, 90, 22, 38]

// ── Sort step generators ──────────────────────────────────────────────────────
function bubbleSortSteps(arr) {
  const a = [...arr], steps = []
  const n = a.length
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ type: 'compare', i: j, j: j+1, arr: [...a] })
      if (a[j] > a[j+1]) {
        ;[a[j], a[j+1]] = [a[j+1], a[j]]
        steps.push({ type: 'swap', i: j, j: j+1, arr: [...a] })
      }
    }
    steps.push({ type: 'sorted', sorted: n-1-i, arr: [...a] })
  }
  steps.push({ type: 'done', arr: [...a] })
  return steps
}

function selectionSortSteps(arr) {
  const a = [...arr], steps = []
  const n = a.length
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    for (let j = i+1; j < n; j++) {
      steps.push({ type: 'compare', i: minIdx, j, arr: [...a] })
      if (a[j] < a[minIdx]) minIdx = j
    }
    if (minIdx !== i) {
      ;[a[i], a[minIdx]] = [a[minIdx], a[i]]
      steps.push({ type: 'swap', i, j: minIdx, arr: [...a] })
    }
    steps.push({ type: 'sorted', sorted: i, arr: [...a] })
  }
  steps.push({ type: 'done', arr: [...a] })
  return steps
}

function insertionSortSteps(arr) {
  const a = [...arr], steps = []
  for (let i = 1; i < a.length; i++) {
    let j = i
    while (j > 0 && a[j-1] > a[j]) {
      steps.push({ type: 'compare', i: j-1, j, arr: [...a] })
      ;[a[j-1], a[j]] = [a[j], a[j-1]]
      steps.push({ type: 'swap', i: j-1, j, arr: [...a] })
      j--
    }
  }
  steps.push({ type: 'done', arr: [...a] })
  return steps
}

// ── Sounds ────────────────────────────────────────────────────────────────────
let _sctx = null
function blip(freq, dur=0.08, type='sine') {
  try {
    if (!_sctx) _sctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = _sctx.createOscillator(), g = _sctx.createGain()
    o.connect(g); g.connect(_sctx.destination)
    o.frequency.value = freq; o.type = type
    g.gain.setValueAtTime(0.1, _sctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, _sctx.currentTime + dur)
    o.start(); o.stop(_sctx.currentTime + dur)
  } catch(_) {}
}

// ── 3D Bar ────────────────────────────────────────────────────────────────────
const MAX_VAL = 100
const BAR_W   = 0.7
const GAP     = 0.9
const MAX_H   = 6

function SortBar({ value, index, totalCount, status }) {
  const meshRef = useRef()
  const matRef  = useRef()
  const curH    = useRef((value / MAX_VAL) * MAX_H)
  const curX    = useRef((index - (totalCount-1)/2) * GAP)
  const velH    = useRef(0)
  const velX    = useRef(0)

  const targetH = (value / MAX_VAL) * MAX_H
  const targetX = (index - (totalCount-1)/2) * GAP

  const COLORS = {
    default:  '#2563EB',
    compare:  '#F59E0B',
    swap:     '#EF4444',
    sorted:   '#22C55E',
    pivot:    '#A78BFA',
  }

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)

    const dH = targetH - curH.current
    const fH = dH * 200 - velH.current * 18
    velH.current += fH * dt; curH.current += velH.current * dt

    const dX = targetX - curX.current
    const fX = dX * 200 - velX.current * 18
    velX.current += fX * dt; curX.current += velX.current * dt

    if (meshRef.current) {
      meshRef.current.scale.y = curH.current / targetH
      meshRef.current.position.x = curX.current
      meshRef.current.position.y = curH.current / 2 - 0.05
    }

    if (matRef.current) {
      const c = new THREE.Color(COLORS[status] ?? COLORS.default)
      matRef.current.color.lerp(c, 0.12)
      matRef.current.emissive.lerp(c.clone().multiplyScalar(0.3), 0.12)
    }
  })

  const color = COLORS[status] ?? COLORS.default
  const h     = (value / MAX_VAL) * MAX_H

  return (
    <group>
      <mesh ref={meshRef} position={[targetX, h/2, 0]} castShadow>
        <boxGeometry args={[BAR_W, h, BAR_W]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color}
          emissiveIntensity={0.25} roughness={0.3} metalness={0.55} />
      </mesh>
      {/* value label above */}
      <Text position={[targetX, h + 0.4, 0]} fontSize={0.22} color="#94A3B8"
        anchorX="center" anchorY="middle">{value}</Text>
    </group>
  )
}

function SortScene({ arr, compareIdx, swapIdx, sortedIdx }) {
  const getStatus = (i) => {
    if (sortedIdx.includes(i)) return 'sorted'
    if (swapIdx.includes(i))   return 'swap'
    if (compareIdx.includes(i)) return 'compare'
    return 'default'
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3,10,5]} intensity={1.3} castShadow />
      <pointLight position={[-6,5,-4]} intensity={0.7} color="#7B61FF" />
      <pointLight position={[6,2,4]}  intensity={0.5} color="#F062D0" />

      {/* Ground */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
        <planeGeometry args={[40,20]} /><meshStandardMaterial color="#080E1A" roughness={0.95} />
      </mesh>

      {arr.map((val, i) => (
        <SortBar key={i} value={val} index={i} totalCount={arr.length} status={getStatus(i)} />
      ))}

      <OrbitControls enablePan={false} minDistance={6} maxDistance={26}
        minPolarAngle={0} maxPolarAngle={Math.PI/2.2} dampingFactor={0.08} enableDamping />
    </>
  )
}

function Sort2D({ arr, compareIdx, swapIdx, sortedIdx }) {
  const maxVal = Math.max(...arr, 1)
  return (
    <div className="flex flex-col gap-3 w-full h-full justify-center px-2 py-4">
      {/* Bar chart */}
      <div className="flex items-end justify-center gap-1.5 flex-1 px-2 bg-[#0A0F1E]/60 rounded-2xl border border-white/5 py-3">
        {arr.map((val, i) => {
          const isSorted  = sortedIdx.includes(i)
          const isSwap    = swapIdx.includes(i)
          const isCompare = compareIdx.includes(i)
          const [barFrom, barTo, labelC, shadow] = isSorted
            ? ['from-[#22C55E]','to-[#4ADE80]','text-[#86EFAC]','shadow-green-500/30']
            : isSwap
            ? ['from-[#EF4444]','to-[#F87171]','text-[#FCA5A5]','shadow-red-500/30']
            : isCompare
            ? ['from-[#F59E0B]','to-[#FCD34D]','text-[#FDE68A]','shadow-yellow-400/30']
            : ['from-[#2563EB]/70','to-[#60A5FA]/70','text-[#93C5FD]','']
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <span className={`text-[9px] font-mono font-bold transition-colors duration-300 ${labelC}`}>{val}</span>
              <div
                className={`w-full rounded-t-lg bg-gradient-to-t ${barFrom} ${barTo} transition-all duration-300 shadow-lg ${shadow} ${isCompare || isSwap ? 'ring-1 ring-white/30' : ''}`}
                style={{ height: `${(val / maxVal) * 120}px` }}
              />
              <span className="text-[8px] text-[#334155] font-mono">[{i}]</span>
            </div>
          )
        })}
      </div>
      {/* Status row */}
      <div className="flex gap-2 justify-center flex-wrap">
        {[
          { bg: 'bg-[#2563EB]', border: 'border-[#2563EB]/40', label: 'Unsorted' },
          { bg: 'bg-[#F59E0B]', border: 'border-[#F59E0B]/40', label: 'Comparing' },
          { bg: 'bg-[#EF4444]', border: 'border-[#EF4444]/40', label: 'Swapping'  },
          { bg: 'bg-[#22C55E]', border: 'border-[#22C55E]/40', label: 'Sorted'    },
        ].map(l => (
          <div key={l.label} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white/[0.03] ${l.border}`}>
            <div className={`w-2 h-2 rounded-sm ${l.bg}`} />
            <span className="text-[10px] text-[#94A3B8] font-medium">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SPEED_MS = { slow: 1500, medium: 800, fast: 300 }
const SORT_FNS = { bubble: bubbleSortSteps, selection: selectionSortSteps, insertion: insertionSortSteps }

export function SortingViz({ initialArray = DEFAULT_ARR }) {
  const [arr,       setArr]       = useState([...initialArray])
  const [algo,      setAlgo]      = useState('bubble')
  const [viewMode,  setViewMode]  = useState('3d')
  const [speed,     setSpeed]     = useState('medium')
  const [playing,   setPlaying]   = useState(false)
  const [stepIdx,   setStepIdx]   = useState(-1)
  const [log,       setLog]       = useState('Choose algorithm and press Play')
  const stepsRef  = useRef([])
  const timerRef  = useRef(null)
  const [compare, setCompare]     = useState([])
  const [swap,    setSwap]        = useState([])
  const [sorted,  setSorted]      = useState([])
  const [displayArr, setDisplayArr] = useState([...initialArray])

  const buildSteps = useCallback(() => {
    stepsRef.current = (SORT_FNS[algo] || bubbleSortSteps)(arr)
  }, [arr, algo])

  const stop = () => { clearTimeout(timerRef.current); setPlaying(false) }

  const applyStep = useCallback((idx) => {
    const step = stepsRef.current[idx]
    if (!step) { stop(); setLog('✅ Sorting complete!'); setSorted(displayArr.map((_,i) => i)); return }
    setDisplayArr(step.arr)
    if (step.type === 'compare') {
      setCompare([step.i, step.j]); setSwap([])
      setLog(`Comparing index [${step.i}]=${step.arr[step.i]} and [${step.j}]=${step.arr[step.j]}`)
      blip(300 + step.arr[step.i] * 3, 0.07, 'sine')
    } else if (step.type === 'swap') {
      setSwap([step.i, step.j]); setCompare([])
      setLog(`Swapping [${step.i}]=${step.arr[step.i]} ↔ [${step.j}]=${step.arr[step.j]}`)
      blip(500, 0.1, 'triangle')
    } else if (step.type === 'sorted') {
      setSorted(prev => [...prev, step.sorted]); setCompare([]); setSwap([])
      blip(700, 0.08, 'sine')
    } else if (step.type === 'done') {
      setSorted(step.arr.map((_,i) => i)); setCompare([]); setSwap([])
      setLog('✅ Sorting complete!')
      setPlaying(false)
    }
    setStepIdx(idx)
  }, [displayArr])

  const handlePlay = () => {
    if (playing) { stop(); return }
    if (stepsRef.current.length === 0 || stepIdx >= stepsRef.current.length - 1) {
      buildSteps()
      setSorted([]); setCompare([]); setSwap([]); setStepIdx(0)
    }
    setPlaying(true)
    let idx = stepIdx <= 0 ? 0 : stepIdx
    const tick = () => {
      applyStep(idx)
      idx++
      if (idx < stepsRef.current.length) {
        timerRef.current = setTimeout(tick, SPEED_MS[speed])
      } else {
        setPlaying(false)
        setLog('✅ Sorting complete!')
      }
    }
    tick()
  }

  const handleShuffle = () => {
    stop(); stepsRef.current = []; setStepIdx(-1)
    const shuffled = [...arr].sort(() => Math.random()-0.5)
    setArr(shuffled); setDisplayArr(shuffled)
    setSorted([]); setCompare([]); setSwap([])
    setLog('Array shuffled — press Play to sort')
  }

  const handleReset = () => {
    stop(); stepsRef.current = []; setStepIdx(-1)
    setArr([...initialArray]); setDisplayArr([...initialArray])
    setSorted([]); setCompare([]); setSwap([])
    setLog('Choose algorithm and press Play')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['bubble','selection','insertion'].map(a => (
          <button key={a} onClick={() => { stop(); stepsRef.current=[]; setStepIdx(-1); setAlgo(a); setSorted([]); setCompare([]); setSwap([]) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              algo === a ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white' : 'bg-white/5 border border-white/10 text-[#64748B] hover:text-white'
            }`}>{a}</button>
        ))}

        <div className="flex-1" />

        <button onClick={handlePlay} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-sm font-medium hover:opacity-90">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleShuffle} disabled={playing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 disabled:opacity-40">
          <Shuffle className="w-4 h-4" /> Shuffle
        </button>
        <button onClick={handleReset}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
          <RotateCcw className="w-4 h-4" />
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
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border border-white/5"
           style={{ height: '360px', background: 'radial-gradient(ellipse at 50% 80%, #0D1835 0%, #07111C 100%)' }}>
        {viewMode === '3d' ? (
          <Canvas shadows camera={{ position: [0, 4, 16], fov: 52 }} gl={{ antialias: true }}>
            <SortScene arr={displayArr} compareIdx={compare} swapIdx={swap} sortedIdx={sorted} />
          </Canvas>
        ) : (
          <div className="w-full h-full flex items-center justify-center px-4">
            <Sort2D arr={displayArr} compareIdx={compare} swapIdx={swap} sortedIdx={sorted} />
          </div>
        )}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-[#64748B] pointer-events-none select-none whitespace-nowrap">
            🖱 Drag to orbit · Scroll to zoom
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {[{bg:'bg-[#2563EB]',label:'Unsorted'},{bg:'bg-[#F59E0B]',label:'Comparing'},{bg:'bg-[#EF4444]',label:'Swapping'},{bg:'bg-[#22C55E]',label:'Sorted'}].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded ${l.bg}`} /><span className="text-[#94A3B8]">{l.label}</span>
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
