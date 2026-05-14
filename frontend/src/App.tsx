import { Routes, Route } from 'react-router-dom'
import { useTelemetry } from './hooks/useTelemetry'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { OverviewPage } from './pages/OverviewPage'
import { PlantTwinPage } from './pages/PlantTwinPage'
import { RevenuePage } from './pages/RevenuePage'
import { SustainabilityPage } from './pages/SustainabilityPage'
import { HazardsPage } from './pages/HazardsPage'
import { SimulationPage } from './pages/SimulationPage'
import { OptimizationPage } from './pages/OptimizationPage'

function App() {
  useTelemetry()

  return (
    <div className="h-screen w-screen flex bg-bg-primary overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/plant" element={<PlantTwinPage />} />
            <Route path="/revenue" element={<RevenuePage />} />
            <Route path="/hazards" element={<HazardsPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/optimization" element={<OptimizationPage />} />
            <Route path="/sustainability" element={<SustainabilityPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
