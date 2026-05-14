import { NavLink } from 'react-router-dom'
import { usePlantStore } from '../store/plantStore'

const NAV_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { path: '/', label: 'Overview', icon: '◉' },
      { path: '/plant', label: 'Plant Twin', icon: '⬡' },
      { path: '/hazards', label: 'Safety', icon: '△' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/simulation', label: 'Simulation', icon: '◈' },
      { path: '/optimization', label: 'Optimize', icon: '⟡' },
      { path: '/shifts', label: 'Shift History', icon: '◫' },
    ],
  },
  {
    title: 'Business',
    items: [
      { path: '/revenue', label: 'Revenue', icon: '◆' },
      { path: '/calculator', label: 'ROI Calculator', icon: '▣' },
      { path: '/sustainability', label: 'ESG', icon: '○' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { path: '/story', label: 'Story Mode', icon: '▶' },
      { path: '/report', label: 'Reports', icon: '◧' },
    ],
  },
]

export function Sidebar() {
  const connected = usePlantStore((s) => s.connected)
  const telemetry = usePlantStore((s) => s.telemetry)
  const riskScore = telemetry?.plant_risk_score || 0

  return (
    <aside className="w-[210px] bg-bg-secondary border-r border-border flex flex-col">
      {/* Brand */}
      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
            <span className="text-accent-cyan text-xs font-bold">C</span>
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-text-bright tracking-wide">COUP AI</h1>
            <p className="text-[8px] text-text-muted font-medium uppercase tracking-[0.15em]">Digital Twin</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-2.5 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-accent-green pulse-live' : 'bg-hazard-red'}`} />
            <span className="text-[9px] text-text-muted">{connected ? 'Synchronized' : 'Offline'}</span>
          </div>
          <span className={`text-[9px] font-mono ${riskScore > 60 ? 'text-hazard-red' : 'text-text-muted'}`}>
            Risk: {riskScore.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="px-4 py-1.5">
              <span className="text-[8px] text-text-muted uppercase tracking-[0.2em] font-semibold">{section.title}</span>
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 mx-2 px-2.5 py-[7px] rounded-md transition-all duration-100 ${
                    isActive
                      ? 'bg-accent-cyan/8 text-accent-cyan'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`
                }
              >
                <span className="text-[10px] w-3.5 text-center opacity-50">{item.icon}</span>
                <span className="text-[11px] font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[8px] text-text-muted">v1.0.0</span>
        <span className="text-[8px] text-text-muted flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-accent-green" />
          14 sensors
        </span>
      </div>
    </aside>
  )
}
