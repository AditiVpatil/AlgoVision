import { Brain, Star, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function AIAnalysisPanel({ analysis, isAnalyzing }) {
  if (isAnalyzing) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-[#7B61FF]/20 border-t-[#7B61FF] animate-spin" />
          <Brain className="absolute inset-0 m-auto w-6 h-6 text-[#7B61FF] animate-pulse" />
        </div>
        <h3 className="text-white font-bold mb-2">Analyzing Optimization...</h3>
        <p className="text-slate-500 text-sm max-w-[200px]">The AI is evaluating space and time complexities.</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-50">
        <Brain className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="text-slate-400 font-bold mb-2">No Analysis Yet</h3>
        <p className="text-slate-500 text-sm max-w-[240px]">Submit your solution to get an AI optimization score and detailed feedback.</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 overflow-auto scrollbar-hide">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <div className="flex flex-col">
           <h3 className="text-white font-black flex items-center gap-2 text-sm uppercase tracking-tight">Optimization Score</h3>
           <span className="text-[10px] text-slate-500 font-bold">Powered by OpenAI</span>
        </div>
        <div className="relative">
           <svg className="w-16 h-16 transform -rotate-90">
             <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
             <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="176" strokeDashoffset={176 - (176 * analysis.score) / 100} className="text-[#7B61FF]" strokeLinecap="round" />
           </svg>
           <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{analysis.score}%</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#7B61FF]/10 to-transparent border border-[#7B61FF]/20">
          <p className="text-[9px] font-black text-[#7B61FF] uppercase tracking-[0.2em] mb-3">Feedback</p>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">"{analysis.encouragement || analysis.currentApproach}"</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Detected Complexity</p>
            <p className="text-lg text-white font-mono font-black">{analysis.yourComplexity}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[9px] font-black text-emerald-500 uppercase mb-2">Optimal Complexity</p>
            <p className="text-lg text-emerald-400 font-mono font-black">{analysis.optimalComplexity}</p>
          </div>
        </div>

        {analysis.improvements && analysis.improvements.length > 0 && (
          <div className="pt-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Suggested Improvements</h4>
            <div className="space-y-3">
              {analysis.improvements.map((imp, idx) => (
                <div key={idx} className="flex gap-3 text-sm text-slate-300">
                  <div className="mt-1 flex-shrink-0"><CheckCircle2 className="w-4 h-4 text-[#7B61FF]" /></div>
                  <p className="leading-relaxed">{imp}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
