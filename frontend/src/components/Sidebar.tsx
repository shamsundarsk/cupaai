import { NavLink } from 'react-router-dom'
import { usePlantStore } from '../store/plantStore'

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: '📊', description: 'Live summary' },
  { path: '/plant', label: 'Plant Twin', icon: '🏭', description: 'Live process view' },
  { path: '/revenue', label: 'Revenue', icon: '💰', description: 'Income & recovery' },
  { path: '/hazards', label: 'Hazards', icon: '⚠️', description: 'Safety & alerts' },
  { path: '/sustainability', label: 'Sustainability', icon: '🌱', description: 'Environmental impact' },
]

export function Sidebar() {
  const connected = usePlantStore((s) => s.connected)

  return (
    <aside className="w-[200px] bg-bg-secondary border-r border-border flex flex-col">
      {/* Brand */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-accent-cyan tracking-tight">COUP AI</h1>
        <p className="text-[10px] text-text-muted mt-0.5">E-Waste & Battery Recycling</p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-accent-green pulse-live' : 'bg-hazard-red'}`} />
          <span className="text-[10px] text-text-secondary">{connected ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                  : 'text-text-secondary hover:bg-bg-card hover:text-text-primary border border-transparent'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <div>
              <div className="font-medium text-xs">{item.label}</div>
              <div className="text-[9px] text-text-muted">{item.description}</div>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-[9px] text-text-muted text-center">Digital Twin Platform v1.0</p>
      </div>
    </aside>
  )
}
