import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, Train, Database, Link as LinkIcon, 
  History, Music, RotateCcw, Map, Sparkles,
  ArrowRightCircle, CheckCircle2, ChevronRight,
  Bot
} from 'lucide-react'

export function LinkedListStory({ onNext, onOpenAi }) {
  const { scrollYProgress } = useScroll()
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-32 pb-32">
      {/* 1. HERO INTRO */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">Interactive Journey</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white leading-tight mb-6">
            Imagine a Train.
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Where the tracks don't exist, and every coach only knows the location of the <span className="text-white font-bold">next coach</span>.
          </p>
        </motion.div>

        {/* Animated Train Coaches / Nodes */}
        <div className="flex items-center justify-center gap-4 mt-20 relative w-full max-w-3xl">
          {[1, 2, 3].map((node, i) => (
            <motion.div 
              key={node}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 + (i * 0.4) }}
              className="flex items-center"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl flex flex-col items-center justify-center relative group">
                <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Train className="w-8 h-8 text-purple-400 mb-2" />
                <span className="text-xs font-bold text-slate-400">Coach {node}</span>
              </div>
              {i < 2 && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 48, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 + (i * 0.4) }}
                  className="mx-2 flex items-center justify-center overflow-hidden"
                >
                  <ArrowRight className="text-purple-500 w-8 h-8" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 2. WHAT IS A LINKED LIST? */}
      <section className="relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-black text-white mb-6">What is a Linked List?</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">
              Instead of storing data together in a continuous block, a Linked List scatters data across memory. 
            </p>
            <p className="text-lg text-slate-400 leading-relaxed">
              It connects them using <strong className="text-emerald-400 font-bold">Pointers</strong>. Each piece of data is called a <strong className="text-white">Node</strong>.
            </p>
          </div>
          
          {/* Visual Node Explanation */}
          <motion.div 
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>
            
            <div className="flex items-stretch h-32 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl relative z-10 overflow-hidden group">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-slate-700 bg-slate-800/80 group-hover:bg-slate-700/50 transition-colors">
                <Database className="w-8 h-8 text-white mb-2" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">DATA</span>
                <span className="text-lg font-bold text-white mt-1">"42"</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center bg-emerald-950/30 group-hover:bg-emerald-900/40 transition-colors">
                <LinkIcon className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-500">POINTER</span>
                <span className="text-[10px] font-mono text-emerald-400/70 mt-1">0x8F9A →</span>
              </div>
            </div>
            <p className="text-center mt-6 text-sm font-bold text-slate-500 uppercase tracking-widest">Anatomy of a Node</p>
          </motion.div>
        </div>
      </section>

      {/* 3. TRAVERSAL */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-black text-white mb-4">The Catch: Sequential Traversal</h2>
        <p className="text-slate-400 text-lg mb-16 max-w-2xl mx-auto">
          You can't just jump to the 3rd node. You have to start at the <span className="text-white font-bold">Head</span> and ask for directions at every stop.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 relative">
          {[1, 2, 3, 4].map((node, i) => (
            <motion.div 
              key={node}
              initial={{ opacity: 0.3 }}
              whileInView={{ opacity: 1, scale: 1.1, zIndex: 10 }}
              viewport={{ margin: "-200px 0px -200px 0px", once: false, amount: "all" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex items-center"
            >
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center shadow-lg border relative transition-all duration-300
                ${i === 0 ? 'bg-purple-900/40 border-purple-500' : 'bg-slate-800 border-slate-700'}`}
              >
                {i === 0 && <span className="absolute -top-6 text-[10px] font-bold text-purple-400 uppercase tracking-widest">Head</span>}
                <span className="text-xl font-black text-white">{node}</span>
              </div>
              {i < 3 && (
                <ArrowRight className="text-slate-600 w-6 h-6 mx-2" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. WHY NOT ARRAYS? */}
      <section className="relative py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Why Not Just Use Arrays?</h2>
          <p className="text-slate-400">Arrays are rigid. Linked Lists are flexible.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Arrays */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
            <h3 className="text-xl font-bold text-rose-400 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" /> Arrays
            </h3>
            <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-inner mb-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="flex-1 py-4 border-r border-slate-700 text-center text-slate-300 font-mono last:border-0">{n}</div>
              ))}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Require a <strong className="text-white">continuous block</strong> of memory. If you run out of space, you have to move the entire array to a larger room.
            </p>
          </div>

          {/* Linked Lists */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full"></div>
            <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" /> Linked Lists
            </h3>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {[1, 2, 3].map((n, i) => (
                <motion.div 
                  key={n}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="px-4 py-3 rounded-lg bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 font-mono shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    {n}
                  </div>
                  {i < 2 && <ArrowRight className="text-emerald-500/50 w-4 h-4" />}
                </motion.div>
              ))}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="px-4 py-3 rounded-lg bg-emerald-500 border border-emerald-400 text-white font-mono shadow-[0_0_20px_rgba(16,185,129,0.4)] ml-4"
              >
                + New Node
              </motion.div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed relative z-10">
              Grow dynamically. Need more space? Just grab any available spot in memory and point to it. <strong className="text-white">No moving required.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* 5. TYPES OF LINKED LISTS */}
      <section>
        <h2 className="text-3xl font-black text-white mb-10 text-center">Flavors of Linked Lists</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Singly Linked', desc: 'One-way street. Nodes only know the next node.', icon: ArrowRight, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
            { title: 'Doubly Linked', desc: 'Two-way street. Nodes know both next and previous.', icon: ArrowRightCircle, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
            { title: 'Circular Linked', desc: 'Infinite loop. The last node connects back to the first.', icon: RotateCcw, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20' }
          ].map((type, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl ${type.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <type.icon className={`w-6 h-6 ${type.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
              <p className="text-sm text-slate-400">{type.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. REAL WORLD APPS */}
      <section>
        <h2 className="text-3xl font-black text-white mb-10 text-center">Where are they used?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: History, label: 'Browser History', desc: 'Going back and forward (Doubly Linked)' },
            { icon: Music, label: 'Music Playlists', desc: 'Looping tracks (Circular Linked)' },
            { icon: RotateCcw, label: 'Undo / Redo', desc: 'State management in text editors' },
            { icon: Map, label: 'Navigation Maps', desc: 'Connecting paths and routes' },
          ].map((app, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800"
            >
              <app.icon className="w-8 h-8 text-white/50 mb-4" />
              <h4 className="text-white font-bold mb-2">{app.label}</h4>
              <p className="text-xs text-slate-400">{app.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7. AI TUTOR CONTEXTUAL */}
      <section className="py-12">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20 relative overflow-hidden flex flex-col items-center text-center">
          <Bot className="absolute -bottom-10 -right-10 w-64 h-64 text-purple-500/10 rotate-12 pointer-events-none" />
          
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Still have questions?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">Click any question below to ask your personalized AI Tutor in real-time.</p>
          
          <div className="flex flex-wrap justify-center gap-3 relative z-10">
            {[
              "Why is random access slower in Linked Lists?",
              "When should I definitely avoid Linked Lists?",
              "What happens if a node pointer breaks?"
            ].map((q, i) => (
              <button 
                key={i}
                onClick={onOpenAi}
                className="px-5 py-3 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-purple-500 hover:bg-purple-500/10 text-sm font-medium text-slate-300 hover:text-white transition-all text-left flex items-center gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA VISUALIZATION */}
      <section className="text-center pt-20 pb-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex flex-col items-center"
        >
          <h2 className="text-4xl font-black text-white mb-4">Enough Theory.</h2>
          <p className="text-xl text-slate-400 mb-10">Let's SEE how Linked Lists behave in memory.</p>
          
          <button 
            onClick={onNext}
            className="group relative px-8 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xl overflow-hidden shadow-[0_0_40px_rgba(123,97,255,0.4)] hover:shadow-[0_0_60px_rgba(123,97,255,0.6)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10">Launch Visualization</span>
            <ChevronRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>
    </div>
  )
}
