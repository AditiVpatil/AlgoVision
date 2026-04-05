import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrayViz }       from '@/components/visualizations/ArrayViz'
import { BinarySearchViz } from '@/components/visualizations/BinarySearchViz'
import { TreeViz }        from '@/components/visualizations/TreeViz'
import { StackViz }       from '@/components/visualizations/StackViz'
import { QueueViz }       from '@/components/visualizations/QueueViz'
import { GraphViz }       from '@/components/visualizations/GraphViz'
import { LinkedListViz }  from '@/components/visualizations/LinkedListViz'
import { SortingViz }     from '@/components/visualizations/SortingViz'
import { AiTutor } from '@/components/AiTutor'
import {
  ArrowLeft, ChevronRight, BookOpen, Code2, PlayCircle,
  ListOrdered, Bot, CheckCircle2, Clipboard, ClipboardCheck
} from 'lucide-react'

const API = 'http://localhost:5000/api'

const tabs = [
  { id: 'explanation', label: 'Explanation',  icon: BookOpen },
  { id: 'code',        label: 'Code',         icon: Code2 },
  { id: 'visualize',   label: 'Visualize',    icon: PlayCircle },
  { id: 'dryrun',      label: 'Dry Run',      icon: ListOrdered },
]

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-2xl bg-[#060D18] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/5">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{language}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-white transition-colors">
          {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-[#10B981]" /> : <Clipboard className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono text-[#CBD5E1] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function LearnTopicPage() {
  const { topicId } = useParams()
  const [topic, setTopic]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab]   = useState('explanation')
  const [codeLang, setCodeLang]     = useState('java')
  const [aiOpen, setAiOpen]         = useState(false)
  const [progress, setProgress]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('av_progress') || '{}') } catch { return {} }
  })

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/topics/${topicId}`)
      .then(r => r.json())
      .then(d => { if (d.data) setTopic(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [topicId])

  const markComplete = () => {
    const next = { ...progress, [topicId]: true }
    setProgress(next)
    localStorage.setItem('av_progress', JSON.stringify(next))
  }
  const isCompleted = !!progress[topicId]

  // ── Route each topic to its unique 3D visualizer ──────────────────────────
  const VIZ_MAP = {
    'arrays':            { Component: ArrayViz,        props: { initialArray: [10, 20, 35, 15, 50, 40, 28] } },
    'binary-search':     { Component: BinarySearchViz, props: { initialArray: [5,10,15,20,25,30,35,40], target: 25 } },
    'linked-list':       { Component: LinkedListViz,   props: {} },
    'trees':             { Component: TreeViz,         props: {} },
    'graphs':            { Component: GraphViz,        props: {} },
    'queue':             { Component: QueueViz,        props: {} },
    'stack':             { Component: StackViz,        props: {} },
    'sorting':           { Component: SortingViz,      props: { initialArray: [64,34,25,12,78,11,45,90,22,38] } },
    'dynamic-programming': { Component: ArrayViz,     props: { initialArray: [0,1,1,2,3,5,8,13,21,34] } },
  }

  const { Component: VizComponent, props: vizProps } =
    VIZ_MAP[topicId] ?? { Component: ArrayViz, props: { initialArray: [10,20,30,40,50] } }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07111C]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-[#7B61FF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#94A3B8] text-sm">Loading topic...</p>
      </div>
    </div>
  )

  if (!topic) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07111C]">
      <div className="text-center">
        <p className="text-white text-xl font-bold mb-4">Topic not found</p>
        <Link to="/learn" className="text-[#7B61FF] hover:underline">← Back to topics</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#07111C] relative">
      {/* AI Tutor floating */}
      <AiTutor topic={topicId} isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      <div className="flex">
        {/* Left sidebar - lesson steps */}
        <aside className="hidden lg:flex w-72 flex-col min-h-screen border-r border-white/5 bg-[#0A0F1E] sticky top-0">
          <div className="p-5">
            <Link to="/learn" className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Topics
            </Link>

            {/* Topic card */}
            <div className={`rounded-2xl bg-gradient-to-br ${topic.color || 'from-violet-500 to-purple-600'} p-px mb-6`}>
              <div className="rounded-2xl bg-[#0A0F1E] p-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  topic.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                  topic.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                }`}>{topic.difficulty}</span>
                <h2 className="text-white font-bold mt-2 mb-1">{topic.title}</h2>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-3">
                  <div
                    className={`h-full bg-gradient-to-r ${topic.color || 'from-violet-500 to-purple-600'} rounded-full transition-all`}
                    style={{ width: `${Math.round((topic.completed / topic.total) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">{topic.completed}/{topic.total} lessons</p>
              </div>
            </div>

            {/* Lesson tabs */}
            <div className="space-y-1">
              {tabs.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${
                      activeTab === t.id
                        ? 'bg-[#7B61FF]/20 border border-[#7B61FF]/30 text-white font-medium'
                        : 'text-[#64748B] hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {activeTab === t.id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#7B61FF]" />}
                  </button>
                )
              })}
            </div>

            {/* Complete button */}
            <div className="mt-6">
              <button
                onClick={markComplete}
                disabled={isCompleted}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isCompleted
                    ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] cursor-default'
                    : 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white hover:opacity-90'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleted ? 'Completed ✓' : 'Mark Complete'}
              </button>
            </div>

            {/* AI Tutor btn */}
            <button
              onClick={() => setAiOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-[#7B61FF]/30 text-sm transition-all"
            >
              <Bot className="w-4 h-4" /> Ask AI Tutor
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
              <Link to="/learn" className="hover:text-white transition-colors">Learn</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">{topic.title}</span>
            </div>

            {/* Tab content */}
            {activeTab === 'explanation' && (
              <div className="space-y-6" key="explanation">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{topic.title}</h1>
                  <p className="text-[#94A3B8]">{topic.description}</p>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <div className="prose prose-invert max-w-none text-[#CBD5E1] text-sm leading-relaxed whitespace-pre-line">
                    {topic.content?.explanation || 'Explanation coming soon...'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-5" key="code">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Code Examples</h2>
                  <div className="flex gap-2">
                    {['java', 'python'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          codeLang === lang
                            ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white'
                            : 'bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {lang === 'java' ? '☕ Java' : '🐍 Python'}
                      </button>
                    ))}
                  </div>
                </div>
                <CodeBlock
                  code={codeLang === 'java' ? (topic.content?.javaCode || 'No Java code available.') : (topic.content?.pythonCode || 'No Python code available.')}
                  language={codeLang === 'java' ? 'Java' : 'Python'}
                />
              </div>
            )}

            {activeTab === 'visualize' && (
              <div className="space-y-5" key="visualize">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Visual Representation</h2>
                  <p className="text-[#94A3B8] text-sm">Interact with the animation to understand how the algorithm works step by step.</p>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <VizComponent {...vizProps} />
                </div>
              </div>
            )}

            {activeTab === 'dryrun' && (
              <div className="space-y-5" key="dryrun">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Step-by-Step Dry Run</h2>
                  <p className="text-[#94A3B8] text-sm">Trace through the algorithm manually to solidify your understanding.</p>
                </div>
                {(topic.content?.dryRun || []).map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {step.step}
                      </div>
                      {i < (topic.content?.dryRun?.length || 0) - 1 && (
                        <div className="w-px flex-1 bg-white/10 mt-1" />
                      )}
                    </div>
                    <div className={`flex-1 pb-6 ${i === (topic.content?.dryRun?.length || 0) - 1 ? 'pb-0' : ''}`}>
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-[#7B61FF]/30 transition-colors">
                        <p className="text-sm text-[#CBD5E1] font-mono leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!topic.content?.dryRun || topic.content.dryRun.length === 0) && (
                  <p className="text-[#64748B] text-sm">Dry run coming soon...</p>
                )}
              </div>
            )}

            {/* Mobile tab switcher */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0F1E]/95 border-t border-white/10 flex z-30">
              {tabs.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                      activeTab === t.id ? 'text-[#7B61FF]' : 'text-[#64748B]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* Bottom padding for mobile nav */}
            <div className="lg:hidden h-20" />

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
              <Link to="/learn" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
              <Link to="/practice" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white hover:opacity-90 text-sm font-medium transition-opacity">
                Practice Problems <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
