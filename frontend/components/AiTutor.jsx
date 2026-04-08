import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, X } from 'lucide-react'

import { API_BASE_URL } from '@/src/config'

export function AiTutor({ topic, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi! I'm your AI tutor 🤖\n\nAsk me anything about **${topic || 'DSA'}** — explanations, hints, complexity analysis, or how to approach a problem!`,
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return

    const token = localStorage.getItem('av_token')
    if (!token) {
      setMessages((prev) => [
        ...prev, 
        { role: 'user', text: q, ts: Date.now() },
        { role: 'assistant', text: '🔒 Please log in to chat with the AI tutor.', ts: Date.now() }
      ])
      setInput('')
      return
    }

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: q, ts: Date.now() }])
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/ask-ai`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: q, topic }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', text: data.data?.answer || 'Sorry, I could not get an answer.', ts: Date.now() }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: '⚠️ Could not reach the AI server. Make sure the backend is running.', ts: Date.now() }])
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[560px] flex flex-col rounded-2xl border border-white/10 bg-[#0A0F1E]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#7B61FF]/20 to-[#F062D0]/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Tutor</p>
            <p className="text-[10px] text-[#7B61FF]">● Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[#64748B] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 380 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-gradient-to-br from-[#7B61FF] to-[#F062D0]' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
              {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'assistant'
                ? 'bg-white/5 border border-white/10 text-[#CBD5E1] rounded-tl-sm'
                : 'bg-gradient-to-br from-[#7B61FF] to-[#F062D0] text-white rounded-tr-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-4 h-4 text-[#7B61FF] animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#7B61FF]/50 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask a doubt..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#64748B] outline-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-[#64748B] text-center mt-2">Press Enter to send</p>
      </div>
    </div>
  )
}
