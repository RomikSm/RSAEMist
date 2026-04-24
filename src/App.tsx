import { useState } from 'react'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider, useAuth } from './AuthContext'
import { FiltersProvider } from './FiltersContext'
import Sidebar from './components/Sidebar'
import MapPanel from './components/MapPanel'
import DetailPanel from './components/DetailPanel'
import LoginForm from './components/LoginForm'
import './App.css'

function AppContent() {
  // `selectedMessageId` is the identifier of the priority-alert row the
  // user clicks in the sidebar. It drives what MapPanel / DetailPanel
  // fetch. `null` means "nothing selected yet — auto-pick the first one".
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  return (
    <div className="app-layout">
      <Sidebar
        selectedMessageId={selectedMessageId}
        onSelectMessage={setSelectedMessageId}
      />
      <div className="main-content">
        <div className="content-area">
          <MapPanel selectedMessageId={selectedMessageId} />
          <DetailPanel selectedMessageId={selectedMessageId} />
        </div>
      </div>
    </div>
  )
}

function AuthGate() {
  const { status } = useAuth()
  if (status === 'initialising') {
    return <div className="app-bootstrap">Loading…</div>
  }
  if (status === 'anonymous') {
    return <LoginForm />
  }
  return (
    <FiltersProvider>
      <AppContent />
    </FiltersProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  )
}
