import { motion } from 'framer-motion'
import { Eye, Network, Zap } from 'lucide-react'

export function VisualizationPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-50 bg-[#0A0F1E]">
        <Eye className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="text-slate-400 font-bold mb-2">Visualization Unavailable</h3>
        <p className="text-slate-500 text-sm max-w-[240px]">Submit code to visualize the optimal approach.</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-auto bg-[#0A0F1E] p-6">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-black text-sm uppercase tracking-tight">Optimal Flow Visualization</h3>
          <p className="text-[10px] font-bold text-slate-500">Conceptual trace of O({analysis.optimalComplexity})</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-[2rem] bg-[#050912] border border-white/5 shadow-inner">
          <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2"><Zap className="w-3 h-3"/> Pseudocode Route</span>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-loose">
            {analysis.optimizedPseudocode || "No pseudocode generated. Consider rewriting using optimal patterns discussed."}
          </pre>
        </div>

        <div className="p-6 rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full"></div>
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3">Memory Footprint</h4>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">To achieve the optimal constraint, the data structures visualized here scale linearly or logarithmically, keeping overhead low.</p>
        </div>
      </div>
    </motion.div>
  )
}
