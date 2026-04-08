import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { AnimatedBackground } from '@/components/animated-background'
import {
  CheckCircle2, Circle, ChevronRight, ExternalLink,
  Filter, Search, Sparkles, Zap, Code2, Bot, Play,
  Send, Maximize2, Minimize2, RotateCcw, AlertTriangle,
  Loader2, Cpu, Brain, CheckCircle, Info, Layers, 
  GitBranch, Network, Box, ChevronLeft, LayoutGrid, ArrowRight,
  Bookmark, BookmarkCheck
} from 'lucide-react'
import { AiTutor } from '@/components/AiTutor'

import { API_BASE_URL } from '@/src/config'
import { motion, AnimatePresence } from 'framer-motion'

const iconMap = { Layers, Search, GitBranch, Network, Box, Zap }

const starters = {
  python: `def solve(nums, target):\n    # Write your solution here\n    pass\n\n# Test call\nprint(solve([2, 7, 11, 15], 9))`,
  java: `public class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        // sol.solve(...)\n    }\n}`,
  javascript: `function solve(nums, target) {\n    // Write your solution here\n}\n\nconsole.log(solve([2, 7, 11, 15], 9));`,
  cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nvector<int> solve(vector<int>& nums, int target) {\n    // Write your solution here\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    int target = 9;\n    solve(nums, target);\n    return 0;\n}`,
}

export default function PracticePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTopic = searchParams.get('topic') || 'All'

  const [problems, setProblems] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [view, setSelectedView] = useState('list') // 'list' | 'editor'

  const [code, setCode] = useState(starters.python)
  const [language, setLanguage] = useState('python')
  const [output, setOutput] = useState('')
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
    setOutput('Running code...')
    try {
      const token = localStorage.getItem('av_token')
      const res = await fetch(`${API_BASE_URL}/code/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, language }),
      })
      const data = await res.json()
      setOutput(data.output || 'No output')
    } catch (err) {
      setOutput('Error: ' + err.message)
    } finally {
      setIsRunning(false)
    }
  }

  const analyzeCode = async () => {
    if (!selectedProblem) return
    setIsAnalyzing(true)
    setAiAnalysis(null)
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
          topicId: selectedProblem.topic || 'general'
        }),
      })
      const data = await res.json()
      setAiAnalysis(data)
      
      if ((data.score >= 70 || data.passed) && !solved.includes(selectedProblem.id)) {
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
    navigate(`/problem/${problem.id}`)
  }

  const filtered = problems.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchDiff = diffFilter === 'All' || p.difficulty === diffFilter
    const normalizedTopic = topicFilter.toLowerCase().replace(/s$/, '')
    const normalizedProblemTopic = p.topicLabel.toLowerCase().replace(/s$/, '')
    const matchTopic = topicFilter === 'All' || normalizedProblemTopic.includes(normalizedTopic)
    return matchSearch && matchDiff && matchTopic
  })

  // ---- LIST VIEW ----
  if (view === 'list') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen relative flex flex-col"
      >
        <AnimatedBackground />
        <AiTutor topic="general" isOpen={aiOpen} onClose={() => setAiOpen(false)} />
        
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
      </motion.div>
    )
  }

  // ---- EDITOR VIEW ----
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      className="h-screen flex flex-col overflow-hidden"
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
                onClick={() => { setLanguage(l); setCode(starters[l]) }}
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

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500" /> Example Case
              </h4>
              <div className="font-mono text-[11px] bg-[#050912] p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex gap-4"><span className="text-slate-600 font-bold min-w-14">Input</span> <span className="text-slate-100">nums = [2,7,11,15], target = 9</span></div>
                <div className="flex gap-4"><span className="text-slate-600 font-bold min-w-14">Output</span> <span className="text-slate-100 underline decoration-indigo-500 decoration-2">[0,1]</span></div>
              </div>
            </div>
            
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 to-transparent border border-white/5">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Master Hint</h4>
              <p className="text-xs italic leading-relaxed">Consider using a Hash map to achieve O(n) time complexity by storing seen values as you iterate.</p>
            </div>
          </div>

          {aiAnalysis && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto pt-10 border-t border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                   <h3 className="text-white font-black flex items-center gap-2 text-sm uppercase tracking-tight">AI Report Summary</h3>
                   <span className="text-[10px] text-slate-500 font-bold">Optimization Analysis v2.1</span>
                </div>
                <div className="relative">
                   <svg className="w-14 h-14 transform -rotate-90">
                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="150" strokeDashoffset={150 - (150 * aiAnalysis.score) / 100} className="text-[#7B61FF]" strokeLinecap="round" />
                   </svg>
                   <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">{aiAnalysis.score}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Observation</p>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium italic">"{aiAnalysis.encouragement || aiAnalysis.currentApproach}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#050912] border border-white/5">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Detected</p>
                    <p className="text-xs text-white font-mono">{aiAnalysis.yourComplexity}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#050912] border border-white/5">
                    <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">Target</p>
                    <p className="text-xs text-emerald-400 font-mono">{aiAnalysis.optimalComplexity}</p>
                  </div>
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
              language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'cpp'}
              value={code}
              onChange={(val) => setCode(val)}
              options={{
                fontSize: 15,
                minimap: { enabled: false },
                scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                lineNumbers: 'on',
                glyphMargin: false,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontWeight: '500',
                lineHeight: 1.6,
                cursorSmoothCaretAnimation: 'on',
                padding: { top: 30, left: 30 },
              }}
            />
            <div className="absolute top-8 right-10 pointer-events-none opacity-10">
              <Code2 className="w-24 h-24 text-white" />
            </div>
          </div>

          <div className="h-64 border-t border-white/5 bg-[#080D1A] flex flex-col">
            <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Output Terminal</span>
              </div>
              <button onClick={() => setOutput('')} className="w-8 h-8 rounded-lg bg-white/5 text-slate-600 hover:text-white transition-all"><RotateCcw className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 p-8 font-mono text-[13px] overflow-auto text-slate-300 bg-[#050912] leading-relaxed">
              {isRunning ? (
                <div className="flex items-center gap-3 text-[#7B61FF]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="animate-pulse">Running test cases against Piston API...</span>
                </div>
              ) : output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-800 italic select-none">
                   Execution output will appear here after running tests.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
