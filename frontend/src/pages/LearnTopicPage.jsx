import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrayViz } from '@/components/visualizations/ArrayViz'
import { BinarySearchViz } from '@/components/visualizations/BinarySearchViz'
import { TreeViz } from '@/components/visualizations/TreeViz'
import { StackViz } from '@/components/visualizations/StackViz'
import { QueueViz } from '@/components/visualizations/QueueViz'
import { GraphViz } from '@/components/visualizations/GraphViz'
import { LinkedListViz } from '@/components/visualizations/LinkedListViz'
import { SortingViz } from '@/components/visualizations/SortingViz'
import { AiTutor } from '@/components/AiTutor'
import { QuickQuiz } from '@/components/QuickQuiz'
import {
  ArrowLeft, ChevronRight, BookOpen, Code2, PlayCircle,
  ListOrdered, Bot, CheckCircle2, Clipboard, ClipboardCheck,
  HelpCircle, Star, Target, Sparkles, ChevronLeft
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE_URL } from '@/src/config'

const steps = [
  { id: 'info',      label: 'Concept Info',   icon: BookOpen,    color: 'text-blue-400' },
  { id: 'visualize', label: 'Visualization',  icon: PlayCircle,  color: 'text-[#F062D0]' },
  { id: 'quiz',      label: 'Quick Quiz',     icon: HelpCircle,  color: 'text-amber-400' },
  { id: 'practice',  label: 'Practice',       icon: Target,      color: 'text-[#10B981]' },
]

export default function LearnTopicPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [aiOpen, setAiOpen]         = useState(false)
  const [progress, setProgress] = useState(null)
  const [quizScore, setQuizScore] = useState(null)
  const [infoLang, setInfoLang] = useState('cpp')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const tr = await fetch(`${API_BASE_URL}/topics/${topicId}`)
        const td = await tr.json()
        if (td.data) setTopic(td.data)

        const token = localStorage.getItem('av_token')
        if (token) {
          const pr = await fetch(`${API_BASE_URL}/progress/topic/${topicId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const pd = await pr.json()
          setProgress(pd)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [topicId])

  const markComplete = async () => {
    const token = localStorage.getItem('av_token')
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/progress/topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topicId,
          completed: true,
          stepReached: topic.total
        })
      })
      if (res.ok) {
        const data = await res.json()
        setProgress(data)
      }
    } catch (err) {
      console.error('Save progress error:', err)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleQuizComplete = (score) => {
    setQuizScore(score)
    markComplete() // Auto-mark complete when quiz is done
  }

  // Visualizer Mapping
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
        <p className="text-[#94A3B8] text-sm font-medium">Preparing your lesson...</p>
      </div>
    </div>
  )

  if (!topic) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07111C]">
      <div className="text-center">
        <p className="text-white text-xl font-bold mb-4">Topic not found</p>
        <Link to="/learn" className="text-[#7B61FF] hover:underline font-semibold">← Back to topics</Link>
      </div>
    </div>
  )

  const isCompleted = progress?.completed || false;
  const activeStepId = steps[currentStep].id

  return (
    <div className="min-h-screen bg-[#07111C] relative flex flex-col lg:flex-row">
      <AiTutor topic={topicId} isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Sidebar: Progress Stepper */}
      <aside className="w-full lg:w-80 border-r border-white/5 bg-[#0A0F1E] flex flex-col flex-shrink-0">
        <div className="p-6">
          <Link to="/learn" className="inline-flex items-center gap-2 text-[#64748B] hover:text-white transition-colors mb-8 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>

          <div className="mb-10">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 border border-white/10 ${
              topic.difficulty === 'Easy' ? 'text-emerald-400' : topic.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400'
            }`}>{topic.difficulty} LEVEL</span>
            <h1 className="text-2xl font-black text-white mt-3 leading-tight">{topic.title}</h1>
            <p className="text-xs text-[#64748B] mt-2 font-medium">Approx. 15 mins to complete</p>
          </div>

          <nav className="relative space-y-2">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-white/5" />
            
            {steps.map((s, idx) => {
              const Icon = s.icon
              const isPast = idx < currentStep
              const isActive = idx === currentStep
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-full relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group ${
                    isActive ? 'bg-[#7B61FF]/10 ring-1 ring-[#7B61FF]/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                    isPast ? 'bg-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 
                    isActive ? 'bg-[#7B61FF] shadow-[0_0_15px_rgba(123,97,255,0.3)]' : 'bg-[#1e293b] border border-white/10'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#64748B] group-hover:text-white'}`} />}
                  </div>
                  <div className="text-left">
                    <p className={`text-[10px] uppercase tracking-tighter font-bold ${isActive ? 'text-[#7B61FF]' : 'text-[#475569]'}`}>Step {idx + 1}</p>
                    <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#CBD5E1]'}`}>{s.label}</p>
                  </div>
                </button>
              )
            })}
          </nav>

          <div className="mt-12 p-5 rounded-2xl bg-gradient-to-br from-[#7B61FF]/10 to-[#F062D0]/5 border border-white/5 relative overflow-hidden group">
             <Bot className="absolute -bottom-2 -right-2 w-16 h-16 text-white/5 rotate-12 transition-transform group-hover:rotate-0" />
             <p className="text-xs font-bold text-white mb-2 flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-amber-400" /> Stuck?
             </p>
             <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-4">Our AI Tutor is ready to explain complex parts of this topic.</p>
             <button 
               onClick={() => setAiOpen(true)}
               className="w-full py-2 rounded-xl bg-white text-[#0A0F1E] text-xs font-bold hover:bg-opacity-90 transition-all"
             >
               Ask AI Tutor
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen flex flex-col relative overflow-hidden">
        {/* Background Aura */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7B61FF]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="flex-1 p-6 lg:p-12 relative z-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            
            {/* Dynamic Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStepId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
              
              {activeStepId === 'info' && (
                <div className="space-y-8">
                  <header>
                    <div className="flex items-center gap-2 text-[#7B61FF] text-sm font-bold uppercase tracking-widest mb-3">
                      <BookOpen className="w-4 h-4" /> Concept Information
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Mastering {topic.title}</h2>
                  </header>

                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                    <div className="prose prose-invert max-w-none prose-p:text-[#CBD5E1] prose-p:leading-relaxed prose-headings:text-white prose-strong:text-[#F062D0] whitespace-pre-line text-base">
                      {topic.content?.explanation}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                       <h4 className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2">
                         <Star className="w-4 h-4" /> Why it matters?
                       </h4>
                       <p className="text-xs text-[#94A3B8] leading-relaxed">Understanding {topic.id} is fundamental for more complex patterns like DP and Graph algorithms.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all">
                       <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                         <Target className="w-4 h-4" /> Key Goal
                       </h4>
                       <p className="text-xs text-[#94A3B8] leading-relaxed">Focus on the time-space trade-offs and how data is physical arranged in memory.</p>
                    </div>
                  </div>

                  {(topic.content?.cppCode || topic.content?.javaCode || topic.content?.pythonCode) && (
                    <div className="mt-8 bg-[#0c1a27] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                      <div className="flex items-center gap-2 px-6 py-4 bg-white/5 border-b border-white/10">
                        <Code2 className="w-4 h-4 text-[#7B61FF]" />
                        <span className="text-sm font-bold text-white mr-4">Starter Snippets</span>
                        {['cpp', 'java', 'python'].map(lang => {
                          const codeKey = `${lang}Code`
                          if (!topic.content[codeKey]) return null
                          return (
                            <button 
                              key={lang}
                              onClick={() => setInfoLang(lang)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${infoLang === lang ? 'bg-[#7B61FF] text-white shadow-lg' : 'bg-white/5 text-[#64748B] hover:text-white hover:bg-white/10'}`}
                            >
                              {lang}
                            </button>
                          )
                        })}
                      </div>
                      <div className="p-6 overflow-x-auto">
                        <pre className="text-[13px] font-mono leading-relaxed text-[#CBD5E1]">
                          <code>{topic.content[`${infoLang}Code`] || topic.content.cppCode || topic.content.pythonCode}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeStepId === 'visualize' && (
                <div className="space-y-8">
                  <header>
                    <div className="flex items-center gap-2 text-[#F062D0] text-sm font-bold uppercase tracking-widest mb-3">
                      <PlayCircle className="w-4 h-4" /> Interactive Visualizer
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">See how {topic.title} works</h2>
                    <p className="text-[#94A3B8] mt-3 text-lg leading-relaxed">Play around with the logic and watch the data structures change in real-time.</p>
                  </header>

                  <div className="bg-[#0c1a27] border border-white/5 rounded-3xl p-8 shadow-2xl relative group">
                    <div className="absolute inset-0 bg-[#7B61FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <VizComponent {...vizProps} />
                  </div>
                </div>
              )}

              {activeStepId === 'quiz' && (
                <div className="space-y-8">
                  <header className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-widest mb-3 bg-amber-400/10 px-4 py-1.5 rounded-full">
                      <HelpCircle className="w-4 h-4" /> Knowledge Check
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Quick Checkpoint</h2>
                    <p className="text-[#94A3B8] mt-3">Let's verify your understanding before moving to practice.</p>
                  </header>

                  <div className="max-w-2xl mx-auto bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative">
                    <QuickQuiz 
                      questions={topic.content?.quiz || []} 
                      onComplete={handleQuizComplete} 
                    />
                  </div>
                </div>
              )}

              {activeStepId === 'practice' && (
                <div className="space-y-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center shadow-2xl shadow-purple-500/40 relative animate-bounce-slow">
                    <Target className="w-12 h-12 text-white" />
                    <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-amber-400" />
                  </div>
                  
                  <div className="max-w-xl">
                    <h2 className="text-4xl font-black text-white mb-4">You're Ready to Code!</h2>
                    <p className="text-lg text-[#94A3B8] leading-relaxed mb-10">
                      You've finished the conceptual journey of **{topic.title}**. Now it's time to test your skills in the Practice Arena.
                    </p>
                    
                    <Link 
                      to={`/practice?topic=${topic.title}`}
                      className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-[#0A0F1E] font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                    >
                      Open Practice Arena <ChevronRight className="w-6 h-6" />
                    </Link>
                    
                    <div className="mt-8 flex justify-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{topic.total}</p>
                        <p className="text-[10px] uppercase text-[#64748B] font-black">Problems</p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">500+</p>
                        <p className="text-[10px] uppercase text-[#64748B] font-black">XP Earned</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Sticky Navigation Footer */}
          {activeStepId !== 'practice' && (
              <div className="mt-16 flex items-center justify-between py-6 border-t border-white/5">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all font-bold text-sm disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous Step
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={activeStepId === 'quiz' && quizScore === null && !isCompleted}
                  className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white font-black text-sm shadow-[0_0_20px_rgba(123,97,255,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                >
                  {currentStep === steps.length - 2 ? 'Final Step' : 'Next Step'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  )
}
