import { useState, useEffect, lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { AnimatedBackground } from '@/components/animated-background'
import {
  CheckCircle2, Circle, ChevronRight, ExternalLink,
  Filter, Search, Sparkles, Zap, Code2, Bot, Play,
  Send, Maximize2, Minimize2, RotateCcw, AlertTriangle,
  Loader2, Cpu, Brain, CheckCircle, Info, Layers, 
  GitBranch, Network, Box, ChevronLeft, LayoutGrid, ArrowRight,
  Bookmark, BookmarkCheck, X, Eye, TrendingUp, Clock
} from 'lucide-react'
import { AiTutor } from '@/components/AiTutor'
import { API_BASE_URL } from '@/src/config'
import { motion, AnimatePresence } from 'framer-motion'

// ── Lazy-load visualization components ───────────────────────────────────────
const ArrayViz       = lazy(() => import('@/components/visualizations/ArrayViz').then(m => ({ default: m.ArrayViz })))
const SortingViz     = lazy(() => import('@/components/visualizations/SortingViz').then(m => ({ default: m.SortingViz })))
const LinkedListViz  = lazy(() => import('@/components/visualizations/LinkedListViz').then(m => ({ default: m.LinkedListViz })))
const TreeViz        = lazy(() => import('@/components/visualizations/TreeViz').then(m => ({ default: m.TreeViz })))
const GraphViz       = lazy(() => import('@/components/visualizations/GraphViz').then(m => ({ default: m.GraphViz })))
const BinarySearchViz = lazy(() => import('@/components/visualizations/BinarySearchViz').then(m => ({ default: m.BinarySearchViz })))
const StackViz       = lazy(() => import('@/components/visualizations/StackViz').then(m => ({ default: m.StackViz })))
const QueueViz       = lazy(() => import('@/components/visualizations/QueueViz').then(m => ({ default: m.QueueViz })))

// Map problem topic -> visualization component
function TopicVisualizer({ topic }) {
  const t = (topic || '').toLowerCase()
  const VizLoader = ({ children }) => (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-[#7B61FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  )

  if (t.includes('sort')) return <VizLoader><SortingViz /></VizLoader>
  if (t.includes('link')) return <VizLoader><LinkedListViz /></VizLoader>
  if (t.includes('tree') || t.includes('bst') || t.includes('binary tree')) return <VizLoader><TreeViz /></VizLoader>
  if (t.includes('graph')) return <VizLoader><GraphViz /></VizLoader>
  if (t.includes('binary search') || t.includes('binary-search')) return <VizLoader><BinarySearchViz /></VizLoader>
  if (t.includes('stack')) return <VizLoader><StackViz /></VizLoader>
  if (t.includes('queue')) return <VizLoader><QueueViz /></VizLoader>
  // Default: array / hash / dp / general
  return <VizLoader><ArrayViz /></VizLoader>
}

const iconMap = { Layers, Search, GitBranch, Network, Box, Zap }

const starters = {
  python: `def solve(nums, target):\n    # Write your solution here\n    pass\n\n# Test call\nprint(solve([2, 7, 11, 15], 9))`,
  java: `public class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        // sol.solve(...)\n    }\n}`,
  javascript: `function solve(nums, target) {\n    // Write your solution here\n}\n\nconsole.log(solve([2, 7, 11, 15], 9));`,
  cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nvector<int> solve(vector<int>& nums, int target) {\n    // Write your solution here\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    int target = 9;\n    solve(nums, target);\n    return 0;\n}`,
}

export default function PracticePage() {

  const [searchParams] = useSearchParams()
  const initialTopic = searchParams.get('topic') || 'All'

  const [problems, setProblems] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [view, setSelectedView] = useState('list') // 'list' | 'editor'

  const [userCodes, setUserCodes] = useState({
    python: starters.python,
    javascript: starters.javascript,
    java: starters.java,
    cpp: starters.cpp
  })
  const [code, setCode] = useState(starters.python)
  const [language, setLanguage] = useState('python')
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState(null) // Object with stdout, stderr, compileErr
  const [isRunning, setIsRunning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)

  const [search, setSearch] = useState('')
  const [diffFilter, setDiff] = useState('All')
  const [topicFilter, setTopicFilter] = useState(initialTopic)
  const [topicsView, setTopicsView] = useState(initialTopic === 'All')
  
  const [solved, setSolved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('av_solved') || '[]') } catch { return [] }
  })
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('av_bookmarks') || '[]') } catch { return [] }
  })
  const [aiOpen, setAiOpen] = useState(false)
  const [showOptimizedModal, setShowOptimizedModal] = useState(false)
  const [terminalTab, setTerminalTab] = useState('terminal') // 'terminal' | 'testcase'
  const [testCaseResults, setTestCaseResults] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/problems`).then(r => r.json()),
      fetch(`${API_BASE_URL}/topics`).then(r => r.json())
    ]).then(([pd, td]) => {
      if (pd.data) setProblems(pd.data)
      if (td.data) setTopics(td.data)
    }).catch(err => console.error('Fetch error:', err))
  }, [])

  const runCode = async () => {
    setIsRunning(true)
    setOutput({ stdout: 'Running code...', stderr: '', compileErr: '' })
    try {
      const token = localStorage.getItem('av_token')
      const res = await fetch(`${API_BASE_URL}/code/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, language, stdin }),
      })
      if (res.status === 401) {
        localStorage.removeItem('av_token');
        localStorage.removeItem('av_user');
        window.location.href = '/login';
        return;
      }
      
      const data = await res.json()
      if (!res.ok) {
        setOutput({ stdout: '', stderr: data.message || 'Execution failed', compileErr: '', success: false })
        return;
      }

      setOutput({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        compileErr: data.compileErr || '',
        success: data.success
      })

      // Logic for test case comparison
      if (selectedProblem?.testCases && data.stdout) {
        const results = selectedProblem.testCases.map(tc => {
          const actual = data.stdout.trim().replace(/\s+/g, '')
          const expected = tc.expected.trim().replace(/\s+/g, '')
          const passed = actual.includes(expected) // Simple inclusion check for now
          return { ...tc, actual: data.stdout.trim(), passed }
        })
        setTestCaseResults(results)
        setTerminalTab('testcase')
      }
    } catch (err) {
      setOutput({ stdout: '', stderr: 'Error: ' + err.message, compileErr: '' })
    } finally {
      setIsRunning(false)
    }
  }

  const analyzeCode = async () => {
    if (!selectedProblem) return
    setIsAnalyzing(true)
    setAiAnalysis(null)
    
    // If we haven't run tests yet, or output is old, we should ideally run it.
    // But for now, we'll just send the current testCaseResults if they exist.
    
    try {
      const token = localStorage.getItem('av_token')
      const res = await fetch(`${API_BASE_URL}/code/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language,
          problemId: selectedProblem.id,
          problemDescription: selectedProblem.description,
          topicId: selectedProblem.topic || 'general',
          testResults: testCaseResults // Pass current test results for accuracy
        }),
      })
      if (res.status === 401) {
        localStorage.removeItem('av_token');
        localStorage.removeItem('av_user');
        window.location.href = '/login';
        return;
      }

      const data = await res.json()
      if (!res.ok) {
        alert('Analysis failed: ' + (data.message || 'Server error'));
        return;
      }

      setAiAnalysis(data)
      
      if (data.passed && !solved.includes(selectedProblem.id)) {
        const newSolved = [...solved, selectedProblem.id]
        setSolved(newSolved)
        localStorage.setItem('av_solved', JSON.stringify(newSolved))
      }
    } catch (err) {
      alert('Analysis failed: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleBookmark = (id) => {
    const newBookmarks = bookmarks.includes(id) 
      ? bookmarks.filter(b => b !== id) 
      : [...bookmarks, id]
    setBookmarks(newBookmarks)
    localStorage.setItem('av_bookmarks', JSON.stringify(newBookmarks))
  }

  const openEditor = (problem) => {
    setSelectedProblem(problem)
    const initialLang = 'python'
    setLanguage(initialLang)
    
    // Use starters from problem if available, else use default starters
    const initialCode = problem.starters?.[initialLang] || userCodes[initialLang] || starters[initialLang]
    setCode(initialCode)
    
    // Initialize userCodes with problem starters
    if (problem.starters) {
      setUserCodes({
        python: problem.starters.python || starters.python,
        javascript: problem.starters.javascript || starters.javascript,
        java: problem.starters.java || starters.java,
        cpp: problem.starters.cpp || starters.cpp
      })
    }
    
    setSelectedView('editor')
    setAiAnalysis(null)
    setOutput(null)
    setStdin('')
  }

  const filtered = problems.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchDiff = diffFilter === 'All' || p.difficulty === diffFilter
    const normalizedTopic = topicFilter.toLowerCase().replace(/s$/, '')
    const normalizedProblemTopic = p.topicLabel.toLowerCase().replace(/s$/, '')
    const matchTopic = topicFilter === 'All' || normalizedProblemTopic.includes(normalizedTopic)
    return matchSearch && matchDiff && matchTopic
  })

  return (
    <div className="min-h-screen relative">
        <AnimatedBackground />
        
        {/* Floating AI Tutor Trigger */}
        <button 
          onClick={() => setAiOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center text-white shadow-[0_10px_30px_-5px_rgba(123,97,255,0.5)] hover:scale-110 active:scale-95 transition-all group"
        >
          <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#07111C] animate-pulse" />
        </button>

        <AiTutor topic={selectedProblem?.topicLabel || "general"} isOpen={aiOpen} onClose={() => setAiOpen(false)} code={view === 'editor' ? code : ''} />
        
        {view === 'list' ? (
          <main className="relative pt-12 pb-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-[#7B61FF]" />
                  <span className="text-xs font-black text-[#94A3B8] uppercase tracking-[0.2em]">Mastery Arena</span>
                </div>
                <h1 className="text-5xl font-black text-white leading-tight">
                  {topicsView ? 'Level Up Your' : topicFilter} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-[#F062D0] uppercase tracking-tighter">{topicsView ? 'Skills' : 'Challenges'}</span>
                </h1>
                <p className="text-[#94A3B8] mt-4 max-w-xl text-lg font-medium leading-relaxed">
                  {topicsView ? 'Battle-tested problems across all domains to build your intuition and technical prowess.' : `Handpicked ${topicFilter} questions to master the core concepts and patterns.`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                 {!topicsView && (
                    <button 
                      onClick={() => { setTopicsView(true); setTopicFilter('All'); }}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all shadow-xl backdrop-blur-md group"
                    >
                      <LayoutGrid className="w-4 h-4 text-[#7B61FF] group-hover:rotate-90 transition-transform duration-500" />
                      All Topics
                    </button>
                 )}
                 <div className="hidden lg:flex gap-1 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-xl">
                   {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                     <button key={d} onClick={() => setDiff(d)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${diffFilter === d ? 'bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{d}</button>
                   ))}
                 </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {topicsView ? (
                <motion.div 
                  key="topics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {topics.map((t) => {
                    const Icon = iconMap[t.icon] || Layers
                    const probCount = problems.filter(p => p.topicLabel.toLowerCase().includes(t.title.toLowerCase().replace(/s$/, ''))).length
                    return (
                      <motion.button
                        key={t.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => { setTopicFilter(t.title); setTopicsView(false); }}
                        className="group relative bg-[#0c1a27] border border-white/5 rounded-[2rem] p-8 text-left transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(123,97,255,0.3)] hover:border-[#7B61FF]/40 overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#7B61FF]/10 to-transparent blur-[80px] group-hover:from-[#7B61FF]/20 transition-all duration-700" />
                        
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${t.color || 'from-violet-500 to-purple-600'} flex items-center justify-center shadow-2xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{t.title}</h3>
                        <p className="text-[#64748B] text-sm leading-relaxed mb-8 line-clamp-2 font-semibold">{t.description}</p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#7B61FF] bg-[#7B61FF]/10 px-4 py-1.5 rounded-full">
                            {probCount} Challenges
                          </span>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#7B61FF] transition-all duration-300">
                            <ArrowRight className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="problems"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row gap-4 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search challenges by title..."
                        className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm font-medium focus:ring-2 focus:ring-[#7B61FF] transition-all outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 h-fit lg:hidden">
                       {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                         <button key={d} onClick={() => setDiff(d)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${diffFilter === d ? 'bg-[#7B61FF] text-white' : 'text-slate-500'}`}>{d}</button>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((p, idx) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-[#0c1a27]/80 border border-white/5 rounded-[2rem] p-7 hover:border-[#7B61FF]/40 transition-all duration-500 hover:shadow-[0_20px_40px_-20px_rgba(123,97,255,0.4)] flex flex-col"
                      >
                         <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-2">
                             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                               p.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 
                               p.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 
                               'border-rose-500/20 text-rose-400 bg-rose-500/5'
                             }`}>{p.difficulty}</div>
                             {solved.includes(p.id) && (
                               <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                 <CheckCircle2 className="w-3 h-3" /> Solved
                               </div>
                             )}
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleBookmark(p.id); }}
                             className={`p-2.5 rounded-xl border transition-all ${bookmarks.includes(p.id) ? 'bg-[#7B61FF]/10 border-[#7B61FF] text-[#7B61FF]' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
                           >
                             {bookmarks.includes(p.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                           </button>
                         </div>
                         
                         <h3 className="text-xl font-black text-white mb-3 group-hover:text-[#7B61FF] transition-colors">{p.title}</h3>
                         <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed mb-8">{p.description}</p>
                         
                         <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> {p.acceptance || '64%'}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span>{p.topicLabel}</span>
                            </div>
                            <button 
                              onClick={() => openEditor(p)}
                              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black hover:bg-gradient-to-r from-[#7B61FF] to-[#F062D0] hover:border-transparent transition-all active:scale-95 shadow-xl"
                            >
                              Solve Challenge
                            </button>
                         </div>
                      </motion.div>
                    ))}
                    {filtered.length === 0 && (
                       <div className="col-span-full py-24 text-center">
                         <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
                           <Search className="w-10 h-10 text-slate-700" />
                         </div>
                         <h3 className="text-xl font-bold text-white mb-2">No Challenges Found</h3>
                         <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm font-medium">We couldn't find any challenges matching your filters. Try search or adjust the filters.</p>
                         <button onClick={() => { setSearch(''); setDiff('All'); setTopicFilter('All'); }} className="text-[#7B61FF] font-black text-sm hover:underline tracking-tighter uppercase">Reset All Filters</button>
                       </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="h-screen flex flex-col overflow-hidden relative z-10"
          >
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0A0F1E] flex-shrink-0 backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSelectedView('list')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-[#7B61FF]/30 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-[#7B61FF] uppercase tracking-widest">{selectedProblem.difficulty}</span>
              <span className="text-[10px] text-slate-600 font-bold tracking-tighter uppercase">ID #{selectedProblem.id || 'N/A'}</span>
            </div>
            <h2 className="text-white font-black text-base">{selectedProblem.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {Object.keys(starters).map(l => (
              <button
                key={l}
                onClick={() => { 
                  setUserCodes(prev => ({ ...prev, [language]: code }))
                  setLanguage(l)
                  setCode(userCodes[l] || starters[l])
                }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${language === l ? 'bg-[#7B61FF] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run
            </button>
            <button
              onClick={analyzeCode}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-xs font-black hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-purple-500/20 active:scale-95"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              Submit
            </button>

            {/* Visualize Optimal Solution — appears after analysis completes */}
            {aiAnalysis && (
              <button
                onClick={() => setShowOptimizedModal(true)}
                className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-amber-500/30 active:scale-95"
                style={{ animation: 'fadeInRight 0.5s ease forwards' }}
              >
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white" />
                <Eye className="w-4 h-4" />
                Visualize Optimal
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[450px] border-r border-white/5 bg-[#0a121d] overflow-y-auto p-10 scrollbar-hide flex flex-col">
          <div className="flex items-center gap-2 mb-8">
             <div className="w-2 h-2 rounded-full bg-[#7B61FF] animate-pulse" />
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{selectedProblem.topicLabel} Breakdown</span>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-slate-400 space-y-8 mb-12">
            <p className="text-base font-medium leading-relaxed text-slate-300">{selectedProblem.description}</p>

            {selectedProblem.testCases && selectedProblem.testCases.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Example Cases
                </h4>
                {selectedProblem.testCases.slice(0, 2).map((tc, i) => (
                  <div key={i} className="font-mono text-[11px] bg-[#050912] p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex gap-4"><span className="text-slate-600 font-bold min-w-14">Input</span> <span className="text-slate-100">{tc.input}</span></div>
                    <div className="flex gap-4"><span className="text-slate-600 font-bold min-w-14">Output</span> <span className="text-slate-100 underline decoration-indigo-500 decoration-2">{tc.expected}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 to-transparent border border-white/5">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Master Hint</h4>
                <p className="text-xs italic leading-relaxed">Consider using an efficient approach to solve this challenge.</p>
              </div>
            )}
          </div>

          {aiAnalysis && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto pt-10 border-t border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                   <h3 className="text-white font-black flex items-center gap-2 text-sm uppercase tracking-tight">
                     AI Analysis Report
                     {aiAnalysis.passed ? (
                       <span className="flex items-center gap-1 text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                         <CheckCircle className="w-3 h-3" /> PASSED
                       </span>
                     ) : (
                       <span className="flex items-center gap-1 text-[9px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                         <AlertTriangle className="w-3 h-3" /> REVISE
                       </span>
                     )}
                   </h3>
                   <span className="text-[10px] text-slate-500 font-bold">Optimization Analysis v2.1</span>
                </div>
                <div className="relative">
                   <svg className="w-14 h-14 transform -rotate-90">
                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="150" strokeDashoffset={150 - (150 * aiAnalysis.score) / 100} className={aiAnalysis.score >= 70 ? "text-emerald-500" : "text-[#7B61FF]"} strokeLinecap="round" />
                   </svg>
                   <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">{aiAnalysis.score}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-8 h-8 text-[#7B61FF]" />
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Expert Feedback</p>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium italic">"{aiAnalysis.encouragement || aiAnalysis.currentApproach}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#050912] border border-white/5 relative overflow-hidden group hover:border-[#7B61FF]/30 transition-all">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Time Complexity</p>
                    <p className="text-xs text-white font-mono">{aiAnalysis.timeComplexity}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Target:</span>
                      <span className="text-[9px] text-emerald-400 font-bold font-mono">{aiAnalysis.optimalTimeComplexity}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#050912] border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20">
                      <Layers className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">Space Complexity</p>
                    <p className="text-xs text-emerald-400 font-mono">{aiAnalysis.spaceComplexity}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Target:</span>
                      <span className="text-[9px] text-emerald-400 font-bold font-mono">{aiAnalysis.optimalSpaceComplexity}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="p-4 rounded-2xl bg-[#7B61FF]/5 border border-[#7B61FF]/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black text-[#7B61FF] uppercase tracking-widest">Efficiency Rating</p>
                      <span className="text-[10px] font-bold text-white">{aiAnalysis.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${aiAnalysis.score}%` }}
                        className={`h-full bg-gradient-to-r ${aiAnalysis.score >= 70 ? 'from-emerald-500 to-teal-400' : 'from-[#7B61FF] to-[#F062D0]'}`} 
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowOptimizedModal(true)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Visualize Optimal Solution
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language}
              value={code}
              onChange={(val) => setCode(val)}
              options={{
                fontSize: 15,
                minimap: { enabled: false },
                scrollbar: { vertical: 'visible', horizontal: 'visible' },
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontWeight: '500',
                lineHeight: 1.6,
                cursorSmoothCaretAnimation: true,
                padding: { top: 30, left: 30 },
                quickSuggestions: { other: true, comments: true, strings: true },
                formatOnPaste: true,
                formatOnType: true,
                automaticLayout: true,
              }}
            />
            <div className="absolute top-8 right-10 pointer-events-none opacity-10">
              <Code2 className="w-24 h-24 text-white" />
            </div>
          </div>

          <div className="h-72 border-t border-white/5 bg-[#080D1A] flex flex-col">
            <div className="px-8 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setTerminalTab('terminal')}
                    className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${terminalTab === 'terminal' ? 'border-[#7B61FF] text-white' : 'border-transparent text-slate-500'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${terminalTab === 'terminal' ? 'bg-[#7B61FF]' : 'bg-slate-700'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Console</span>
                  </button>
                  <button 
                    onClick={() => setTerminalTab('testcase')}
                    className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${terminalTab === 'testcase' ? 'border-[#7B61FF] text-white' : 'border-transparent text-slate-500'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${terminalTab === 'testcase' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Testcases</span>
                  </button>
                </div>
                
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1 border border-white/5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Stdin</span>
                  <input 
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Input data here..."
                    className="bg-transparent border-none outline-none text-[11px] text-white font-mono w-40 placeholder:text-slate-700"
                  />
                </div>
              </div>
              <button onClick={() => { setOutput(null); setTestCaseResults([]); }} className="w-8 h-8 rounded-lg bg-white/5 text-slate-600 hover:text-white transition-all"><RotateCcw className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 p-8 font-mono text-[13px] overflow-auto bg-[#050912] leading-relaxed scrollbar-hide">
              {isRunning ? (
                <div className="flex items-center gap-3 text-[#7B61FF]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="animate-pulse">Executing code...</span>
                </div>
              ) : terminalTab === 'testcase' ? (
                <div className="space-y-6">
                  {testCaseResults.length > 0 ? (
                    testCaseResults.map((result, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${result.passed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            CASE {idx + 1}: {result.passed ? 'ACCEPTED' : 'WRONG ANSWER'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <p className="text-[8px] font-black text-slate-600 uppercase">Input</p>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-400 font-mono">{result.input}</div>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[8px] font-black text-slate-600 uppercase">Expected</p>
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-400 font-mono">{result.expected}</div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black text-slate-600 uppercase">Your Output</p>
                          <div className={`p-3 rounded-xl border font-mono text-[10px] ${result.passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                            {result.actual || '—'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-700 italic select-none">
                      Run code to see test case results
                    </div>
                  )}
                </div>
              ) : output ? (
                <div className="space-y-4">
                  {output.compileErr && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <p className="text-[10px] font-black text-rose-500 uppercase mb-2">Compilation Error</p>
                      <pre className="text-rose-400 whitespace-pre-wrap font-mono text-[11px]">{output.compileErr}</pre>
                    </div>
                  )}
                  {output.stderr && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[10px] font-black text-amber-500 uppercase mb-2">Runtime Error</p>
                      <pre className="text-amber-400 whitespace-pre-wrap font-mono text-[11px]">{output.stderr}</pre>
                    </div>
                  )}
                  {output.stdout && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Standard Output</p>
                      <pre className="text-emerald-400 whitespace-pre-wrap font-mono text-[11px]">{output.stdout}</pre>
                    </div>
                  )}
                  {!output.stdout && !output.stderr && !output.compileErr && (
                    <span className="text-slate-600 italic">Code executed with no output.</span>
                  )}
                  {/* Scroll Anchor */}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-800 italic select-none">
                   Terminal ready.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Code Visualization Modal */}
      <AnimatePresence>
        {showOptimizedModal && aiAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowOptimizedModal(false) }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-6xl h-[90vh] bg-[#0A0F1E] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#7B61FF]/10 border border-[#7B61FF]/20">
                    <Sparkles className="w-5 h-5 text-[#7B61FF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {aiAnalysis.optimizedApproachName || 'Optimal Strategy'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      {selectedProblem?.title} — Interactive Visualization
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      Time: {aiAnalysis.optimalTimeComplexity}
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-[#7B61FF]/10 border border-[#7B61FF]/20 text-[10px] font-black text-[#7B61FF] uppercase tracking-widest">
                      Space: {aiAnalysis.optimalSpaceComplexity}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowOptimizedModal(false)}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body — 2 columns: Viz (left) + Code (right) */}
              <div className="flex-1 flex overflow-hidden">

                {/* ─── Left: Algorithm Visualization ─── */}
                <div className="w-[45%] border-r border-white/5 bg-[#070D1B] p-6 overflow-y-auto">
                  <div className="mb-4">
                    <p className="text-[9px] font-black text-[#7B61FF] uppercase tracking-[0.2em] mb-1">Algorithm in Action</p>
                    <h4 className="text-sm font-black text-white">{selectedProblem?.topicLabel || 'Data Structure'} Visualization</h4>
                  </div>

                  <TopicVisualizer topic={selectedProblem?.topicLabel || selectedProblem?.topic || 'array'} />

                  {/* Improvements list */}
                  {aiAnalysis.improvements?.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <p className="text-[9px] font-black text-[#7B61FF] uppercase tracking-[0.2em]">Key Improvements</p>
                      {aiAnalysis.improvements.map((imp, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-lg bg-[#7B61FF]/10 border border-[#7B61FF]/20 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-[#7B61FF] mt-0.5">{i + 1}</div>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">{imp}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expert insight */}
                  <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#7B61FF]/10 to-transparent border border-[#7B61FF]/20">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Expert Insight</p>
                    <p className="text-xs text-slate-300 italic font-medium leading-relaxed">"{aiAnalysis.encouragement}"</p>
                  </div>
                </div>

                {/* ─── Right: Optimized Code ─── */}
                <div className="flex-1 bg-[#1e1e1e] relative flex flex-col">
                  <div className="absolute top-4 left-6 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      <Zap className="w-3 h-3" />
                      Optimal Code — {language.toUpperCase()}
                    </div>
                  </div>
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language}
                    value={aiAnalysis?.optimizedCode || '// No optimized code available\n// Please run Submit first to get AI analysis'}
                    options={{
                      readOnly: true,
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollbar: { vertical: 'visible', horizontal: 'hidden' },
                      lineNumbers: 'on',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontWeight: '500',
                      lineHeight: 1.6,
                      padding: { top: 56, left: 30 },
                      automaticLayout: true,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    )}
    </div>
  )
}
