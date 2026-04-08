import { useState } from 'react'
import { RotateCcw, Loader2, Terminal, ListChecks, CheckCircle2, XCircle } from 'lucide-react'

export function OutputPanel({ isRunning, output, onClear, testCases }) {
  const [activeTab, setActiveTab] = useState('output') // 'output' | 'tests'

  return (
    <div className="flex-1 flex flex-col bg-[#080D1A] min-h-0 border-t border-white/5">
      {/* Tabs */}
      <div className="flex items-center px-6 border-b border-white/5 bg-white/[0.02]">
        <button 
          onClick={() => setActiveTab('output')}
          className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'output' ? 'border-[#7B61FF] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" /> Output
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'tests' ? 'border-[#7B61FF] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center gap-2">
            <ListChecks className="w-3.5 h-3.5" /> Test Cases
          </div>
        </button>
        <div className="ml-auto">
          <button onClick={onClear} className="w-8 h-8 rounded-lg bg-white/5 text-slate-500 flex justify-center items-center hover:text-white hover:bg-white/10 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#050912] p-6 font-mono text-[13px] text-slate-300 leading-relaxed">
        {activeTab === 'output' && (
          <>
            {isRunning ? (
              <div className="flex items-center gap-3 text-[#7B61FF]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="animate-pulse font-sans">Running code...</span>
              </div>
            ) : output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-700 italic select-none font-sans font-medium">
                Execution output will appear here after running.
              </div>
            )}
          </>
        )}

        {activeTab === 'tests' && (
           <div className="space-y-4 font-sans">
              {testCases ? testCases.map((tc, idx) => (
                 <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#7B61FF]">Case {idx + 1}</span>
                    </div>
                    <div><span className="text-slate-500 font-bold text-xs uppercase mr-2">Input:</span><span className="text-white text-sm font-mono">{tc.input}</span></div>
                    <div><span className="text-slate-500 font-bold text-xs uppercase mr-2">Expected:</span><span className="text-emerald-400 text-sm font-mono">{tc.expected}</span></div>
                 </div>
              )) : (
                <div className="h-full flex px-4 py-8 items-center justify-center text-slate-700 italic select-none font-medium">
                  Submit code to see hidden test case results.
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  )
}
