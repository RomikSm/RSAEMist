import './TopBar.css'

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const dropdowns = [
  { label: 'All Cars' },
  { label: 'All Locations' },
  { label: 'Severity 4G' },
  { label: 'Last 7 Days' },
]

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-dropdowns">
        {dropdowns.map(d => (
          <button key={d.label} className="topbar-dropdown">
            <span>{d.label}</span>
            <ChevronDown />
          </button>
        ))}
      </div>
      <div className="topbar-actions">
        <button className="topbar-clear">Clear</button>
        <button className="topbar-save">Save View</button>
      </div>
    </div>
  )
}
