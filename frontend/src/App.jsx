import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Hazards from "./pages/Hazards";
import Recovery from "./pages/Recovery";
import Sustainability from "./pages/Sustainability";
import { useTwin } from "./hooks/useTwin";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/hazards", label: "Hazards" },
  { to: "/recovery", label: "Recovery" },
  { to: "/sustainability", label: "Sustainability" },
];

export default function App() {
  const twin = useTwin();

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Top nav */}
        <header className="flex items-center justify-between px-6 py-3 bg-surface-800 border-b border-surface-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-brand-400">
              UrbanMine Twin AI
            </span>
            <span className="text-xs text-gray-500 font-mono hidden sm:inline">
              Operational Digital Twin
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-600/20 text-brand-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-surface-700"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* Connection indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                twin ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-gray-500 font-mono">
              {twin ? `tick ${twin.tick}` : "connecting…"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {!twin ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 text-sm">
                  Connecting to plant twin…
                </p>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard twin={twin} />} />
              <Route path="/hazards" element={<Hazards twin={twin} />} />
              <Route path="/recovery" element={<Recovery twin={twin} />} />
              <Route
                path="/sustainability"
                element={<Sustainability twin={twin} />}
              />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}
