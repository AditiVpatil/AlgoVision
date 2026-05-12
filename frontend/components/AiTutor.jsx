import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, X, RotateCcw, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { API_BASE_URL } from '@/src/config'

export function AiTutor({ topic, isOpen, onClose, code = '' }) {
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(`av_chat_${topic || 'general'}`)
    return saved ? JSON.parse(saved) : [
      {
        role: 'assistant',
        text: `Hi! I'm your AI tutor 🤖\n\nAsk me anything about **${topic || 'DSA'}** — explanations, hints, complexity analysis, or how to approach a problem!`,
        ts: Date.now(),
      },
    ]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef(null)

  // Load history when topic changes
  useEffect(() => {
    const saved = sessionStorage.getItem(`av_chat_${topic || 'general'}`)
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse chat history', e)
      }
    } else {
      setMessages([
        {
          role: 'assistant',
          text: `Hi! I'm your AI tutor 🤖\n\nAsk me anything about **${topic || 'DSA'}** — explanations, hints, complexity analysis, or how to approach a problem!`,
          ts: Date.now(),
        },
      ])
    }
  }, [topic])

  // Save history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`av_chat_${topic || 'general'}`, JSON.stringify(messages))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, topic])

  const clearChat = () => {
    const defaultMsg = [{
      role: 'assistant',
      text: `Hi! I'm your AI tutor 🤖\n\nAsk me anything about **${topic || 'DSA'}** — explanations, hints, complexity analysis, or how to approach a problem!`,
      ts: Date.now(),
    }]
    setMessages(defaultMsg)
    sessionStorage.removeItem(`av_chat_${topic || 'general'}`)
  }

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

    const newMsg = { role: 'user', text: q, ts: Date.now() }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
    setLoading(true)
    setStreamingText('')

    try {
      const response = await fetch(`${API_BASE_URL}/ask-ai`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          question: q, 
          topic,
          code, // Include the current editor code
          history: messages.slice(-6) // Send last 6 messages for context
        }),
      })

      if (response.status === 401) {
        localStorage.removeItem('av_token')
        localStorage.removeItem('av_user')
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: `🔒 Your session has expired. Please [log in again](/login) to continue.`,
          ts: Date.now()
        }])
        // Optional: window.location.href = '/login'
        return
      }

      if (!response.ok) {
        // Non-2xx: try to read whatever is in the body
        const errText = await response.text().catch(() => `Server error (${response.status})`)
        let parsed = { message: errText }
        try { parsed = JSON.parse(errText) } catch {}
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: `⚠️ ${parsed.message || `Server error (${response.status})`}`,
          ts: Date.now()
        }])
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setStreamingText(fullText)
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: fullText || '(No response received)', ts: Date.now() }])
      setStreamingText('')
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ Could not reach the AI server. Check your connection and try again.\n\n_Error: ${err.message}_`, ts: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const suggestedDoubts = [
    `Explain ${topic || 'this'} in simple terms`,
    `What's the time complexity?`,
    `Give me a hint for this problem`,
    `Show me a dry run example`
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[620px] flex flex-col rounded-[2rem] border border-white/10 bg-[#0A0F1E]/95 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden scale-in-center">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-[#7B61FF]/10 to-[#F062D0]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">AlgoVision Tutor</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={clearChat} title="Clear conversation" className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
             <RotateCcw className="w-4 h-4" />
           </button>
           <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
             <X className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${msg.role === 'assistant' ? 'bg-gradient-to-br from-[#7B61FF] to-[#F062D0]' : 'bg-slate-800'}`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed relative ${
              msg.role === 'assistant'
                ? 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm prose-invert prose-sm prose-p:my-1 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded'
                : 'bg-[#7B61FF] text-white rounded-tr-sm font-medium shadow-lg shadow-[#7B61FF]/10'
            }`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        
        {streamingText && (
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 text-slate-300 text-[13px] leading-relaxed prose-invert prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#7B61FF] animate-spin" />
              <span className="text-[10px] font-black text-[#7B61FF] uppercase tracking-widest animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Doubts */}
      {!loading && !streamingText && messages.length < 3 && (
        <div className="px-6 py-2 flex flex-wrap gap-2">
          {suggestedDoubts.map((d, i) => (
            <button 
              key={i} 
              onClick={() => { setInput(d); }}
              className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-[#7B61FF] hover:border-[#7B61FF]/30 transition-all active:scale-95"
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-6 pt-2">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2.5 focus-within:border-[#7B61FF]/40 focus-within:bg-white/[0.07] transition-all duration-300">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask your tutor anything..."
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-slate-600 outline-none px-2 font-medium"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center hover:shadow-[0_8px_16px_-4px_rgba(123,97,255,0.4)] hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest flex items-center gap-1">
             <MessageSquare className="w-3 h-3" /> Press Enter to send
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-[#7B61FF]/20" />
        </div>
      </div>
    </div>
  )
}
