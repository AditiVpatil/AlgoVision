import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE_URL } from '@/src/config'
import { ChevronLeft, Play, Brain, Loader2, Sparkles, LayoutPanelLeft } from 'lucide-react'

import { CodeEditor } from '@/components/problem/CodeEditor'
import { OutputPanel } from '@/components/problem/OutputPanel'
import { AIAnalysisPanel } from '@/components/problem/AIAnalysisPanel'
import { VisualizationPanel } from '@/components/problem/VisualizationPanel'

const starters = {
  python: `def solve(nums, target):\n    # Write your solution here\n    pass\n\n# Test call\nprint(solve([2, 7, 11, 15], 9))`,
  java: `public class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        // sol.solve(...)\n    }\n}`,
  javascript: `function solve(nums, target) {\n    // Write your solution here\n}\n\nconsole.log(solve([2, 7, 11, 15], 9));`,
  cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nvector<int> solve(vector<int>& nums, int target) {\n    // Write your solution here\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    int target = 9;\n    solve(nums, target);\n    return 0;\n}`,
}

export default function ProblemSolverPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  
  const [rightPaneView, setRightPaneView] = useState('ai') // 'ai' | 'visual'

  useEffect(() => {
    fetch(`${API_BASE_URL}/problems`).then(r => r.json()).then(data => {
      const p = data.data?.find(x => x.id.toString() === id.toString())
      if (p) {
        setProblem(p)
        setCode(p.starters ? p.starters[language] : starters[language])
      } else {
        setProblem({
          id, title: "Custom Challenge", description: "Solve the problem based on the instructions provided here.",
          difficulty: "Medium", topicLabel: "General", 
          testCases: [{ input: "example", expected: "example output" }]
        })
        setCode(starters[language])
      }
    })
  }, [id])

  if (!problem) return <div className="h-screen flex items-center justify-center bg-[#07111C]"><Loader2 className="animate-spin text-[#7B61FF]" /></div>

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running code...')
    try {
      const token = localStorage.getItem('av_token')
      const res = await fetch(`${API_BASE_URL}/code/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
    setIsAnalyzing(true)
    setRightPaneView('ai')
    
    // Simulate submission run locally before ai
    setOutput('Running hidden test cases...')
    await runCode()

    try {
      const token = localStorage.getItem('av_token')
      const res = await fetch(`${API_BASE_URL}/code/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          code, language,
          problemId: problem.id,
          problemDescription: problem.description,
          topicId: problem.topic || 'general',
          optimalComplexity: 'O(N)' // Mocking since it might not be in DB
        }),
      })
      const data = await res.json()
      setAiAnalysis(data)
    } catch (err) {
      alert('Analysis failed: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen bg-[#07111C] flex flex-col overflow-hidden">
      {/* Navbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0F1E] flex-shrink-0 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white px-2 py-0.5 rounded bg-white/10 uppercase tracking-widest">{problem.difficulty}</span>
            <h2 className="text-white font-black text-sm tracking-tight">{problem.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={language} onChange={(e) => { 
              const newLang = e.target.value
              setLanguage(newLang)
              setCode(problem?.starters ? problem.starters[newLang] : starters[newLang]) 
            }}
            className="bg-[#050912] border border-white/10 text-slate-300 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          <button onClick={runCode} disabled={isRunning} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black hover:bg-emerald-500 hover:text-white transition-all">
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Play className="w-3.5 h-3.5"/>} Run
          </button>
          
          <button onClick={analyzeCode} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#7B61FF] to-[#D55AF0] text-white text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Brain className="w-3.5 h-3.5"/>} Submit & Analyze
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Description */}
        <div className="w-[350px] border-r border-white/5 bg-[#0a121d] flex flex-col">
           <div className="px-6 py-4 border-b border-white/5"><h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayoutPanelLeft className="w-4 h-4"/> Problem Description</h3></div>
           <div className="flex-1 overflow-auto p-6 scrollbar-hide text-slate-300">
             <p className="text-sm leading-relaxed mb-6 font-medium">{problem.description}</p>
             <div className="bg-[#050912] p-5 rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3"/> Example</h4>
                {problem.testCases ? (
                  <div className="space-y-2">
                    <p className="text-xs font-mono"><span className="text-slate-500 font-bold">In:</span> {problem.testCases[0]?.input}</p>
                    <p className="text-xs font-mono text-emerald-400"><span className="text-slate-500 font-bold">Out:</span> {problem.testCases[0]?.expected}</p>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500">No examples provided.</p>
                )}
             </div>
           </div>
        </div>

        {/* Center Pane: Editor + Output */}
        <div className="flex-1 flex flex-col border-r border-white/5">
          <CodeEditor code={code} language={language} onChange={setCode} />
          <div className="h-[250px] flex flex-col border-t border-white/5">
            <OutputPanel isRunning={isRunning} output={output} onClear={() => setOutput('')} testCases={problem.testCases} />
          </div>
        </div>

        {/* Right Pane: AI / Visualizer */}
        <div className="w-[380px] bg-[#0c1322] flex flex-col">
          <div className="flex p-2 bg-[#050912] border-b border-white/5 gap-1">
             <button onClick={() => setRightPaneView('ai')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${rightPaneView === 'ai' ? 'bg-[#7B61FF]/10 text-[#7B61FF]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Analysis</button>
             <button onClick={() => setRightPaneView('visual')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${rightPaneView === 'visual' ? 'bg-[#7B61FF]/10 text-[#7B61FF]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Visualize</button>
          </div>
          <AnimatePresence mode="wait">
             {rightPaneView === 'ai' ? (
                <AIAnalysisPanel key="ai" analysis={aiAnalysis} isAnalyzing={isAnalyzing} />
             ) : (
                <VisualizationPanel key="visual" analysis={aiAnalysis} />
             )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
