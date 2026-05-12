import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedBackground } from '@/components/animated-background'
import {
  BarChart3, CheckCircle2, Flame, Clock, Trophy,
  ArrowRight, BookOpen, Zap, TrendingUp, Target, Loader2, User
} from 'lucide-react'
import { API_BASE_URL } from '@/src/config'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // solved from localStorage (client-side quick access)
  const [solved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('av_solved') || '[]') } catch { return [] }
  })

  useEffect(() => {
    const token = localStorage.getItem('av_token')
    const savedUser = localStorage.getItem('av_user')
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch {}
    }

    if (!token) {
      setLoading(false)
      return
    }

    // Fetch real dashboard stats from backend
    fetch(`${API_BASE_URL}/progress/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setStats(data)
      })
      .catch(err => {
        console.warn('Dashboard fetch error:', err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const topicsCompleted = stats?.topicsCompleted ?? 0
  const problemsSolved = Math.max(stats?.problemsSolved ?? 0, solved.length)
  const avgScore = stats?.avgOptimizationScore ?? 0
  const totalSubmissions = stats?.totalSubmissions ?? 0
  const quizAccuracy = stats?.quizAccuracy ?? []
  const optimizationGrowth = stats?.optimizationGrowth ?? []

  const topicsMap = {
    'arrays': 'Arrays', 'binary-search': 'Binary Search', 'linked-list': 'Linked List',
    'trees': 'Trees & BST', 'graphs': 'Graphs', 'dynamic-programming': 'Dynamic Programming',
    'stack': 'Stack', 'queue': 'Queue', 'sorting': 'Sorting Algorithms',
  }
  const totalTopics = Object.keys(topicsMap).length
  const topicPct = Math.round((topicsCompleted / totalTopics) * 100)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#7B61FF] animate-spin mx-auto" />
        <p className="text-slate-400 text-sm font-medium">Loading your dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen relative flex flex-col">
      <AnimatedBackground />

      <main className="relative pt-12 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-10 flex items-start justify-between">
            <div>
              <p className="text-[#94A3B8] text-sm mb-2">Welcome back 👋</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                {user?.username ? (
                  <><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-[#F062D0]">{user.username}'s</span> Dashboard</>
                ) : (
                  <>Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-[#F062D0]">Dashboard</span></>
                )}
              </h1>
            </div>
            {user && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#F062D0] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{user.username || user.email?.split('@')[0]}</p>
                  <p className="text-[#64748B] text-[10px] font-medium">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              {
                label: 'Problems Solved', val: problemsSolved,
                badge: totalSubmissions > 0 ? `${totalSubmissions} submissions` : 'Keep going!',
                icon: CheckCircle2, grad: 'from-[#F062D0] to-[#E848EF]', badgeColor: 'text-[#10B981] bg-[#10B981]/10'
              },
              {
                label: 'Avg AI Score', val: avgScore > 0 ? `${avgScore}%` : '—',
                badge: avgScore >= 80 ? 'Excellent!' : avgScore >= 60 ? 'Good work' : 'Keep practicing',
                icon: Zap, grad: 'from-[#F59E0B] to-[#D97706]', badgeColor: 'text-[#EC4899] bg-[#EC4899]/10'
              },
              {
                label: 'Topics Covered', val: `${topicsCompleted}/${totalTopics}`,
                badge: `${topicPct}% done`,
                icon: BookOpen, grad: 'from-[#3B82F6] to-[#1D4ED8]', badgeColor: 'text-[#60A5FA] bg-[#3B82F6]/10'
              },
              {
                label: 'Quiz Scores', val: quizAccuracy.length > 0 ? `${Math.round(quizAccuracy.reduce((a, q) => a + q.accuracy, 0) / quizAccuracy.length)}%` : '—',
                badge: quizAccuracy.length > 0 ? `${quizAccuracy.length} topics` : 'Take a quiz!',
                icon: Trophy, grad: 'from-[#7B61FF] to-[#6366F1]', badgeColor: 'text-[#F59E0B] bg-[#F59E0B]/10'
              },
            ].map((c) => (
              <div key={c.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center shadow-lg`}>
                    <c.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.badgeColor}`}>{c.badge}</span>
                </div>
                <p className="text-[#94A3B8] text-xs mb-1">{c.label}</p>
                <p className="text-3xl font-bold text-white">{c.val}</p>
              </div>
            ))}
          </div>

          {/* Two-col layout */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">

            {/* Progress by topic */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7B61FF]" /> Topic Progress
              </h3>
              <div className="space-y-4">
                {Object.entries(topicsMap).map(([id, label]) => {
                  const topicProgress = quizAccuracy.find(q => q.topicId === id)
                  const pct = topicProgress ? topicProgress.accuracy : 0
                  const done = pct >= 80
                  return (
                    <div key={id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#94A3B8]">{label}</span>
                        <span className={done ? 'text-[#10B981] font-semibold' : pct > 0 ? 'text-[#F59E0B] font-semibold' : 'text-[#64748B]'}>
                          {done ? `${pct}% ✓` : pct > 0 ? `${pct}%` : 'Not started'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            done ? 'bg-gradient-to-r from-[#10B981] to-[#34D399]' :
                            pct > 0 ? 'bg-gradient-to-r from-[#F59E0B] to-[#F97316]' : 'bg-white/5'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link to="/learn" className="mt-5 flex items-center gap-2 text-[#7B61FF] text-sm font-semibold hover:text-[#F062D0] transition-colors">
                Continue Learning <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Optimization growth chart + quick actions */}
            <div className="space-y-5">
              {/* Optimization scores over time */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#F062D0]" /> Optimization Growth
                </h3>
                {optimizationGrowth.length > 0 ? (
                  <div className="flex items-end gap-1.5 h-20 overflow-x-auto">
                    {optimizationGrowth.slice(-7).map((s, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[28px]">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[#7B61FF] to-[#F062D0] opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ height: `${s.score}%` }}
                          title={`${s.problem}: ${s.score}%`}
                        />
                        <span className="text-[8px] text-[#64748B] truncate max-w-full">{s.score}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center text-[#64748B] text-sm italic">
                    Submit solutions to see your optimization growth
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#F59E0B]" /> Quick Actions
                </h3>
                {[
                  { label: 'Continue Learning', to: '/learn', icon: BookOpen, color: 'from-[#7B61FF] to-[#F062D0]' },
                  { label: 'Practice Problems', to: '/practice', icon: Target, color: 'from-[#10B981] to-[#34D399]' },
                ].map((a) => (
                  <Link key={a.label} to={a.to} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${a.color} text-white text-sm font-semibold hover:opacity-90 transition-opacity`}>
                    <a.icon className="w-4 h-4" />
                    {a.label}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent submissions */}
          {optimizationGrowth.length > 0 && (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F062D0]" /> Recent Submissions
              </h3>
              <div className="space-y-2">
                {optimizationGrowth.slice(-5).reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-sm text-white font-medium capitalize">{s.problem}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${s.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{s.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily challenge */}
          <div className="bg-gradient-to-br from-[#7B61FF]/10 to-[#F062D0]/10 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">Daily Challenge</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Coin Change</h3>
              <p className="text-[#94A3B8] text-sm">Medium • Dynamic Programming</p>
            </div>
            <Link to="/practice">
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#F062D0] text-white font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-2">
                <Target className="w-4 h-4" /> Attempt Now
              </button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
