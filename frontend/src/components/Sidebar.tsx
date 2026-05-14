import { NavLink } from 'react-router-dom'
import { usePlantStore } from '../store/plantStore'

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: '📊', description: 'Live summary' },
  { path: '/plant', label: 'Plant Twin', icon: '🏭', description: '3D process view' },
  { path: '/simulation', label: 'Simulation', icon: '🔮', description: 'Predict & what-if' },
  { path: '/optimization', label: 'Optimization', icon: '🤖', description: 'AI recommendations' },
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
        <p className="text-[10px] text-text-muted mt-0.5">Digital Twin Platform</p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-accent-green pulse-live' : 'bg-hazard-red'}`} />
          <span className="text-[10px] text-text-secondary">{connected ? 'Synchronized' : 'Offline'}</span>
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

      {/* Twin Status Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          <span className="text-[9px] text-text-muted">Twin: Synchronized</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
          <span className="text-[9px] text-text-muted">AI: Active (94.2%)</span>
        </div>
        <p className="text-[8px] text-text-muted text-center mt-2">v1.0.0 • COUP AI</p>
      </div>
    </aside>
  )
}
