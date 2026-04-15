import { useState } from 'react'
import { ThemeProvider } from './ThemeContext'
import Sidebar from './components/Sidebar'
import MapPanel from './components/MapPanel'
import DetailPanel from './components/DetailPanel'
import './App.css'

function AppContent() {
  const [selectedAlertId, setSelectedAlertId] = useState('1')

  return (
    <div className="app-layout">
      <Sidebar selectedAlertId={selectedAlertId} onSelectAlert={setSelectedAlertId} />
      <div className="main-content">
        <div className="content-area">
          <MapPanel />
          <DetailPanel />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
