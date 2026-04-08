import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LeftSidebar } from '@/components/left-sidebar'
import HomePage from './pages/HomePage'
import LearnPage from './pages/LearnPage'
import LearnTopicPage from './pages/LearnTopicPage'
import PracticePage from './pages/PracticePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('av_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}
function AppLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  if (isLogin) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AnimatePresence>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans antialiased bg-[#0F172A]">
      <LeftSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
            <Route path="/learn/:topicId" element={<ProtectedRoute><LearnTopicPage /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
