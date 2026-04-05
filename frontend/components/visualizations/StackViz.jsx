/**
 * StackViz — Full-featured Stack visualizer.
 *
 * UI layer: input, Push / Pop / Peek / Reset controls, speed selector,
 *           2D ↔ 3D toggle, status log.
 * 3D layer: Scene3D + StackScene3D (lazy-loaded).
 * 2D layer: Pure CSS vertical stack.
 *
 * Stack item: { id, value, status }
 *   status: 'default' | 'inserted' | 'removed' | 'peek'
 */

import { useState, useRef, lazy, Suspense, useCallback } from 'react'
import {
  ArrowUpFromDot, ArrowDownToDot, Eye, RotateCcw,
  LayoutGrid, Box, ChevronRight, Layers
} from 'lucide-react'
import { Scene3D } from './3D/Scene3D'

const StackScene3D = lazy(() =>
  import('./3D/StackScene3D').then((m) => ({ default: m.StackScene3D }))
)

// ── Timing (ms) ──────────────────────────────────────────────────────────────
const SPEED_MAP = { slow: 900, medium: 500, fast: 200 }
const CLEANUP_DELAY = { slow: 1600, medium: 900, fast: 500 }

let _nextId = 1
const nextId = () => `s-${_nextId++}`

// ── 2D flat stack view ───────────────────────────────────────────────────────
function Stack2D({ items }) {
  const display = [...items].reverse() // top of stack at the top

  const statusStyle = {
    default:  { box: 'bg-[#2563EB]/20 border-[#2563EB]/40 text-[#93C5FD]', dot: 'bg-[#2563EB]' },
    inserted: { box: 'bg-[#22C55E]/20 border-[#22C55E]/60 text-[#86EFAC] shadow-green-500/20 shadow-lg', dot: 'bg-[#22C55E]' },
    removed:  { box: 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#FCA5A5] shadow-red-500/20 shadow-lg',   dot: 'bg-[#EF4444]' },
    peek:     { box: 'bg-[#A78BFA]/20 border-[#A78BFA]/60 text-[#DDD6FE] shadow-violet-500/20 shadow-lg', dot: 'bg-[#A78BFA]' },
    active:   { box: 'bg-[#F5C518]/20 border-[#F5C518]/60 text-[#FDE68A] shadow-yellow-500/20 shadow-lg', dot: 'bg-[#F5C518]' },
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-[#334155] text-sm gap-2">
        <Layers className="w-8 h-8 opacity-30" />
        <span>Stack is empty</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5 py-4 min-h-[260px] justify-end">
      {/* TOP label */}
      <div className="text-[10px] font-mono text-[#F5C518] uppercase tracking-widest mb-1 flex items-center gap-1">
        <span>▲</span> TOP
      </div>

      <div className="flex flex-col gap-1.5 w-full max-w-[240px]">
        {display.map((item, i) => {
          const st = statusStyle[item.status] || statusStyle.default
          const isTop = i === 0
          return (
            <div
              key={item.id}
              className={`
                relative flex items-center justify-between px-4 py-2.5
                rounded-xl border-2 transition-all duration-300
                ${st.box}
                ${isTop ? 'scale-105 origin-center' : ''}
              `}
            >
              <div className={`w-2 h-2 rounded-full ${st.dot} flex-shrink-0`} />
              <span className="font-mono font-bold text-sm flex-1 text-center">
                {item.value}
              </span>
              <span className="text-[10px] opacity-50 font-mono">
                [{items.length - 1 - i}]
              </span>
            </div>
          )
        })}
      </div>

      {/* BASE label */}
      <div className="mt-1.5 w-full max-w-[240px] h-2 rounded-full bg-gradient-to-r from-[#7B61FF]/30 via-[#F062D0]/30 to-[#7B61FF]/30" />
      <span className="text-[10px] font-mono text-[#334155] uppercase tracking-widest">BOTTOM</span>
    </div>
  )
}

// ── Log entry ────────────────────────────────────────────────────────────────
const LOG_ICONS = {
  push:   { icon: '📥', color: 'text-[#86EFAC]' },
  pop:    { icon: '📤', color: 'text-[#FCA5A5]' },
  peek:   { icon: '👁',  color: 'text-[#DDD6FE]' },
  reset:  { icon: '🔄', color: 'text-[#94A3B8]' },
  empty:  { icon: '⚠️', color: 'text-[#FDE68A]' },
  info:   { icon: 'ℹ️', color: 'text-[#94A3B8]' },
}

// ── Main component ────────────────────────────────────────────────────────────
export function StackViz({ maxSize = 8 }) {
  const [items,    setItems]    = useState([])      // {id, value, status}
  const [input,    setInput]    = useState('')
  const [viewMode, setViewMode] = useState('3d')   // '2d' | '3d'
  const [speed,    setSpeed]    = useState('medium')
  const [log,      setLog]      = useState({ type: 'info', msg: 'Push a value to start' })
  const [busy,     setBusy]     = useState(false)  // prevents overlapping ops

  const timerRef = useRef(null)

  const delay = (ms) => new Promise((r) => setTimeout(r, ms))

  const addLog = (type, msg) => setLog({ type, msg })

  // ── PUSH ────────────────────────────────────────────────────────────────────
  const handlePush = useCallback(async () => {
    const val = input.trim()
    if (!val) { addLog('info', 'Enter a value first'); return }
    if (items.length >= maxSize) { addLog('empty', `Stack full (max ${maxSize})`); return }
    if (busy) return
    setBusy(true)

    const newItem = { id: nextId(), value: val, status: 'inserted' }
    setItems((prev) => [...prev, newItem])
    addLog('push', `Pushed "${val}" → stack size: ${items.length + 1}`)
    setInput('')

    await delay(CLEANUP_DELAY[speed])

    // Return to default
    setItems((prev) =>
      prev.map((it) => it.id === newItem.id ? { ...it, status: 'default' } : it)
    )
    setBusy(false)
  }, [input, items.length, busy, maxSize, speed])

  // ── POP ─────────────────────────────────────────────────────────────────────
  const handlePop = useCallback(async () => {
    if (items.length === 0) { addLog('empty', 'Stack is empty — nothing to pop'); return }
    if (busy) return
    setBusy(true)

    const topId = items[items.length - 1].id
    const topVal = items[items.length - 1].value

    // Highlight active first
    setItems((prev) =>
      prev.map((it) => it.id === topId ? { ...it, status: 'active' } : it)
    )
    await delay(SPEED_MAP[speed])

    // Mark removed (spring animates upward)
    setItems((prev) =>
      prev.map((it) => it.id === topId ? { ...it, status: 'removed' } : it)
    )
    addLog('pop', `Popped "${topVal}" ← stack size: ${items.length - 1}`)

    await delay(CLEANUP_DELAY[speed])

    // Remove from array
    setItems((prev) => prev.filter((it) => it.id !== topId))
    setBusy(false)
  }, [items, busy, speed])

  // ── PEEK ────────────────────────────────────────────────────────────────────
  const handlePeek = useCallback(async () => {
    if (items.length === 0) { addLog('empty', 'Stack is empty — nothing to peek'); return }
    if (busy) return
    setBusy(true)

    const top = items[items.length - 1]
    setItems((prev) =>
      prev.map((it) => it.id === top.id ? { ...it, status: 'peek' } : it)
    )
    addLog('peek', `Peek → top is "${top.value}"`)

    await delay(CLEANUP_DELAY[speed] + SPEED_MAP[speed])

    setItems((prev) =>
      prev.map((it) => it.id === top.id ? { ...it, status: 'default' } : it)
    )
    setBusy(false)
  }, [items, busy, speed])

  // ── RESET ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    clearTimeout(timerRef.current)
    setItems([])
    setBusy(false)
    addLog('reset', 'Stack cleared')
  }

  // ── Keyboard shortcut on input ──────────────────────────────────────────────
  const onKeyDown = (e) => {
    if (e.key === 'Enter') handlePush()
  }

  const logStyle = LOG_ICONS[log.type] || LOG_ICONS.info

  return (
    <div className="space-y-4">

      {/* ── Top control bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Input */}
        <input
          id="stack-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={6}
          placeholder="Value…"
          className="w-28 px-3 py-2 rounded-xl bg-white/5 border border-white/10
                     text-white placeholder:text-[#475569] text-sm font-mono outline-none
                     focus:border-[#7B61FF]/60 focus:bg-white/[0.08] transition-all"
        />

        {/* Push */}
        <button
          id="stack-push-btn"
          onClick={handlePush}
          disabled={busy || !input.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white
                     hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowDownToDot className="w-4 h-4" /> Push
        </button>

        {/* Pop */}
        <button
          id="stack-pop-btn"
          onClick={handlePop}
          disabled={busy || items.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white
                     hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUpFromDot className="w-4 h-4" /> Pop
        </button>

        {/* Peek */}
        <button
          id="stack-peek-btn"
          onClick={handlePeek}
          disabled={busy || items.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-gradient-to-r from-[#7B61FF] to-[#A78BFA] text-white
                     hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4" /> Peek
        </button>

        {/* Reset */}
        <button
          id="stack-reset-btn"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Speed */}
        <div className="flex items-center gap-1">
          {['slow', 'medium', 'fast'].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
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
            id="stack-2d-btn"
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
            id="stack-3d-btn"
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

        {/* Counter */}
        <span className="text-xs font-mono text-[#475569]">
          {items.filter(i => i.status !== 'removed').length}/{maxSize}
        </span>
      </div>

      {/* ── Visualization area ────────────────────────────────────────── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-white/5"
        style={{ height: '380px' }}
      >
        {viewMode === '3d' ? (
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-[#07111C]">
                <div className="w-8 h-8 border-2 border-[#7B61FF] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Scene3D
              className="w-full h-full"
              cameraPosition={[0, 5, 10]}
              orbitTarget={[0, 2, 0]}
            >
              <StackScene3D items={items} />
            </Scene3D>
          </Suspense>
        ) : (
          <div className="w-full h-full overflow-y-auto bg-[#07111C] flex items-end justify-center px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Stack2D items={items} />
          </div>
        )}

        {/* Orbit hint */}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1
                          rounded-full bg-black/40 backdrop-blur-sm border border-white/10
                          text-[10px] text-[#64748B] pointer-events-none select-none whitespace-nowrap">
            🖱 Drag to orbit · Scroll to zoom
          </div>
        )}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { bg: 'bg-[#2563EB]',  label: 'Default'  },
          { bg: 'bg-[#22C55E]',  label: 'Inserted' },
          { bg: 'bg-[#A78BFA]',  label: 'Peek'     },
          { bg: 'bg-[#F5C518]',  label: 'Active'   },
          { bg: 'bg-[#EF4444]',  label: 'Removed'  },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded ${l.bg}`} />
            <span className="text-[#94A3B8]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Status log ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <span className="text-base leading-none">{logStyle.icon}</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#7B61FF] flex-shrink-0" />
        <span className={`text-xs font-mono ${logStyle.color}`}>{log.msg}</span>
      </div>
    </div>
  )
}
