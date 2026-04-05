import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Play, Pause, RotateCcw, ChevronRight, Box, LayoutGrid, Gauge } from 'lucide-react'

const ArrayViz3D = lazy(() =>
  import('./ArrayViz3D').then((m) => ({ default: m.ArrayViz3D }))
)

const SPEEDS = {
  slow:   1200,
  medium: 650,
  fast:   200,
}

// ─── 2D flat view ──────────────────────────────────────────────────────────────
function View2D({ arr, current, visited, targetIndex }) {
  const maxVal = Math.max(...arr)

  return (
    <div className="flex items-end justify-center gap-2 h-48 px-4 py-4 bg-white/[0.02] rounded-2xl border border-white/5">
      {arr.map((val, i) => {
        const isActive  = current === i
        const isMatch   = i === targetIndex
        const isVisited = visited.includes(i)

        let barClass = 'bg-gradient-to-t from-[#3B5BDB]/70 to-[#6482F5]/70'
        let valClass  = 'text-[#94A3B8]'
        let idxClass  = 'text-[#64748B]'

        if (isActive && isMatch) {
          barClass = 'bg-gradient-to-t from-[#22C55E] to-[#4ADE80] shadow-lg shadow-green-500/40'
          valClass = 'text-[#4ADE80] font-bold'
          idxClass = 'text-[#4ADE80] font-bold'
        } else if (isActive) {
          barClass = 'bg-gradient-to-t from-[#F5C518] to-[#FFE066] shadow-lg shadow-yellow-400/40'
          valClass = 'text-[#F5C518] font-bold'
          idxClass = 'text-[#F5C518] font-bold'
        } else if (isMatch) {
          barClass = 'bg-gradient-to-t from-[#22C55E] to-[#4ADE80]'
          valClass = 'text-[#4ADE80]'
          idxClass = 'text-[#4ADE80]'
        } else if (isVisited) {
          barClass = 'bg-gradient-to-t from-[#6C4FBF]/70 to-[#9B8FFF]/70'
        }

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className={`text-[10px] font-mono transition-colors duration-300 ${valClass}`}>{val}</span>
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${barClass}`}
              style={{ height: `${(val / maxVal) * 120}px` }}
            />
            <span className={`text-[10px] font-mono transition-colors duration-300 ${idxClass}`}>[{i}]</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main exported component ───────────────────────────────────────────────────
export function ArrayViz({
  initialArray = [10, 20, 30, 40, 50, 15, 35],
  targetIndex  = null,
  mode         = 'traverse',
}) {
  const [arr]       = useState(initialArray)
  const [viewMode, setViewMode]   = useState('3d')         // '2d' | '3d'
  const [speed, setSpeed]         = useState('medium')
  const [current, setCurrent]     = useState(-1)
  const [visited, setVisited]     = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [step, setStep]           = useState(0)
  const [log, setLog]             = useState('Press Start Traversal to begin')
  const intervalRef = useRef(null)

  const reset = () => {
    clearInterval(intervalRef.current)
    setIsPlaying(false)
    setCurrent(-1)
    setVisited([])
    setStep(0)
    setLog('Press Start Traversal to begin')
  }

  useEffect(() => {
    if (!isPlaying) { clearInterval(intervalRef.current); return }

    intervalRef.current = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1
        if (next >= arr.length) {
          clearInterval(intervalRef.current)
          setIsPlaying(false)
          setCurrent(-1)
          setLog(`✅ Traversal complete! Visited all ${arr.length} elements.`)
          return prev
        }
        setCurrent(next)
        setVisited((v) => [...v, next])
        const isHit = targetIndex !== null && next === targetIndex
        setLog(
          isHit
            ? `🎯 Found target at index [${next}] → value = ${arr[next]}`
            : `→ Visiting index [${next}]: value = ${arr[next]}`
        )
        return next
      })
    }, SPEEDS[speed])

    return () => clearInterval(intervalRef.current)
  }, [isPlaying, arr, speed, targetIndex])

  const handleStartPause = () => {
    if (step >= arr.length - 1 && !isPlaying) {
      reset()
      setTimeout(() => setIsPlaying(true), 50)
    } else {
      setIsPlaying((p) => !p)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Start / Pause */}
        <button
          id="array-viz-start-btn"
          onClick={handleStartPause}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Pause' : 'Start Traversal'}
        </button>

        {/* Reset */}
        <button
          id="array-viz-reset-btn"
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        {/* Speed selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Gauge className="w-3.5 h-3.5 text-[#7B61FF]" />
          {['slow', 'medium', 'fast'].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                speed === s
                  ? 'bg-[#7B61FF]/30 border border-[#7B61FF]/50 text-[#BFB4FF]'
                  : 'bg-white/5 border border-white/10 text-[#64748B] hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 2D / 3D toggle */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            id="array-viz-2d-btn"
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === '2d'
                ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white shadow'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> 2D
          </button>
          <button
            id="array-viz-3d-btn"
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white shadow'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> 3D
          </button>
        </div>

        <span className="text-xs text-[#64748B] font-mono">
          Step {step}/{arr.length}
        </span>
      </div>

      {/* ── Visualization area ───────────────────────────────────── */}
      {viewMode === '2d' ? (
        <View2D
          arr={arr}
          current={current}
          visited={visited}
          targetIndex={targetIndex}
        />
      ) : (
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/5"
          style={{
            height: '340px',
            background: 'radial-gradient(ellipse at 50% 60%, #0D1835 0%, #07111C 100%)',
          }}
        >
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#7B61FF] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <ArrayViz3D
              array={arr}
              currentIndex={current}
              targetIndex={targetIndex}
            />
          </Suspense>

          {/* Overlay hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-[#64748B] pointer-events-none select-none">
            🖱 Drag to orbit · Scroll to zoom
          </div>
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { bg: 'bg-[#3B5BDB]',  label: 'Unvisited'  },
          { bg: 'bg-[#F5C518]',  label: 'Current'    },
          { bg: 'bg-[#22C55E]',  label: 'Match'      },
          { bg: 'bg-[#6C4FBF]',  label: 'Visited'    },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${l.bg}`} />
            <span className="text-[#94A3B8]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Log line ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
        <ChevronRight className="w-3.5 h-3.5 text-[#7B61FF] flex-shrink-0" />
        <span className="text-xs font-mono text-[#94A3B8]">{log}</span>
      </div>
    </div>
  )
}
